# Claude Token-Dashboard

Ein kleines, **rein lokales** Dashboard, das zeigt, wie viele Tokens du mit Claude Code verbrauchst – pro Chat, pro Tag, pro Projekt, pro Modell und im aktuellen **5-Stunden-Fenster** bzw. in der **Woche**.

## Starten

- **Doppelklick auf `start.bat`** – startet den Server und öffnet den Browser automatisch.
- oder im Terminal: `node server.js --open` (bzw. `npm start`)

Das Dashboard läuft dann auf <http://localhost:5175>. Ist der Port belegt, wird automatisch der nächste freie genommen. Läuft es schon, öffnet `start.bat` einfach nur den Browser.

Beenden: Fenster schließen oder `Strg + C`.

Voraussetzung: [Node.js](https://nodejs.org) (Version 18 oder neuer). Es gibt **keine** weiteren Abhängigkeiten – kein `npm install` nötig.

## Muss ich irgendwas in Claude „integrieren“?

Nein. Claude Code speichert jeden Chat ohnehin als Log-Datei auf deinem Rechner:

```
C:\Users\<du>\.claude\projects\<projekt>\<chat-id>.jsonl
C:\Users\<du>\.claude\projects\<projekt>\<chat-id>\subagents\*.jsonl   (Subagents)
```

In jeder Antwort von Claude steht dort, wie viele Tokens verbraucht wurden. Das Dashboard liest diese Dateien nur (es verändert nichts) – jeder neue Chat taucht also automatisch auf. Die Seite aktualisiert sich alle 10 Sekunden selbst.

## Das HUD

- **Reaktor in der Mitte:** eine 3D-Punktkugel mit Sprach-Waveform. Sie „spricht“, solange Claude gerade arbeitet (letzte Nachricht jünger als 90 s), atmet ruhig im Leerlauf und pulsiert bei jeder neuen Antwort (die Output-Tokens fliegen als „+1,2 Tsd.“ nach oben).
- **Ringe:** außen die verstrichene Zeit im aktuellen 5-Stunden-Block (mit Uhrzeiten), innen die „Auslastung“ im Vergleich zu dem Block, in dem du zuletzt ans Limit gestoßen bist. Wird im aktuellen Block ein Limit gemeldet, steht dort **LIMIT**.
- **Briefing (Taste B):** liest dir den aktuellen Stand auf Deutsch vor (Sprachausgabe von Windows, funktioniert offline) – die Kugel spricht mit, das gerade gesprochene Wort wird markiert.
- **Live-Protokoll & Puls:** die letzten Antworten mit Uhrzeit, Modell und Output-Tokens sowie ein Minuten-Diagramm der letzten Stunde.
- **Projekt-Auswahl:** steht standardmäßig auf **Automatisch** = das Projekt, in dem du zuletzt gearbeitet hast (Kennzeichnung „AUTO“). Wählst du selbst etwas aus, gilt das bis zum Neuladen.
- **Töne:** optionale leise UI-Töne (Lautsprecher-Knopf), standardmäßig aus.
- Tastenkürzel: **B** Briefing, **R** neu einlesen. Die Boot-Animation lässt sich per Klick/Taste überspringen.

## Steuerung

- **Ansicht (Taste V): Nutzung · Guthaben · Beides.** „Nutzung“ zeigt Tokens, „Guthaben“ zeigt alles als API-Wert in US-Dollar und schätzt dein verbrauchtes Guthaben (Extra-Nutzung) im Monat, „Beides“ zeigt Tokens mit Dollar-Werten daneben.
- **Messgröße:** Alle Tokens · Ohne Cache-Lesen (Standard) · Nur Output.
- **Projekt:** wirkt auf *alles* (Reaktor, Block, Woche, Protokoll, Diagramme). Das Konto-Limit bleibt kontoweit und wird als „Konto“ dazugeschrieben.
- **Seiten (Tasten 1–6):** Übersicht · Chats · 5-Std-Blöcke · Verlauf · Projekte & Modelle · Einstellungen. Jede Kachel hat oben rechts einen „Öffnen“-Knopf, Listen sind in den Kacheln scrollbar.
- **Chat-Details:** Klick auf einen Chat → alle Antworten, Diagramm je Antwort, „Fortsetzen-Befehl kopieren“ (`claude --resume …`), „Projektordner öffnen“, CSV-Export.
- **Live/Pause (Taste P),** Aktualisierungsintervall, Wochen-Reset, eigene Limit-Referenz, Stimme & Tempo fürs Briefing, CSV-Export aller Antworten – alles unter „Einstellungen“.

- **Zeitraum:** Voreinstellungen von „Letzte Stunde“ bis „Alles“ – oder **„Eigener Zeitraum …“**: beliebig viele Stunden oder Tage eingeben, Schnellwahl (2 Std … 1 Jahr) oder ein genaues **Von–Bis**. Bis 3 Tage zeigt das Diagramm Stundenbalken.
- **Kosten-Rechner:** Was deine Nutzung bei API-Preisen **ohne Abo** gekostet hätte – im Zeitraum, diesen Monat und hochgerechnet aufs Monatsende, im Vergleich zu deinem Abo-Preis (einstellbar, Standard 20 $). Dazu: wie viel das Prompt-Caching spart, Kosten je Kategorie, die teuersten Chats. In jeder Chat-Tabelle gibt es außerdem die Spalte **„API $“**.
- **Prognose:** Im 5-Std-Fenster siehst du dein Tempo der letzten 30 Minuten, die Hochrechnung bis zum Reset und wann du bei diesem Tempo den Vergleichswert erreichst. In der Woche: Hochrechnung bzw. Ø pro Tag.
- **Rekorde & Fakten:** stärkster Tag, größter Block, teuerster/längster Chat, aktive Tage, Serien.
- **Benachrichtigungen** (Einstellungen): wenn Claude fertig ist, wenn der Block einen Prozentwert erreicht, wenn ein neuer 5-Std-Block beginnt. Funktioniert, solange das Dashboard in einem Browser-Tab offen ist.

### Wie wird das Guthaben geschätzt?

Claude Code speichert keine Abrechnungsdaten. Deshalb: Jede Antwort wird mit der offiziellen API-Preisliste bewertet (z. B. Opus 5: $5 Input / $25 Output je 1 Mio. Tokens, Cache schreiben 2×, Cache lesen 0,1×). Pro 5-Stunden-Block gilt ein **Plan-Kontingent** (automatisch: der API-Wert, den ein Block bis zu deinem letzten 5-Std-Limit verbraucht hat – oder selbst eintragen). Was ein Block darüber hinaus verbraucht, zählt als Guthaben. Trag unter „Einstellungen“ dein **monatliches Ausgabenlimit** ein, dann zeigt der innere Ring, wie viel davon ungefähr weg ist. Die echten Werte stehen immer auf claude.ai unter Einstellungen → Nutzung.

## Was wird angezeigt?

| Bereich | Bedeutung |
|---|---|
| **5-Stunden-Fenster** | Tokens im aktuellen 5-Std-Block, Restzeit bis zum Reset, Vergleich mit deinem Durchschnitt, größtem Block und dem Block, in dem du zuletzt ans 5-Std-Limit gestoßen bist. |
| **Woche** | Tokens der letzten 7 Tage – oder, wenn du deinen Reset-Wochentag + Uhrzeit einstellst, seit dem letzten Wochen-Reset. |
| **Kacheln** | Summen im gewählten Zeitraum/Projekt: Input, Cache schreiben, Cache lesen, Output, Thinking, Nachrichten, Chats. |
| **Tokens pro Tag** | Gestapeltes Balkendiagramm. Legende anklicken = Kategorie ein-/ausblenden („Cache lesen“ ist anfangs aus, weil es alles andere überragt). |
| **5-Stunden-Blöcke** | Deine letzten Blöcke, markiert wenn darin ein Limit erreicht wurde. |
| **Wann du arbeitest** | Heatmap nach Wochentag und Uhrzeit. |
| **Modelle / Projekte** | Verteilung. Klick auf ein Projekt filtert das ganze Dashboard. |
| **Chats** | Jeder Chat mit Titel und allen Token-Arten, sortierbar und durchsuchbar. |
| **Limit-Meldungen** | Wann Claude Code dir ein Limit gemeldet hat. |

### Kategorien

- **Input** – neuer, nicht gecachter Text, den Claude liest.
- **Cache schreiben** – Kontext, der erstmals in den Prompt-Cache gelegt wird.
- **Cache lesen** – schon gecachter Kontext, der bei jeder weiteren Nachricht erneut gelesen wird (deshalb riesig).
- **Output** – was Claude schreibt, **inklusive** Thinking.
- **Thinking** – der „Nachdenk“-Anteil vom Output.

## Wichtige Hinweise

- **Nur Claude Code:** Nutzung in claude.ai oder der Claude-App zählt auch zu deinem Abo-Limit, ist hier aber nicht sichtbar.
- **Annäherung:** Anthropic veröffentlicht nicht, wie genau die Limits berechnet werden (z. B. wie stark Cache-Lesen zählt). Die 5-Std-Blöcke werden so geschätzt: Start = erste Nachricht, abgerundet auf die volle Stunde, Dauer 5 Stunden. Die Zahlen sind also die **rohe Nutzung**, keine offizielle Prozentanzeige.
- **Keine Kosten:** Beim Abo zahlst du pauschal – eine Euro/Dollar-Schätzung wäre irreführend und ist deshalb bewusst nicht eingebaut.
- **Doppelzählung vermieden:** Claude Code schreibt jede Antwort mehrmals ins Log (einmal pro Block: Thinking, Text, Tool-Aufruf) – jeweils mit denselben Zahlen. Das Dashboard zählt jede Antwort (`message.id`) nur einmal.

## Datenschutz

Alles bleibt auf deinem Rechner. Der Server lauscht nur auf `127.0.0.1` (nicht im Netzwerk erreichbar), macht **keine** Internet-Anfragen und die Seite lädt nichts von außen (keine CDNs, keine Schriftarten, kein Tracking).

## Ordner verschieben

Den ganzen Ordner `token-usage-dashboard` kannst du einfach irgendwohin verschieben – er findet die Claude-Logs immer über dein Benutzerverzeichnis (`~/.claude/projects`), nicht über den eigenen Speicherort.

## Dateien

```
token-usage-dashboard/
  server.js        Server: liest die Logs, rechnet alles zusammen, liefert /api/usage
  public/          Oberfläche (HTML, CSS, JavaScript – ohne Bibliotheken)
  start.bat        Doppelklick-Start für Windows
  package.json     nur für „npm start“, keine Abhängigkeiten
```

Anderer Port: `set PORT=6000 && node server.js` (Windows) bzw. `PORT=6000 node server.js`.
