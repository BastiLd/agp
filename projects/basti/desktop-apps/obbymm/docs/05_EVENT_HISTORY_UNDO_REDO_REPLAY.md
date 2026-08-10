# Event History, Undo/Redo, and Replay

This is the most important technical document for ObbyMM.

## Core idea

Every meaningful change to a mindmap is recorded as an event.

Those events power:

- undo
- redo
- replay
- timeline
- autosave
- versions
- clean replay
- real replay
- later collaboration

## Required rule

No UI component may directly mutate the mindmap state.

Every mutation must go through:

```text
Command -> Event -> State Projection -> Persistence
```

## Command example

```ts
type UpdateNodeTextCommand = {
  type: 'node.text.update'
  mapId: string
  nodeId: string
  before: string
  after: string
  timestamp: number
}
```

## Event example

```ts
type MindmapEvent = {
  eventId: string
  mapId: string
  type: string
  timestamp: number
  actor: 'user' | 'system' | 'import' | 'replay'
  payload: unknown
  inverse?: unknown
  replay?: {
    include: boolean
    importance: 'low' | 'normal' | 'high'
    cleanReplayEligible: boolean
  }
}
```

## Important event types

MVP:

```text
map.create
map.open
node.create
node.delete
node.text.update
node.position.update
node.note.update
node.style.update
edge.create
edge.delete
selection.change
undo.apply
redo.apply
```

Later:

```text
node.private.toggle
node.type.change
node.todo.toggle
node.link.set
node.tag.add
node.tag.remove
group.create
group.update
layout.auto.apply
layout.mode.change
markdown.import
markdown.export
replay.settings.update
snapshot.create
```

## Undo/redo model

Each command should either include or be able to generate an inverse command.

Example:

```text
node.create inverse = node.delete
node.delete inverse = node.restore
node.text.update inverse = node.text.update with before/after swapped
node.position.update inverse = node.position.update with before/after swapped
edge.create inverse = edge.delete
edge.delete inverse = edge.restore
```

## Undo event policy

User wanted default replay to show every change.

Therefore:

- Real Replay includes undo/redo as part of the thought process.
- Clean Replay later can hide or compress undo/redo.

## Replay modes

### Real Replay

Default. Shows what really happened.

### Clean Replay

Later. A filtered version that skips noise.

## Replay retention

- Replay is on by default.
- History is kept forever by default.
- Retention must be configurable globally and per mindmap.

## Private nodes

Private nodes must be in the data model early. MVP can store private flags even if export is not implemented yet.

## Drag events

- During drag: update temporary UI state.
- On drag end: store one node.position.update event with before/after position.

## Text editing events

- Debounce text changes.
- Store meaningful text-change events when editing finishes or after debounce.
- Keep before/after values.

## Replay playback architecture

Replay should use a projector: Initial state + events up to time T = reconstructed state at T.

## Snapshots/keyframes

Later, large histories need snapshots for performance.

## Timeline UI

MVP: show event list, timestamps, event type, affected node, undo/redo buttons.

## Event schema migration

Events must include schema version if needed. Never silently drop history.

## Acceptance criteria for the event system

1. Creating a node writes an event.
2. Editing a node writes an event.
3. Moving a node writes an event.
4. Creating an edge writes an event.
5. Undo works for node creation and text changes.
6. Redo works for node creation and text changes.
7. Closing/reopening the app keeps the map state.
8. The replay/history panel shows events in order.
9. The app can reconstruct current map state from saved data.
10. Missing replay sidecars do not break opening .canvas files.
