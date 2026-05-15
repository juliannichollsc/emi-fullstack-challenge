---
name: architecture
description: Hard architecture rule enforced before any code change.
metadata:
  type: feedback
---

Respect the feature-sliced architecture defined in `doc/architecture.md`:

- `pages/` → may import `features/` and `shared/`.
- `features/<dom>/` → may import `shared/`; **never** another feature (one documented exception: `TaskForm` consumes `useStateCatalog`).
- `shared/` → may not import `features/` or `pages/`.
- `app/` → composition only (router, providers, layouts).
- Use TS path aliases (`@app`, `@features`, `@shared`, `@pages`, `@`).
- Each feature exposes its surface via `index.ts` (barrel); the rest is internal.

**Why:** the user explicitly required this rule. Violating it produced past coupling problems and breaks lazy-loaded routes.

**How to apply:** Before writing a new file, decide its layer. Before adding an import, verify it points down (or sideways within shared), never up.
