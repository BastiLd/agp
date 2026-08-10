---
name: obbymm-builder
description: Builds and modifies ObbyMM, an Obsidian-style local-first mindmap and markdown app. Use when implementing vaults, .canvas mindmaps, Markdown notes, event-sourced undo/redo, replay history, backlinks, themes, self-hosted sync, or related architecture.
---

# ObbyMM Builder Skill

Use this skill whenever the task involves ObbyMM product planning, architecture, implementation, testing, or refactoring.

## First steps

Before coding, read docs/01_PRODUCT_VISION.md, docs/02_MVP_SCOPE_ROADMAP.md, docs/03_ARCHITECTURE_TECH_STACK.md, docs/04_DATA_FORMATS_CANVAS_MARKDOWN.md, docs/05_EVENT_HISTORY_UNDO_REDO_REPLAY.md, docs/06_UI_UX_SPEC.md, docs/08_TESTING_ACCEPTANCE_CRITERIA.md.

## Non-negotiable architecture

Every mindmap mutation must go through the command/event system.
Do not mutate canvas state directly from UI components.
The event system powers undo, redo, replay, timeline, autosave, version history.

## Data format rules

- Notes are `.md` files.
- Mindmaps are `.canvas` files.
- App-specific metadata is stored under `.obbymm/` sidecars.
- Missing sidecars must not prevent opening `.canvas` files.
- Preserve readability and exportability.

## Implementation style

- Build vertical slices.
- Keep code simple and testable.
- Prefer stable, boring architecture over clever abstractions.
- Preserve future mobile support.
- Avoid accounts/cloud in the MVP.
- Avoid AI features in the MVP.
