import os
from openai import OpenAI
from pathlib import Path

# Configuration
TRANSCRIPT_DIR = "transcripts"
TEXT_FILE = r"c:\Users\basti\Desktop\MittelKap7.txt"
OUTPUT_FILE = "final_text.txt"
OUTPUT_FILE_V2 = "final_text_v2.txt"  # Zweite Version im direkten Stil (Mittelkap schreibt selbst)
OUTPUT_FILE_V3 = "final_text_v3.txt"  # Dritte Version: Höflich, kurz, Fokus auf Audios 38, 41, 42
INSTRUCTIONS_FILE = "instructions.txt"  # Datei für deine Anweisungen

# API Key - wird direkt hier gesetzt (oder aus Umgebungsvariable)
API_KEY = os.getenv("OPENAI_API_KEY") or "DEIN_API_KEY_HIER"

if not API_KEY:
    raise ValueError("API Key nicht gefunden!")

client = OpenAI(api_key=API_KEY)

def load_instructions():
    """Load custom instructions from instructions.txt if it exists."""
    if os.path.exists(INSTRUCTIONS_FILE):
        try:
            with open(INSTRUCTIONS_FILE, "r", encoding="utf-8") as f:
                instructions = f.read().strip()
                if instructions:
                    print(f"\n📝 Anweisungen aus {INSTRUCTIONS_FILE} geladen:")
                    print(f"   {instructions[:100]}..." if len(instructions) > 100 else f"   {instructions}")
                    return instructions
        except Exception as e:
            print(f"⚠ Warnung: Konnte {INSTRUCTIONS_FILE} nicht lesen: {e}")
    return None

def extract_number_from_transcript(filename):
    """Extract number from transcript filename for sorting."""
    import re
    # Remove .txt extension and .ogg
    name = filename.replace('.txt', '').replace('.ogg', '')
    numbers = re.findall(r'\d+', name)
    if numbers:
        return int(numbers[-1])
    return 0

