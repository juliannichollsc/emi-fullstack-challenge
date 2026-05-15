---
name: scope
description: Minimum viable scope of the EMI task-app, anchored to doc/Code Challenge EMI 1 (1).pdf and doc/db 1.json.
metadata:
  type: project
---

The PDF defines 10 tasks + 1 bonus. Authoritative scope is the PDF; `doc/db 1.json` defines the minimum data shape that must work end-to-end.

**Task shape (db 1.json):**
- `title: string`
- `description: string`
- `dueDate: string (YYYY-MM-DD)`
- `completed: boolean`
- `stateHistory: { state: string; date: string }[]` — show **last** entry as current state.
- `notes: string[]` — at least one note is required in TaskForm validation.

**States (db 1.json):** `new`, `active`, `resolved`, `closed`.

**Senior-only:** Tasks 7 (Jest tests), 8 (error handling), 9 (perf — lazy loading + memo).

**Why:** Anything outside this scope is optional. Anything that contradicts the PDF is wrong.

**How to apply:** When a request implies new fields/states, confirm with the user before extending. When prioritizing work, finish PDF tasks before polish.
