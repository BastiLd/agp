# AGP — Alle Gruppen und Projekte

Gesammelte Code-Projekte von **Bastian Klaus** und **Mijo Mörtl**, mit einer Katalog-Website
zum Durchstöbern.

**Katalog:** https://bastild.github.io/agp/

---

## Was hier drin ist

Nur Software: Websites, Browser-Erweiterungen, Python-Apps und Desktop-Programme.
Bewusst **nicht** enthalten sind Fotos, Videos, Schuldokumente, Präsentationen, Dateien
von Mitschüler:innen sowie installierte Fremdprogramme.

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
│   │   └── desktop-apps/
│   └── mijo/
│       └── websites/
├── duplicate-finder/       PowerShell-Skript zur Duplikatsuche
├── tools/                  Hilfsskripte
└── DUPLIKATE.md            Wo dasselbe Projekt mehrfach liegt
```

## Die Katalog-Website

- **Kacheln in vier Größen** — klein, mittel, groß und Liste, wie die Symbolansicht im
  Windows-Explorer. Die Wahl bleibt gespeichert.
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

Alle übrigen Projekte haben (noch) kein eigenes Repository und liegen vorerst nur hier.

## Privater Bereich

Der graue Link **privat** ganz unten öffnet eine Passwortabfrage. Die zugehörigen
Projektdaten liegen als `data/private.enc` — mit **AES-256-GCM** verschlüsselt, der Schlüssel
wird über **PBKDF2-SHA256** mit 250 000 Runden aus dem Passwort abgeleitet. Ohne das
richtige Passwort ist die Datei nicht lesbar, auch nicht hier im öffentlichen Repo.

Neu verschlüsseln nach einer Änderung an `data/private.json`:

```bash
node tools/encrypt-private.js "PASSWORT"
```

`data/private.json` steht in `.gitignore` und wird nie hochgeladen.

## Duplikate auf anderen Rechnern finden

```powershell
.\duplicate-finder\Find-Duplicates.ps1
```

Durchsucht standardmäßig alle lokalen Laufwerke nach mehrfach vorhandenen Projektordnern —
erkannt über gleichen Namen, gleichen Inhalt oder dasselbe Git-Repository. Das Skript
**liest nur**, es löscht und verschiebt nichts. Ergebnis landet als CSV auf dem Desktop.

## Hinweis zu Zugangsdaten

Vor der Veröffentlichung wurden aus den Kopien entfernt: ein Plex-Zugangstoken samt
Server-Adresse, ein TMDb-API-Schlüssel, die Kartenbot-Datenbank (enthielt Discord-IDs)
sowie Laufzeit-Protokolle. Die Originale auf dem Rechner sind unverändert.