def load_transcriptions():
    """Load all transcriptions in order."""
    if not os.path.exists(TRANSCRIPT_DIR):
        print(f"Warnung: {TRANSCRIPT_DIR} Verzeichnis nicht gefunden!")
        return []
    
    transcript_files = [f for f in os.listdir(TRANSCRIPT_DIR) if f.endswith('.txt')]
    
    if not transcript_files:
        print(f"Keine Transkriptionen gefunden in {TRANSCRIPT_DIR}")
        return []
    
    # Sort files by number
    sorted_files = sorted(transcript_files, key=extract_number_from_transcript)
    
    transcripts = []
    for filename in sorted_files:
        filepath = os.path.join(TRANSCRIPT_DIR, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    transcripts.append({
                        'filename': filename,
                        'content': content
                    })
                    print(f"Geladen: {filename} ({len(content)} Zeichen)")
        except Exception as e:
            print(f"Fehler beim Laden von {filename}: {e}")
    
    return transcripts

def load_text_file():
    """Load and split the text file at line 419."""
    if not os.path.exists(TEXT_FILE):
        raise FileNotFoundError(f"Text file not found: {TEXT_FILE}")
    
    with open(TEXT_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    # Find split point (line 419 where "MFU-_-is_da" appears)
    split_line = 419
    for i, line in enumerate(lines, 1):
        if "MFU-_-is_da" in line:
            split_line = i
            break
    
    # Split into two conversations
    first_conversation = ''.join(lines[:split_line-1]).strip()
    second_conversation = ''.join(lines[split_line-1:]).strip()
    
    print(f"\nText-Datei geladen:")
    print(f"  Erste Unterhaltung (Privat): {len(first_conversation)} Zeichen")
    print(f"  Zweite Unterhaltung (MFU Discord): {len(second_conversation)} Zeichen")
    
    return first_conversation, second_conversation

def combine_all_content(transcripts, first_conv, second_conv):
    """Combine all content with clear separators. Highlight important audios."""
    combined = []
    
    # Add header
    combined.append("=" * 80)
    combined.append("PRIVATE CHAT UNTERHALTUNG (Basti <-> Mittelkap)")
    combined.append("=" * 80)
    combined.append("")
    combined.append(first_conv)
    combined.append("")
    combined.append("")
    
    # Add audio transcriptions for private chat (first 43)
    combined.append("=" * 80)
    combined.append("AUDIO-TRANSKRIPTIONEN: PRIVATE CHAT (Audio 1-43)")
    combined.append("=" * 80)
    combined.append("")
    combined.append("WICHTIG: Die Audios 38, 41 und 42 sind besonders wichtig und sollten stärker gewichtet werden!")
    combined.append("")
    
    # Important audio indices (1-based, so 38, 41, 42)
    important_audios = [38, 41, 42]
    
    for i, transcript in enumerate(transcripts[:43], 1):
        if i in important_audios:
            combined.append(f"\n{'=' * 80}")
            combined.append(f"*** WICHTIGES AUDIO {i}: {transcript['filename']} ***")
            combined.append(f"{'=' * 80}")
        else:
            combined.append(f"\n--- Audio {i}: {transcript['filename']} ---")
        combined.append(transcript['content'])
        combined.append("")
    
    # Add second conversation
    combined.append("")
    combined.append("=" * 80)
    combined.append("MFU DISCORD SERVER UNTERHALTUNG")
    combined.append("=" * 80)
    combined.append("")
    combined.append(second_conv)
    combined.append("")
    combined.append("")
    
    # Add remaining audio transcriptions (44-52)
    if len(transcripts) > 43:
        combined.append("=" * 80)
        combined.append("AUDIO-TRANSKRIPTIONEN: MFU DISCORD (Audio 44-52)")
        combined.append("=" * 80)
        combined.append("")
        
        for i, transcript in enumerate(transcripts[43:], 44):
            combined.append(f"\n--- Audio {i}: {transcript['filename']} ---")
            combined.append(transcript['content'])
            combined.append("")
    
    full_text = '\n'.join(combined)
    
    # Save combined text for reference
    with open("combined_text.txt", "w", encoding="utf-8") as f:
        f.write(full_text)
    
    print(f"\nKombinierter Text erstellt: {len(full_text)} Zeichen")
    print(f"Gespeichert in: combined_text.txt")
    
    return full_text

def generate_summary(combined_text):
    """Generate final summary using GPT-4."""
    print("\nGeneriere Zusammenfassung mit GPT-4...")
    
    # Check token limit (GPT-4 has ~128k context, but we'll be safe)
    # Rough estimate: 1 token ≈ 4 characters
    estimated_tokens = len(combined_text) / 4
    
    if estimated_tokens > 100000:
        print(f"Warnung: Text ist sehr lang (~{estimated_tokens:.0f} Tokens)")
        print("Verwende Chunking-Strategie...")
        return generate_summary_chunked(combined_text)
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """Du bist ein professioneller Autor und Analytiker. 
Deine Aufgabe ist es, aus vielen Gesprächen und Audio-Transkriptionen einen klaren, strukturierten Text zu erstellen, der alle wichtigen Ideen und Anfragen von Mittelkap zusammenfasst."""
                },
                {
                    "role": "user",
                    "content": f"""Hier sind alle Gespräche und Audio-Transkriptionen von Mittelkap.

AUFGABE:
- Verstehe ALLES vollständig
- Identifiziere die Hauptideen und Anfragen von Mittelkap
- Erstelle einen strukturierten, klaren Text der alles zusammenfasst
- Der Text soll alle wichtigen Punkte enthalten, die Mittelkap kommunizieren möchte
- Verwende eine professionelle, aber verständliche Sprache
- Organisiere die Informationen logisch

KONTEXT:
- Die ersten 43 Audios und der erste Text-Teil sind aus einem privaten Chat zwischen Basti und Mittelkap
- Die restlichen Audios und der zweite Text-Teil sind aus dem MFU (Marvel Fan Universe) Discord Server
- Mittelkap hat verschiedene Ideen und Vorschläge gemacht

TEXT:
{combined_text}

Erstelle jetzt einen umfassenden Text, der alles zusammenfasst was Mittelkap will und kommunizieren möchte."""
                }
            ],
            temperature=0.4,
            max_tokens=2000
        )
        
        summary = response.choices[0].message.content
        
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            f.write(summary)
        
        print(f"✓ Zusammenfassung erstellt: {len(summary)} Zeichen")
        print(f"Gespeichert in: {OUTPUT_FILE}")
        
        return summary
        
    except Exception as e:
        print(f"Fehler bei der Zusammenfassung: {e}")
        raise

