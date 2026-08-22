"""Modellverwaltung.

Einzige Stelle im Projekt, die Modelle laden darf. Grund: die RTX 4060 hat 8 GB VRAM,
Whisper large-v3 (float16) belegt davon ~3,9 GB und Gemma 3 4B (Q4) ~3,2 GB. Beide
gleichzeitig geht nicht auf. Deshalb hält dieser Manager immer nur EIN Modell im
Speicher und entlädt das andere vorher nachweislich.
"""
from __future__ import annotations

import gc
import importlib.util
import os
import site
import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Any, Literal

from .logbus import log

Slot = Literal["whisper", "formatierer"]

_QUELLE = "modelle"


def _nvidia_smi(*felder: str) -> list[str] | None:
    try:
        roh = subprocess.run(
            ["nvidia-smi", f"--query-gpu={','.join(felder)}", "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=10, check=True,
        ).stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return None
    return [teil.strip() for teil in roh.splitlines()[0].split(",")] if roh else None


def gpu_info() -> dict[str, Any] | None:
    """None, wenn keine NVIDIA-GPU nutzbar ist."""
    felder = _nvidia_smi("name", "memory.total", "memory.used")
    if not felder or len(felder) < 3:
        return None
    try:
        return {"name": felder[0], "vram_gesamt_mb": int(felder[1]), "vram_belegt_mb": int(felder[2])}
    except ValueError:
        return None


def vram_belegt_mb() -> int | None:
    info = gpu_info()
    return info["vram_belegt_mb"] if info else None


_dlls_registriert = False


def cuda_dlls_registrieren() -> bool:
    """Macht die cuBLAS-/cuDNN-DLLs aus den pip-Paketen auffindbar.

    Unter Windows sucht ctranslate2 die DLLs im PATH; die nvidia-*-Pakete legen sie
    stattdessen in site-packages ab. Ohne diesen Schritt scheitert das GPU-Laden mit
    einer irreführenden "cudnn64_9.dll not found"-Meldung.
    """
    global _dlls_registriert
    if _dlls_registriert or os.name != "nt":
        return True

    wurzeln: set[Path] = set()
    if (spec := importlib.util.find_spec("nvidia")) and spec.submodule_search_locations:
        wurzeln.update(Path(p) for p in spec.submodule_search_locations)
    for basis in {*site.getsitepackages(), site.getusersitepackages()}:
        wurzeln.add(Path(basis) / "nvidia")

    ordner: list[Path] = []
    for nvidia in wurzeln:
        if nvidia.is_dir():
            ordner.extend(p for p in nvidia.glob("*/bin") if p.is_dir())
            ordner.extend(p for p in nvidia.glob("*/lib") if p.is_dir())
    eigene = Path(__file__).resolve().parents[2] / "dist" / "cuda"
    if eigene.is_dir():
        ordner.append(eigene)

    if not ordner:
        log.warn(_QUELLE, "Keine CUDA-DLLs gefunden - GPU-Betrieb schlägt möglicherweise fehl.")
        return False

    for pfad in ordner:
        try:
            os.add_dll_directory(str(pfad))
        except OSError:
            continue
    os.environ["PATH"] = os.pathsep.join([*(str(p) for p in ordner), os.environ.get("PATH", "")])
    log.debug(_QUELLE, f"{len(ordner)} CUDA-DLL-Ordner registriert.")
    _dlls_registriert = True
    return True


def geraet_aufloesen(wunsch: str = "auto") -> tuple[str, str]:
    """(gerät, berechnungstyp) - fällt ohne GPU automatisch auf CPU zurück."""
    if wunsch == "cpu":
        return "cpu", "int8"
    if gpu_info() is not None and cuda_dlls_registrieren():
        return "cuda", "float16"
    if wunsch == "cuda":
        log.warn(_QUELLE, "GPU angefordert, aber keine nutzbare NVIDIA-GPU gefunden. Nutze CPU.")
    return "cpu", "int8"


def whisper_ordner(modell: str, modellordner: Path) -> Path:
    return modellordner / f"whisper-{modell}"


def whisper_bereit(modell: str, modellordner: Path) -> bool:
    ordner = whisper_ordner(modell, modellordner)
    return (ordner / "model.bin").exists() and (ordner / "tokenizer.json").exists()


def whisper_holen(modell: str, modellordner: Path) -> Path:
    """Legt das Modell als flachen Ordner ab und gibt dessen Pfad zurück.

    Bewusst nicht der Hugging-Face-Zwischenspeicher: der arbeitet mit Symlinks, die
    unter Windows regelmäßig ins Leere zeigen - dann findet ctranslate2 die
    'model.bin' nicht. Ein flacher Ordner mit echten Dateien lässt sich ausserdem
    einfach neben die Anwendung kopieren.
    """
    ordner = whisper_ordner(modell, modellordner)
    if whisper_bereit(modell, modellordner):
        return ordner

    from huggingface_hub import snapshot_download

    log.info(_QUELLE, f"Lade Whisper-Modell '{modell}' herunter (einmalig) ...")
    ordner.mkdir(parents=True, exist_ok=True)
    snapshot_download(
        repo_id=f"Systran/faster-whisper-{modell}",
        local_dir=str(ordner),
        allow_patterns=["*.json", "*.bin", "*.txt"],
    )
    log.ok(_QUELLE, f"Modell liegt in {ordner}.")
    return ordner


class Modellverwaltung:
    def __init__(self) -> None:
        self._sperre = threading.RLock()
        self._slot: Slot | None = None
        self._modell: Any = None
        self._kennung: tuple | None = None

    @property
    def geladen(self) -> Slot | None:
        return self._slot

    def entladen(self) -> None:
        with self._sperre:
            if self._modell is None:
                return
            vorher = self._slot
            vram_vorher = vram_belegt_mb()
            self._modell = None
            self._slot = None
            self._kennung = None
            gc.collect()
            # ctranslate2/llama.cpp geben das VRAM erst beim Destruktor frei; kurz nachfassen.
            for _ in range(10):
                belegt = vram_belegt_mb()
                if belegt is None or belegt < 500:
                    break
                time.sleep(0.3)
                gc.collect()
            vram_nachher = vram_belegt_mb()
            log.info(_QUELLE, f"{vorher} entladen (VRAM {vram_vorher} -> {vram_nachher} MB).")

    def _reservieren(self, slot: Slot, kennung: tuple) -> Any | None:
        """Gibt das bereits passende Modell zurück, sonst None (und macht Platz)."""
        if self._slot == slot and self._kennung == kennung:
            return self._modell
        if self._slot is not None:
            log.info(_QUELLE, f"Modellwechsel: {self._slot} wird für {slot} entladen.")
            self.entladen()
        return None

    def whisper(self, modell: str, geraet: str = "auto", berechnungstyp: str = "auto",
                modellordner: Path | None = None) -> Any:
        log.debug(_QUELLE, "Lade faster-whisper-Bibliothek ...")
        from faster_whisper import WhisperModel
        log.debug(_QUELLE, "Bibliothek geladen, ermittle Gerät ...")

        quelle = str(whisper_holen(modell, modellordner)) if modellordner else modell
        aufgeloest, standardtyp = geraet_aufloesen(geraet)
        typ = standardtyp if berechnungstyp == "auto" else berechnungstyp
        kennung = (modell, aufgeloest, typ)

        with self._sperre:
            if (vorhanden := self._reservieren("whisper", kennung)) is not None:
                return vorhanden
            log.info(_QUELLE, f"Lade Whisper '{modell}' auf {aufgeloest} ({typ}) ...")
            start = time.perf_counter()
            self._modell = WhisperModel(quelle, device=aufgeloest, compute_type=typ)
            self._slot = "whisper"
            self._kennung = kennung
            log.ok(_QUELLE, f"Whisper bereit in {time.perf_counter() - start:.1f}s "
                            f"(VRAM {vram_belegt_mb()} MB).")
            return self._modell

    def formatierer(self, modellpfad: Path, kontext: int = 8192) -> Any:
        # Muss vor dem Import stehen: llama_cpp laedt seine DLLs beim Importieren und
        # findet die CUDA-Laufzeit sonst nicht.
        auf_gpu = gpu_info() is not None and cuda_dlls_registrieren()
        from llama_cpp import Llama

        gpu_schichten = -1 if auf_gpu else 0
        kennung = (str(modellpfad), kontext, gpu_schichten)

        with self._sperre:
            if (vorhanden := self._reservieren("formatierer", kennung)) is not None:
                return vorhanden
            log.info(_QUELLE, f"Lade Formatierer '{modellpfad.name}' "
                              f"({'GPU' if gpu_schichten else 'CPU'}) ...")
            start = time.perf_counter()
            self._modell = Llama(
                model_path=str(modellpfad), n_ctx=kontext, n_gpu_layers=gpu_schichten,
                verbose=False,
            )
            self._slot = "formatierer"
            self._kennung = kennung
            log.ok(_QUELLE, f"Formatierer bereit in {time.perf_counter() - start:.1f}s "
                            f"(VRAM {vram_belegt_mb()} MB).")
            return self._modell


modelle = Modellverwaltung()
