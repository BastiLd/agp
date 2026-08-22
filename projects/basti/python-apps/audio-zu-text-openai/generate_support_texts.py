import json
import os
import re
import argparse
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable, List, Sequence

from openai import OpenAI


SOURCE_AUDIO_DIR_DEFAULT = "Mittelkap ist zerstört sein leben ist scheiße stand 31.1.2026"
NEW_TRANSCRIPT_DIR_DEFAULT = "Transkript"

OUTPUT_ANSWER_FILE_DEFAULT = "output_friend_downhill_answer.txt"
OUTPUT_SUMMARY_FILE_DEFAULT = "output_audio_summary_short.txt"

AUDIO_EXTENSIONS = {".ogg", ".mp3", ".wav", ".m4a"}
TRANSCRIPT_AUDIO_SUFFIXES = (".ogg.txt", ".mp3.txt", ".wav.txt", ".m4a.txt")

SKIP_DIRS = {".git", ".venv", "__pycache__", "node_modules"}
TRANSCRIPT_DIR_NAMES = {"transcripts", "transkript", "transkripte"}
SKIP_FILES = {
    "combined_text.txt",
    "final_text.txt",
    "final_text_v2.txt",
    "final_text_v3.txt",
    "instructions.txt",
    "requirements.txt",
    "readme.md",
}


@dataclass(frozen=True)
class Transcript:
    path: Path
    modified_at: datetime
    content: str


def _dt_from_mtime(path: Path) -> datetime:
    return datetime.fromtimestamp(path.stat().st_mtime)


def _normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def transcript_name_from_audio(audio_filename: str) -> str:
    base = Path(audio_filename).stem
    base = re.sub(r"(?i)\bvoice[-_ ]?message\b", "transkript", base)
    base = _normalize_spaces(base)
    if not base:
        base = "transkript"
    return f"{base}.txt"


def require_openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit(
            "OPENAI_API_KEY ist nicht gesetzt. "
            "Bitte setze die Umgebungsvariable und starte dann erneut."
        )
    return OpenAI(api_key=api_key)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Transkribiert Audios (Whisper) und erstellt 2 Outputs (GPT): "
            "Antwort an Mittelkap + kurze Audio-Zusammenfassung."
        )
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--transcribe-only",
        action="store_true",
        help="Nur transkribieren (keine Text-Generierung).",
    )
    mode.add_argument(
        "--generate-only",
        action="store_true",
        help="Nur Text generieren (keine neue Transkription).",
    )

    parser.add_argument(
        "--source-audio-dir",
        default=SOURCE_AUDIO_DIR_DEFAULT,
        help=f"Ordner mit Audios (Default: {SOURCE_AUDIO_DIR_DEFAULT}).",
    )
    parser.add_argument(
        "--transkript-dir",
        default=NEW_TRANSCRIPT_DIR_DEFAULT,
        help=f"Zielordner für neue Transkripte (Default: {NEW_TRANSCRIPT_DIR_DEFAULT}).",
    )
    parser.add_argument(
        "--new-run",
        action="store_true",
        help="Schreibt Transkripte in einen neuen Unterordner (ohne bestehende zu überschreiben).",
    )
    parser.add_argument(
        "--recent-count",
        type=int,
        default=3,
        help="Wie viele der neuesten Transkripte extra gewichtet werden (Default: 3).",
    )
    parser.add_argument(
        "--summary-max-bullets",
        type=int,
        default=12,
        help="Maximale Bulletpoints in der Zusammenfassung (Default: 12).",
    )
    parser.add_argument(
        "--recap-words-min",
        type=int,
        default=150,
        help="Minimum Wortanzahl für den Kurztext (Default: 150).",
    )
    parser.add_argument(
        "--recap-words-max",
        type=int,
        default=300,
        help="Maximum Wortanzahl für den Kurztext (Default: 300).",
    )
    parser.add_argument(
        "--answer-file",
        default=OUTPUT_ANSWER_FILE_DEFAULT,
        help=f"Output-Datei für die Antwort (Default: {OUTPUT_ANSWER_FILE_DEFAULT}).",
    )
    parser.add_argument(
        "--summary-file",
        default=OUTPUT_SUMMARY_FILE_DEFAULT,
        help=f"Output-Datei für die Zusammenfassung (Default: {OUTPUT_SUMMARY_FILE_DEFAULT}).",
    )
    return parser.parse_args()


def list_audio_files(dir_path: Path) -> List[Path]:
    if not dir_path.exists():
        return []
    files = [p for p in dir_path.iterdir() if p.is_file() and p.suffix.lower() in AUDIO_EXTENSIONS]

    def sort_key(p: Path) -> Sequence[int]:
        nums = re.findall(r"\d+", p.name)
        return (int(nums[-1]) if nums else 0, len(p.name))

    return sorted(files, key=sort_key)