def generate_summary_chunked(combined_text):
    """Generate summary using chunking for very long texts."""
    # Split into chunks of ~80k characters (safe for 100k token limit)
    chunk_size = 80000
    chunks = [combined_text[i:i+chunk_size] for i in range(0, len(combined_text), chunk_size)]
    
    print(f"Text in {len(chunks)} Chunks aufgeteilt")
    
    chunk_summaries = []
    
    for i, chunk in enumerate(chunks, 1):
        print(f"Verarbeite Chunk {i}/{len(chunks)}...")
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "Du bist ein professioneller Analytiker. Erstelle eine präzise Zusammenfassung des gegebenen Textes."
                },
                {
                    "role": "user",
                    "content": f"Zusammenfasse diesen Text-Abschnitt präzise:\n\n{chunk}"
                }
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        chunk_summaries.append(response.choices[0].message.content)
    
    # Now summarize the summaries
    print("Erstelle finale Zusammenfassung aus allen Chunks...")
    
    combined_summaries = "\n\n---\n\n".join(chunk_summaries)
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": """Du bist ein professioneller Autor. Erstelle aus mehreren Zusammenfassungen einen finalen, strukturierten Text der alle wichtigen Ideen und Anfragen von Mittelkap zusammenfasst."""
            },
            {
                "role": "user",
                "content": f"""Hier sind Zusammenfassungen verschiedener Text-Abschnitte. Erstelle daraus einen finalen, umfassenden Text der alles zusammenfasst was Mittelkap will und kommunizieren möchte:

