---
name: conventions
description: File layout and assertion conventions for Jest tests in this repo.
metadata:
  type: feedback
---

- Tests live in `__tests__/` next to the unit (e.g., `src/features/tasks/components/__tests__/Task.test.tsx`).
- Filename = unit name + `.test.tsx` (component) or `.test.ts` (logic).
- One behavior per `it`; AAA structure.
- Query priority: `getByRole` (with accessible name) > `getByLabelText` > `getByText` > `getByTestId`.
- No DOM snapshots; assert on roles, text, and side effects.
- Type fixtures from `features/tasks/types` — no `any` in tests.
- Render with the **real** `TaskProvider` unless isolating a reducer; do not mock context.

**Why:** stable tests survive markup changes; role-based queries enforce a11y; real providers catch wiring bugs the PDF rewards.

**How to apply:** if you find yourself reaching for `getByTestId`, first fix the UI to expose a proper role+name.
