import os
import re
from openai import OpenAI
from pathlib import Path

# Configuration
AUDIO_DIR = r"c:\Users\basti\Downloads\Mittelkap"
OUT_DIR = "transcripts"

# API Key - wird direkt hier gesetzt (oder aus Umgebungsvariable)
API_KEY = os.getenv("OPENAI_API_KEY") or "DEIN_API_KEY_HIER"

if not API_KEY:
    raise ValueError("API Key nicht gefunden!")

client = OpenAI(api_key=API_KEY)

# Create output directory
os.makedirs(OUT_DIR, exist_ok=True)

def extract_number(filename):
    """Extract number from filename for sorting."""
    # Handle various patterns:
    # - voice-message.ogg (base file, return 0)
    # - voice-message2.ogg (return 2)
    # - voice-message 10.ogg (return 10)
    # - voice-message.39ogg.ogg (return 39)
    
    # Remove extension
    name = filename.lower().replace('.ogg', '')
    
    # Try to find number in filename
    numbers = re.findall(r'\d+', name)
    if numbers:
        return int(numbers[-1])  # Get last number found
    
    # If no number found, it's likely the base file
    if 'voice-message' in name and len(name.replace('voice-message', '').strip()) < 3:
        return 0
    
    # Default: return a high number to put at end
    return 999

def sort_audio_files(files):
    """Sort audio files by their number."""
    return sorted(files, key=extract_number)

def transcribe_audio(audio_path, output_path):
    """Transcribe a single audio file using Whisper API."""
    try:
        print(f"Transkribiere: {os.path.basename(audio_path)}")
        
        with open(audio_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="de"  # German
            )
        
        text = transcription.text
        
        # Save transcription
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)
        
        print(f"  ✓ Gespeichert: {output_path}")
        return True, text
        
    except Exception as e:
        print(f"  ✗ Fehler bei {os.path.basename(audio_path)}: {str(e)}")
        return False, None

def main():
    """Main transcription workflow."""
    audio_dir = Path(AUDIO_DIR)
    
    if not audio_dir.exists():
        raise FileNotFoundError(f"Audio directory not found: {AUDIO_DIR}")
    
    # Get all audio files
    audio_files = [f for f in os.listdir(audio_dir) 
                   if f.lower().endswith(('.ogg', '.mp3', '.wav', '.m4a'))]
    
    if not audio_files:
        print(f"Keine Audio-Dateien gefunden in {AUDIO_DIR}")
        return
    
    # Sort files
    sorted_files = sort_audio_files(audio_files)
    
    print(f"\nGefunden: {len(sorted_files)} Audio-Dateien")
    print("=" * 60)
    
    successful = 0
    failed = 0
    
    for filename in sorted_files:
        audio_path = audio_dir / filename
        output_path = os.path.join(OUT_DIR, filename + ".txt")
        
        # Skip if already transcribed
        if os.path.exists(output_path):
            print(f"Überspringe (bereits transkribiert): {filename}")
            successful += 1
            continue
        
        success, _ = transcribe_audio(str(audio_path), output_path)
        
        if success:
            successful += 1
        else:
            failed += 1
    
    print("=" * 60)
    print(f"\nFertig!")
    print(f"Erfolgreich: {successful}")
    print(f"Fehlgeschlagen: {failed}")
    print(f"Transkriptionen gespeichert in: {OUT_DIR}/")

if __name__ == "__main__":
    main()
