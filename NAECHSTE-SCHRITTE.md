# Nächste Schritte

Kurze Übergabe. Erstellt am 10.08.2026 auf dem **Laptop**, am selben Tag auf dem **PC**
fortgesetzt.

## Was schon fertig ist

- **60 Code-Projekte** im Katalog — 58 öffentlich, 2 im privaten Bereich
- **Alle 36 GitHub-Repos** sind erfasst: 28 verlinkt, 7 in `DUPLIKATE.md` mit Begründung
  abgelegt, dazu der Katalog selbst. Nachprüfbar mit `node tools/pruefe-abdeckung.js`
- Katalog-Website läuft: https://bastild.github.io/agp/
- Fünf Kategorien: Websites, Python-Apps, Browser-Erweiterungen, Desktop-Apps und
  **Minecraft-Mods** (neu für die sieben Fabric-Mods und das Datenpaket)
- `DUPLIKATE.md` erfasst jetzt **beide Rechner**, inklusive einer Liste aller ausgelassenen
  Zugangsdaten
- `duplicate-finder/Find-Duplicates.ps1` findet Mehrfachkopien
- `tools/Import-Projekt.ps1` übernimmt ein Projekt und lässt Zugangsdaten, Build-Ausgaben und
  Browser-Profile automatisch weg
