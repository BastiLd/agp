# Discord Archive Viewer

Eine reine, lokal laufende Browser-App, mit der du **DiscordChatExporter**-Exporte (JSON + Medien)
durchsuchen und in einer Discord-ähnlichen Oberfläche anzeigen kannst.

- Kein Backend
- Kein Docker
- Keine Cloud
- Keine Uploads ins Internet
- Originaldateien werden **nicht** verändert

---

## Lokal starten

Voraussetzung: [Node.js](https://nodejs.org/) (LTS reicht).

```bash
npm install
npm run dev
```

Dann die im Terminal angezeigte URL öffnen (üblicherweise http://localhost:5173).

Weitere Scripts:

```bash
npm run build     # Produktions-Build
npm run preview   # Build lokal anschauen
npm run lint      # ESLint
```

---

## Bedienung

Beim Öffnen siehst du auf der Startseite vier Buttons:

| Button | Wofür? |
|---|---|
| **Channel-Ordner auswählen** | Ein einzelner Channel-Ordner mit JSON + Medien |
| **Hauptordner auswählen** | Ein übergeordneter Ordner mit mehreren Channel-Unterordnern |
| **JSON-Datei auswählen** | Eine oder mehrere reine `.json`-Dateien (auch ohne Medien) |
| **Assets/Media-Ordner auswählen** | Reiner Bilder/Videos/Anhänge-Ordner — wird mit den JSONs zusammengeführt |

### Mehrere Ordner und Dateien kombinieren

Du kannst die Buttons **mehrfach klicken** oder die Ordner und Dateien direkt **per Drag & Drop**
in das Fenster ziehen — auch mehrere gleichzeitig. Jede Auswahl landet als Eintrag in der Liste
„Vorbereitete Auswahl“. Erst wenn du auf **„Archiv öffnen“** klickst, werden alle Quellen
zusammengeführt zu einem Archiv.

Beispiel:

1. „Hauptordner auswählen“ → Ordner mit deinen 5 Channels
2. „Assets/Media-Ordner auswählen“ → ein separater Bilder-Ordner aus einem Backup
3. „JSON-Datei auswählen“ → eine zusätzliche, ältere Export-Datei
4. → **Archiv öffnen**

Alternativ markierst du im Datei-Explorer einfach mehrere Ordner und ziehst sie in einem Rutsch
ins Browserfenster. Ordner werden rekursiv gelesen, Pfade bleiben erhalten.

Auch im laufenden Betrieb kannst du in der linken Seitenleiste über **„+ Mehr hinzufügen“**
weitere Ordner oder Dateien einlesen, ohne die App neu zu starten.

### Wenn Medien fehlen

Wenn ein Anhang im Chat als „Fehlt lokal“ markiert ist:

- Der Viewer hat die Datei nicht in deiner Auswahl gefunden.
- Wähle entweder den kompletten Channel-Ordner inklusive Medien aus, oder lade den
  Bilder-/Anhänge-Ordner zusätzlich über **„Assets/Media-Ordner auswählen“** nach.
- Die Zuordnung erfolgt über Dateiname und relativen Pfad — die Datei muss also unter
  ihrem Original-Namen vorhanden sein.

---

## Browser-Kompatibilität

Die App nutzt `<input type="file" webkitdirectory multiple>` für die Ordnerauswahl.

- **Chrome, Edge, Brave, Opera, Vivaldi**: volle Unterstützung
- **Firefox**: aktuelle Versionen unterstützen `webkitdirectory` ebenfalls
- **Safari (macOS)**: aktuelle Versionen unterstützen es; ältere nicht
- **iOS / iPadOS Safari**: keine Ordnerauswahl. Nutze hier den JSON-Button für einzelne Dateien.

Falls dein Browser keine Ordnerauswahl kann, zeigt die App oben eine deutliche Warnung an
und die Ordner-Buttons sind deaktiviert. Du kannst dann trotzdem den **JSON-Datei**-Button
verwenden.

---

## Datenschutz

- Alles läuft lokal in deinem Browser.
- Keine API-Calls an externe Server.
- Keine Cloud, keine Datenbank.
- Optional: kleine UI-Einstellungen können in `LocalStorage` gespeichert werden.
- **Chat-Daten** werden nicht dauerhaft gespeichert — nach dem Schließen des Tabs sind sie weg.
- Beim erneuten Laden musst du deine Ordner/Dateien wieder auswählen — das ist eine
  Sicherheitsbeschränkung der Browser, kein Bug.

---

## Grenzen einer reinen Website

- Eine Website kann **nicht** automatisch deine ganze Festplatte scannen — du musst
  Ordner und Dateien selbst auswählen.
- Für **dauerhaft gespeicherte Archive** ist eine Docker-Lösung besser.
- Für eine **native PC-App** ist Electron besser geeignet.

Diese App hier ist bewusst minimal: nur Browser, nur lokal, sofort einsatzbereit.

---

## Funktionsumfang

- Discord-ähnlicher Dark-Mode
- Linke Channel-Liste (mit Kategorien, falls in der JSON enthalten)
- Chat-Header oben, neueste Nachricht unten
- Beim Öffnen automatisch zur neuesten Nachricht scrollen
- Avatar, Username, Timestamp, Content
- Embeds als Karten, Reaktionen, Replies (mit Sprung zur Original-Nachricht)
- Bilder, GIFs, Videos, Audios werden direkt im Chat dargestellt
- Andere Dateien als Download-Link
- Fehlende Dateien werden klar markiert
- Suche im aktuellen Channel oder global über alle geladenen Channels
- Filter: User, Datum, Medientyp (Bild / Datei / Link)
- Treffer anklicken springt direkt zur Nachricht
- Virtualisierte Liste für große Chats (auch 50.000+ Nachrichten flüssig)

---

## Tech-Stack

- React 19
- TypeScript
- Vite
- File API (`webkitRelativePath`)
- `lucide-react` für Icons
