"""Rohtext per kleinem Sprachmodell zu lesbarem Markdown aufräumen."""
from __future__ import annotations

import time
from pathlib import Path

from .config import Einstellungen
from .logbus import log
from .modelmanager import modelle

_QUELLE = "formatierer"

# Gemma 3 4B: bestes Deutsch in der Groessenklasse, ~2,5 GB als Q4_K_M.
MODELL_REPO = "unsloth/gemma-3-4b-it-GGUF"
MODELL_DATEI = "gemma-3-4b-it-Q4_K_M.gguf"

ANWEISUNG = """Du bekommst die wörtliche Abschrift einer deutschen Sprachnachricht.
Forme sie in gut lesbares Markdown um.

Regeln:
- Inhalt niemals verändern, nichts hinzuerfinden, nichts weglassen.
- Füllwörter (ähm, äh, halt, also, ne, sozusagen) entfernen.
- Sinnvolle Absätze bilden. Satzzeichen und Gross-/Kleinschreibung korrigieren.
- Aufzählungen als Liste mit "-" setzen, wenn der Text welche enthält.
- Konkrete Aufgaben, Termine oder Fristen als Liste hervorheben.
- Eine kurze Überschrift mit "## " voranstellen, die den Inhalt benennt.
- Antworte ausschliesslich mit dem Markdown, ohne Vorrede und ohne Code-Block."""


def modellpfad(einst: Einstellungen | None = None) -> Path:
    einst = einst or Einstellungen.laden()
    return einst.modellordner / einst.formatierer_modell


def modell_vorhanden(einst: Einstellungen | None = None) -> bool:
    return modellpfad(einst).exists()


def modell_holen(einst: Einstellungen | None = None,
                 fortschritt=None) -> Path:
    """Lädt das Formatierer-Modell herunter, falls es noch fehlt."""
    einst = einst or Einstellungen.laden()
    ziel = modellpfad(einst)
    if ziel.exists():
        return ziel

    from huggingface_hub import hf_hub_download

    einst.modellordner.mkdir(parents=True, exist_ok=True)
    log.info(_QUELLE, f"Lade {MODELL_DATEI} (~2,5 GB, einmalig) ...")
    if fortschritt:
        fortschritt(0.0, "Formatierer-Modell wird heruntergeladen")

    geladen = hf_hub_download(
        repo_id=MODELL_REPO, filename=MODELL_DATEI,
        local_dir=str(einst.modellordner),
    )
    pfad = Path(geladen)
    if pfad != ziel:
        pfad.replace(ziel)
    log.ok(_QUELLE, f"Formatierer-Modell liegt in {ziel}.")
    return ziel


def zu_markdown(text: str, einst: Einstellungen | None = None, fortschritt=None) -> str:
    """Räumt den Text auf. Whisper wird dafür vorher aus dem Grafikspeicher entladen."""
    einst = einst or Einstellungen.laden()
    text = text.strip()
    if not text:
        return ""

    melden = fortschritt or (lambda a, t: None)
    melden(0.0, "Formatierer wird vorbereitet")
    pfad = modell_holen(einst, fortschritt)

    llm = modelle.formatierer(pfad)
    melden(0.3, "Text wird aufgeräumt")

    log.info(_QUELLE, f"Formatiere {len(text)} Zeichen ...")
    start = time.perf_counter()
    antwort = llm.create_chat_completion(
        messages=[
            {"role": "system", "content": ANWEISUNG},
            {"role": "user", "content": text},
        ],
        temperature=0.2,
        max_tokens=min(4096, len(text) // 2 + 512),
    )
    ergebnis = antwort["choices"][0]["message"]["content"].strip()

    # Manche Modelle verpacken die Antwort trotz Anweisung in einen Code-Block.
    if ergebnis.startswith("```"):
        zeilen = ergebnis.splitlines()
        ergebnis = "\n".join(zeilen[1:-1] if zeilen[-1].strip() == "```" else zeilen[1:]).strip()

    log.ok(_QUELLE, f"Formatiert in {time.perf_counter() - start:.1f}s.")
    melden(1.0, "Fertig")
    return ergebnis
