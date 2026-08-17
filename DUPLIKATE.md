# Duplikate & Mehrfachkopien

Beim Zusammentragen der Projekte sind mehrere Kopien desselben Projekts aufgetaucht.
Für dieses Repo wurde jeweils **die aktuellste Version** genommen. **Auf dem Laptop wurde
nichts gelöscht oder verschoben** — hier steht nur, was wo liegt, damit du selbst
zusammenführen kannst.

Stand: 10.08.2026. **Laptop und PC sind beide erfasst.** Die Abschnitte 1–6 stammen vom
Laptop, ab Abschnitt 7 folgt der PC (Laufwerke C:, D: und G:).

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

## Nicht lesbar: Mijos OneDrive (Laptop)

Das OneDrive-Konto **Moertl.Mijo@edu.chs-villach.at** (`OneDrive - CHS Villach (1)`) ist zwar
in Windows registriert, aber die Synchronisierung läuft nicht. Alle Dateien dort sind reine
Cloud-Platzhalter — Windows meldet beim Zugriff *„Der Clouddateianbieter wird nicht ausgeführt"*.

**Was zu tun ist:** Bei OneDrive mit Mijos Konto anmelden bzw. die Synchronisierung starten,
danach in den betroffenen Ordnern per Rechtsklick **„Immer auf diesem Gerät behalten"** wählen.
Erst dann lassen sich seine Projekte übernehmen.

Betroffen sind: `Jackson`, `Privat\Fiverr1\Basti Cursor`, `Privat\Basti-Roast`, `Privat\TdoT`,
`Privat\HTML`, `Privat\CTF`.

**Auf dem PC ist die Lage anders** — siehe Abschnitt 13.

---

# Der PC (C:, D:, G:)

Erfasst am 10.08.2026. G: enthält keinen Code: `G:\Win` ist leer, `G:\Linux` enthält
66 KB PC-Teilelisten als Tabellen.

## 7. Kartenbot — neun Kopien

Das mit Abstand am häufigsten kopierte Projekt. Alle hängen an `BastiLd/kartenbot`.

| Ort | Letzter Commit | Größe |
|---|---|---|
| `D:\Cursour\Discord Bot` | **11.06.2026** ← neuester Stand auf dem PC | 30 MB |
| `D:\Cursour\Discord Bot änderungen für ZimaOS…\24.5.2026 22.30 workspace` | 23.05.2026 | 4,5 MB |
| `C:\…\OneDrive - CHS Villach\Attachments\Discord Bot - Kopie` | 13.02.2026 | 612 KB |
| `C:\Users\basti\Documents\Discord Bot - Kopie` | 03.02.2026 | 14 MB |
| `C:\Users\basti\Documents\Karten Bot\kartenbot` | 23.01.2026 | 633 KB |
| `…\Attachments\Discord Bot - Kopie\Neuer Ordner\…laptop 1 / laptop 2 / PC` | 26.–27.01.2026 | drei verschachtelte Klone |
| `C:\Users\basti\Documents\Neuer Ordner (2)` | — | 11 datierte Sicherungen + RAR |

**Empfehlung:** Im Katalog liegt weiterhin der Laptop-Worktree (07.08.2026), der ist neuer als
alle PC-Stände. Die drei Klone unter „Neuer Ordner" sind reine Altlasten. **Achtung:** In zwei
PC-Kopien liegt `kartenbot.db` mit echten Discord-Nutzerdaten — der Ordner
`Discord Bot änderungen für ZimaOS mit gehaltenen Nutzer daten` sagt das schon im Namen.
Diese Datenbanken wurden nicht übernommen.

**Nachtrag vom 16.08.2026 — möglicherweise verlorene Arbeit:** In
`…\Attachments\Discord Bot - Kopie` (Laptop, Zeile 3 oben) steckt zwar ein Commit-Stand von
Februar, **aber im Arbeitsverzeichnis liegen unveröffentlichte Änderungen**, die es sonst
nirgends gibt — auch nicht in einer der anderen acht Kopien:

- `bot.py`: +1233/−… Zeilen
- `karten.py`: +47
- `services/battle.py`: +65
- `services/db.py`: +18
- `tests/test_combat_rules.py`: **komplett neu, 499 Zeilen**

Diese Änderungen wurden nie committet, liegen aber auf einer sechs Monate alten
Codebasis auf — direkt in den heutigen Stand übernehmen würde vermutlich nicht sauber
zusammenpassen. **Nicht automatisch übernommen.** Falls darin etwas Brauchbares steckt
(die Testdatei sieht am ehesten danach aus), müsste jemand das von Hand mit dem
aktuellen `kartenbot`-Stand vergleichen. Der Ordner wurde nicht verändert.

## 8. Plex Transfer — sechs Kopien

