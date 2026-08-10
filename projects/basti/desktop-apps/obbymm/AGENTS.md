# ObbyMM Agent Instructions

This repository is for **ObbyMM**, an Obsidian-style mindmap and markdown thinking app.

Read the documents in `docs/` before making architectural changes.

## Core product idea

ObbyMM = Obsidian for Mindmaps.

It is a local-first app where `.md` notes and `.canvas` mindmaps live in a real vault folder. The app adds event-sourced undo/redo and replay/timelapse for the evolution of mindmaps.

## Hard rules

- Keep user data local-first and file-first.
- Keep `.canvas` files readable and compatible where possible.
- Store app-specific metadata in `.obbymm/` sidecars.
- Do not lock user data into a proprietary database.
- Do not require accounts for the core app.
- Every mindmap mutation must go through the command/event system.
- Do not let UI components mutate map state directly.
- Preserve a path toward mobile via responsive UI and later Capacitor.
- Keep the core free; paid features may only add extras later.

## Preferred implementation approach

Build vertical slices:

1. Vault shell
2. File operations
3. Basic editor
4. Event system
5. Undo/redo
6. Replay event list
7. Sidebar/details
8. Search/backlinks
9. Mobile/responsive polish
10. Later export/sync/plugins
