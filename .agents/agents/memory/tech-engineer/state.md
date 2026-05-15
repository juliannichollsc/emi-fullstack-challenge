---
name: state
description: Single rule for state management in the EMI task-app.
metadata:
  type: feedback
---

PDF Task 6 mandates **React Context API + useReducer**. No Redux, no Zustand, no signals.

Each feature owns its context:
- `TaskContext` in `src/features/tasks/context/`
- `StateContext` (states catalog) in `src/features/states/context/`
- `ToastContext` (shared) in `src/shared/context/`

Split state and dispatch into two contexts so dispatch-only consumers don't re-render on state changes (cheap Task 9 win). Selector hooks (`useTaskState`, `useTaskDispatch`, `usePaginatedTasks`) live alongside the provider.

Reducers are pure: no `fetch`, no `Date.now()`. Async lives in custom hooks (`useLoadTasks`) that wrap a service call and dispatch start/success/error.

**Why:** matches PDF Task 6, keeps reducer trivially testable (PDF Task 7), and avoids the global-context perf trap.

**How to apply:** when the user asks for a new piece of state, decide first whether it belongs in URL (React Router), feature context, or shared context — never in `app/`.
