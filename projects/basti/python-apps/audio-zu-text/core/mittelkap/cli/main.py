"""Einstiegspunkt des Terminal-Werkzeugs."""
from __future__ import annotations

import os
import sys
from dataclasses import dataclass, field
from pathlib import Path

from ..config import Einstellungen
from ..logbus import log
from . import explain
from .spec import BEFEHLE, GLOBALE_OPTIONEN, PROGRAMM, STANDARDBEFEHL, Befehl, befehl_finden


class Abbruch(Exception):
    """Ein erwarteter Fehler mit verständlicher Meldung für den Benutzer."""


@dataclass
class Aufruf:
    befehl: Befehl
    argumente: list[str] = field(default_factory=list)
    schalter: set[str] = field(default_factory=set)
    werte: dict[str, str] = field(default_factory=dict)

    def an(self, lang: str) -> bool:
        return lang in self.schalter

    def wert(self, lang: str, standard: str) -> str:
        return self.werte.get(lang, standard)


def zerlegen(rohe_argumente: list[str]) -> Aufruf:
    """Parst anhand der Spezifikation - dieselbe Quelle, aus der auch die Hilfe entsteht."""
    if not rohe_argumente:
        raise Abbruch(explain.uebersicht())

    erstes = rohe_argumente[0]
    if erstes in ("--hilfe", "-h", "--help", "/?"):
        raise Abbruch(explain.uebersicht())

    if befehl := befehl_finden(erstes):
        rest = rohe_argumente[1:]
    else:
        if erstes.startswith("-") and erstes not in {n for o in GLOBALE_OPTIONEN for n in o.namen}:
            raise Abbruch(f"Unbekannte Option '{erstes}'.\n\n{explain.uebersicht()}")
        befehl = befehl_finden(STANDARDBEFEHL)
        rest = rohe_argumente

    aufruf = Aufruf(befehl=befehl)
    erwartet = None
    for token in rest:
        if erwartet is not None:
            aufruf.werte[erwartet.lang] = token
            erwartet = None
            continue
        if token.startswith("-") and len(token) > 1:
            name, _, angehaengt = token.partition("=")
            option = befehl.option_finden(name)
            if option is None:
                raise Abbruch(
                    f"'{name}' ist bei '{befehl.name}' keine gültige Option.\n"
                    f"Tipp: {PROGRAMM} hilfe {befehl.name}\n"
                    f'      {PROGRAMM} erklaere "{" ".join(rohe_argumente)}"')
            if option.ist_schalter:
                aufruf.schalter.add(option.lang)
            elif angehaengt:
                aufruf.werte[option.lang] = angehaengt
            else:
                erwartet = option
            continue
        aufruf.argumente.append(token)

    if erwartet is not None:
        raise Abbruch(f"Nach {erwartet.lang} fehlt ein Wert. {erwartet.kurzinfo}")
    return aufruf


def einstellungen_aus(aufruf: Aufruf) -> Einstellungen:
    einst = Einstellungen.laden()
    einst.modell = aufruf.wert("--modell", einst.modell)
    einst.geraet = aufruf.wert("--geraet", einst.geraet)
    einst.ordner_anlegen()
    return einst


def in_zwischenablage(text: str) -> bool:
    try:
        import pyperclip
        pyperclip.copy(text)
        return True
    except Exception as fehler:
        log.warn("cli", f"Zwischenablage nicht erreichbar: {fehler}")
        return False


# ---------------------------------------------------------------- Befehle

