---
name: scope
description: Technical surface area owned by tech-engineer, mapped to PDF tasks.
metadata:
  type: project
---

PDF Task → file the tech engineer owns:

- Task 1 → `tsconfig.app.json`, `vite.config.ts`, aliases, scripts.
- Task 5 → `src/app/router.tsx` (lazy routes for `pages/*`).
- Task 6 → `src/features/tasks/context/TaskContext.tsx` + reducer + selector hooks.
- Task 8 → `src/shared/utils/httpClient.ts`, `HttpError`, `ToastContext`, `ErrorBoundary`.
- Task 9 → lazy + `React.memo` + `useMemo` wiring (the UI uses them; you decide where).
- Bonus → `src/features/states/context/` + service.

**Why:** isolates non-visual logic so UI and tests can iterate without merging into each other's files.

**How to apply:** if a task spans both your scope and UI, return the technical seam first; let `ui-designer` consume it.