def transcribe_audio_file(client: OpenAI, audio_path: Path, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if out_path.exists() and out_path.stat().st_size > 0:
        print(f"Überspringe (bereits vorhanden): {out_path}")
        return

    print(f"Transkribiere: {audio_path.name}")
    with audio_path.open("rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="de",
        )
    text = (transcription.text or "").strip()
    out_path.write_text(text, encoding="utf-8")
    print(f"  OK gespeichert: {out_path}")


def transcribe_source_folder_to_transkript(
    client: OpenAI, source_audio_dir: Path, out_dir: Path
) -> List[Path]:
    audio_files = list_audio_files(source_audio_dir)
    if not audio_files:
        print(f"Keine Audio-Dateien gefunden in: {source_audio_dir}")
        return []

    out_dir.mkdir(parents=True, exist_ok=True)

    created_or_existing: List[Path] = []
    for audio_path in audio_files:
        out_name = transcript_name_from_audio(audio_path.name)
        out_path = out_dir / out_name
        # Handle collisions (same name) without deleting anything
        if out_path.exists() and out_path.stat().st_size > 0:
            created_or_existing.append(out_path)
            continue
        transcribe_audio_file(client, audio_path, out_path)
        created_or_existing.append(out_path)
    return created_or_existing


def iter_transcript_files(root: Path) -> Iterable[Path]:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        current_dir_name = Path(dirpath).name.lower()
        in_known_transcript_dir = current_dir_name in TRANSCRIPT_DIR_NAMES
        for filename in filenames:
            if not filename.lower().endswith(".txt"):
                continue
            if filename.lower() in SKIP_FILES:
                continue
            lower = filename.lower()
            if in_known_transcript_dir or lower.endswith(TRANSCRIPT_AUDIO_SUFFIXES) or "voice-message" in lower or "transkript" in lower:
                yield Path(dirpath) / filename


def load_transcripts(root: Path) -> List[Transcript]:
    transcripts: List[Transcript] = []
    for path in iter_transcript_files(root):
        try:
            content = path.read_text(encoding="utf-8").strip()
        except Exception:
            # Try latin-1 fallback for older files
            content = path.read_text(encoding="latin-1", errors="replace").strip()
        if not content:
            continue
        transcripts.append(Transcript(path=path, modified_at=_dt_from_mtime(path), content=content))

    transcripts.sort(key=lambda t: t.modified_at)
    return transcripts


def format_transcripts_for_prompt(transcripts: Sequence[Transcript], recent_count: int = 3) -> str:
    if not transcripts:
        return ""
    recent_paths = {t.path for t in transcripts[-recent_count:]} if len(transcripts) >= 1 else set()

    lines: List[str] = []
    lines.append("TRANSKRIPTE (chronologisch, neueste sind am wichtigsten):")
    lines.append("")

    for t in transcripts:
        rel = t.path.as_posix()
        stamp = t.modified_at.strftime("%Y-%m-%d %H:%M:%S")
        recent_tag = "  *** NEUESTES / HOHE PRIORITÄT ***" if t.path in recent_paths else ""
        lines.append(f"[{stamp}] {rel}{recent_tag}")
        lines.append(t.content)
        lines.append("")

    return "\n".join(lines).strip() + "\n"


def generate_answer_and_summary(client: OpenAI, transcripts_block: str, summary_max_bullets: int) -> dict:
    messages = [
        {
            "role": "system",
            "content": (
                "Du bist ein empathischer, klarer Freund. "
                "Du schreibst kurze, hilfreiche Texte auf Deutsch. "
                "Wenn es Hinweise auf akute Selbstgefährdung gibt, "
                "empfiehl ruhig, sofort Hilfe zu holen (Notruf/Vertrauensperson/Professionelle Hilfe)."
            ),
        },
        {
            "role": "user",
            "content": (
                "Lies ALLE Transkripte (unten). Die Person heißt Mittelkap.\n\n"
                "AUFGABEN:\n"
                "1) Antworte auf die Frage: \"What to say if the Life of a Friend is going all down hill?\" "
                "(Friend = Mittelkap). Der Text ist für MICH (Basti), also gib mir konkrete Sätze/Beispiele, "
                "wie ich reagieren, zuhören und nachfragen kann. Gib klare Handlungs-Tipps. "
                "Wenn er sich öffnet: Was kann ich sagen? Wenn er konkrete Antworten will: Was dann? "
                "Wenn es akut wirkt: Was soll ich tun?\n"
                f"2) Erstelle eine ZUSAMMENFASSUNG der wichtigsten Inhalte aus ALLEN Audios "
                f"(max. {summary_max_bullets} Bulletpoints). Gewichte die NEUESTEN Transkripte stärker als den Rest.\n"
                "3) Erstelle einen kurzen, zusammenhängenden Text (150–300 Wörter), der alles nochmals bündelt "
                "und besonders die neuesten Infos betont.\n\n"
                "Gib das Ergebnis als JSON zurück mit Keys: guidance, summary_bullets, recap_text.\n\n"
                f"{transcripts_block}"
            ),
        },
    ]

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=1200,
            messages=messages,
        )
    except TypeError:
        # Older SDKs may not support response_format; fall back to best-effort JSON.
        response = client.chat.completions.create(
            model="gpt-4o",
            temperature=0.3,
            max_tokens=1200,
            messages=messages,
        )

    content = (response.choices[0].message.content or "").strip()
    if not content:
        return {}
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", content, flags=re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return {}