def befehl_text(aufruf: Aufruf) -> int:
    from ..transcribe import audiodateien_finden, stapel, txt_schreiben

    if not aufruf.argumente:
        raise Abbruch(f"Es fehlt die Datei oder der Ordner.\n\n{explain.hilfe('text')}")

    einst = einstellungen_aus(aufruf)
    rekursiv = aufruf.an("--rekursiv")
    dateien: list[Path] = []
    for eingabe in aufruf.argumente:
        pfad = Path(eingabe).expanduser()
        if not pfad.exists():
            raise Abbruch(f"Nicht gefunden: {pfad}")
        gefunden = audiodateien_finden(pfad, rekursiv)
        if not gefunden:
            log.warn("cli", f"Keine Audiodateien in {pfad}.")
        dateien.extend(gefunden)

    if not dateien:
        raise Abbruch("Keine verwertbaren Audiodateien gefunden.")

    leise = aufruf.an("--leise")
    if not leise:
        print(f"{len(dateien)} Datei(en) werden verarbeitet ...\n", file=sys.stderr)

    gesammelt: list[str] = []
    fehler_anzahl = 0
    for ergebnis in stapel(dateien, einst):
        if isinstance(ergebnis, Exception):
            fehler_anzahl += 1
            print(f"FEHLER: {ergebnis}", file=sys.stderr)
            continue

        ausgabe = ergebnis.mit_zeitmarken() if aufruf.an("--zeitmarken") else "\n\n".join(ergebnis.absaetze)

        if aufruf.an("--markdown"):
            from ..formatter import zu_markdown
            ausgabe = zu_markdown(ergebnis.text)

        if not leise:
            print(f"\n--- {ergebnis.datei.name} "
                  f"({ergebnis.dauer:.0f}s Audio, {ergebnis.rechenzeit:.1f}s Rechenzeit, "
                  f"{ergebnis.faktor:.1f}x) ---", file=sys.stderr)
        print(ausgabe)
        gesammelt.append(ausgabe)

        if aufruf.an("--txt"):
            ziel = txt_schreiben(ergebnis, aufruf.an("--zeitmarken"))
            if not leise:
                print(f"-> {ziel}", file=sys.stderr)

    if aufruf.an("--kopieren") and gesammelt:
        if in_zwischenablage("\n\n".join(gesammelt)) and not leise:
            print("\nIn die Zwischenablage gelegt.", file=sys.stderr)

    return 1 if fehler_anzahl and not gesammelt else 0


def befehl_beobachte(aufruf: Aufruf) -> int:
    from ..watcher import beobachten

    if not aufruf.argumente:
        raise Abbruch(f"Es fehlt der zu überwachende Ordner.\n\n{explain.hilfe('beobachte')}")
    ordner = Path(aufruf.argumente[0]).expanduser()
    if not ordner.is_dir():
        raise Abbruch(f"Kein Ordner: {ordner}")

    einst = einstellungen_aus(aufruf)
    return beobachten(ordner, einst, txt=aufruf.an("--txt"),
                      zeitmarken=aufruf.an("--zeitmarken"), markdown=aufruf.an("--markdown"))


def befehl_formatiere(aufruf: Aufruf) -> int:
    from ..formatter import zu_markdown

    if not aufruf.argumente:
        raise Abbruch(f"Es fehlt die Textdatei.\n\n{explain.hilfe('formatiere')}")

    quelle = aufruf.argumente[0]
    if quelle == "-":
        text = sys.stdin.read()
    else:
        pfad = Path(quelle).expanduser()
        if not pfad.exists():
            raise Abbruch(f"Nicht gefunden: {pfad}")
        text = pfad.read_text(encoding="utf-8")

    if not text.strip():
        raise Abbruch("Der Text ist leer.")

    einstellungen_aus(aufruf)
    ergebnis = zu_markdown(text)
    print(ergebnis)
    if aufruf.an("--kopieren"):
        in_zwischenablage(ergebnis)
    return 0


def befehl_protokoll(aufruf: Aufruf) -> int:
    einst = Einstellungen.laden()
    einst.ordner_anlegen()
    dateien = sorted(einst.logordner.glob("mittelkap-*.log"))
    if not dateien:
        print("Noch kein Protokoll vorhanden.", file=sys.stderr)
        return 0
    inhalt = dateien[-1].read_text(encoding="utf-8")
    print(inhalt)
    if aufruf.an("--kopieren") and in_zwischenablage(inhalt):
        print(f"\nProtokoll aus {dateien[-1].name} in die Zwischenablage gelegt.", file=sys.stderr)
    return 0


