# Architecture and Tech Stack

## Recommended first stack

### Frontend

- React
- TypeScript
- Vite
- React Flow / xyflow or a similar graph editor layer
- CSS variables for themes
- Tailwind optional, but do not overcomplicate styling

### State management

Use a predictable state layer.

Recommended:

- Zustand for simple app state
- A custom command/event store for mindmap mutations

Do not rely only on React component state for core data.

### Persistence

Primary goal:

- Real local folders and files where supported

Fallback:

- IndexedDB or OPFS-style internal browser storage
- Export/import always available

### Later mobile

- Capacitor for iOS/Android wrapper
- Same React app should be responsive from the start

### Later self-hosting

- Dockerized web app
- Optional sync server
- Optional WebDAV/Git integration

## Major modules

```text
src/
  app/
    App.tsx
    routes.tsx
  vault/
    VaultProvider.ts
    fileSystemAccessProvider.ts
    indexedDbProvider.ts
    vaultTypes.ts
    vaultIndex.ts
  editor/
    MindmapEditor.tsx
    CanvasViewport.tsx
    NodeCard.tsx
    EdgeLayer.tsx
    EditorToolbar.tsx
    RightSidebar.tsx
  commands/
    commandTypes.ts
    commandDispatcher.ts
    eventStore.ts
    undoRedo.ts
    replayProjector.ts
  formats/
    canvasFormat.ts
    markdownFormat.ts
    sidecarFormat.ts
    wikilinks.ts
  search/
    searchIndex.ts
    searchTypes.ts
  backlinks/
    backlinkIndex.ts
  ui/
    CommandPalette.tsx
    ThemeProvider.tsx
    FileTree.tsx
    StartView.tsx
  tests/
```

## Core architecture principle

The map state must be changed only through commands.

### Bad

```ts
node.text = 'New text'
```

### Good

```ts
dispatchCommand({
  type: 'node.text.update',
  mapId,
  nodeId,
  before: 'Old text',
  after: 'New text',
  timestamp: Date.now(),
})
```

## Why commands are required

The same command/event foundation powers:

- autosave
- undo
- redo
- replay
- timeline
- version history
- clean replay
- real replay
- collaboration later
- debugging
- export history later

## Thin-slice build strategy

Build one small working path end-to-end:

```text
Open app
Create canvas file
Add node
Move node
Edit text
Write event
Save file
Undo event
Redo event
Show replay list
Reload app
```

Only after that should the app add more node types or polish.

## Data flow

```text
UI action
  -> command
    -> validate command
      -> apply command to current state
        -> emit event
          -> append to event log
          -> autosave state/sidecar
          -> update undo/redo stacks
          -> update replay/timeline
          -> update search/backlink indexes if needed
```

## Suggested libraries, but not hard requirements

- `@xyflow/react` for node editor foundation
- `zustand` for global UI/app state
- `idb` for IndexedDB helper if fallback is needed
- `gray-matter` only if Markdown frontmatter becomes useful
- `vitest` for unit tests
- `playwright` later for E2E

The agent should choose stable packages and avoid overengineering.

## Performance principles

- Keep rendering fast.
- Do not re-render the whole canvas on every keystroke if avoidable.
- Batch noisy events like dragging.
- Store final drag positions as meaningful events, not every pixel movement forever.
- Still preserve enough event detail for replay.
- Use snapshots/keyframes later for large histories.

## Mobile principles

Desktop-first for MVP, but never desktop-only.

Prepare:

- touch targets
- responsive panels
- command palette on mobile
- no mouse-only essential action
- no tiny buttons for core actions

## Anti-goals

Do not build these in the first prototype:

- user accounts
- cloud sync
- AI features
- payments
- collaboration
- full plugin marketplace
- perfect export system

Design for them, but do not implement them yet.