def generate_recap_only(
    client: OpenAI,
    transcripts_block: str,
    words_min: int,
    words_max: int,
    previous_text: str | None = None,
) -> str:
    hint = ""
    if previous_text:
        prev_count = word_count(previous_text)
        hint = f"\nDer vorherige Text hatte {prev_count} Wörter. Bitte anpassen."
    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.3,
        max_tokens=900,
        messages=[
            {
                "role": "system",
                "content": "Du schreibst prägnante, gut lesbare deutsche Zusammenfassungen.",
            },
            {
                "role": "user",
                "content": (
                    "Erstelle einen zusammenhängenden Kurztext, der die wichtigsten Inhalte "
                    "aus allen Audios bündelt und die neuesten Infos stärker betont.\n"
                    f"Länge: {words_min}–{words_max} Wörter.\n"
                    f"{hint}\n\n"
                    f"{transcripts_block}"
                ),
            },
        ],
    )
    return (response.choices[0].message.content or "").strip()


def next_available_path(path: Path) -> Path:
    if not path.exists():
        return path
    stem = path.stem
    suffix = path.suffix
    parent = path.parent
    for i in range(2, 1000):
        candidate = parent / f"{stem} ({i}){suffix}"
        if not candidate.exists():
            return candidate
    raise RuntimeError(f"Konnte keinen freien Dateinamen finden für: {path}")


def coerce_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        parts = [str(v).strip() for v in value]
        return "\n".join([p for p in parts if p])
    if isinstance(value, dict):
        return json.dumps(value, ensure_ascii=False, indent=2)
    return str(value)


def coerce_bullets(value) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        lines: List[str] = []
        for item in value:
            s = str(item).strip()
            if not s:
                continue
            if s.startswith(("-", "•", "*")):
                lines.append(s)
            else:
                lines.append(f"- {s}")
        return "\n".join(lines)
    return coerce_text(value)

def trim_bullets(text: str, max_bullets: int) -> str:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    bullets: List[str] = []
    for line in lines:
        if line.startswith(("-", "•", "*")):
            bullets.append(line)
        else:
            bullets.append(f"- {line}")
    return "\n".join(bullets[:max(1, max_bullets)])


def word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text, flags=re.UNICODE))


def main() -> None:
    root = Path.cwd()

    args = parse_args()

    source_audio_dir = (root / args.source_audio_dir).resolve()
    out_transkript_dir = (root / args.transkript_dir).resolve()
    if args.new_run:
        stamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        out_transkript_dir = out_transkript_dir / stamp

    out_answer = (root / args.answer_file).resolve()
    out_summary = (root / args.summary_file).resolve()

    client = require_openai_client()

    if not args.generate_only:
        # 1) New transcripts from the latest audio folder
        transcribe_source_folder_to_transkript(client, source_audio_dir, out_transkript_dir)

    if args.transcribe_only:
        print("\nTranskription fertig.")
        return

    # 2) Read ALL transcripts (any folder) + generate outputs
    transcripts = load_transcripts(root)
    if not transcripts:
        raise SystemExit("Keine Transkripte gefunden (keine *.ogg.txt / *transkript*.txt Dateien).")

    transcripts_block = format_transcripts_for_prompt(transcripts, recent_count=max(1, int(args.recent_count)))
    result = generate_answer_and_summary(client, transcripts_block, summary_max_bullets=max(1, int(args.summary_max_bullets)))

    answer = coerce_text(result.get("guidance")).strip()
    summary_raw = coerce_bullets(result.get("summary_bullets")).strip()
    recap = coerce_text(result.get("recap_text")).strip()

    if not answer:
        raise SystemExit("Fehler: Kein 'guidance' im Model-Output gefunden.")
    if not summary_raw:
        raise SystemExit("Fehler: Kein 'summary_bullets' im Model-Output gefunden.")

    summary = trim_bullets(summary_raw, max(1, int(args.summary_max_bullets)))

    # Ensure recap length within bounds (retry up to 2x)
    words_min = max(1, int(args.recap_words_min))
    words_max = max(words_min, int(args.recap_words_max))
    if not recap:
        recap = generate_recap_only(client, transcripts_block, words_min, words_max)
    for _ in range(2):
        count = word_count(recap)
        if words_min <= count <= words_max:
            break
        recap = generate_recap_only(client, transcripts_block, words_min, words_max, previous_text=recap)
    recap_count = word_count(recap)
    recap_with_count = f"{recap}\n\nWortanzahl: {recap_count}"

    out_answer_final = next_available_path(out_answer)
    out_summary_final = next_available_path(out_summary)

    out_answer_final.write_text(answer + "\n", encoding="utf-8")
    out_summary_final.write_text(summary + "\n\n" + recap_with_count + "\n", encoding="utf-8")

    print("\nFertig:")
    print(f"  - Antwort: {out_answer_final}")
    print(f"  - Zusammenfassung: {out_summary_final}")


if __name__ == "__main__":
    main()
