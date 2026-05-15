---
name: scope
description: Priority list of units to cover with Jest tests for the EMI task-app.
metadata:
  type: project
---

PDF Task 7 explicitly names **Jest**. Minimum bar = one component test. Senior bar = meaningful coverage.

Priority order:
1. `TaskForm` — required-field validation, ≥1 note required, submit payload matches `db 1.json` shape.
2. `TaskList` — 5-per-page pagination, mark-complete toggle.
3. `Task` — last state from `stateHistory`, edit + delete callbacks.
4. `taskService` — mocked HTTP for CRUD.
5. `TaskContext` reducer cases.

**Why:** matches PDF Task 7 (Senior), keeps tests aligned with the user-visible contract from the PDF.

**How to apply:** start with TaskForm; it has the most behavior packed into one component and exercises the validation rules the PDF calls out.
