# Claude Master Prompt for ObbyMM in Antigravity

You are Claude Opus running inside Google Antigravity.

Your task is to help build **ObbyMM**, an Obsidian-style local-first mindmap and markdown thinking app.

Before writing code, read these project files carefully:

- @docs/01_PRODUCT_VISION.md
- @docs/02_MVP_SCOPE_ROADMAP.md
- @docs/03_ARCHITECTURE_TECH_STACK.md
- @docs/04_DATA_FORMATS_CANVAS_MARKDOWN.md
- @docs/05_EVENT_HISTORY_UNDO_REDO_REPLAY.md
- @docs/06_UI_UX_SPEC.md
- @docs/07_SELF_HOSTING_SYNC_ZIMAOS_DOCKER.md
- @docs/08_TESTING_ACCEPTANCE_CRITERIA.md
- @docs/09_ANTIGRAVITY_USAGE.md
- @.agents/rules/obbymm-rules.md
- @.agents/skills/obbymm-builder/SKILL.md

## Product summary

ObbyMM is "Obsidian for Mindmaps":

A local-first, offline-first, open-format thinking app where `.md` notes and `.canvas` mindmaps live together in a real vault folder. It combines an Obsidian-like workflow with a beautiful visual mindmap editor, backlinks, command palette, and replay history.

## Non-negotiable principles

1. The app must be local-first and file-first.
2. User data must remain readable and exportable.
3. Mindmaps are visible `.canvas` files in the vault.
4. Markdown notes are visible `.md` files in the vault.
5. App-specific replay/history metadata must be stored in sidecar files under `.obbymm/`.
6. The `.canvas` file must remain usable even if sidecar files are missing.
7. Every mindmap change must go through a central command/event system.
8. No UI component may directly mutate the map state.
9. Undo, redo, replay, timeline, autosave, and version history must all be built on the same event foundation.
10. The free core must stay free. Future paid features must not remove or lock existing free features.

## Build objective

Build a real thin-slice prototype, not a static mockup.

The first prototype should include:

- Vault-style layout
- File tree on the left
- Recent files/start area
- `.md` note creation and editing
- `.canvas` mindmap creation and editing
- Basic mindmap editor
- Obsidian-style node cards
- Node selection
- Floating node toolbar
- Right sidebar with node details
- Node notes in the sidebar
- Wikilink support using `[[FileName]]`
- Basic backlinks data model
- Global search foundation
- Light and dark mode
- Autosave foundation
- Central event system
- Undo/redo foundation
- Replay button visible
- Replay event list visible

The first prototype does **not** need perfect replay playback, perfect mobile UX, self-hosted sync, AI, plugins, or export. But the architecture must prepare for those.

## Required working style

Start in Planning Mode.

First produce an implementation plan artifact with:

1. Current workspace inspection summary
2. Recommended stack
3. Proposed file/folder tree
4. Data model
5. Event system design
6. MVP implementation steps
7. Risks and tradeoffs
8. Exact first coding tasks
9. Verification plan

Do not begin implementation until the plan is reviewed, unless you are only inspecting the workspace.

When implementing:

- Work in small vertical slices.
- Prefer simple, testable code over clever abstractions.
- Keep the UI clean and fast.
- Avoid introducing cloud/account requirements.
- Preserve Obsidian compatibility where possible.
- Add comments only where they explain important architectural decisions.
- Add tests for event application, undo/redo, file persistence, and replay reconstruction as soon as the foundation exists.

## Suggested first milestone

Milestone 0.1 should create a working prototype where a user can:

1. Open the app.
2. See a vault-like UI.
3. Create a `.canvas` mindmap.
4. Add a few nodes.
5. Move nodes.
6. Connect nodes.
7. Select a node.
8. Edit node title.
9. Add node notes in the sidebar.
10. See events added to the history list.
11. Undo and redo at least basic node creation/text changes.
12. Save data locally.
13. Reopen the app and see the map again.

## Important technical rule

All map mutations must use commands.

Example:

```ts
dispatchCommand({
  type: 'node.text.update',
  mapId,
  nodeId,
  before: 'Old title',
  after: 'New title',
  timestamp: Date.now()
})
```

Do not do this from UI components:

```ts
node.text = 'New title'
```

The command/event layer is the heart of ObbyMM.
