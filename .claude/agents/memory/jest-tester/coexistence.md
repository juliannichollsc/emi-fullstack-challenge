---
name: coexistence
description: Jest and Vitest both live in this repo; both must pass.
metadata:
  type: feedback
---

- `pnpm test` → Vitest (existing, vite-native).
- `pnpm test:jest` → Jest (added for PDF Task 7 compliance).
- Don't delete the Vitest config or existing `*.test.tsx` that targeted Vitest.
- Jest tests should be portable: avoid Vitest-only APIs (`vi.fn`); prefer `jest.fn`. If a test must work in both, use the `@testing-library/*` surface which is runner-agnostic.

**Why:** PDF explicitly requires Jest, but the project was scaffolded on Vitest and the existing infra works. Removing Vitest would regress.

**How to apply:** when porting an existing Vitest test, copy it under a Jest-runnable form (replace `vi.` → `jest.`) and run both runners in CI.
