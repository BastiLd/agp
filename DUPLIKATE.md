# Duplikate & Mehrfachkopien

Beim Zusammentragen der Projekte sind mehrere Kopien desselben Projekts aufgetaucht.
Für dieses Repo wurde jeweils **die aktuellste Version** genommen. **Auf dem Laptop wurde
nichts gelöscht oder verschoben** — hier steht nur, was wo liegt, damit du selbst
zusammenführen kannst.

Stand: 10.08.2026 (Laptop). Der PC ist hier noch nicht erfasst.

---

## 1. Plex Transfer

Zwei komplette Kopien derselben Electron-/Python-App.

| Ort | Stand | Größe `app.py` | Git | Übernommen |
|---|---|---|---|---|
| `Documents\scripte\transfer\transfermov-seritozimaOSserver` | 05.07.2026 | 99.209 B | ✅ `BastiLd/transfermov-seritozimaOSserver` | **ja** |
| `OneDrive - CHS Villach\A1 GIT\TransfertoServer` | 03.05.2026 | 97.251 B | ❌ | nein |

**Empfehlung:** `A1 GIT\TransfertoServer` ist rund zwei Monate älter und hängt an keinem Repo.
Du kannst ihn löschen, sobald du geprüft hast, dass nichts Eigenes nur dort drin liegt.

---

## 2. Kartenbot

Kein echtes Duplikat, sondern **ein Repo mit zwei Arbeitsverzeichnissen**:
`Documents\kartenbot-web` ist ein *Git-Worktree* von `Documents\BOT\kartenbot`
(die Datei `.git` dort enthält nur den Verweis
`gitdir: …\BOT\kartenbot\.git\worktrees\kartenbot-web`).

| Ort | Rolle | Letzter Commit | Übernommen |
|---|---|---|---|
| `Documents\kartenbot-web` | Worktree (aktueller Zweig) | `5a9fac7` · 07.08.2026 | **ja** |
| `Documents\BOT\kartenbot` | Haupt-Arbeitskopie | `566beec` · 06.08.2026 | nein |

**Empfehlung:** So gedacht und in Ordnung — nichts zusammenführen. Nur wissen, dass
`BOT\kartenbot` das Original ist: löschst du den, verliert auch `kartenbot-web` seine
Git-Historie. Beide gehören zu `BastiLd/kartenbot`.

---

## 3. Claude Wormhole Site

Vier Kopien des gemeinsamen Schulprojekts.

| Ort | `app.js` | Stand | Übernommen |
|---|---|---|---|
| `Documents\Claude Wormhole Site` | 205.335 B | 29.06.2026 | **ja** (hat Git-Repo) |
| `OneDrive - CHS Villach\A A Kunst\Claude Wormhole Site` | 205.335 B | 29.06.2026 | nein (inhaltsgleich) |
| `OneDrive - CHS Villach (1)\KOMD Fotografie\Gemeinsame-Dateien\Claude Wormhole Site` | 69.833 B | 17.06.2026 | nein (deutlich älter) |
| `OneDrive - CHS Villach (1)\Präsentationen TZU\Claude Wormhole Site 2` | — | 30.06.2026 | nein (nicht lesbar, siehe unten) |

**Empfehlung:** Die beiden 205 KB-Kopien sind identisch. Mijos Kopien sind ältere Stände —
er sollte den aktuellen aus dem Repo `school-website-tzu-powerpoint` ziehen statt eine
eigene Kopie zu pflegen.

---

## 4. VetNow

Drei Stände, davon zwei veraltet.

| Ort | Was | Stand | Übernommen |
|---|---|---|---|
| `Documents\VetNow ALL\vetnow-app` | vollständige App (Web + Mobile + Extension + Studio) | Commit `23ba10e` · 04.08.2026 | **ja** |
| `Documents\VetNow ALL\VetNow (1)` | früher HTML-Prototyp | 07.07.2026 | nein |
| `Documents\VetNow (1).zip` | ZIP des gleichen Prototyps | 07.07.2026 | nein |

---

## 5. Avocado at Law

Derselbe Code liegt an zwei Stellen — inhaltlich **byte-identisch** geprüft (`app.jsx` u. a.).

| Ort | Rolle |
|---|---|
| `Documents\AvocadoatLaw` | eigenständige App, zusätzlich mit `screenshots\` |
| `Documents\VetNow ALL\vetnow-app\avocado\web` | dieselbe App, eingebettet als Teil des VetNow Studio |

**Entscheidung:** beide behalten — einmal als eigene Kachel, einmal als Bestandteil von VetNow,
weil das VetNow-Studio sie zum Bauen braucht.

---

## 6. Weitere Sicherungskopien (nicht übernommen)

| Ort | Warum nicht |
|---|---|
| `Documents\Websites_Download_Backup_20260801_235714` | Sicherung von `Websites Download` |
| `Documents\GHGFlix\backup_20260801_235846` | Sicherung im Projekt selbst |
| `Documents\DARK.zip` / `DARK_FULL.zip` | ZIPs des `DARK`-Ordners |
| `Documents\AutoCaptureallunderpages.zip` | ZIP des gleichnamigen Ordners |
| `Documents\Claude Wormhole Site.zip` (98 MB) | ZIP des Projekts |
| `Documents\kartenbot-web-static-1.4.1.zip` | Build-Ausgabe von kartenbot-web |
| `Documents\scripte\Extension Stadtlandflussandir.zip` | ZIP des gleichnamigen Ordners |
| `Documents\scripte.zip`, `Documents\website.zip` (110 MB) | Sammel-ZIPs |
| `OneDrive - CHS Villach\Microsoft Teams-Chatdateien` | über Teams geteilte Kopien von Schulaufgaben |

---

## Nicht lesbar: Mijos OneDrive

Das OneDrive-Konto **Moertl.Mijo@edu.chs-villach.at** (`OneDrive - CHS Villach (1)`) ist zwar
in Windows registriert, aber die Synchronisierung läuft nicht. Alle Dateien dort sind reine
Cloud-Platzhalter — Windows meldet beim Zugriff *„Der Clouddateianbieter wird nicht ausgeführt"*.

**Was zu tun ist:** Bei OneDrive mit Mijos Konto anmelden bzw. die Synchronisierung starten,
danach in den betroffenen Ordnern per Rechtsklick **„Immer auf diesem Gerät behalten"** wählen.
Erst dann lassen sich seine Projekte übernehmen.

Betroffen sind: `Jackson`, `Privat\Fiverr1\Basti Cursor`, `Privat\Basti-Roast`, `Privat\TdoT`,
`Privat\HTML`, `Privat\CTF`.

---

## Duplikate auf dem PC suchen

Für die Suche über mehrere Laufwerke liegt ein Skript bereit:
[`duplicate-finder/Find-Duplicates.ps1`](duplicate-finder/Find-Duplicates.ps1).
Es liest nur und verändert nichts.