{combined_summaries}"""
            }
        ],
        temperature=0.4,
        max_tokens=4000
    )
    
    summary = response.choices[0].message.content
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(summary)
    
    print(f"✓ Finale Zusammenfassung erstellt: {len(summary)} Zeichen")
    print(f"Gespeichert in: {OUTPUT_FILE}")
    
    return summary

def generate_summary_v2(combined_text, custom_instructions=None):
    """Generate second version in direct, concise style like the example."""
    print("\nGeneriere Version 2 (direkter Stil) mit GPT-4...")
    
    # Check token limit
    estimated_tokens = len(combined_text) / 4
    
    if estimated_tokens > 100000:
        print(f"Warnung: Text ist sehr lang (~{estimated_tokens:.0f} Tokens)")
        print("Verwende Chunking-Strategie...")
        return generate_summary_v2_chunked(combined_text, custom_instructions)
    
    try:
        # Add custom instructions if available
        instructions_note = ""
        if custom_instructions:
            instructions_note = f"\n\nZUSÄTZLICHE ANWEISUNGEN:\n{custom_instructions}\n\n"
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """Du bist Basti und fasst die Ideen von Mittelkap zusammen. 
Schreibe im direkten, prägnanten Stil wie in einem persönlichen Gespräch. Beginne mit \"Also ich denke Mittelkap will mit den ganzen Audios das folgende sagen.\""""
                },
                {
                    "role": "user",
                    "content": f"""Hier sind alle Gespräche und Audio-Transkriptionen von Mittelkap.

BEISPIEL-STIL (so soll der Text aussehen):
---
Also ich denke Mittelkap will mit den ganzen Audios das folgende sagen.

Ich habe die Idee, dass man die App die Ihr erstellt auch für DC und Star-Wars machen könnte.
Zudem war meine Idee, dass man einen neuen Discord-Server erstellt und diesen DC-Fan-Universe nennt und ich, Mittelkap und Montrigor würden diesem beitreten. Man muss ihn noch nicht aufbauen, aber das wir ihn einfach mal haben. (Man kann diesen ja jederzeit wieder löschen.)
Ich habe auch erwähnt das Montrigor sich mit einem oder mehreren anderen Marvel Youtubern zusammen schließen könnte und man würde diesen Server dann zusammen managen.

Und ich meinte das wir das (das beigelegtes Bild) mit diesem MFU Server machen.
---

WICHTIG: Der Text wird von MITTELKAP selbst geschrieben und an Montrigor gesendet!
- Verwende "ich" statt "er" oder "Mittelkap"
- Schreibe so, als ob Mittelkap selbst spricht
- Formulierungen wie: "Ich habe die Idee, dass..." oder "Zudem war meine Idee, dass..." oder "Ich habe auch erwähnt das..."

AUFGABE:
- Verstehe ALLES vollständig aus allen Transkriptionen
- Fasse ALLE Ideen und Anfragen von Mittelkap zusammen
- Schreibe im EXAKTEN Stil des obigen Beispiels
- Beginne mit: "Also ich denke Mittelkap will mit den ganzen Audios das folgende sagen."
- Liste dann alle Punkte klar und direkt auf, genau wie im Beispiel
- Verwende kurze, klare Sätze wie im Beispiel
- Keine langen Erklärungen, nur die Fakten und Ideen
- Verwende "ich" statt "er" - Mittelkap schreibt selbst!
- Der Text soll so sein, dass Mittelkap ihn direkt an Montrigor senden kann

WICHTIG - BESONDERE AUFMERKSAMKEIT:
- Die Audios 38, 41 und 42 sind BESONDERS WICHTIG und sollten stärker gewichtet werden
- Stelle sicher, dass alle wichtigen Ideen aus diesen Audios enthalten sind
- Diese Audios sind im Text mit "*** WICHTIGES AUDIO ***" markiert

KONTEXT:
- Die ersten 43 Audios und der erste Text-Teil sind aus einem privaten Chat zwischen Basti und Mittelkap
- Die restlichen Audios und der zweite Text-Teil sind aus dem MFU (Marvel Fan Universe) Discord Server
- Mittelkap hat verschiedene Ideen und Vorschläge gemacht

TEXT:
{combined_text}
{instructions_note}
Erstelle jetzt einen direkten, prägnanten Text im EXAKTEN Stil des Beispiels, der ALLES zusammenfasst was Mittelkap will und kommunizieren möchte. Der Text soll so sein, dass Mittelkap ihn direkt an Montrigor senden kann."""
                }
            ],
            temperature=0.4,
            max_tokens=2000
        )
        
        summary = response.choices[0].message.content
        
        with open(OUTPUT_FILE_V2, "w", encoding="utf-8") as f:
            f.write(summary)
        
        print(f"✓ Version 2 erstellt: {len(summary)} Zeichen")
        print(f"Gespeichert in: {OUTPUT_FILE_V2}")
        
        return summary
        
    except Exception as e:
        print(f"Fehler bei Version 2: {e}")
        raise

