# ObbyMM Workspace Rules

These rules should be treated as persistent project rules.

## Product identity

ObbyMM is Obsidian for Mindmaps.
It is a local-first, offline-first, open-format thinking app where `.md` notes and `.canvas` mindmaps live together in a vault.

## Hard rules

1. Do not introduce a required account system for core features.
2. Do not introduce required cloud storage for core features.
3. Do not store core user data only in a proprietary database.
4. Keep user data exportable and readable.
5. Use `.md` for notes.
6. Use `.canvas` for visible mindmaps.
7. Store ObbyMM-specific metadata in `.obbymm/` sidecars.
8. Do not break `.canvas` compatibility unnecessarily.
9. Every map mutation must go through a command/event layer.
10. UI components must not directly mutate map state.
11. Preserve a path toward undo/redo, replay, timeline, and versions.
12. Keep the first prototype simple.
13. Favor data safety over fancy UI.
14. Keep performance high.
15. Build with responsive UI in mind.

## Monetization rule

The important core remains free.
