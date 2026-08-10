# Nächste Schritte

Kurze Übergabe für die Fortsetzung am PC. Erstellt am 10.08.2026 auf dem **Laptop**.

## Was schon fertig ist

- 21 Code-Projekte von Basti sind einsortiert unter `projects/basti/`
- Katalog-Website läuft: https://bastild.github.io/agp/
- Privater Bereich funktioniert (grauer Link unten, Passwort `GHGFLIX`) — ist aber noch leer
- `DUPLIKATE.md` listet alle Mehrfachkopien vom **Laptop**
- `duplicate-finder/Find-Duplicates.ps1` ist getestet und einsatzbereit

## 1. Projekte vom PC dazunehmen

Auf dem PC dasselbe Vorgehen wie auf dem Laptop:

1. Repo holen bzw. aktualisieren:
   ```bash
   git clone https://github.com/BastiLd/agp.git
   ```
2. Nach Code-Projekten suchen (Websites, Apps, Bots, Erweiterungen).
   **Nicht** aufnehmen: Bilder, Videos, Schuldokumente, Präsentationen, Dateien von
   Mitschüler:innen, installierte Fremdprogramme.
3. Beim Kopieren ausschließen: `node_modules`, `dist`, `build`, `target`, `.next`,
   `__pycache__`, `.venv`, `.git`, Dateien über 20 MB.
4. **Vor dem Commit auf Zugangsdaten prüfen** — das Repo ist öffentlich. Beim ersten
   Aufbau mussten entfernt werden: ein Plex-Token samt Server-Adresse, ein TMDb-API-Key,
   die Kartenbot-Datenbank (Discord-IDs) und Laufzeit-Protokolle.
5. Neue Einträge in `data/projects.json` ergänzen (gleiches Schema wie die bestehenden).

## 2. Duplikate auf dem PC suchen

```powershell
.\duplicate-finder\Find-Duplicates.ps1
```

Durchsucht alle lokalen Laufwerke, erkennt Duplikate über gleichen Namen, gleichen Inhalt
oder dasselbe Git-Repository. Liest nur, löscht nichts. Der CSV-Bericht landet auf dem
Desktop. Die Ergebnisse gehören anschließend in `DUPLIKATE.md`.

## 3. Mijos Projekte nachholen

Auf dem Laptop **blockiert**: das OneDrive-Konto `Moertl.Mijo@edu.chs-villach.at`
(`OneDrive - CHS Villach (1)`) synchronisiert nicht. Alle Dateien dort sind Cloud-Platzhalter,
Windows meldet *„Der Clouddateianbieter wird nicht ausgeführt"*.

**Lösung:** in OneDrive mit Mijos Konto anmelden bzw. Synchronisierung starten, danach
Rechtsklick auf die Ordner → **„Immer auf diesem Gerät behalten"**.

Danach zu übernehmen:

| Ordner | Wohin | Bereich |
|---|---|---|
| `Jackson` | `projects/mijo/websites/jackson` | öffentlich |
| `Privat\Fiverr1\Basti Cursor` | privates Repo | privat |
| `Privat\Basti-Roast` | privates Repo | privat |
| `Privat\TdoT` | privates Repo | privat |
| `Privat\HTML` | privates Repo | privat |
| `Privat\CTF` | privates Repo | privat |

## 4. Privaten Bereich befüllen

Sobald Mijos Dateien lesbar sind:

1. Privates Repo `BastiLd/agp-privat` anlegen (privat, nicht öffentlich) und den Code
   dorthin pushen.
2. `data/private.json` mit den Projekteinträgen füllen (gleiches Schema wie
   `projects.json`, plus `repo` auf `agp-privat`).
3. Neu verschlüsseln und hochladen:
   ```bash
   node tools/encrypt-private.js "GHGFLIX"
   git add data/private.enc && git commit -m "Privaten Bereich aktualisieren" && git push
   ```

`data/private.json` steht in `.gitignore` und darf nie hochgeladen werden.

## 5. Eigene Repos für die übrigen Projekte

Diese Projekte haben noch **kein** eigenes GitHub-Repo und liegen bisher nur hier —
bewusst so entschieden, kann aber jederzeit nachgeholt werden:

Avocado at Law · bastianklaus.online · Studiow-Warteliste · DigitalFAB · FlashLearn ·
Wunderwelten Reisen · Roblox-Recherche · Mini-Games · ResuMax Clone ·
Mediathek-Downloader · Wisch-Animation · AutoCapture · Auto Tab Close ·
Stadt-Land-Fluss-Auto-Fill · CursorForge