def generate_summary_v2_chunked(combined_text, custom_instructions=None):
    """Generate version 2 using chunking for very long texts."""
    chunk_size = 80000
    chunks = [combined_text[i:i+chunk_size] for i in range(0, len(combined_text), chunk_size)]
    
    print(f"Text in {len(chunks)} Chunks aufgeteilt")
    
    chunk_summaries = []
    
    for i, chunk in enumerate(chunks, 1):
        print(f"Verarbeite Chunk {i}/{len(chunks)}...")
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "Du bist Basti und fasst prägnant zusammen. Liste die Ideen von Mittelkap direkt auf."
                },
                {
                    "role": "user",
                    "content": f"Fasse die Ideen von Mittelkap aus diesem Text-Abschnitt prägnant zusammen:\n\n{chunk}"
                }
            ],
            temperature=0.3,
            max_tokens=4000
        )
        
        chunk_summaries.append(response.choices[0].message.content)
    
    print("Erstelle finale Version 2 aus allen Chunks...")
    
    combined_summaries = "\n\n---\n\n".join(chunk_summaries)
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
                {
                    "role": "system",
                    "content": """Du bist Mittelkap und schreibst selbst den Text an Montrigor. 
Schreibe im direkten, prägnanten Stil. Verwende "ich" statt "er". Beginne mit \"Also ich denke Mittelkap will mit den ganzen Audios das folgende sagen.\""""
                },
                {
                    "role": "user",
                    "content": f"""Hier sind Zusammenfassungen verschiedener Text-Abschnitte.

BEISPIEL-STIL (so soll der Text aussehen):
---
Also ich denke Mittelkap will mit den ganzen Audios das folgende sagen.

Ich habe die Idee, dass man die App die Ihr erstellt auch für DC und Star-Wars machen könnte.
Zudem war meine Idee, dass man einen neuen Discord-Server erstellt und diesen DC-Fan-Universe nennt und ich, Mittelkap und Montrigor würden diesem beitreten. Man muss ihn noch nicht aufbauen, aber das wir ihn einfach mal haben. (Man kann diesen ja jederzeit wieder löschen.)
Ich habe auch erwähnt das Montrigor sich mit einem oder mehreren anderen Marvel Youtubern zusammen schließen könnte und man würde diesen Server dann zusammen managen.

Und ich meinte das wir das (das beigelegtes Bild) mit diesem MFU Server machen.
---

WICHTIG: Verwende "ich" statt "er" - Mittelkap schreibt selbst!

Erstelle daraus einen direkten, prägnanten Text im EXAKTEN Stil des Beispiels, der ALLES zusammenfasst was Mittelkap will und kommunizieren möchte. Der Text soll so sein, dass Mittelkap ihn direkt an Montrigor senden kann.

WICHTIG: Die Audios 38, 41 und 42 sind besonders wichtig!

ZUSAMMENFASSUNGEN:
{combined_summaries}
{f'\n\nZUSÄTZLICHE ANWEISUNGEN:\n{custom_instructions}\n\n' if custom_instructions else ''}"""
                }
        ],
        temperature=0.4,
        max_tokens=4000
    )
    
    summary = response.choices[0].message.content
    
    with open(OUTPUT_FILE_V2, "w", encoding="utf-8") as f:
        f.write(summary)
    
    print(f"✓ Version 2 erstellt: {len(summary)} Zeichen")
    print(f"Gespeichert in: {OUTPUT_FILE_V2}")
    
    return summary

