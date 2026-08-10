"""
Test script to validate file sorting and setup without making API calls.
"""
import os
import re
from pathlib import Path

AUDIO_DIR = r"c:\Users\basti\Downloads\Mittelkap"
TEXT_FILE = r"c:\Users\basti\Desktop\MittelKap7.txt"

def extract_number(filename):
    """Extract number from filename for sorting (same as in transcribe.py)."""
    name = filename.lower().replace('.ogg', '')
    numbers = re.findall(r'\d+', name)
    if numbers:
        return int(numbers[-1])
    if 'voice-message' in name and len(name.replace('voice-message', '').strip()) < 3:
        return 0
    return 999

def test_file_sorting():
    """Test that audio files can be sorted correctly."""
    print("=" * 60)
    print("TEST: Datei-Sortierung")
    print("=" * 60)
    
    audio_dir = Path(AUDIO_DIR)
    if not audio_dir.exists():
        print(f"✗ Audio-Verzeichnis nicht gefunden: {AUDIO_DIR}")
        return False
    
    audio_files = [f for f in os.listdir(audio_dir) 
                   if f.lower().endswith(('.ogg', '.mp3', '.wav', '.m4a'))]
    
    if not audio_files:
        print(f"✗ Keine Audio-Dateien gefunden")
        return False
    
    sorted_files = sorted(audio_files, key=extract_number)
    
    print(f"✓ Gefunden: {len(sorted_files)} Audio-Dateien")
    print(f"\nErste 10 Dateien (sortiert):")
    for i, f in enumerate(sorted_files[:10], 1):
        num = extract_number(f)
        print(f"  {i:2d}. {f} (Nummer: {num})")
    
    print(f"\nLetzte 5 Dateien (sortiert):")
    for i, f in enumerate(sorted_files[-5:], len(sorted_files)-4):
        num = extract_number(f)
        print(f"  {i:2d}. {f} (Nummer: {num})")
    
    return True

def test_text_file_split():
    """Test that text file can be split correctly."""
    print("\n" + "=" * 60)
    print("TEST: Text-Datei Split")
    print("=" * 60)
    
    if not os.path.exists(TEXT_FILE):
        print(f"✗ Text-Datei nicht gefunden: {TEXT_FILE}")
        return False
    
    with open(TEXT_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    print(f"✓ Text-Datei geladen: {len(lines)} Zeilen")
    
    # Find split point
    split_line = 419
    for i, line in enumerate(lines, 1):
        if "MFU-_-is_da" in line:
            split_line = i
            break
    
    first_conv = ''.join(lines[:split_line-1]).strip()
    second_conv = ''.join(lines[split_line-1:]).strip()
    
    print(f"✓ Split-Punkt gefunden: Zeile {split_line}")
    print(f"  Erste Unterhaltung: {len(first_conv)} Zeichen")
    print(f"  Zweite Unterhaltung: {len(second_conv)} Zeichen")
    
    # Check first conversation
    if "MittelKap7" in first_conv and "Basti" in first_conv:
        print("  ✓ Erste Unterhaltung enthält erwartete Inhalte")
    else:
        print("  ⚠ Erste Unterhaltung scheint unvollständig")
    
    # Check second conversation
    if "MFU-_-is_da" in second_conv and "Montrigor" in second_conv:
        print("  ✓ Zweite Unterhaltung enthält erwartete Inhalte")
    else:
        print("  ⚠ Zweite Unterhaltung scheint unvollständig")
    
    return True

def test_requirements():
    """Test that requirements file exists."""
    print("\n" + "=" * 60)
    print("TEST: Requirements")
    print("=" * 60)
    
    if os.path.exists("requirements.txt"):
        print("✓ requirements.txt gefunden")
        with open("requirements.txt", "r") as f:
            content = f.read()
            if "openai" in content:
                print("  ✓ openai dependency gefunden")
                return True
            else:
                print("  ✗ openai dependency fehlt")
                return False
    else:
        print("✗ requirements.txt nicht gefunden")
        return False

def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("SETUP VALIDIERUNG")
    print("=" * 60)
    print()
    
    results = []
    
    results.append(("Datei-Sortierung", test_file_sorting()))
    results.append(("Text-Datei Split", test_text_file_split()))
    results.append(("Requirements", test_requirements()))
    
    print("\n" + "=" * 60)
    print("ZUSAMMENFASSUNG")
    print("=" * 60)
    
    all_passed = True
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
        if not result:
            all_passed = False
    
    print()
    if all_passed:
        print("✓ Alle Tests bestanden! Setup ist bereit.")
        print("\nNächste Schritte:")
        print("1. Setze OPENAI_API_KEY Umgebungsvariable")
        print("2. Führe aus: pip install -r requirements.txt")
        print("3. Führe aus: python transcribe.py")
        print("4. Führe aus: python summarize.py")
    else:
        print("✗ Einige Tests fehlgeschlagen. Bitte überprüfe die Fehler oben.")
    
    return all_passed

if __name__ == "__main__":
    main()
