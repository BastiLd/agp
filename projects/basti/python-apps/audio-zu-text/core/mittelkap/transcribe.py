"""Transkription mit faster-whisper."""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Iterator

from .config import AUDIO_SUFFIXES, Einstellungen
from .logbus import log
from .modelmanager import modelle

_QUELLE = "whisper"

Fortschritt = Callable[[float, str], None]


@dataclass
class Segment:
    start: float
    ende: float
    text: str

    @property
    def zeitmarke(self) -> str:
        def mmss(s: float) -> str:
            return f"{int(s // 60):02d}:{int(s % 60):02d}"
        return f"[{mmss(self.start)} - {mmss(self.ende)}]"


@dataclass
class Transkript:
    datei: Path
    segmente: list[Segment] = field(default_factory=list)
    dauer: float = 0.0
    rechenzeit: float = 0.0
    sprache: str = "de"
    modell: str = ""
    geraet: str = ""

    @property
    def text(self) -> str:
        return " ".join(s.text.strip() for s in self.segmente).strip()

    @property
    def absaetze(self) -> list[str]:
        """Gruppiert Segmente an längeren Sprechpausen - das ergibt die Abschnitte,
        die in der Oberfläche einzeln kopierbar sind."""
        if not self.segmente:
            return []
        gruppen: list[list[Segment]] = [[self.segmente[0]]]
        for vorher, jetzt in zip(self.segmente, self.segmente[1:]):
            if jetzt.start - vorher.ende > 0.8 or sum(len(s.text) for s in gruppen[-1]) > 400:
                gruppen.append([jetzt])
            else:
                gruppen[-1].append(jetzt)
        return [" ".join(s.text.strip() for s in g).strip() for g in gruppen]

    @property
    def faktor(self) -> float:
        return self.dauer / self.rechenzeit if self.rechenzeit else 0.0

    def mit_zeitmarken(self) -> str:
        return "\n".join(f"{s.zeitmarke} {s.text.strip()}" for s in self.segmente)


def audiodateien_finden(pfad: Path, rekursiv: bool = True) -> list[Path]:
    if pfad.is_file():
        return [pfad] if pfad.suffix.lower() in AUDIO_SUFFIXES else []
    muster = "**/*" if rekursiv else "*"
    return sorted(p for p in pfad.glob(muster) if p.is_file() and p.suffix.lower() in AUDIO_SUFFIXES)


def transkribieren(datei: Path, einst: Einstellungen | None = None,
                   fortschritt: Fortschritt | None = None) -> Transkript:
    einst = einst or Einstellungen.laden()
    if not datei.exists():
        raise FileNotFoundError(f"Audiodatei nicht gefunden: {datei}")

    melden = fortschritt or (lambda a, t: None)
    melden(0.0, "Modell wird bereitgestellt")

    modell = modelle.whisper(einst.modell, einst.geraet, einst.berechnungstyp, einst.modellordner)
    geraet = getattr(modell.model, "device", einst.geraet)

    log.info(_QUELLE, f"Transkribiere {datei.name} ...")
    start = time.perf_counter()
    segmente_iter, info = modell.transcribe(
        str(datei),
        language=einst.sprache,
        beam_size=5,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 500},
    )

    ergebnis = Transkript(datei=datei, dauer=info.duration, sprache=info.language,
                          modell=einst.modell, geraet=str(geraet))
    for segment in segmente_iter:
        ergebnis.segmente.append(Segment(segment.start, segment.end, segment.text))
        if info.duration:
            melden(min(segment.end / info.duration, 1.0), "Transkribiere")

    ergebnis.rechenzeit = time.perf_counter() - start
    melden(1.0, "Fertig")
    log.ok(_QUELLE, f"{datei.name}: {ergebnis.dauer:.1f}s Audio in {ergebnis.rechenzeit:.1f}s "
                    f"({ergebnis.faktor:.1f}x Echtzeit), {len(ergebnis.segmente)} Segmente.")
    return ergebnis


def stapel(dateien: list[Path], einst: Einstellungen | None = None,
           fortschritt: Fortschritt | None = None) -> Iterator[Transkript | Exception]:
    """Verarbeitet mehrere Dateien. Ein Fehler bei einer Datei stoppt die anderen nicht."""
    einst = einst or Einstellungen.laden()
    for nummer, datei in enumerate(dateien, 1):
        def melden(anteil: float, phase: str, _n=nummer, _d=datei) -> None:
            if fortschritt:
                fortschritt((_n - 1 + anteil) / len(dateien), f"{_d.name}: {phase}")
        try:
            yield transkribieren(datei, einst, melden)
        except Exception as fehler:
            log.fehler(_QUELLE, f"{datei.name}: {fehler}")
            yield fehler


def txt_schreiben(t: Transkript, mit_zeitmarken: bool = False, ziel: Path | None = None) -> Path:
    pfad = ziel or t.datei.with_suffix(".txt")
    inhalt = t.mit_zeitmarken() if mit_zeitmarken else "\n\n".join(t.absaetze)
    pfad.write_text(inhalt + "\n", encoding="utf-8")
    log.info(_QUELLE, f"Geschrieben: {pfad}")
    return pfad
