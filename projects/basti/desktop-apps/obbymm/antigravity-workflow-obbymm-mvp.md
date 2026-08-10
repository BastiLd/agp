# Antigravity Workflow: Build ObbyMM MVP Thin Slice

Description: Use this workflow to guide an Antigravity agent through planning and implementing the ObbyMM 0.1 vertical slice.

## Step 1 — Read project context

Read these files:

- @CLAUDE_MASTER_PROMPT.md
- @AGENTS.md
- @docs/01_PRODUCT_VISION.md
- @docs/02_MVP_SCOPE_ROADMAP.md
- @docs/03_ARCHITECTURE_TECH_STACK.md
- @docs/04_DATA_FORMATS_CANVAS_MARKDOWN.md
- @docs/05_EVENT_HISTORY_UNDO_REDO_REPLAY.md
- @docs/06_UI_UX_SPEC.md
- @docs/08_TESTING_ACCEPTANCE_CRITERIA.md
- @.agents/rules/obbymm-rules.md
- @.agents/skills/obbymm-builder/SKILL.md

## Step 2 — Inspect workspace

Inspect the current file tree and identify whether a frontend project already exists.

Do not write code yet.

## Step 3 — Create implementation plan

Create a plan artifact with:

1. stack choice
2. file/folder structure
3. data model
4. event system design
5. persistence design
6. UI components
7. tests
8. risks
9. exact first tasks

Wait for review.

## Step 4 — Implement vertical slice

After approval, implement:

- app shell
- vault layout
- note editor
- canvas editor
- node create/move/connect/edit
- command/event system
- undo/redo basic
- replay/history panel
- persistence

## Step 5 — Verify

Run available tests/lint/build.

Manually verify:

- create note
- create map
- add node
- move node
- connect node
- edit title
- add note
- event appears
- undo works
- redo works
- save/reload works

## Step 6 — Summarize

Produce a walkthrough artifact explaining:

- what was built
- where files are
- how to run it
- what works
- what is incomplete
- next recommended step