def befehl_zustand(aufruf: Aufruf) -> int:
    from ..modelmanager import cuda_dlls_registrieren, geraet_aufloesen, gpu_info

    einst = Einstellungen.laden()
    einst.ordner_anlegen()
    info = gpu_info()

    print(f"{PROGRAMM} - Systemzustand\n")
    if info:
        frei = info["vram_gesamt_mb"] - info["vram_belegt_mb"]
        print(f"  Grafikkarte     {info['name']}")
        print(f"  Grafikspeicher  {frei} MB frei von {info['vram_gesamt_mb']} MB")
        print(f"  CUDA-Bibliotheken {'gefunden' if cuda_dlls_registrieren() else 'FEHLEN'}")
    else:
        print("  Grafikkarte     keine NVIDIA-GPU gefunden - es wird auf dem Prozessor gerechnet")

    geraet, typ = geraet_aufloesen(einst.geraet)
    print(f"  Betriebsart     {geraet} ({typ})")
    print(f"  Modell          {einst.modell}")
    print(f"\n  Datenordner     {einst.wurzel}")

    print(f"  Heruntergeladen {', '.join(vorhandene_modelle(einst)) or 'noch nichts'}")
    return 0


def vorhandene_modelle(einst: Einstellungen) -> list[str]:
    """Die Namen der bereits heruntergeladenen Modelle, ohne den Hugging-Face-Beiwerk-Kram."""
    if not einst.modellordner.exists():
        return []
    namen = [p.name.split("--")[-1] for p in einst.modellordner.glob("models--*") if p.is_dir()]
    namen += [p.name for p in einst.modellordner.glob("*.gguf") if p.is_file()]
    return sorted(namen)


def befehl_hilfe(aufruf: Aufruf) -> int:
    print(explain.hilfe(aufruf.argumente[0] if aufruf.argumente else None))
    return 0


def befehl_erklaere(aufruf: Aufruf) -> int:
    if not aufruf.argumente:
        raise Abbruch(explain.hilfe("erklaere"))
    print(explain.zerlegung_zeichnen(" ".join(aufruf.argumente)))
    return 0


AUSFUEHRUNG = {
    "text": befehl_text,
    "beobachte": befehl_beobachte,
    "formatiere": befehl_formatiere,
    "protokoll": befehl_protokoll,
    "zustand": befehl_zustand,
    "hilfe": befehl_hilfe,
    "erklaere": befehl_erklaere,
}


def konsole_einrichten() -> None:
    """Sorgt dafür, dass Umlaute und Rahmenzeichen im Terminal richtig ankommen.

    Deutsche Windows-Konsolen laufen üblicherweise auf Codepage 850. Schreibt Python
    dorthin UTF-8, wird aus "ä" ein Kauderwelsch-Zeichenpaar. Darum wird die Konsole
    selbst auf UTF-8 umgestellt und erst danach der Ausgabestrom.
    """
    if os.name == "nt":
        try:
            import ctypes

            kernel = ctypes.windll.kernel32
            kernel.SetConsoleOutputCP(65001)
            kernel.SetConsoleCP(65001)
        except Exception:  # noqa: BLE001 - ohne Konsole (z. B. Dienst) einfach ueberspringen
            pass
    for strom in (sys.stdout, sys.stderr):
        try:
            strom.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, OSError):
            pass


def main(argumente: list[str] | None = None) -> int:
    konsole_einrichten()

    rohe = list(sys.argv[1:] if argumente is None else argumente)

    # Die Oberflaeche startet dieselbe Anwendung mit --rpc als Hintergrunddienst.
    if "--rpc" in rohe:
        from ..rpc import main as rpc_main
        return rpc_main()

    globale = {n for o in GLOBALE_OPTIONEN for n in o.namen}
    ausfuehrlich = bool(globale & {"--ausfuehrlich", "-v"} & set(rohe))
    leise = bool({"--leise", "-q"} & set(rohe))

    einst = Einstellungen.laden()
    einst.ordner_anlegen()
    log.an_datei(einst.logordner)
    log.echo = not leise
    log.mindeststufe = "debug" if ausfuehrlich else "info"

    try:
        aufruf = zerlegen(rohe)
        return AUSFUEHRUNG[aufruf.befehl.name](aufruf)
    except Abbruch as fehler:
        print(fehler, file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        print("\nAbgebrochen.", file=sys.stderr)
        return 130
    except Exception as fehler:
        log.fehler("cli", f"{type(fehler).__name__}: {fehler}")
        print(f"\nUnerwarteter Fehler: {fehler}\n"
              f"Das vollständige Protokoll zeigt '{PROGRAMM} protokoll'.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