- Privater Bereich steht: eigener Abschnitt mit Schloss-Symbol, Code im privaten Repo
  [agp-privat](https://github.com/BastiLd/agp-privat)

Laufwerk **G:** wurde geprüft und enthält keinen Code — `G:\Win` ist leer, `G:\Linux` hat nur
PC-Teilelisten.

---

## 1. Mijos restliche Projekte

**Das ist der nächste Schritt.** Auf beiden Rechnern fehlen dieselben fünf Ordner — aber aus
unterschiedlichen Gründen, und die alte Anleitung führt auf dem PC in die Irre.

**Am Laptop:** Mijos Konto `Moertl.Mijo@edu.chs-villach.at` ist in Windows eingerichtet, aber
die Synchronisierung läuft nicht. Alle Dateien sind Cloud-Platzhalter, Windows meldet
*„Der Clouddateianbieter wird nicht ausgeführt"*.

**Am PC:** Mijos Konto ist **gar nicht eingerichtet**. Was hier liegt, sind fünf von ihm
*freigegebene* Ordner in Bastis eigenem Schul-OneDrive (`Dateien von Moertl Mijo, 1BKMD - …`).
Die funktionieren einwandfrei — deshalb ließ sich `Basti Cursor` hier übernehmen, das am Laptop
blockiert war.

**Daraus folgt:** Sich mit Mijos Konto anzumelden bringt auf dem PC nichts. **Mijo muss die
fehlenden Ordner freigeben** — dann tauchen sie wie die anderen von selbst auf.

| Ordner | Wohin | Bereich | Stand |
|---|---|---|---|
| `Privat\Fiverr1\Basti Cursor` | `agp-privat` | privat | **erledigt** — als Zorah Business |
| `Jackson` | `projects/mijo/websites/jackson` | öffentlich | fehlt, Freigabe nötig |
| `Privat\Basti-Roast` | privates Repo | privat | fehlt, Freigabe nötig |
| `Privat\TdoT` | privates Repo | privat | fehlt, Freigabe nötig |
| `Privat\HTML` | privates Repo | privat | fehlt, Freigabe nötig |
| `Privat\CTF` | privates Repo | privat | fehlt, Freigabe nötig |

## 2. Katalog aktuell halten — dafür gibt es jetzt ein Werkzeug

Doppelklick auf **`AGP aktualisieren.bat`**. Es vergleicht jeden Quellordner mit der
Kopie im Katalog und zieht Unterschiede nach. Ohne Knopfdruck ändert es nichts.

Zwei Dinge, die dabei wichtig sind:

- **Die Quellen stehen in `data/quellen.json`**, getrennt nach Rechnername. Auf diesem
  PC haben 43 der 60 Projekte eine Quelle. Die übrigen 13 liegen nur auf dem Laptop
  (GHGFlix, VetNow, Kartenbot, Claude Wormhole, …); dort ausgeführt findet das Werkzeug
  sie und trägt sie unter `LAPTOP-NAME` ein. Ein Projekt (Mini-Games) hat gar keinen
  eigenen Ordner — die fünf Seiten liegen lose im OneDrive-Stamm. Drei weitere
  (Colored In, MVD Web, MediaStack Regler) haben überhaupt keinen lokalen Ordner: ihr
  Code kam direkt aus dem GitHub-Repo.
- **Vier Projekte haben eigene Ausnahmen**, weil dort neben dem Code auch Laufzeitdaten
  liegen: bei WebHafen die betriebenen Seiten unter `data/`, bei Audio zu Text die
  Abschriften, bei Privacy Guard die heruntergeladenen Filterlisten. Steht mit Begründung
  in `quellen.json`.

## 3. Privater Bereich — erledigt, so funktioniert er

Das private Repo **[BastiLd/agp-privat](https://github.com/BastiLd/agp-privat)** ist angelegt
und enthält den Code von **Zorah Business** und **Montrigor**.

Im Katalog erscheinen sie nach Eingabe des Passworts in einem eigenen Abschnitt mit
Schloss-Symbol, orangem Rahmen und der Marke „🔒 Privat" — deutlich abgesetzt von den
öffentlichen Kacheln. Ein Link „Code in diesem Repo" gibt es dort bewusst nicht, weil der
Code eben nicht hier liegt.

So kommt ein neues privates Projekt dazu:

1. Code ins private Repo übernehmen — `tools/Import-Projekt.ps1` nimmt auch absolute Ziele:
   ```powershell
   .\tools\Import-Projekt.ps1 -Quelle "C:\Pfad\zum\Projekt" -Ziel "C:\Pfad\zu\agp-privat\projects\basti\websites\name"
   ```
2. Eintrag in `data/private.json` ergänzen (gleiches Schema wie `projects.json`).
3. Neu verschlüsseln und hochladen:
   ```bash
   node tools/encrypt-private.js "GHGFLIX"
   git add data/private.enc && git commit -m "Privaten Bereich aktualisieren" && git push
   ```

`data/private.json` steht in `.gitignore` und darf nie hochgeladen werden — veröffentlicht
wird ausschließlich die verschlüsselte `data/private.enc`. Der **Code** privater Projekte
gehört nicht in dieses Repo.

## 4. WebHafen: alte Pages-Seite aufräumen

Das Repo **[MFU-TEST](https://github.com/BastiLd/MFU-TEST)** enthält auf `main` den
WebHafen-Code — der Repo-Link im Katalog stimmt also. Unter
`https://bastild.github.io/MFU-TEST/` liegt aber noch eine **ganz andere Seite**: die
Vorstellungsseite „Marvel Fan Universe" aus der Zeit, als das Repo dafür benutzt wurde
(daher der Name).

Der einzige Workflow im Repo baut ein Docker-Image, es gibt **keinen** Pages-Workflow —
die Auslieferung ist ein Überbleibsel und wird von nichts mehr aktualisiert. Deshalb ist
sie **nicht** als Live-Link eingetragen: WebHafen ist ein Docker-Panel und kann auf
GitHub Pages gar nicht laufen.

**Zu tun, falls es stört:** Pages im Repo unter Settings → Pages abschalten, oder das
Repo umbenennen. Für den Katalog ändert sich dadurch nichts.

## 5. Colored In: Row-Level-Security nachsehen

In `Chrome Extension Colored-In/lib/supabase.js` steht ein Supabase-Schlüssel fest im
Code. Das ist der **anon-Schlüssel** (Projekt `gevqwporirhaekapftib`, gültig bis 2034) —
er ist laut Supabase ausdrücklich dafür gedacht, im Client-Code zu stehen, und liegt
ohnehin schon öffentlich im Repo `colored-in`. Deshalb ist er auch im Katalog geblieben.

**Der Haken:** Ein anon-Schlüssel schützt nur dann, wenn **Row-Level-Security** für die
Tabellen eingeschaltet ist. Ist sie es nicht, kann jede Person mit diesem Schlüssel alle
Daten lesen und schreiben.

**Zu tun:** Im Supabase-Dashboard unter Authentication → Policies nachsehen, ob für alle
Tabellen RLS aktiv ist. Falls nicht: einschalten und Regeln hinterlegen.

## 6. Ein Stand noch nachzuziehen

**Avocado at Law ist erledigt** — der Katalog zeigt jetzt die neuere Expo-/React-Native-Fassung
aus `D:\Meine Projekte\AvocadeatLaw` (Commit vom 31.05.2026) statt des alten Browser-Prototyps,
und ist mit dem privaten Repo `BastiLd/Avocados-at-Law` verlinkt. Der alte Prototyp bleibt in
der Git-Historie erhalten.

Offen bleibt:

- **Wunderwelten Reisen** — `C:\…\OneDrive - CHS Villach\Website Gemini`, Stand 12.06.2026 ist
  neuer als der Laptop-Stand im Katalog. Bewusst noch nicht ersetzt.

## 6b. YouTube-Downloader — fehlt noch, vermutlich nur auf dem Laptop

Gesucht auf diesem PC: `C:\Users\basti\Documents`, `Desktop`, `D:\Meine Projekte`, `D:\Cursour`,
`E:\`. Kein eigenes Skript oder Projekt gefunden — nur ein `yt-dlp`-Cache-Ordner unter
`C:\Users\basti\.cache\yt-dlp`, der von der YouTube-Kanal-Funktion in GHGFlix stammen dürfte
(`youtube-sigfuncs`-Unterordner), nicht von einem eigenständigen Downloader.

**Zu tun:** Am Laptop prüfen, ob es dort liegt. Falls ja: mit `tools\Import-Projekt.ps1`
übernehmen wie jedes andere Projekt. Falls es nie existiert hat, kann Basti eines bauen lassen
— Python mit `yt-dlp` als Kern, Links/Playlist-URLs einfügen, automatisch beste verfügbare
Qualität (Video+Audio zusammengeführt).

## 7. Den OpenAI-Schlüssel zurückziehen

In **Audio zu Text** lag ein gültiger OpenAI-API-Schlüssel im Klartext — in zwei Python-Dateien
fest verdrahtet und zusätzlich in `project_commands.txt` ausgeschrieben. Er ist **nicht** ins
Repo gelangt (im Katalog steht `DEIN_API_KEY_HIER`), liegt aber weiterhin offen auf `C:`.

**Zu tun:** Schlüssel bei OpenAI zurückziehen, neuen ausstellen und künftig nur noch über die
Umgebungsvariable `OPENAI_API_KEY` setzen — das sehen die Skripte ohnehin schon vor.

## 8. Eigene Repos für die übrigen Projekte

Diese **31 Projekte** haben kein eigenes GitHub-Repo und liegen bisher nur hier. Bewusst so
entschieden, kann aber jederzeit nachgeholt werden. Die übrigen 29 tragen einen Repo-Link.

**Vom Laptop:** bastianklaus.online · Studiow-Warteliste · DigitalFAB · FlashLearn ·
Wunderwelten Reisen · Roblox-Recherche · Mini-Games · ResuMax Clone ·
Mediathek-Downloader · Wisch-Animation · AutoCapture · Auto Tab Close ·
Stadt-Land-Fluss-Auto-Fill · CursorForge

**Vom PC:** KI-Antwort-Verifizierer · Viele WebApps · Katabump Control Panel ·
Discord Archive (beide Fassungen) · Wo was Filme & Serien · Quizelt ·
Tracker & Kamera Kaufkompass · SearchApp · Audio zu Text · Instagram Audit Helper ·
Hotbar Scroll · Stealth Creative · MAB · Who did what when · Take it Anywhere ·
Timer Datapack

## 9. Bewusst nicht aufgenommen

Damit später niemand danach sucht:

| Was | Warum |
|---|---|
| `manimations` (drei Stände) | auf Wunsch weggelassen |
| `GoobiesModMenu` | Cheat-Werkzeug, nicht in ein öffentliches Repo unter eigenem Namen |
| `MOD TEMPLATE FOR FABRIC 1.21.1` | unveränderte Fremdvorlage, kein eigenes Projekt |
| `bot.py`, `test perplexicty.py` | lose Einzelskripte, unfertig |
| `colored-in` | `.git` beschädigt (`bad object HEAD`) |
| `Game Server Docker Claude Test` | nur zwei HTML-Entwürfe zu CraftControl |
| Audio und Transkripte in **Audio zu Text** | private Sprachnachrichten über eine reale Person |
| Fabric-API-Quellbäume in drei Mods | Fremdbibliothek, 2285 Dateien je Mod |
| Erzeugte Regellisten in **Privacy Guard** | entstehen über `scripts/update-rules.mjs` neu |

## Neue Projekte suchen und übernehmen

```powershell
.\duplicate-finder\Find-Duplicates.ps1
```

Durchsucht alle lokalen Laufwerke, erkennt Duplikate über gleichen Namen, gleichen Inhalt oder
dasselbe Git-Repository. Liest nur, löscht nichts. Der CSV-Bericht landet auf dem Desktop.

```powershell
.\tools\Import-Projekt.ps1 -Quelle "D:\Pfad\zum\Projekt" -Ziel "projects/basti/websites/name"
```

Übernimmt ein Projekt in den Katalog. Ausgelassen werden automatisch: Zugangsdaten (`.env`,
`config.py`, Schlüssel, Datenbanken), Abhängigkeiten und Build-Ausgaben, Browser-Profile aus
Testläufen, Mediendateien und alles über 20 MB. **Zusätzlich wird der Inhalt jeder Textdatei
auf bekannte Schlüsselformen geprüft** — genau so wurde der OpenAI-Schlüssel aus Punkt 4
gefunden. Mit `-NurAnzeigen` erst einmal nur schauen, was passieren würde.

Danach den Eintrag in `data/projects.json` ergänzen (gleiches Schema wie die bestehenden) und
**vor dem Commit prüfen**, dass nichts Vertrauliches durchgerutscht ist:

```bash
git ls-files | grep -Ei '\.env$|\.db$|\.sqlite|config\.py|\.pem$|\.key$|id_rsa'
```
