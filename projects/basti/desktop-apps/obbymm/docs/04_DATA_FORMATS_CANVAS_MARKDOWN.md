# Data Formats: Canvas, Markdown, Sidecars

## Main decision

ObbyMM uses visible files in the vault:

```text
My Note.md
My Mindmap.canvas
```

App-specific data is stored in sidecar files:

```text
.obbymm/My Mindmap.replay.jsonl
.obbymm/My Mindmap.meta.json
.obbymm/My Mindmap.versions.jsonl
```

## Why `.canvas`

The app should be as Obsidian-compatible as possible.

`.canvas` is the visible mindmap file because it already represents nodes and edges.

## Compatibility rule

A `.canvas` file must remain useful without ObbyMM sidecar files.

If this exists:

```text
My Mindmap.canvas
```

but these are missing:

```text
.obbymm/My Mindmap.replay.jsonl
.obbymm/My Mindmap.meta.json
```

then the app must still open the mindmap.

The user should only lose ObbyMM-specific extras such as replay and special settings.

## Suggested vault layout

```text
Vault/
  Schule/
    Biologie.md
    Zellaufbau.canvas
  Projekte/
    ObbyMM.canvas
    Product Ideas.md
  .obbymm/
    Zellaufbau.replay.jsonl
    Zellaufbau.meta.json
    Zellaufbau.versions.jsonl
    ObbyMM.replay.jsonl
    ObbyMM.meta.json
```

## Canvas file example

Keep this close to a normal JSON Canvas structure.

```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "text",
      "text": "ObbyMM",
      "x": 0,
      "y": 0,
      "width": 240,
      "height": 120
    },
    {
      "id": "node-2",
      "type": "text",
      "text": "Replay",
      "x": 320,
      "y": 80,
      "width": 240,
      "height": 120
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "fromNode": "node-1",
      "toNode": "node-2"
    }
  ]
}
```

## Meta sidecar example

```json
{
  "app": "ObbyMM",
  "schemaVersion": 1,
  "canvasFile": "ObbyMM.canvas",
  "title": "ObbyMM",
  "layoutMode": "free",
  "theme": "system",
  "replay": {
    "enabled": true,
    "retention": "forever",
    "defaultMode": "real",
    "privateNodesExcluded": true
  },
  "createdAt": "2026-04-29T12:00:00.000Z",
  "updatedAt": "2026-04-29T12:30:00.000Z"
}
```

## Replay event log example

Use JSON Lines so events can be appended safely.

File:

```text
.obbymm/ObbyMM.replay.jsonl
```

Each line:

```json
{"eventId":"evt-1","type":"node.create","timestamp":1770000000000,"mapId":"ObbyMM.canvas","payload":{"node":{"id":"node-1","type":"text","text":"ObbyMM","x":0,"y":0,"width":240,"height":120}},"inverse":{"type":"node.delete","payload":{"nodeId":"node-1"}}}
```

## Version sidecar example

```json
{"versionId":"v1","timestamp":1770000000000,"label":"Initial map","canvasHash":"abc123","eventId":"evt-1"}
```

## Markdown notes

Markdown files are normal `.md` files.

Example:

```markdown
# Zellkern

Der Zellkern enthält die DNA und steuert wichtige Zellprozesse.

Related:

- [[Zellaufbau.canvas]]
- [[DNA]]
```

## Links

MVP standard:

```text
[[FileName]]
[[Folder/FileName]]
[[Biology.md]]
[[Zellaufbau.canvas]]
```

Later support:

```markdown
[Display Text](Folder/FileName.md)
```

## Node notes

MVP decision:

- Node notes are edited in the right sidebar.
- Store node notes either in `.canvas` if compatible enough, or in `.obbymm/*.meta.json` if the data is too app-specific.

Important:

Do not break `.canvas` compatibility with large unknown custom blobs.

Preferred approach:

- Keep simple text node content in `.canvas`.
- Keep ObbyMM-only extras in `.meta.json`.

## Private nodes

Private nodes should be supported in the data model from the start.

Example metadata:

```json
{
  "nodeSettings": {
    "node-123": {
      "private": true,
      "excludeFromReplay": true,
      "excludeFromExport": true
    }
  }
}
```

## Global settings

Global settings can live in:

```text
.obbymm/settings.json
```

Example:

```json
{
  "theme": "system",
  "replay": {
    "enabledByDefault": true,
    "retentionDefault": "forever"
  },
  "search": {
    "indexMarkdown": true,
    "indexCanvasNodeText": true,
    "indexNodeNotes": true
  }
}
```

## Migration rule

Every file format must include a schema version where possible.

When changing formats:

- write a migration
- keep old files readable
- never silently destroy old data
