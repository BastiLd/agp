# Testing and Acceptance Criteria

## MVP acceptance criteria

### Vault
- User can create a vault or open a workspace folder.
- User can see `.md` and `.canvas` files.
- User can create a new Markdown note.
- User can create a new Canvas mindmap.
- User can reopen existing files.

### Markdown
- User can edit Markdown text.
- User can save Markdown.
- User can write `[[Wikilinks]]`.
- Search can find text in Markdown files.

### Mindmap
- User can create a node.
- User can edit node text.
- User can move node.
- User can connect two nodes.
- User can delete a node safely.
- User can select a node.
- User can edit node note in sidebar.
- User can save and reload the map.

### Event history
- Node create writes event.
- Text edit writes event.
- Position change writes event.
- Edge create writes event.
- Events are ordered by timestamp/sequence.
- Replay panel can show event list.

### Undo/redo
- Undo node create works.
- Redo node create works.
- Undo text edit works.
- Redo text edit works.
- Undo/redo does not corrupt saved data.

### Persistence
- Close/reopen app keeps notes.
- Close/reopen app keeps canvas nodes/edges.
- Close/reopen app keeps node notes.
- Missing `.obbymm/*.replay.jsonl` does not prevent opening `.canvas`.
- Invalid sidecar file produces safe warning, not data loss.

### Search
- Search finds file names, Markdown content, node text, node notes.

### Theme
- Light mode, dark mode, system theme work.

## Non-regression rules
- existing `.canvas` files still load
- existing sidecar logs still load
- undo/redo still works
- tests still pass
