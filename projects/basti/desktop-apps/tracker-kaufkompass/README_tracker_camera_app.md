# Tracker & Kamera Kaufkompass (Node CLI)

Dieses kleine Node.js‑Programm bietet einen schnellen Überblick über die im Bericht analysierten GPS‑Tracker und Kameras. Die Daten liegen als JSON vor und können über eine einfache Text‑Menüoberfläche angezeigt werden.

## Anforderungen

- [Node.js](https://nodejs.org/) (Version 14 oder höher). Falls Sie Node.js nicht installiert haben, können Sie es kostenlos von der offiziellen Webseite herunterladen.
- Optional: [pkg](https://github.com/vercel/pkg), um das Skript in eine eigenständige Windows‑EXE zu packen. Das ist nur notwendig, wenn Sie eine ausführbare Datei erstellen möchten.

## Installation & Nutzung

1. Entpacken Sie das ZIP‑Archiv. Es enthält folgende Dateien:
   - `tracker_camera_app.js` – Das Node‑Skript
   - `tracker_camera_data.json` – Die Datentabelle
   - `README_tracker_camera_app.md` – Diese Anleitung

2. Öffnen Sie eine Kommandozeile im entpackten Verzeichnis.

3. Führen Sie das Programm mit Node aus:

   ```bash
   node tracker_camera_app.js
   ```

   Es erscheint ein Menü, in dem alle Geräte aufgelistet sind. Geben Sie die Nummer eines Geräts ein, um die Details anzuzeigen. Mit `alle` zeigen Sie alle Geräte nacheinander an, `exit` beendet das Programm.

## Optional: Erstellung einer Windows‑EXE

Wenn Sie eine eigenständige EXE erzeugen möchten (z. B. um die App ohne Node‑Installation zu starten), können Sie das Open‑Source‑Tool **pkg** nutzen.

1. Installieren Sie pkg weltweit mit npm (Voraussetzung ist eine funktionierende Internetverbindung):

   ```bash
   npm install -g pkg
   ```

2. Kompilieren Sie das Skript für Windows (64‑Bit):

   ```bash
   pkg tracker_camera_app.js --targets node18-win-x64 --output Tracker_Kamera_Kaufkompass.exe
   ```

   Diese Anweisung lädt die erforderliche Node‑Runtime herunter und erzeugt `Tracker_Kamera_Kaufkompass.exe`. Sie können diese Datei dann unter Windows direkt ausführen. Da das Programm Text‑basiert ist, wird beim Start ein Konsolenfenster angezeigt.

> **Hinweis:** Aufgrund der Größe der eingebetteten Node‑Runtime kann die EXE rund 50–70 MB groß sein. Die im Agent‑Modus bereitgestellte Umgebung erlaubt keine Online‑Installation neuer Pakete; daher wird das Kompilieren hier nicht automatisiert durchgeführt. Folgen Sie einfach der Anleitung auf Ihrem eigenen System.

Viel Erfolg!
