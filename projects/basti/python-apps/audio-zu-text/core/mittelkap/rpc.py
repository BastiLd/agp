"""JSON-Zeilen-Protokoll zwischen der Oberfläche und dem Kern.

Die Oberfläche startet diesen Prozess und schickt je eine JSON-Zeile pro Auftrag auf
die Standardeingabe; zurück kommen ebenfalls JSON-Zeilen: laufend Fortschritt und
Protokoll, am Ende das Ergebnis. Dadurch bleibt die Oberfläche während langer
Transkriptionen bedienbar.
"""
from __future__ import annotations

import json
import queue
import sys
import threading
import traceback
from pathlib import Path
from typing import Any

from .config import AUDIO_SUFFIXES, Einstellungen
from .logbus import Eintrag, log

_ausgabe_sperre = threading.Lock()


def senden(art: str, **daten: Any) -> None:
    zeile = json.dumps({"art": art, **daten}, ensure_ascii=False)
    with _ausgabe_sperre:
        sys.stdout.write(zeile + "\n")
        sys.stdout.flush()


def _transkript_als_dict(t) -> dict[str, Any]:
    return {
        "datei": str(t.datei),
        "name": t.datei.name,
        "text": t.text,
        "absaetze": t.absaetze,
        "mit_zeitmarken": t.mit_zeitmarken(),
        "segmente": [{"start": s.start, "ende": s.ende, "text": s.text.strip()} for s in t.segmente],
        "dauer": t.dauer,
        "rechenzeit": t.rechenzeit,
        "faktor": t.faktor,
        "modell": t.modell,
        "geraet": t.geraet,
    }