| Ort | Stand |
|---|---|
| `D:\Cursour\Neuer Ordner` | **21.05.2026** ← neuester auf dem PC |
| `C:\…\OneDrive - CHS Villach\Aufnahmen\Neuer Ordner` | 11.04.2026 |
| `D:\Cursour\Neuer Ordner - Kopie`, `D:\Cursour\Für Plex umnennen\Neuer Ordner`, `D:\Meine Projekte\Meine Projekte\Neuer Ordner` | älter |
| `C:\…\OneDrive - CHS Villach\A1 GIT\TransfertoServer` | 07.05.2026, ohne eigenes Repo, 4,6 GB |

`TransfertoServer` enthält zusätzlich `github-latest\transfermov-seritozimaOSserver-main` — ein
entpacktes ZIP desselben Repos, also eine Dublette in der Dublette. Der Laptop-Stand
(05.07.2026) bleibt im Katalog.

## 9. Restore-Inv — vier Kopien

| Ort | Letzter Commit | Übernommen |
|---|---|---|
| `D:\Meine Projekte\Restore Inv Claude` | **05.06.2026** | **ja** |
| `C:\Users\basti\Documents\INV MOD` | 07.07.2025 (14:12) | nein |
| `C:\Users\basti\Documents\INV MOD - Kopie` | 07.07.2025 (12:50) | nein |
| `C:\Users\basti\Documents\INV MOD BACKUP` | — | nein |

Dazu `C:\Users\basti\Documents\RESTORE INV MOD` (leer) und gebaute JAR-Dateien unter
`C:\Users\basti\Desktop\Slef Mod inv sevae`. Der D:-Stand ist fast ein Jahr neuer und deckt
Minecraft 1.21 bis 1.21.11 ab.

## 10. bastianklaus.online — drei Stände

| Ort | Version |
|---|---|
| `C:\Users\basti\DOKUä` | **1.1.7** ← neuester |
| `C:\…\OneDrive - CHS Villach\Attachments\DOKUä` | 1.1.5 |
| `D:\Meine Projekte\Meine Projekte\bastianklausonline+` | ohne Git, mit eigenem CSS-Backup vom 08.12.2025 |

## 11. WebHafen und MFU-TEST sind dasselbe Projekt

Das sah nach zwei Projekten aus, ist aber eines. Nachgeprüft über einen Dateivergleich:
Die gemeinsamen Dateien sind **byte-identisch**, unterschiedlich sind nur die Ränder.

| Ort | Was es ist |
|---|---|
| `C:\…\Attachments\Websites\MFU-TEST` | die Git-Arbeitskopie, hat als einziges den Actions-Workflow |
| `C:\…\Attachments\Websites\webhafen` | eine **laufende Instanz** — zusätzlich Analytics- und Caddy-Laufzeitdaten |
| `D:\Meine Projekte\Meine Projekte\MFU_Montrigor Website from Github mine` | älterer Stand desselben Repos (12.03.2026) |

Im Katalog steht deshalb **ein** Eintrag (`webhafen`) mit dem Workflow aus MFU-TEST. Die
Laufzeitdaten der Instanz wurden nicht übernommen — die entstehen beim Betrieb neu.

Ebenfalls doppelt: `webhafen\data\sites\montrigor\public` war eine vollständige Zweitkopie der
Montrigor-Website (74 MB). Auch nicht übernommen, das Projekt steht ja eigenständig im Katalog.

## 12. Weitere Mehrfachkopien auf dem PC

| Projekt | Fundorte | Anmerkung |
|---|---|---|
| Avocado at Law | `D:\Meine Projekte\AvocadeatLaw` (Expo-Fassung, 31.05.2026) | eigenes Repo `Avocados-at-Law`, **neuer als der Katalog-Stand** — beim nächsten Mal prüfen |
| Wunderwelten Reisen | `C:\…\OneDrive - CHS Villach\Website Gemini` (12.06.2026) | **neuer als der Katalog-Stand** |
| Medien-Suche | `D:\Cursour\Suche nach Film Serie` und `D:\Cursour\Für Plex umnennen\Suche nach Film Serie` | inhaltsgleich, gleicher Commit |
| Audio zu Text | `C:\Audio zu Text … - Kopie` | fast identisch, der Kopie fehlen zwei Dateien |
| montrigor-site | `C:\…\Websites\_backup_dokumente_20260719_1311` und `_backup_montrigor-site_20260719_1256` | zwei Sicherungen von Hand |
| manimations | `C:\Users\basti\manimations`, `C:\…\OneDrive - BG BRG…\MANIM\manimations`, `C:\Users\basti\OneDrive\Manim Online` | drei Stände — **bewusst nicht in den Katalog aufgenommen** |
| SearchApp | `C:\…\OneDrive - BG BRG…\A Search\SearchApp Main` und `D:\Schule safe\A Search\SearchApp Main` | der OneDrive-Stand ist neuer |
| ECHT / Studiow | `C:\…\MEINE PROJEKTE\ECHT`, `D:\…\ECHT`, nochmals in `bastianklausonline+\ECHT` | dreifach |
| ResuMax Clone | `C:\…\MEINE PROJEKTE\ResuMax Clone`, `D:\…\ResuMax Clone` | doppelt |
| AutoCapture, Auto Tab Close | `D:\Meine Projekte\Meine Projekte\…` | auf C: nur noch Verknüpfungen, der Ordner `Downloads\autocapture` ist leer |
| Claude Wormhole Site | `C:\…\A A Kunst\Claude Wormhole Site` (Commit 23.06.2026) | vierte Kopie neben den drei vom Laptop |
| DigitalFAB, FlashLearn, Roblox, Mini-Games | verstreut im Wurzelverzeichnis von `OneDrive - CHS Villach` | inhaltsgleich zum Katalog |

