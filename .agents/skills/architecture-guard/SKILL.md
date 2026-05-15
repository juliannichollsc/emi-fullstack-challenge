---
name: architecture-guard
description: Enforces the feature-sliced architecture of the EMI task-app (doc/architecture.md). Use BEFORE writing or moving any file. All agents must load this skill on entry.
---

# Architecture Guard — EMI Task App

This skill encodes a **non-negotiable** architecture rule. Every agent must consult it before touching the file tree.

## Layers (top depends on bottom only)

```
┌──────────────────────────────────────────────────┐
│  pages/             (routes, screens)            │
├──────────────────────────────────────────────────┤
│  features/<dom>/    (components, hooks, context, │
│                      services, types, index.ts)  │
├──────────────────────────────────────────────────┤
│  shared/            (components, hooks, context, │
│                      utils, types)               │
├──────────────────────────────────────────────────┤
│  app/               (router, providers, layouts) │
└──────────────────────────────────────────────────┘
```

## Hard rules

1. **`pages/`** may import `features/` and `shared/`. Pages are thin route shells.
2. **`features/<dom>/`** may import `shared/` and its own internals. **Never** import another feature. *Documented exception:* `TaskForm` consumes `useStateCatalog` because the state dropdown is a cross-cutting selector.
3. **`shared/`** may not import `features/` or `pages/`. It must be domain-agnostic.
4. **`app/`** is composition only — wires router, providers, layouts.
5. Each feature exposes its public surface via `index.ts` (barrel). Importing from internal paths (`@features/tasks/components/Task`) outside the feature is forbidden — go through `@features/tasks`.

## Path aliases

Use these everywhere (configured in `tsconfig.app.json` + `vite.config.ts`):

| Alias | Resolves to |
|---|---|
| `@/*` | `src/*` |
| `@app/*` | `src/app/*` |
| `@features/*` | `src/features/*` |
| `@shared/*` | `src/shared/*` |
| `@pages/*` | `src/pages/*` |

**No deep relative imports.** `../../shared/utils/http` is a bug.

## Naming

- Components: PascalCase, named exports (`export function Task(...)`).
- Pages: PascalCase, **default** export (lazy-loadable).
- Hooks: `useX` camelCase, named exports.
- Tests: co-located in `__tests__/` next to the unit.

## Where things go (cheat sheet)

| Item | Lives in |
|---|---|
| Reusable button / pagination | `src/shared/components/` |
| Task domain component | `src/features/tasks/components/` |
| `useTasks()` hook | `src/features/tasks/hooks/` |
| `TaskContext` + reducer | `src/features/tasks/context/` |
| `taskService` (HTTP) | `src/features/tasks/services/` |
| Cross-cutting types | `src/shared/types/` |
| `Task` type | `src/features/tasks/types/` |
| `Router`, `Providers`, layouts | `src/app/` |
| Routes screens | `src/pages/` |

## Validation before commit

Before writing a file, ask:
1. Which layer is this?
2. Does every import point **down** (or sideways inside `shared/`)?
3. Am I importing from another feature's internals? If yes — stop and refactor to a shared concept or accept the documented exception.
4. Am I using aliases (`@features/...`) instead of deep relative paths?

If any answer is wrong, do not write the file. Surface the issue to the user.

## Why this rule exists

The user explicitly mandated respecting the architecture. Violations produced past cross-feature coupling and broke lazy routing. Reverting them is expensive; preventing them is free.
