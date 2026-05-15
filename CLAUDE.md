# CLAUDE.md — EMI Task App

This file is the entry context for Claude Code in this repo. Every session must read it before acting.

## Project

**EMI Code Challenge: Task Management Application** — React + TypeScript scaffold delivering Tasks 1–10 + Bonus from `doc/Code Challenge EMI 1 (1).pdf`. Mock backend via `json-server` over `public/db.json`. **Minimum data shape** is anchored to `doc/db 1.json` — do not invent fields outside it.

Stack: Vite + React 18 + TS, React Router v6 (lazy), Context API + `useReducer`, Tailwind (mobile-first), Vitest (legacy) + Jest (PDF Task 7 requirement), pnpm.

## Hard rules (non-negotiable)

1. **All requests pass through the `orchestrator` agent.** The orchestrator is a router — it never writes code. It delegates to specialists in parallel when scope spans multiple domains.
2. **Respect the feature-sliced architecture** in `doc/architecture.md`. Unidirectional deps; aliases (`@app`, `@features`, `@shared`, `@pages`, `@`) instead of relative paths; barrel `index.ts` per feature.
3. **Authoritative scope** = the PDF + `db 1.json`. Anything outside is optional.
4. **eslint runs after every prompt** (Stop hook in `.claude/settings.json`).

## Agents (`.claude/agents/`)

| Agent | Role | Owns |
|---|---|---|
| `orchestrator` | Pure router. Analyzes the prompt, loads `doc/` context, delegates. **Never implements.** | Routing decisions, reconciliation, summary back to user |
| `tech-engineer` | Sole implementer for non-UI/non-test code | State, HTTP, services, hooks, error handling, performance, routing, architecture, config |
| `ui-designer` | Visual specialist | Components, Tailwind, responsive, GSAP, UX, a11y |
| `jest-tester` | Unit/component testing specialist | Jest + RTL tests, mocks, coverage, fixtures |
| `e2e-tester` | End-to-end testing specialist | Playwright specs driving real Brave; one spec per PDF task |

Each agent reads its own memory at `.claude/agents/memory/<agent>/MEMORY.md` on entry.

### Delegation flow

```
user prompt
   │
   ▼
orchestrator (analyze + classify)
   │
   ├─► tech-engineer   (state/HTTP/perf/arch)   ─┐
   ├─► ui-designer     (visual)                  │
   ├─► jest-tester     (unit tests)              ├─► run in PARALLEL
   └─► e2e-tester      (Playwright on Brave)    ─┘
                                                  │
                                                  ▼
                                            reconciled summary
```

If a UI/test agent needs a seam (hook, service, reducer), the orchestrator spawns `tech-engineer` first, then UI + tests in parallel against the new seam.

## Skills (`.claude/skills/`)

### Internal (this repo)

| Skill | Loaded by | Purpose |
|---|---|---|
| `architecture-guard` | **all agents (always)** | Enforces feature-sliced rule, unidirectional deps, aliases |
| `axios-specialist` | `tech-engineer`, `jest-tester` (when HTTP under test) | Axios instance, interceptors, retries, error mapping, `axios-mock-adapter` |
| `state-management` | `tech-engineer` | Context API + useReducer pattern (PDF Task 6) |
| `jest-best-practices` | `jest-tester` | Jest + RTL config, AAA, query priority, mocks |
| `playwright-e2e` | `e2e-tester` | Microsoft Playwright pattern, launches user's existing Brave binary, PDF-task→spec mapping |

### External (vendored)

