# UI and UX Specification

## Overall feeling

ObbyMM should feel like:

- Obsidian
- clean
- fast
- dark-mode friendly
- calm
- useful
- slightly creative

## App start

```text
Left sidebar: Vault file tree
Main area: Recent files, favorites, create buttons
Right sidebar: hidden or contextual
```

## Desktop layout

```text
+---------------------------------------------------------------+
| Top bar: app name, search, command palette, theme, settings   |
+----------------------+----------------------+-----------------+
| File tree / vault    | Editor area          | Right sidebar   |
|                      |                      |                 |
| Schule               | Mindmap/Markdown     | Node details    |
| Projekte             |                      | Notes           |
| Privat               |                      | Backlinks       |
|                      |                      | History/Replay  |
+----------------------+----------------------+-----------------+
```

## Vault view

- Left file tree like Obsidian
- Folders and files visible
- `.md` and `.canvas` shown with icons

## Node card design

- Nodes should look like Obsidian cards.
- rounded rectangle, subtle border, dark/light theme support
- small icon/type indicator, main title, optional small preview line

## Floating node toolbar

Basic actions:
- Edit
- Link
- Color/style
- Todo
- Note
- More

## Right sidebar

Tabs/sections:
- Details
- Note
- Links
- Backlinks
- History
- Replay

## Node note editing

- Select node
- Open right sidebar
- Edit note text
- Save note with map metadata/sidecar

## Backlinks
- data model and simple panel
- backlinks from Markdown Wikilinks

## Themes
- light, dark, system

## Layout modes
- free layout first

## Replay UI
- Replay button visible
- History event list
- Undo/redo buttons