def generate_summary_v3(transcripts, first_conv, second_conv, custom_instructions=None):
    """Generate version 3: Höflich, kurz, Fokus auf Audios 38, 41, 42."""
    print("\nGeneriere Version 3 (höflich, kurz, Fokus auf Audios 38, 41, 42)...")
    
    # Extract important audios (38, 41, 42 - 1-based indexing, so indices 37, 40, 41)
    important_audios = []
    for i, transcript in enumerate(transcripts[:43], 1):
        if i in [38, 41, 42]:
            important_audios.append({
                'number': i,
                'content': transcript['content'],
                'filename': transcript['filename']
            })
    
    # Combine important content
    important_content = []
    important_content.append("PRIVATE CHAT UNTERHALTUNG:")
    important_content.append(first_conv)
    important_content.append("")
    important_content.append("=" * 80)
    important_content.append("WICHTIGE AUDIOS (38, 41, 42):")
    important_content.append("=" * 80)
    for audio in important_audios:
        important_content.append(f"\nAudio {audio['number']}: {audio['filename']}")
        important_content.append(audio['content'])
        important_content.append("")
    
    important_text = '\n'.join(important_content)
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """Du bist Mittelkap und schreibst einen höflichen, kurzen Text an Montrigor. 
Der Text soll die wichtigsten Punkte aus den Audios 38, 41 und 42 zusammenfassen. 
Schreibe höflich, klar und verständlich. Verwende "ich" statt "er"."""
                },
                {
                    "role": "user",
                    "content": f"""Hier sind die wichtigsten Inhalte, besonders aus den Audios 38, 41 und 42.

AUFGABE:
- Fasse die wichtigsten Ideen und Anfragen höflich und kurz zusammen
- Fokus auf die Audios 38, 41 und 42
- Schreibe so, dass man versteht was Mittelkap will
- Verwende "ich" statt "er" - Mittelkap schreibt selbst
- Höflicher, professioneller Ton
- Kurz und prägnant, aber vollständig

INHALT:
{important_text}
{f'\n\nZUSÄTZLICHE ANWEISUNGEN:\n{custom_instructions}\n\n' if custom_instructions else ''}
Erstelle jetzt einen höflichen, kurzen Text der die wichtigsten Punkte zusammenfasst, besonders aus den Audios 38, 41 und 42."""
                }
            ],
            temperature=0.4,
            max_tokens=2000
        )
        
        summary = response.choices[0].message.content
        
        with open(OUTPUT_FILE_V3, "w", encoding="utf-8") as f:
            f.write(summary)
        
        print(f"✓ Version 3 erstellt: {len(summary)} Zeichen")
        print(f"Gespeichert in: {OUTPUT_FILE_V3}")
        
        return summary
        
    except Exception as e:
        print(f"Fehler bei Version 3: {e}")
        raise

def main():
    """Main summarization workflow."""
    print("=" * 60)
    print("ZUSAMMENFASSUNG ERSTELLEN")
    print("=" * 60)
    
    # Load custom instructions if available
    custom_instructions = load_instructions()
    
    # Load transcriptions
    transcripts = load_transcriptions()
    print(f"\nGeladen: {len(transcripts)} Transkriptionen")
    
    # Load text file
    first_conv, second_conv = load_text_file()
    
    # Combine all content
    combined_text = combine_all_content(transcripts, first_conv, second_conv)
    
    # Generate summary (Version 1 - original)
    print("\n" + "=" * 60)
    print("VERSION 1: Detaillierte Zusammenfassung")
    print("=" * 60)
    summary = generate_summary(combined_text)
    
    # Generate summary (Version 2 - direkter Stil, Mittelkap schreibt selbst)
    print("\n" + "=" * 60)
    print("VERSION 2: Direkter, prägnanter Stil (Mittelkap schreibt selbst)")
    print("=" * 60)
    summary_v2 = generate_summary_v2(combined_text, custom_instructions)
    
    # Generate summary (Version 3 - höflich, kurz, Fokus auf 38, 41, 42)
    print("\n" + "=" * 60)
    print("VERSION 3: Höflich, kurz, Fokus auf Audios 38, 41, 42")
    print("=" * 60)
    summary_v3 = generate_summary_v3(transcripts, first_conv, second_conv, custom_instructions)
    
    print("\n" + "=" * 60)
    print("FERTIG!")
    print("=" * 60)
    print(f"Version 1 gespeichert in: {OUTPUT_FILE}")
    print(f"Version 2 gespeichert in: {OUTPUT_FILE_V2}")
    print(f"Version 3 gespeichert in: {OUTPUT_FILE_V3}")
    if custom_instructions:
        print(f"\n📝 Anweisungen aus {INSTRUCTIONS_FILE} wurden berücksichtigt.")

if __name__ == "__main__":
    main()
