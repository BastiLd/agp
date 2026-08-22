# mittelkap

Verwandelt deutsche Sprachnachrichten offline in Text. Kein Konto, keine laufenden Kosten,
keine Internetverbindung im Betrieb — die Aufnahmen verlassen den Rechner nie.

Zwei Oberflächen auf einem gemeinsamen Kern: eine Desktop-Anwendung und ein Terminal-Werkzeug.

## Schnellstart

```bash
cd core
../.venv/Scripts/python.exe -m mittelkap nachricht.opus --txt
```

Desktop-Anwendung: `gui/src-tauri/target/release/mittelkap.exe`

## Befehle

| Befehl | Zweck |
|---|---|
| `mittelkap <datei\|ordner>...` | Transkribieren (Befehl `text` ist Standard und darf entfallen) |
| `mittelkap beobachte <ordner>` | Ordner überwachen, neue Dateien sofort verarbeiten |
| `mittelkap formatiere <datei>` | Vorhandenen Text per KI zu Markdown aufräumen |
| `mittelkap zustand` | Grafikkarte, Speicher, vorhandene Modelle |
| `mittelkap protokoll` | Protokoll der letzten Läufe |
| `mittelkap hilfe [befehl]` | Übersicht oder ein Befehl im Detail |
| `mittelkap erklaere "<zeile>"` | Eine Befehlszeile Stück für Stück zerlegen |

Optionen: `--txt` `--kopieren` `--markdown` `--zeitmarken` `--modell` `--geraet` `--rekursiv`
`--ausfuehrlich` `--leise`

Jede Option trägt ihre Erklärung in [`cli/spec.py`](core/mittelkap/cli/spec.py) — daraus entstehen
Parser, Hilfe und Zerlegung gemeinsam, sodass sie nicht auseinanderlaufen können.

## Aufbau

```
core/mittelkap/       Python-Kern — beide Oberflächen nutzen dieselben Funktionen
  config.py           Pfade und Einstellungen
  logbus.py           Protokoll: Ringpuffer, Datei, Abonnenten für die Oberfläche
  modelmanager.py     Modellverwaltung — hält immer nur EIN Modell im Grafikspeicher
  transcribe.py       Transkription (faster-whisper)
  formatter.py        Markdown-Aufbereitung (Gemma 3 4B über llama-cpp)
  watcher.py          Ordnerüberwachung
  rpc.py              JSON-Zeilen-Brücke zur Oberfläche
  cli/spec.py         Die eine Wahrheit über alle Befehle
  cli/explain.py      Hilfe und Befehlszerlegung
  cli/main.py         Parser und Befehlsausführung
gui/src/              Oberfläche (HTML/CSS/JS)
gui/src-tauri/        Fenster und Sidecar-Start (Rust)
tools/                Einrichtung und Paketbau
```

## Die zentrale Regel: ein Modell zur Zeit

Die RTX 4060 hat 8 GB Grafikspeicher. Whisper `large-v3` belegt davon ~3,9 GB, Gemma 3 4B ~3,2 GB —
gemeinsam wird es eng. `modelmanager.py` ist deshalb die **einzige** Stelle, die Modelle lädt: jeder
Wechsel entlädt das andere Modell nachweislich und prüft den freigegebenen Speicher per `nvidia-smi`
nach. In der Oberfläche ist der Wechsel als eigener Schritt sichtbar.

## Gemessene Werte (RTX 4060 Laptop, 8 GB)

| Schritt | Zeit |
|---|---|
| Whisper laden | 7–9 s |
| Transkription | 4,5–7,6× Echtzeit (29 s Audio in 4–6 s) |
| Modellwechsel | ~1 s (3,9 GB → 0,1 GB) |
| Markdown-Aufbereitung | 2–3 s |

## Auslieferungen bauen

```bash
cd gui/src-tauri && cargo build --release
powershell -ExecutionPolicy Bypass -File tools/paket_bauen.ps1
```

Erzeugt `dist/mittelkap-terminal/` (zum Weitergeben) und `dist/mittelkap-portabel/`.
Beide richten sich beim ersten Start selbst ein und legen alles in `mittelkap-daten/` daneben —
es wird nichts im System installiert.

## Stolpersteine, die im Code adressiert sind

Diese Punkte kosteten Zeit und sind bewusst so gelöst — bitte nicht „vereinfachen":

- **Modell als flacher Ordner, nicht im Hugging-Face-Zwischenspeicher.** Dessen Symlinks zeigen unter
  Windows ins Leere; ctranslate2 findet die `model.bin` dann nicht.
- **Bibliotheken werden im Hauptthread vorgeladen** (`rpc.py`). Der erste Import von `faster_whisper`
  aus einem Arbeiter-Thread blockiert dauerhaft, sobald der Prozess umgeleitete Ein-/Ausgabekanäle hat.
- **`sys.stdin.readline()` statt `for zeile in sys.stdin`.** Die Iteration liest im Voraus und hält
  Aufträge zurück.
- **CUDA-DLLs registrieren, bevor `llama_cpp` importiert wird** — die Bibliothek lädt ihre DLLs beim Import.
- **Reiter und Inhaltsflächen mit `.blatt[data-blatt=…]` ansprechen** (`app.js`). Die Reiter-Knöpfe
  tragen dasselbe Attribut und stehen im DOM davor.
- **`.bat`-Dateien ohne UTF-8-Signatur schreiben** — cmd.exe liest sie sonst als Teil der ersten Zeile.
- **Paketordner nur über `EntferneOrdner`** (`paket_bauen.ps1`) löschen; `Remove-Item -Recurse` läuft
  sonst in Verzeichnisverknüpfungen hinein und löscht verlinkte Modelle mit.
- **Umlaute im Terminal** brauchen beides: `konsole_einrichten()` (`cli/main.py`) stellt die
  Windows-Konsole per `SetConsoleOutputCP(65001)` auf UTF-8 *und* den Ausgabestrom. Ohne den ersten
  Schritt zeigt eine deutsche cmd-Konsole (Codepage 850) Kauderwelsch statt „ä".
- **`.ps1` mit UTF-8-Signatur, `.bat` ohne.** Windows PowerShell 5.1 liest `.ps1` ohne Signatur als
  ANSI und zerlegt dabei jeden Umlaut; cmd.exe wiederum verschluckt sich an einer Signatur in `.bat`.
- **Nur Zeichenketten mit echten Umlauten**, keine Bezeichner: `geraet` ist ein JSON-Feldname zur
  Oberfläche, `erklaere` und `--ausfuehrlich` sind eingetippte Befehlsnamen — alle drei bleiben ASCII.

## Beigelegt

`voice-message-downloader/` — BetterDiscord-Plugin, das Discord-Sprachnachrichten als `.ogg`
speichert, auch **weitergeleitete** (die hängen nicht an `attachments`, sondern liegen unter
`message_snapshots`). Damit landen sie direkt in einem Ordner, den mittelkap überwachen kann.
Zu beachten: BetterDiscord reicht `require("os")` nicht durch — das Plugin nutzt daher
`process.env.USERPROFILE`.