**Leere Ordner** (kein Inhalt, nur der Name): `D:\Meine Projekte\VetNow`,
`D:\Meine Projekte\Meine Projekte\Coolors Clone`,
`D:\Meine Projekte\Meine Projekte\MOVIES And SERIES DOWNLOADER AUTO`,
`C:\Users\basti\Documents\RESTORE INV MOD`, `C:\Users\basti\Downloads\autocapture`.

## 13. Mijos Dateien auf dem PC — anders als am Laptop

Die Laptop-Blockade gibt es hier **nicht**. Der Cloud-Dateianbieter läuft; von 25 geprüften
Platzhalter-Dateien ließen sich 25 öffnen.

Der Grund ist aber ein anderer als gedacht: Mijos Konto ist auf diesem PC **gar nicht als
OneDrive-Konto eingerichtet**. Eingerichtet sind nur `bastian.klaus2010@gmail.com`,
`klauba10@itgym.at` und `Klaus.Bastian@edu.chs-villach.at`. Was hier liegt, sind fünf von Mijo
**freigegebene** Ordner, die in Bastis eigenes Schul-OneDrive eingehängt wurden.

| Gesucht (Laptop-Pfad) | Auf dem PC |
|---|---|
| `Privat\Fiverr1\Basti Cursor` | **vorhanden und lesbar** als `Dateien von Moertl Mijo, 1BKMD - Fiverr1\Basti Cursor` |
| `Jackson` | fehlt |
| `Privat\Basti-Roast` | fehlt |
| `Privat\TdoT` | fehlt |
| `Privat\HTML` | fehlt |
| `Privat\CTF` | fehlt |

`Basti Cursor` ist das Repo `BastiLd/zorah-business` und wurde in den **privaten Bereich**
aufgenommen. Die übrigen fünf liegen in Mijos privatem OneDrive-Baum. Sich mit seinem Konto
anzumelden hilft hier nicht — **Mijo muss die Ordner freigeben.**

---

## Ausgeschlossene Zugangsdaten

Das Repo ist öffentlich. Beim Übernehmen vom PC hat
[`tools/Import-Projekt.ps1`](tools/Import-Projekt.ps1) **63 Dateien mit Zugangsdaten**
zurückgelassen. Die Originale auf C: und D: sind unverändert — hier steht nur, was fehlt.

| Projekt | Was ausgelassen wurde |
|---|---|
| Homelab Discord Bot Manager | 13 `.env`-Dateien (Hauptordner, Testläufe, Arbeitsverzeichnisse) und `app/core/config.py` |
| Katabump Control Panel | `.env` und der SFTP-Hostschlüssel `data/sftp-hostkey.pem` |
| Montrigor | die Datenbank `data/montrigor.sqlite` und `php/cacert.pem` |
| WebHafen | `.env` und die mitkopierte Montrigor-Datenbank |
| IdeenHub, Small but Good | `.env.local` mit Supabase-Schlüsseln |
| Excel Formel Retter | `.env` |
| BastiLd Mod Hub | `Test/PaddleForce_RUN1/cookies.txt` |
| Pfotennotruf (zweite Fassung) | drei vollständige **Chrome-Profile** mit `Login Data`, `Web Data` und Cookies — Rückstände automatischer Screenshot-Läufe, 387 Dateien |

### Ein echter Schlüssel im Klartext

In **Audio zu Text** steckte ein gültiger OpenAI-API-Schlüssel gleich dreifach: fest verdrahtet
als Rückfallwert in `transcribe.py` und `summarize.py` sowie ausgeschrieben in
`project_commands.txt`. Kein Dateiname deutete darauf hin — gefunden hat ihn erst die
Inhaltsprüfung des Import-Skripts.

