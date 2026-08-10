# Audio Transcription and Summary Workflow

Dieses Projekt transkribiert 52 Audio-Dateien von Mittelkap, kombiniert sie mit bestehenden Text-Unterhaltungen und erstellt eine umfassende Zusammenfassung.

## Voraussetzungen

1. **Python 3.9+** installiert
2. **OpenAI API Key** - Du benötigst einen API-Key von OpenAI
3. **Umgebungsvariable** `OPENAI_API_KEY` gesetzt

## Installation

1. Installiere die Abhängigkeiten:
```bash
pip install -r requirements.txt
```

2. Setze deinen OpenAI API Key:
```bash
# Windows PowerShell
$env:OPENAI_API_KEY="dein-api-key-hier"

# Windows CMD
set OPENAI_API_KEY=dein-api-key-hier
```

## Verwendung

### Schritt 1: Audio-Dateien transkribieren

Führe das Transkriptions-Script aus:
```bash
python transcribe.py
```

Dieses Script:
- Lädt alle Audio-Dateien aus `c:\Users\basti\Downloads\Mittelkap`
- Sortiert sie numerisch (behandelt verschiedene Namensmuster)
- Transkribiert jede Datei mit OpenAI Whisper API
- Speichert die Transkriptionen in `transcripts/` Ordner

**Hinweis**: Die Transkription kann einige Zeit dauern und API-Kosten verursachen (~$0.003-0.006 pro Minute Audio).

### Schritt 2: Zusammenfassung erstellen

Nach der Transkription, führe das Zusammenfassungs-Script aus:
```bash
python summarize.py
```

Dieses Script:
- Lädt alle Transkriptionen aus `transcripts/`
- Lädt die Text-Datei `MittelKap7.txt` und teilt sie bei Zeile 419
- Kombiniert alles zu einem vollständigen Text
- Erstellt eine umfassende Zusammenfassung mit GPT-4
- Speichert das Ergebnis in `final_text.txt`

## Dateien

- **transcribe.py** - Transkribiert alle Audio-Dateien
- **summarize.py** - Erstellt die finale Zusammenfassung
- **test_setup.py** - Validiert das Setup (optional)
- **requirements.txt** - Python-Abhängigkeiten
- **transcripts/** - Ordner für einzelne Transkriptionen (wird automatisch erstellt)
- **combined_text.txt** - Alle Inhalte kombiniert (wird automatisch erstellt)
- **final_text.txt** - Finale Zusammenfassung (wird automatisch erstellt)

## Neuer Output (Antwort + Ultra-Kurz-Zusammenfassung)

Dieses Script:
- transkribiert automatisch alle Audios aus dem Ordner `Mittelkap ist zerstört sein leben ist scheiße stand 31.1.2026` nach `Transkript/`
- liest danach ALLE Transkripte rekursiv (egal in welchem Ordner)
- erstellt 2 neue Dateien:
  - `output_friend_downhill_answer.txt` (Text zum direkt an Mittelkap senden)
  - `output_audio_summary_short.txt` (Ultra-kurze Zusammenfassung, Fokus auf neueste Transkripte)

Ausführen:
```bash
python generate_support_texts.py
```

**Hinweis**: Dieses Script macht API-Aufrufe (Whisper + GPT-4o) und kann Kosten verursachen.

## Struktur der Daten

- **Erste 43 Audios** + **Zeilen 1-418** von `MittelKap7.txt` = Private Chat Unterhaltung (Basti ↔ Mittelkap)
- **Restliche 9 Audios** + **Zeilen 419-536** von `MittelKap7.txt` = MFU Discord Server Unterhaltung

## Kosten

- **Transkription**: ~$0.003-0.006 pro Minute Audio
- **Zusammenfassung**: Abhängig von Textlänge, typischerweise $0.01-0.10 für GPT-4

**Tipp**: Neue OpenAI-Accounts erhalten oft $5 Startguthaben.

## Fehlerbehebung

### "OPENAI_API_KEY environment variable not set"
- Stelle sicher, dass die Umgebungsvariable gesetzt ist
- Starte die Konsole neu nach dem Setzen

### "Audio directory not found"
- Überprüfe, ob der Pfad `c:\Users\basti\Downloads\Mittelkap` korrekt ist
- Stelle sicher, dass die Audio-Dateien dort vorhanden sind

### Transkription schlägt bei einzelnen Dateien fehl
- Das Script setzt fort und überspringt fehlerhafte Dateien
- Überprüfe die Fehlermeldungen in der Konsole

## Test

Optional kannst du das Setup testen (ohne API-Aufrufe):
```bash
python test_setup.py
```

Dies validiert:
- Datei-Sortierung
- Text-Datei Split
- Requirements
