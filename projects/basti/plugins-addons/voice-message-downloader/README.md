# VoiceMessageDownloader (BetterDiscord Plugin)

Zeigt neben jeder Discord-Sprachnachricht einen Download-Button. Ein Klick speichert die
Sprachnachricht (`.ogg`) direkt in einen frei wählbaren Ordner.

## Installation

1. Datei `VoiceMessageDownloader.plugin.js` nach
   `C:\Users\basti\AppData\Roaming\BetterDiscord\plugins\` kopieren.
2. In Discord: **Einstellungen → Plugins** öffnen (ggf. `Strg + R` drücken, damit die Liste neu lädt).
3. Den Schalter bei **VoiceMessageDownloader** einschalten.

Mehr braucht es nicht — keine Abhängigkeit zu ZeresPluginLibrary oder BDFDB.

## Bedienung

| Aktion | Ergebnis |
|---|---|
| Klick auf das Download-Symbol | Speichert sofort in den eingestellten Ordner |
| Shift-Klick oder Rechtsklick | Öffnet den Windows-„Speichern unter …“-Dialog |
| Grüner Haken / roter Blitz am Button | Erfolg bzw. Fehler (Details als Toast + in der Konsole) |

## Einstellungen

Zu finden über das Zahnrad neben dem Plugin in der Plugin-Liste.

- **Speicherort** – Zielordner, wird bei Bedarf automatisch angelegt.
  Standard: `%USERPROFILE%\Downloads\Discord Sprachnachrichten`.
  Buttons „Durchsuchen“ (Ordnerauswahl) und „Öffnen“ (Ordner im Explorer).
- **Dateiname-Vorlage** – Standard: `{user} {date} {time}.{ext}`
  Platzhalter: `{user}` `{userid}` `{guild}` `{channel}` `{date}` `{time}` `{datetime}`
  `{id}` `{duration}` `{ext}`
  Für Windows unzulässige Zeichen werden automatisch ersetzt.
- **Unterordner** – alles in einen Ordner, pro Server, oder pro Server/Kanal.
- **Jedes Mal fragen** – immer den Speichern-Dialog statt Direktspeicherung.
- **Benachrichtigung anzeigen** – Toast mit dem gespeicherten Pfad.
- **Vorhandene Dateien überschreiben** – aus: gleichnamige Dateien bekommen ` (2)`, ` (3)` …

## Wie es funktioniert

- Ein `MutationObserver` (200 ms entprellt) beobachtet den Chat und findet alle
  `#message-accessories-<id>`-Container.
- Die Nachricht selbst kommt aus dem `MessageStore` (Fallback: React-Fiber-Walk), Anhänge werden
  über `filename: voice-message.*` bzw. `waveform`/`duration_secs` als Sprachnachricht erkannt.
- Der Button wird in den Player-Container gehängt (`[class*="voiceMessage"]` u. ä.) und rechts
  daneben positioniert. Wird kein Player-Element gefunden (z. B. nach einem Discord-Update mit
  neuen Klassennamen), landet der Button als Fallback unter der Nachricht — die Funktion bleibt.
- Download über `BdApi.Net.fetch` (Fallback: `fetch`), gespeichert mit Node-`fs`.

## Fehlersuche

- **Kein Button sichtbar:** `Strg + Shift + I` → Konsole auf `[VoiceMessageDownloader]`-Meldungen
  prüfen. Plugin aus- und wieder einschalten.
- **Download schlägt fehl:** Discord-CDN-Links sind signiert und laufen ab. Kanal neu laden
  (`Strg + R`) und erneut versuchen.
