"""Ordner-Ueberwachung: neue Audiodateien werden automatisch transkribiert."""
from __future__ import annotations

import sys
import time
from pathlib import Path

from .config import AUDIO_SUFFIXES, Einstellungen
from .logbus import log

_QUELLE = "beobachter"


def _fertig_geschrieben(datei: Path, ruhe: float = 1.5, geduld: float = 60.0) -> bool:
    """Wartet, bis die Dateigröße sich nicht mehr ändert.

    Nötig, weil ein Kopiervorgang die Datei bereits sichtbar macht, bevor sie
    vollständig ist - Whisper würde sonst auf einem Fragment laufen.
    """
    letzte = -1
    ende = time.monotonic() + geduld
    while time.monotonic() < ende:
        try:
            jetzt = datei.stat().st_size
        except OSError:
            return False
        if jetzt == letzte and jetzt > 0:
            return True
        letzte = jetzt
        time.sleep(ruhe)
    log.warn(_QUELLE, f"{datei.name} wird seit {geduld:.0f}s beschrieben - übersprungen.")
    return False


def beobachten(ordner: Path, einst: Einstellungen, txt: bool = True,
               zeitmarken: bool = False, markdown: bool = False) -> int:
    from watchdog.events import FileSystemEventHandler
    from watchdog.observers import Observer

    from .transcribe import transkribieren, txt_schreiben

    verarbeitet: set[Path] = set()

    def verarbeiten(pfad: Path) -> None:
        pfad = pfad.resolve()
        if pfad in verarbeitet or pfad.suffix.lower() not in AUDIO_SUFFIXES:
            return
        verarbeitet.add(pfad)
        if not _fertig_geschrieben(pfad):
            verarbeitet.discard(pfad)
            return
        try:
            ergebnis = transkribieren(pfad, einst)
            ausgabe = ergebnis.mit_zeitmarken() if zeitmarken else "\n\n".join(ergebnis.absaetze)
            if markdown:
                from .formatter import zu_markdown
                ausgabe = zu_markdown(ergebnis.text)
            print(f"\n=== {pfad.name} ===\n{ausgabe}\n", flush=True)
            if txt:
                txt_schreiben(ergebnis, zeitmarken)
        except Exception as fehler:
            log.fehler(_QUELLE, f"{pfad.name}: {fehler}")
            verarbeitet.discard(pfad)

    class Horcher(FileSystemEventHandler):
        def on_created(self, ereignis):
            if not ereignis.is_directory:
                verarbeiten(Path(ereignis.src_path))

        def on_moved(self, ereignis):
            if not ereignis.is_directory:
                verarbeiten(Path(ereignis.dest_path))

    beobachter = Observer()
    beobachter.schedule(Horcher(), str(ordner), recursive=False)
    beobachter.start()
    log.ok(_QUELLE, f"Beobachte {ordner} - neue Audiodateien werden sofort verarbeitet.")
    print("Beenden mit Strg+C.\n", file=sys.stderr)

    try:
        while True:
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nBeobachtung beendet.", file=sys.stderr)
    finally:
        beobachter.stop()
        beobachter.join()
    return 0
