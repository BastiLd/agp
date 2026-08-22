"""Zentrales Logging: Ringpuffer im Speicher + Datei + Abonnenten für die GUI."""
from __future__ import annotations

import sys
import threading
import time
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable

STUFEN = {"debug": 10, "info": 20, "ok": 25, "warn": 30, "fehler": 40}


@dataclass(frozen=True)
class Eintrag:
    zeit: float
    stufe: str
    quelle: str
    text: str

    def formatiert(self) -> str:
        uhr = time.strftime("%H:%M:%S", time.localtime(self.zeit))
        return f"[{uhr}] {self.stufe.upper():<6} {self.quelle:<12} {self.text}"


class LogBus:
    def __init__(self, groesse: int = 5000) -> None:
        self._puffer: deque[Eintrag] = deque(maxlen=groesse)
        self._abonnenten: list[Callable[[Eintrag], None]] = []
        self._sperre = threading.Lock()
        self._datei: Path | None = None
        self.echo = False
        self.mindeststufe = "info"

    def an_datei(self, ordner: Path) -> None:
        ordner.mkdir(parents=True, exist_ok=True)
        self._datei = ordner / f"mittelkap-{time.strftime('%Y-%m-%d')}.log"

    def abonnieren(self, rueckruf: Callable[[Eintrag], None]) -> Callable[[], None]:
        with self._sperre:
            self._abonnenten.append(rueckruf)
        return lambda: self._abbestellen(rueckruf)

    def _abbestellen(self, rueckruf: Callable[[Eintrag], None]) -> None:
        with self._sperre:
            if rueckruf in self._abonnenten:
                self._abonnenten.remove(rueckruf)

    def schreiben(self, stufe: str, quelle: str, text: str) -> None:
        eintrag = Eintrag(time.time(), stufe, quelle, text)
        with self._sperre:
            self._puffer.append(eintrag)
            abonnenten = list(self._abonnenten)
            datei = self._datei
        if datei is not None:
            try:
                with datei.open("a", encoding="utf-8") as f:
                    f.write(eintrag.formatiert() + "\n")
            except OSError:
                pass
        if self.echo and STUFEN.get(stufe, 20) >= STUFEN.get(self.mindeststufe, 20):
            print(eintrag.formatiert(), file=sys.stderr)
        for rueckruf in abonnenten:
            try:
                rueckruf(eintrag)
            except Exception:
                pass

    def debug(self, quelle: str, text: str) -> None:
        self.schreiben("debug", quelle, text)

    def info(self, quelle: str, text: str) -> None:
        self.schreiben("info", quelle, text)

    def ok(self, quelle: str, text: str) -> None:
        self.schreiben("ok", quelle, text)

    def warn(self, quelle: str, text: str) -> None:
        self.schreiben("warn", quelle, text)

    def fehler(self, quelle: str, text: str) -> None:
        self.schreiben("fehler", quelle, text)

    def eintraege(self, seit: float = 0.0) -> list[Eintrag]:
        with self._sperre:
            return [e for e in self._puffer if e.zeit >= seit]

    def als_text(self, eintraege: Iterable[Eintrag] | None = None) -> str:
        quelle = self.eintraege() if eintraege is None else eintraege
        return "\n".join(e.formatiert() for e in quelle)


log = LogBus()
