import os
import sys
from pathlib import Path
from downloader_core import get_all_media_items, download_media_item, DEFAULT_DOWNLOAD_DIR

def print_header():
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
    print("=" * 65)
    print("   MIRACULOUS LADYBUG AUTOMATED VIDEO DOWNLOADER   ")
    print("=" * 65)
    print("  Laedt alle Folgen, Staffeln, Specials & Filme in Ordner herunter:")
    print("  -> Staffel 1, Staffel 2, ..., Specials, Filme")
    print("=" * 65)

def select_language():
    print("\n[Sprachauswahl]")
    print("1) Deutsch (de) [Standard]")
    print("2) Englisch (en)")
    print("3) Französisch (fr)")
    print("4) Spanisch (es)")
    print("5) Andere Sprache eingeben")
    choice = input("Wähle eine Option (1-5, Enter für Deutsch): ").strip()
    if choice == "2":
        return "en"
    elif choice == "3":
        return "fr"
    elif choice == "4":
        return "es"
    elif choice == "5":
        custom = input("Sprachcode eingeben (z.B. pl, it, ru, tr, kr, jp): ").strip().lower()
        return custom if custom else "de"
    return "de"

def main():
    print_header()
    items = get_all_media_items()
    if not items:
        print("[!] Keine Medien-Dateien in miraculous/miraculous.to/en gefunden!")
        return

    categories = sorted(list(set(item["category"] for item in items)))
    print(f"\n[+] Insgesamt {len(items)} Medien gefunden in folgenden Kategorien:")
    for cat in categories:
        count = sum(1 for item in items if item["category"] == cat)
        print(f"  - {cat}: {count} Titel")

    lang = select_language()
    print(f"\n[+] Ausgewählte Sprache für Streams: {lang.upper()}")

    print("\n[Download-Optionen]")
    print("1) ALLES herunterladen (Alle Staffeln, Specials & Filme)")
    print("2) Bestimmte Kategorie / Staffel herunterladen")
    print("3) Eine einzelne Folge / Film herunterladen")
    print("4) Beenden")

    opt = input("\nWähle eine Option (1-4): ").strip()

    items_to_download = []

    if opt == "1":
        items_to_download = items
    elif opt == "2":
        print("\nVerfügbare Kategorien:")
        for idx, cat in enumerate(categories, 1):
            count = sum(1 for item in items if item["category"] == cat)
            print(f"  {idx}) {cat} ({count} Titel)")
        cat_opt = input(f"Wähle eine Kategorie (1-{len(categories)}): ").strip()
        try:
            selected_cat = categories[int(cat_opt) - 1]
            items_to_download = [item for item in items if item["category"] == selected_cat]
        except (IndexError, ValueError):
            print("[!] Ungültige Auswahl!")
            return
    elif opt == "3":
        print("\nLade Liste aller Titel...")
        for idx, item in enumerate(items, 1):
            print(f"  {idx:3d}) [{item['category']}] {item['title']}")
        item_opt = input(f"\nWähle eine Titel-Nummer (1-{len(items)}): ").strip()
        try:
            items_to_download = [items[int(item_opt) - 1]]
        except (IndexError, ValueError):
            print("[!] Ungültige Auswahl!")
            return
    else:
        print("Beendet.")
        return

    print(f"\n[+] Starte Download von {len(items_to_download)} Titel(n)...")
    print(f"[+] Zielordner: {DEFAULT_DOWNLOAD_DIR}\n")

    success_count = 0
    fail_count = 0

    for idx, item in enumerate(items_to_download, 1):
        print(f"[{idx}/{len(items_to_download)}] Lade: [{item['category']}] {item['title']}...")
        
        last = [0.0]

        def cli_progress(percent, phase, speed="", eta=""):
            if percent - last[0] < 5 and percent < 100:
                return
            last[0] = percent
            tail = f" {speed}" + (f" | noch {eta}" if eta else "") if speed else ""
            print(f"    -> [{percent:5.1f}%] {phase}{tail}")

        ok, file_path, msg, _langs = download_media_item(
            item,
            primary_lang=lang,
            output_base_dir=DEFAULT_DOWNLOAD_DIR,
            progress_callback=cli_progress
        )

        if ok:
            print(f"    [✔] Erfolgreich: {Path(file_path).name}\n")
            success_count += 1
        else:
            print(f"    [✘] Fehler: {msg}\n")
            fail_count += 1

    print("=" * 65)
    print(f"DOWNLOAD ABGESCHLOSSEN! Erfolgreich: {success_count} | Fehler: {fail_count}")
    print(f"Dateien gespeichert in: {DEFAULT_DOWNLOAD_DIR}")
    print("=" * 65)

if __name__ == "__main__":
    main()
