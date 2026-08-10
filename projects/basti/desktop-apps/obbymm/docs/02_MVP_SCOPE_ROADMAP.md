# MVP Scope and Roadmap

## Guiding idea

Do not try to build the perfect app immediately.

Build a real thin vertical slice that proves the architecture:

- vault
- files
- editor
- event history
- undo/redo
- replay foundation
- local persistence

## Version 0.1 — Foundation Prototype

Goal:

A user can create and edit a basic `.canvas` mindmap in an Obsidian-like vault UI, with events being recorded.

### Must have

- App shell
- Vault-style layout
- Left file tree
- Start view with recent files
- Create Markdown note
- Create Canvas mindmap
- Open Markdown note
- Open Canvas mindmap
- Basic Markdown editor
- Basic mindmap editor
- Obsidian-style node cards
- Create node
- Move node
- Connect nodes
- Select node
- Floating node toolbar
- Right sidebar
- Edit node title
- Add node note in sidebar
- Basic Wikilink parsing for `[[FileName]]`
- Basic global search foundation
- Autosave foundation
- Central command/event system
- Undo/redo foundation
- Replay button visible
- History/replay event list visible
- Light/dark mode
- Local persistence

### Can be simple

- File tree can be basic
- Markdown editor can be basic textarea/editor
- Search can be simple text search
- Backlinks can be data-model-first, not perfect UI
- Replay can show an event list before full animation exists
- Mobile can be usable but not perfect

### Not required yet

- Full replay animation
- Clean Replay filtering
- Video/GIF/PDF export
- Perfect Obsidian plugin compatibility
- Cloud accounts
- AI
- Full mobile app stores
- Multiplayer collaboration
- Plugin system implementation
- Self-hosted sync

## Version 0.2 — Obsidian Feeling

Goal:

Make the app feel more like a serious vault-based thinking tool.

### Add

- Better file tree operations
- Create folders
- Rename files
- Delete files safely
- Move files
- Command palette
- Slash commands
- Better Wikilink handling
- Backlinks panel
- Search results UI
- Note preview
- File references from nodes
- Basic keyboard shortcuts
- Better autosave status
- Version snapshots

## Version 0.3 — Better Mindmap Editor

Goal:

Make the editor pleasant, fast, and useful.

### Add

- Todo nodes
- Link nodes
- Group nodes
- Tags
- Basic auto-layout
- Free layout mode
- Hybrid layout mode
- Better zoom/pan
- Better touch support
- Better node card styles
- Basic theme customization
- Node drag handles
- Edge creation UX

## Version 0.4 — Replay Becomes Special

Goal:

Turn the event system into a visible product feature.

### Add

- Replay playback
- Replay speed controls
- Timeline scrubbing
- Real Replay mode
- Clean Replay mode foundation
- Snapshots/keyframes
- Replay pause/resume
- Per-map replay settings
- Private nodes excluded from replay/export
- Replay deletion/purge

## Version 1.0 — First Beta

Goal:

A real usable local-first beta.

### Add

- `.canvas` import/export stability
- Markdown export from mindmap
- Markdown-to-mindmap import/conversion
- Backup/export vault
- PWA support
- Better responsive mobile UI
- Better theme system
- Basic plugin architecture design
- Performance optimization
- Data-loss testing
- App update path

## Later — Paid or advanced features

### AI one-time purchase possibilities

- Mindmap from text
- Expand a node
- Explain a mindmap
- Generate study questions
- Generate a study plan
- Summarize a map
- Convert messy notes into a mindmap

### Theme packs

- Minimal
- Paper
- Study
- Neon
- Glass
- Focus
- Procreate-like replay themes

### Exports

- Video replay
- GIF replay
- PDF presentation
- PNG/SVG export
- Markdown outline
- HTML share page

### Self-hosted sync

- Docker app
- ZimaOS-friendly install
- WebDAV option
- Git-based vault sync option
- Local network sync later

## Main success criteria for MVP

Version 0.1 is successful if:

1. Data does not get lost.
2. A user can make a basic mindmap.
3. The app feels clean and not ugly.
4. The event-history foundation is real.
5. Undo/redo works for basic operations.
6. The file structure is open and understandable.
7. Claude/agents can continue building on the architecture without rewriting everything.