`project_commands.txt` wurde ausgelassen. Die beiden Python-Dateien sind im Katalog, aber mit
`DEIN_API_KEY_HIER` an Stelle des Schlüssels — dasselbe Vorgehen wie seinerzeit beim Plex-Token.

> **Der Schlüssel liegt weiterhin im Klartext auf `C:`. Er sollte bei OpenAI zurückgezogen und
> neu ausgestellt werden**, unabhängig davon, dass er nie veröffentlicht wurde.

### Nicht angefasst

Diese Ordner enthalten Wiederherstellungscodes und wurden weder geöffnet noch gelesen:
`D:\Nordpass_Nofall_Codes`, `D:\Epic Notfall Code`, `D:\Old\Privat_Nordpass_Recovery_Codes`.

---

## Repos ohne Katalog-Eintrag

Auf dem GitHub-Konto `BastiLd` liegen **36 Repositories**: 28 sind im Katalog verlinkt,
`agp` ist der Katalog selbst, und diese sieben bleiben bewusst außen vor. Sie sind hier
aufgeführt, damit bei der nächsten Durchsicht niemand erneut danach sucht.
**Gelöscht wurde keines.**

Nachprüfen lässt sich das jederzeit mit `node tools/pruefe-abdeckung.js` — das Skript
meldet jedes Repo, das weder verlinkt noch hier vermerkt ist.

| Repo | Warum kein Katalog-Eintrag |
|---|---|
| [`Website-first-html`](https://github.com/BastiLd/Website-first-html) | Erste HTML-Übung („My Own Second"), eine einzelne `index.html` mit 10 KB |
| [`bastiklaus-`](https://github.com/BastiLd/bastiklaus-) | Leer — nur eine README mit der Überschrift, 0 KB. Beim Anlegen vertippt |
| [`coloored`](https://github.com/BastiLd/coloored) | Leer — nur eine README, 0 KB. Vertippte Fassung von `colored-in` |
| [`formel-excel`](https://github.com/BastiLd/formel-excel) | Duplikat von `Fromel-Excel` |
| [`fromel-exce`](https://github.com/BastiLd/fromel-exce) | Duplikat, am selben Tag angelegt |
| [`fromel-excl`](https://github.com/BastiLd/fromel-excl) | Duplikat — **byte-gleicher Dateibaum** mit `formel-excel` (`07d47692…`) |
| [`colored-in-Lovable`](https://github.com/BastiLd/colored-in-Lovable) | Zweite Fassung von Colored In, über Lovable.dev gebaut. Als Verweis in der Colored-In-Beschreibung |

**Zu den drei `fromel-*`:** Alle drei entstanden am 07.12.2025 innerhalb von 25 Minuten —
offenbar Tippfehler beim Anlegen. Das richtig geschriebene
[`Fromel-Excel`](https://github.com/BastiLd/Fromel-Excel) kam einen Tag später und ist
als **Excel Formel Retter** im Katalog verlinkt.

Zwei weitere Repos haben aus anderem Grund keine eigene Kachel:

- [`agp`](https://github.com/BastiLd/agp) ist der Katalog selbst. Statt einer Kachel gibt
  es oben in der Kopfzeile einen kleinen Verweis auf den Quelltext.
- [`S-N`](https://github.com/BastiLd/S-N) enthält nur eine README mit der Projektidee
  („Sim & Nal" — ein besserer Weg, in Österreich Tierärzte zu finden). Kein eigener
  Eintrag, aber bei **beiden Pfotennotruf-Kacheln** als Repository verlinkt, weil es der
  reservierte Platz dafür ist.

---

## Aufgabenliste — zweimal unabhängig importiert

Am 15.–17.08.2026 liefen parallel zwei Sitzungen (PC und Laptop) und haben unabhängig
voneinander dieselbe App „Aufgabenliste“ gefunden und importiert — auf dem Laptop nach
`projects/basti/desktop-apps/aufgabenliste`, auf dem PC nach
`projects/basti/websites/aufgabenliste`. Beim Zusammenführen blieb nur die PC-Fassung,
weil sie `kontakte.js` korrekt ausschließt — siehe **⚠️ Punkt 0** in `NAECHSTE-SCHRITTE.md`
für den Sicherheitsvorfall, der dabei aufgefallen ist. Die Laptop-Fassung wurde beim Merge
vollständig entfernt.

---

## Duplikate selbst suchen

Für die Suche über mehrere Laufwerke liegt ein Skript bereit:
[`duplicate-finder/Find-Duplicates.ps1`](duplicate-finder/Find-Duplicates.ps1).
Es liest nur und verändert nichts.

Zum Übernehmen eines gefundenen Projekts gibt es
[`tools/Import-Projekt.ps1`](tools/Import-Projekt.ps1) — es lässt Zugangsdaten, Build-Ausgaben
und Browser-Profile automatisch weg und schreibt einen Bericht über alles Ausgelassene.
