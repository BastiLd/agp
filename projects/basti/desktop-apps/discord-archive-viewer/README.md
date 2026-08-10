# Discord Archive Viewer

Eine lokale Windows-Desktop-App, die Exporte von [DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter) (JSON + HTML + Assets/Media) in einer Discord-ähnlichen Oberfläche anzeigt.

- 100% lokal, keine Cloud, keine Uploads
- Originaldateien werden **nie** verändert (Read-only)
- Portable EXE und/oder NSIS-Installer
- Electron + React + TypeScript + Vite

## Inhalt

- [Installation](#installation)
- [Entwicklungsmodus starten](#entwicklungsmodus-starten)
- [Ordner hinzufügen](#ordner-hinzufügen)
- [Builds erstellen](#builds-erstellen)
- [Fehlerbehandlung](#fehlerbehandlung)
- [Datenintegrität](#datenintegrität)
- [Sicherheitsarchitektur](#sicherheitsarchitektur)

## Installation

Voraussetzung: **Node.js ≥ 18** (getestet mit Node 20+) und npm.

```bash
npm install
```

## Entwicklungsmodus starten

```bash
npm run dev
```

Vite startet den Renderer mit Hot-Reload und Electron lädt automatisch die App.

## Ordner hinzufügen

Du hast drei Wege, Channels zu laden:

### Einzelne Channel-Ordner

1. Klick auf **„+ Channel-Ordner"** in der Seitenleiste.
2. Im System-Dialog einen oder mehrere Ordner auswählen, die jeweils eine `*.json`-Export-Datei enthalten.
3. Bestätigen — die Channels erscheinen sofort in der Liste.

### Hauptordner

1. Klick auf **„+ Hauptordner"**.
2. Einen übergeordneten Ordner auswählen, z. B. `D:\DiscordExports\`.
3. Bestätigen — die App scannt rekursiv (bis 20 Ebenen tief) nach **allen** `*.json`-Dateien und legt jeden gefundenen Channel als eigenen Eintrag an.

### Mehrere Channels gleichzeitig

Mehrere Channel-Ordner können in einem Dialog markiert (Strg-Klick) werden. Du kannst auch nacheinander mehrere Hauptordner hinzufügen — alle Channels landen in derselben Liste und du kannst per Klick zwischen ihnen wechseln.

## Builds erstellen

Alle Build-Artefakte landen im Ordner `release/`.

| Befehl | Ergebnis |
| --- | --- |
| `npm run build` | Kompiliert Renderer + Main in `dist/` und `dist-electron/`. |
| `npm run dist:portable` | Portable EXE (`release\DiscordArchiveViewer-Portable-<version>.exe`). |
| `npm run dist:installer` | NSIS-Installer (`release\DiscordArchiveViewer-Setup-<version>.exe`). |
| `npm run dist` | Beides in einem Lauf. |

Die **Portable EXE** läuft ohne Installation per Doppelklick. Beim ersten Start entpackt sie sich kurz in den Temp-Ordner.

## Fehlerbehandlung

| Problem | Was tun |
| --- | --- |
| **Keine JSON gefunden** | Ordner-Auswahl prüfen — die App sucht nach `*.json`-Dateien rekursiv. Liegt die JSON tiefer? Wähle einen Ordner weiter oben oder direkt den Channel-Ordner. |
| **Datei fehlt im Archiv** (Karte zeigt „Datei fehlt") | Die Mediendatei wurde im Export nicht abgelegt oder umbenannt. Die Nachricht bleibt sichtbar; der Anhang erscheint als Hinweiskarte. |
| **JSON ungültig / kann nicht geparst werden** | Ein Toast in der unteren rechten Ecke zeigt den Pfad und den Fehler. Andere Channels werden weiterhin geladen. |
| **Pfad nicht lesbar** | Berechtigungen prüfen. Die App überspringt unzugängliche Pfade und zeigt eine Warnung. |
| **HTML lässt sich nicht öffnen** | Standardbrowser nicht gesetzt? Manuell den Pfad öffnen — die App schreibt nichts. |

## Datenintegrität

Der Discord Archive Viewer liest **ausschließlich**. Es werden **keine** Schreib-, Umbenennungs-, Verschiebe- oder Löschoperationen in den Channel- oder Hauptordnern ausgeführt. Es werden auch keine Sidecar-Dateien dort angelegt. Lokale App-Einstellungen werden nur im Windows-userData-Verzeichnis (`%APPDATA%\Discord Archive Viewer\`) abgelegt.

## Sicherheitsarchitektur

- **Lokal**: Es gibt keine Server, keine Cloud, keine Telemetrie.
- **Kein Cloud-Upload**: Die App stellt von sich aus keine Verbindung ins Internet her. Nur die Aktion „In HTML öffnen" leitet eine Datei an dein Standardprogramm weiter.
- **Keine Token-Speicherung**: Sollten Discord-Tokens in einem Export auftauchen, werden sie nicht gespeichert und nicht in Logs geschrieben.
- **contextIsolation: true / nodeIntegration: false / sandbox: true**: Der Renderer hat keinen Zugriff auf Node oder das Dateisystem.
- **Preload-API mit Whitelist**: Nur explizit definierte Methoden sind verfügbar. Pfade werden geprüft und müssen innerhalb registrierter Ordner liegen.
- **Custom Protocol `media://`**: Dient zur Anzeige lokaler Mediendateien und liefert nur Inhalte aus registrierten Ordnern aus.

## Tech-Stack

| Komponente | Verwendet |
| --- | --- |
| Desktop-Shell | Electron 30 |
| UI | React 18 + TypeScript |
| Build | Vite 5 + electron-builder |
| Markdown | `marked` |

## Tipps

- **Rechtsklick** auf einen Channel in der Liste, um ihn aus der App zu entfernen (Originaldatei bleibt unverändert).
- **Suche im Channel** vs. **global**: oben rechts in der Suchleiste umschaltbar.
- **Datumsfilter** akzeptieren `Von` / `Bis` einzeln; ein leeres Feld bedeutet „keine Einschränkung".
