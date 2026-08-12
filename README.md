# AGP — Alle Gruppen und Projekte

Gesammelte Code-Projekte von **Bastian Klaus** und **Mijo Mörtl**, mit einer Katalog-Website
zum Durchstöbern.

**Katalog:** https://bastild.github.io/agp/

---

## Was hier drin ist

**56 Projekte** von zwei Rechnern — Websites, Browser-Erweiterungen, Python-Apps,
Desktop-Programme und Minecraft-Mods. Bewusst **nicht** enthalten sind Fotos, Videos,
Schuldokumente, Präsentationen, Dateien von Mitschüler:innen sowie installierte
Fremdprogramme.

```
agp/
├── index.html              Katalog-Website
├── assets/                 Gestaltung und Logik der Website
├── data/
│   ├── projects.json       Alle öffentlichen Projekte
│   └── private.enc         Privater Bereich (AES-256-GCM verschlüsselt)
├── projects/
│   ├── basti/
│   │   ├── websites/
│   │   ├── python-apps/
│   │   ├── browser-extensions/
│   │   ├── desktop-apps/
│   │   └── minecraft-mods/
│   └── mijo/
│       └── websites/
├── duplicate-finder/       PowerShell-Skript zur Duplikatsuche
├── tools/                  Import-Werkzeug und Verschlüsselung
├── DUPLIKATE.md            Wo dasselbe Projekt mehrfach liegt
└── NAECHSTE-SCHRITTE.md    Was als Nächstes ansteht
```

## Die Katalog-Website

- **Kacheln in vier Größen** — klein, mittel, groß und Liste, wie die Symbolansicht im
  Windows-Explorer. Die Wahl bleibt gespeichert.
- **Fünf Kategorien** — Websites, Python-Apps & Bots, Browser-Erweiterungen, Desktop-Apps
  und Minecraft-Mods, jede mit eigenem Symbol und eigener Farbe.
- **Schalter oben in der Mitte** — links **Basti** (blau), rechts **Mijo** (grün).
  Anklicken oder mit der Maus bzw. dem Finger hinüberziehen.
- **Klick auf eine Kachel** öffnet die Beschreibung mit verwendeter Technik und Links
  zur laufenden Website, zum eigenen Repository und zum Code hier im Repo.
- **Suchfeld** filtert über Titel, Beschreibung und Technik.

## Projekte mit eigenem Repository

Diese Projekte werden weiterhin in ihrem eigenen Repo gepflegt; hier liegt eine
Momentaufnahme für den Katalog:

| Projekt | Repository | Live |
|---|---|---|
| GHGFlix | [GHGFLIX](https://github.com/BastiLd/GHGFLIX) | — |
| Aktenzeichen Ungelöst | [MurderMystery](https://github.com/BastiLd/MurderMystery) | [Seite](https://bastild.github.io/MurderMystery/) |
| Claude Wormhole Site | [school-website-tzu-powerpoint](https://github.com/BastiLd/school-website-tzu-powerpoint) | [Seite](https://bastild.github.io/school-website-tzu-powerpoint/) |
| Kartenbot | [kartenbot](https://github.com/BastiLd/kartenbot) | — |
| VetNow Kärnten | [vetnow](https://github.com/BastiLd/vetnow) | [Seite](https://bastild.github.io/vetnow/) |
| Plex Transfer | [transfermov-seritozimaOSserver](https://github.com/BastiLd/transfermov-seritozimaOSserver) | — |
| WebHafen | [MFU-TEST](https://github.com/BastiLd/MFU-TEST) | — |
| ObbyMM | [ObbyMM](https://github.com/BastiLd/ObbyMM) | — |
| IdeenHub | [Webbing](https://github.com/BastiLd/Webbing) | — |
| Excel Formel Retter | [Fromel-Excel](https://github.com/BastiLd/Fromel-Excel) | — |
| Small but Good | [Small-but-Good](https://github.com/BastiLd/Small-but-Good) | [Seite](https://bastild.github.io/Small-but-Good/) |
| Perry Rat | [Perry-Rat](https://github.com/BastiLd/Perry-Rat) | [Seite](https://bastild.github.io/Perry-Rat/) |
| Discord Bot Maker | [Discord_Bot-Maker](https://github.com/BastiLd/Discord_Bot-Maker) | — |
| BastiLd Mod Hub | [MCDiskussionWeb](https://github.com/BastiLd/MCDiskussionWeb) | — |
| CraftControl | [Game-Server-ZimaOS](https://github.com/BastiLd/Game-Server-ZimaOS) | — |
| Homelab Discord Bot Manager | [Docker-Discord-Bot](https://github.com/BastiLd/Docker-Discord-Bot) | — |
| Media Duplikat Finder | [abgleich](https://github.com/BastiLd/abgleich) | — |
| Medien-Suche | [Medien-Suche-Privat](https://github.com/BastiLd/Medien-Suche-Privat) | — |
| MediaSync | [MediaSync](https://github.com/BastiLd/MediaSync) | — |
| Privacy Guard | [adblock-chrome-extension](https://github.com/BastiLd/adblock-chrome-extension) | — |
| Restore Inventory | [Restore-Inv](https://github.com/BastiLd/Restore-Inv) | — |

Alle übrigen Projekte haben (noch) kein eigenes Repository und liegen vorerst nur hier.

## Privater Bereich

Der graue Link **privat** ganz unten öffnet eine Passwortabfrage. Die zugehörigen
Projektdaten liegen als `data/private.enc` — mit **AES-256-GCM** verschlüsselt, der Schlüssel
wird über **PBKDF2-SHA256** mit 250 000 Runden aus dem Passwort abgeleitet. Ohne das
richtige Passwort ist die Datei nicht lesbar, auch nicht hier im öffentlichen Repo.

Nach dem Entsperren erscheint unten ein **eigener Abschnitt mit Schloss-Symbol** und
gestricheltem Rahmen; die Kacheln darin sind orange abgesetzt und tragen die Marke
🔒 Privat. Der **Code** dieser Projekte liegt nicht hier, sondern im privaten Repository
`BastiLd/agp-privat` — deshalb fehlt bei ihnen der Link „Code in diesem Repo".

Neu verschlüsseln nach einer Änderung an `data/private.json`:

```bash
node tools/encrypt-private.js "PASSWORT"
```

`data/private.json` steht in `.gitignore` und wird nie hochgeladen.

## Katalog aktualisieren

Doppelklick auf **`AGP aktualisieren.bat`** im Repo-Stamm. Das Fenster zeigt, was
sich in den Quellordnern geändert hat, lässt einzelne Projekte abwählen und
übernimmt sie auf Knopfdruck — auf Wunsch samt Hochladen zu GitHub.

Ohne Fenster geht es genauso:

```powershell
.\tools\Update-AGP.ps1                        # nur nachsehen, ändert nichts
.\tools\Update-AGP.ps1 -Uebernehmen -Hochladen
```

Woher jedes Projekt stammt, steht in `data/quellen.json`. Der **Rechnername** ist
Teil des Schlüssels, weil dieselben Projekte auf Laptop und PC an verschiedenen
Orten liegen — auf `BASTIAN_PC` sind es 42 der 57, die übrigen gibt es nur auf dem
Laptop. Beim Übernehmen gelten dieselben Ausschlüsse wie beim ersten Aufbau
(`tools/AGP-Regeln.ps1`), Zugangsdaten bleiben also auch hier zurück.

Das Werkzeug **löscht nichts**: mehrere Projekte sind aus zwei Quellen
zusammengesetzt, ein Spiegeln würde den Teil aus der anderen Quelle vernichten.
Was im Repo liegt, aber nicht mehr in der Quelle, wird nur gemeldet.

### Neue Live-Seiten finden

```bash
node tools/pruefe-live.js
```

Fragt für jedes verknüpfte Repo bei GitHub nach, ob dort eine Pages-Seite läuft, die
im Katalog noch fehlt — und meldet umgekehrt Links, deren Pages abgeschaltet wurde.
Eingetragen wird **nichts automatisch**: eine Pages-Adresse kann eine alte, ganz
andere Seite ausliefern, wie bei WebHafen. Erst ansehen, dann `live` setzen.

## Duplikate auf anderen Rechnern finden

```powershell
.\duplicate-finder\Find-Duplicates.ps1
```

Durchsucht standardmäßig alle lokalen Laufwerke nach mehrfach vorhandenen Projektordnern —
erkannt über gleichen Namen, gleichen Inhalt oder dasselbe Git-Repository. Das Skript
**liest nur**, es löscht und verschiebt nichts. Ergebnis landet als CSV auf dem Desktop.

Was gefunden wurde, steht in [DUPLIKATE.md](DUPLIKATE.md) — der Kartenbot etwa liegt über
beide Rechner verteilt in **neun** Kopien.

## Ein Projekt übernehmen

```powershell
.\tools\Import-Projekt.ps1 -Quelle "D:\Pfad\zum\Projekt" -Ziel "projects/basti/websites/name"
```

Kopiert ein Projekt in den Katalog und lässt dabei automatisch weg: Zugangsdaten, Build-
Ausgaben und Abhängigkeiten, Browser-Profile aus Testläufen, Mediendateien und alles über
20 MB. Zusätzlich wird der **Inhalt** jeder Textdatei auf bekannte Schlüsselformen geprüft.
Jede ausgelassene Datei landet in einem CSV-Bericht. Mit `-NurAnzeigen` erst einmal nur
schauen, was passieren würde.

## Hinweis zu Zugangsdaten

Das Repo ist öffentlich, deshalb wurde beides Mal vor der Veröffentlichung ausgemistet.

**Vom Laptop entfernt:** ein Plex-Zugangstoken samt Server-Adresse, ein TMDb-API-Schlüssel,
die Kartenbot-Datenbank (enthielt Discord-IDs) sowie Laufzeit-Protokolle.

**Vom PC zurückgelassen:** 63 Dateien — unter anderem 13 `.env`-Dateien des Discord-Bot-
Managers, ein SFTP-Hostschlüssel, zwei Projektdatenbanken, Supabase-Schlüssel und drei
vollständige **Chrome-Profile** mit gespeicherten Anmeldedaten, die als Rückstände
automatischer Screenshot-Läufe in einem Projektordner lagen.

Ein Fund fiel nur der Inhaltsprüfung auf: In *Audio zu Text* stand ein gültiger
OpenAI-Schlüssel fest im Quelltext. Die betroffenen Dateien sind im Katalog, aber mit
`DEIN_API_KEY_HIER` an seiner Stelle.

Die vollständige Liste steht in [DUPLIKATE.md](DUPLIKATE.md). **Die Originale auf den
Rechnern sind unverändert** — es wurde nur gelesen und kopiert.