UI/animation skills are owned by `ui-designer`:
- `frontend-design`, `web-design-guidelines`, `ui-ux-pro-max`
- `gsap-core`, `gsap-timeline`, `gsap-react`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-performance`, `gsap-utils`, `gsap-frameworks`
- `vercel-react-best-practices` (also useful to `tech-engineer` for hook patterns)

## Hooks (`.claude/settings.json`)

- **Stop**: runs `pnpm lint` (fallback `npx --yes eslint .`) after every prompt completes. Keeps the tree clean continuously.

## Scripts

```bash
pnpm install               # install (run once after pulling)
pnpm dev                   # vite (http://localhost:5173)
pnpm api                   # json-server (http://localhost:3001)
pnpm lint                  # eslint
pnpm test                  # Vitest
pnpm test:jest             # Jest (PDF Task 7)
pnpm test:jest:coverage    # Jest + coverage gate (80%)
pnpm test:e2e              # Playwright on Brave (headed by default) — full PDF suite
pnpm test:e2e:ui           # Playwright UI mode
pnpm test:e2e:report       # open last HTML report
pnpm build                 # tsc -b && vite build
```

## File map

```
.
├── .claude/
│   ├── agents/
│   │   ├── orchestrator.md
│   │   ├── tech-engineer.md
│   │   ├── ui-designer.md
│   │   ├── jest-tester.md
│   │   ├── e2e-tester.md
│   │   └── memory/<agent>/  (per-agent persistent notes)
│   ├── skills/
│   │   ├── architecture-guard/SKILL.md
│   │   ├── axios-specialist/SKILL.md
│   │   ├── state-management/SKILL.md
│   │   ├── jest-best-practices/SKILL.md
│   │   ├── playwright-e2e/SKILL.md
│   │   └── (external skills: gsap-*, frontend-design, ui-ux-pro-max, web-design-guidelines, vercel-react-best-practices)
│   └── settings.json        (eslint Stop hook + permissions)
├── doc/                     (PDF + db 1.json = authoritative scope)
├── e2e/                     (Playwright specs, one per PDF task + bonus)
├── jest.config.ts
├── playwright.config.ts
├── vite.config.ts
├── public/db.json
└── src/
    ├── app/                 (router, providers, layouts — composition only)
    ├── features/
    │   ├── tasks/           (components, context, hooks, services, types, index.ts)
    │   └── states/          (Bonus)
    ├── pages/               (route screens; lazy-loaded)
    ├── shared/              (components, hooks, context, utils, types — domain-agnostic)
    └── setupTests.ts        (jest-dom matchers; used by both Vitest and Jest)
```

## Domain shape (from `doc/db 1.json`)

```ts
type Task = {
  id?: string;                         // json-server assigns
  title: string;
  description: string;
  dueDate: string;                     // YYYY-MM-DD
  completed: boolean;
  stateHistory: { state: string; date: string }[];   // show last as current
  notes: string[];                                    // ≥1 required by TaskForm
};

type StateName = 'new' | 'active' | 'resolved' | 'closed';
```

## PDF Task → owner cheat sheet

| PDF Task | Owner | Files |
|---|---|---|
| 1 Project setup | tech-engineer | `package.json`, `vite.config.ts`, `tsconfig.app.json` |
| 2 Task component | ui-designer | `src/features/tasks/components/Task.tsx` |
| 3 TaskList + pagination | ui-designer | `src/features/tasks/components/TaskList.tsx`, `src/shared/components/Pagination.tsx` |
| 4 TaskForm + validation | ui-designer | `src/features/tasks/components/TaskForm.tsx` |
| 5 Routing | tech-engineer | `src/app/router.tsx` |
| 6 State management | tech-engineer | `src/features/tasks/context/TaskContext.tsx` |
| 7 Testing (Senior) | jest-tester (unit) + e2e-tester (browser) | `__tests__/` next to units; `e2e/*.spec.ts` |
| 8 Error handling (Senior) | tech-engineer | `httpClient.ts`, `HttpError`, `ToastContext`, `ErrorBoundary` |
| 9 Performance (Senior) | tech-engineer (wiring) + ui-designer (memo placement) | `router.tsx`, `React.memo`, `useMemo` |
| 10 Responsive | ui-designer | All visual files |
| Bonus state form | ui-designer (form) + tech-engineer (context) | `src/features/states/` |

## Proposed next skill

`state-management` is shipped. The next gap to consider is a **`react-router-flows`** skill encoding the project's specific routing conventions (lazy boundaries, error elements, loader/action choices — even with json-server) so PDF Task 5 has the same depth of guidance the other tasks do.