class Dienst:
    def __init__(self) -> None:
        self.auftraege: queue.Queue[dict | None] = queue.Queue()
        self.beobachter = None
        self.einst = Einstellungen.laden()
        self.einst.ordner_anlegen()

    # -------------------------------------------------- Auftragsarten

    def _zustand(self, auftrag: dict) -> None:
        from .formatter import modell_vorhanden
        from .modelmanager import geraet_aufloesen, gpu_info, modelle

        info = gpu_info()
        geraet, typ = geraet_aufloesen(self.einst.geraet)
        senden("zustand", id=auftrag.get("id"), daten={
            "gpu": info,
            "geraet": geraet,
            "berechnungstyp": typ,
            "modell": self.einst.modell,
            "geladenes_modell": modelle.geladen,
            "formatierer_bereit": modell_vorhanden(self.einst),
            "datenordner": str(self.einst.wurzel),
        })

    def _transkribieren(self, auftrag: dict) -> None:
        from .transcribe import audiodateien_finden, transkribieren, txt_schreiben

        kennung = auftrag.get("id")
        dateien: list[Path] = []
        for eingabe in auftrag.get("pfade", []):
            pfad = Path(eingabe)
            dateien.extend(audiodateien_finden(pfad, rekursiv=auftrag.get("rekursiv", True)))

        if not dateien:
            senden("fehler", id=kennung, text="Keine verwertbaren Audiodateien gefunden.")
            return

        senden("warteschlange", id=kennung,
               dateien=[{"pfad": str(d), "name": d.name} for d in dateien])

        for nummer, datei in enumerate(dateien):
            def melden(anteil: float, phase: str, _d=datei) -> None:
                senden("fortschritt", id=kennung, datei=str(_d), anteil=anteil, phase=phase)
            try:
                ergebnis = transkribieren(datei, self.einst, melden)
                daten = _transkript_als_dict(ergebnis)
                if auftrag.get("txt"):
                    daten["txt_pfad"] = str(txt_schreiben(ergebnis, auftrag.get("zeitmarken", False)))
                senden("transkript", id=kennung, nummer=nummer, gesamt=len(dateien), daten=daten)
            except Exception as fehler:
                log.fehler("rpc", f"{datei.name}: {fehler}")
                senden("dateifehler", id=kennung, datei=str(datei), text=str(fehler))

        senden("fertig", id=kennung)

    def _formatieren(self, auftrag: dict) -> None:
        from .formatter import zu_markdown

        kennung = auftrag.get("id")
        text = auftrag.get("text", "")
        if not text.strip():
            senden("fehler", id=kennung, text="Kein Text zum Formatieren.")
            return

        def melden(anteil: float, phase: str) -> None:
            senden("fortschritt", id=kennung, anteil=anteil, phase=phase)

        senden("markdown", id=kennung, text=zu_markdown(text, self.einst, melden))
        senden("fertig", id=kennung)

    def _einstellen(self, auftrag: dict) -> None:
        for schluessel, wert in auftrag.get("werte", {}).items():
            if hasattr(self.einst, schluessel):
                setattr(self.einst, schluessel, wert)
        self.einst.speichern()
        senden("einstellungen", id=auftrag.get("id"), werte={
            "modell": self.einst.modell, "geraet": self.einst.geraet,
        })

    def _entladen(self, auftrag: dict) -> None:
        from .modelmanager import modelle
        modelle.entladen()
        senden("entladen", id=auftrag.get("id"))

    def _protokoll(self, auftrag: dict) -> None:
        senden("protokoll", id=auftrag.get("id"), text=log.als_text())

    def _beobachten(self, auftrag: dict) -> None:
        """Startet die Ordnerüberwachung in einem eigenen Faden.

        Neue Dateien werden nicht direkt verarbeitet, sondern als regulärer
        Transkriptionsauftrag eingereiht - so bleibt die Reihenfolge gewahrt und es
        läuft nie mehr als eine Transkription gleichzeitig.
        """
        from watchdog.events import FileSystemEventHandler
        from watchdog.observers import Observer

        from .watcher import _fertig_geschrieben

        kennung = auftrag.get("id")
        ordner = Path(auftrag.get("ordner", ""))
        if not ordner.is_dir():
            senden("fehler", id=kennung, text=f"Kein Ordner: {ordner}")
            return

        self._beobachtung_beenden(auftrag)
        gesehen: set[Path] = set()

        def melden(pfad: Path) -> None:
            pfad = pfad.resolve()
            if pfad in gesehen or pfad.suffix.lower() not in AUDIO_SUFFIXES:
                return
            gesehen.add(pfad)
            if not _fertig_geschrieben(pfad):
                gesehen.discard(pfad)
                return
            senden("neue_datei", ordner=str(ordner), pfad=str(pfad), name=pfad.name)
            self.auftraege.put({
                "id": kennung, "art": "transkribieren", "pfade": [str(pfad)],
                "txt": auftrag.get("txt", False), "zeitmarken": auftrag.get("zeitmarken", False),
            })

        class Horcher(FileSystemEventHandler):
            def on_created(self, ereignis):
                if not ereignis.is_directory:
                    threading.Thread(target=melden, args=(Path(ereignis.src_path),),
                                     daemon=True).start()

            def on_moved(self, ereignis):
                if not ereignis.is_directory:
                    threading.Thread(target=melden, args=(Path(ereignis.dest_path),),
                                     daemon=True).start()

        self.beobachter = Observer()
        self.beobachter.schedule(Horcher(), str(ordner), recursive=False)
        self.beobachter.start()
        log.ok("rpc", f"Beobachte {ordner}.")
        senden("beobachtet", id=kennung, ordner=str(ordner))

    def _beobachtung_beenden(self, auftrag: dict) -> None:
        if self.beobachter is not None:
            self.beobachter.stop()
            self.beobachter.join(timeout=3)
            self.beobachter = None
            log.info("rpc", "Beobachtung beendet.")
        senden("beobachtung_beendet", id=auftrag.get("id"))

    # -------------------------------------------------- Schleifen

    def bearbeiten(self, auftrag: dict) -> None:
        handler = {
            "transkribieren": self._transkribieren,
            "formatieren": self._formatieren,
            "zustand": self._zustand,
            "einstellen": self._einstellen,
            "entladen": self._entladen,
            "protokoll": self._protokoll,
            "beobachten": self._beobachten,
            "beobachtung_beenden": self._beobachtung_beenden,
        }.get(auftrag.get("art", ""))

        if handler is None:
            senden("fehler", id=auftrag.get("id"), text=f"Unbekannter Auftrag: {auftrag.get('art')}")
            return
        try:
            handler(auftrag)
        except Exception as fehler:
            log.fehler("rpc", f"{type(fehler).__name__}: {fehler}")
            senden("fehler", id=auftrag.get("id"), text=str(fehler),
                   spur=traceback.format_exc())

    def arbeiten(self) -> None:
        while (auftrag := self.auftraege.get()) is not None:
            self.bearbeiten(auftrag)

    def _bibliotheken_vorladen(self) -> None:
        """Lädt faster-whisper und llama-cpp im Hauptthread vor.

        Notwendig, nicht nur schneller: werden diese Bibliotheken erstmalig aus einem
        Arbeiter-Thread heraus importiert, blockiert der Import dauerhaft, sobald der
        Prozess mit umgeleiteten Ein-/Ausgabekanälen läuft - also genau im Betrieb
        unter der Oberfläche. Hier im Hauptthread geht es problemlos.
        """
        from .modelmanager import cuda_dlls_registrieren

        cuda_dlls_registrieren()
        for name in ("faster_whisper", "llama_cpp"):
            senden("fortschritt", anteil=0.0, phase=f"Lade {name} …")
            try:
                __import__(name)
                log.debug("rpc", f"{name} vorgeladen.")
            except Exception as fehler:
                log.warn("rpc", f"{name} nicht ladbar: {fehler}")
        senden("vorbereitet")

    def laufen(self) -> int:
        log.an_datei(self.einst.logordner)
        log.abonnieren(lambda e: senden("protokollzeile", stufe=e.stufe, quelle=e.quelle,
                                        text=e.text, zeit=e.zeit))

        senden("bereit", formate=sorted(AUDIO_SUFFIXES))
        self._bibliotheken_vorladen()

        arbeiter = threading.Thread(target=self.arbeiten, daemon=True)
        arbeiter.start()

        # readline() statt "for zeile in sys.stdin": die Iteration liest im Voraus und
        # haelt Auftraege zurueck, bis der Puffer voll ist - die Oberflaeche haenge dann.
        while zeile := sys.stdin.readline():
            zeile = zeile.strip()
            if not zeile:
                continue
            try:
                auftrag = json.loads(zeile)
            except json.JSONDecodeError:
                senden("fehler", text="Ungültige Auftragszeile.")
                continue
            if auftrag.get("art") == "beenden":
                break
            # Zustandsabfragen sofort beantworten, damit sie nicht hinter einer
            # laufenden Transkription warten muessen.
            if auftrag.get("art") in ("zustand", "protokoll", "beobachten", "beobachtung_beenden"):
                self.bearbeiten(auftrag)
            else:
                self.auftraege.put(auftrag)

        self.auftraege.put(None)
        return 0


def main() -> int:
    for strom in (sys.stdout, sys.stdin):
        try:
            strom.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, OSError):
            pass
    return Dienst().laufen()


if __name__ == "__main__":
    sys.exit(main())
