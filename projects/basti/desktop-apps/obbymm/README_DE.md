# ObbyMM Antigravity Pack

Dieses Paket ist dafür gedacht, dass du es direkt in deinen Antigravity-Workspace legst und Claude damit arbeiten lässt.

## Kurzfassung

**ObbyMM** = Obsidian für Mindmaps.

Eine lokale, offene, offline-first Denk-App mit:

- Obsidian-artigem Vault
- `.md`-Notizen
- `.canvas`-Mindmaps
- Backlinks
- Command Palette
- Light/Dark Mode und später Themes
- Event-History für Undo/Redo
- Replay/Timelapse der Mindmap-Entstehung
- später optional Self-hosted Sync für ZimaOS/Docker/WebDAV/Git

## Empfohlene Nutzung in Antigravity

1. Öffne deinen Antigravity-Workspace.
2. Entpacke dieses Paket in den Root des Workspaces.
3. Öffne `CLAUDE_MASTER_PROMPT.md`.
4. Kopiere den Inhalt in den Agent-Chat.
5. Wähle als Modell am besten `Claude Opus 4.6 (Thinking)` oder, falls später verfügbar, `Claude Opus 4.7`.
6. Nutze zuerst **Planning Mode**, nicht direkt Fast Mode.
7. Lass Claude zuerst einen Implementierungsplan erstellen.
8. Erst nach Review soll Claude anfangen zu coden.

## Wichtige Dateien

- `CLAUDE_MASTER_PROMPT.md`  
  Der Startprompt, den du direkt in Antigravity einfügen kannst.

- `docs/01_PRODUCT_VISION.md`  
  Produktidee, Zielgruppe, Prinzipien.

- `docs/02_MVP_SCOPE_ROADMAP.md`  
  Was in Version 0.1, 0.2, 0.3, 1.0 und später gebaut wird.

- `docs/03_ARCHITECTURE_TECH_STACK.md`  
  Technische Architektur und empfohlener Stack.

- `docs/04_DATA_FORMATS_CANVAS_MARKDOWN.md`  
  `.canvas`, `.md`, Sidecar-Dateien, Obsidian-Kompatibilität.

- `docs/05_EVENT_HISTORY_UNDO_REDO_REPLAY.md`  
  Der wichtigste technische Kern: Event-History, Undo/Redo, Replay.

- `docs/06_UI_UX_SPEC.md`  
  Vault, Editor, Node-Karten, Sidebars, Mobile, Animationen.

- `docs/07_SELF_HOSTING_SYNC_ZIMAOS_DOCKER.md`  
  Späterer Plan für eigenen Sync, ZimaOS und Docker.

- `docs/08_TESTING_ACCEPTANCE_CRITERIA.md`  
  Tests, Akzeptanzkriterien und Stabilitätsregeln.

- `docs/09_ANTIGRAVITY_USAGE.md`  
  Anleitung für Antigravity.

- `.agents/skills/obbymm-builder/SKILL.md`  
  Antigravity Skill, damit der Agent die ObbyMM-Regeln automatisch anwenden kann.

- `.agents/rules/obbymm-rules.md`  
  Workspace-Regeln für Antigravity. In der UI am besten als **Always On** aktivieren.

- `antigravity-workflow-obbymm-mvp.md`  
  Workflow-Vorlage, die du in Antigravity als Workflow speichern kannst.

## Wichtigste Projektregel

Keine Komponente darf den Mindmap-State direkt verändern.

Jede Änderung muss durch einen zentralen Command/Event-Handler laufen.

Warum?

Weil daraus entsteht:

- Autosave
- Undo
- Redo
- Replay
- Timeline
- Versionen
- Clean Replay
- Real Replay
- Export

## Dateiformat-Entscheidung

ObbyMM nutzt sichtbare `.canvas`-Dateien im Vault, damit Mindmaps offen und möglichst Obsidian-kompatibel bleiben.

App-spezifische Daten kommen in Sidecar-Dateien:

```text
My Map.canvas
.obbymm/My Map.replay.jsonl
.obbymm/My Map.meta.json
.obbymm/My Map.versions.jsonl
```

Wenn die Sidecar-Dateien fehlen, muss die `.canvas` trotzdem geöffnet werden können.

## Monetarisierungsregel

Der wichtige Kern bleibt kostenlos.

Spätere Einmalkäufe dürfen nur zusätzliche Komfortfunktionen enthalten, zum Beispiel:

- KI-Funktionen
- zusätzliche Theme-Packs
- Export-Templates
- Replay-Styles
- optionaler Sync-Komfort

Alles, was vorher kostenlos war, bleibt kostenlos.
