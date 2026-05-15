---
name: state-management
description: Use when designing or modifying state in the EMI task-app — Context API + useReducer (per PDF Task 6), selectors, async effects, persistence, devtools. Owned by the orchestrator. PROPOSED — finalize once Task 6 patterns stabilize.
---

# State Management — EMI Task App

PDF Task 6 mandates **React Context API + useReducer** (no Redux, no Zustand). This skill encodes how to implement state cleanly inside the feature-sliced architecture.

## Where state lives

| State scope | Lives in |
|---|---|
| Task list, pagination, selected task | `src/features/tasks/context/TaskContext.tsx` |
| State catalog (new/active/resolved/closed) | `src/features/states/context/StateContext.tsx` |
| Toast notifications (Task 8) | `src/shared/context/ToastContext.tsx` |
| Route / params | React Router (`useParams`, `useSearchParams`) — not context |

Rule: **each feature owns its own context.** Cross-feature state belongs in `shared/`.

## Shape of a feature context

```ts
// types
type TaskState = {
  items: Task[];
  page: number;
  pageSize: 5;             // PDF Task 3 fixes this
  status: 'idle' | 'loading' | 'error';
  error: string | null;
};

type TaskAction =
  | { type: 'load/start' }
  | { type: 'load/success'; payload: Task[] }
  | { type: 'load/error'; payload: string }
  | { type: 'add'; payload: Task }
  | { type: 'update'; payload: { id: string; patch: Partial<Task> } }
  | { type: 'remove'; payload: string }
  | { type: 'toggleCompleted'; payload: string }
  | { type: 'setPage'; payload: number };
```

## Reducer rules

- **Pure**: no `fetch`, no `Date.now()`, no `Math.random()`. Side effects belong in hooks/effects.
- **Exhaustive**: cover every action in a `switch`. End with `default: return state;`.
- **Type-narrow**: action `type` discriminator gives TS full inference.
- **Immutable**: spread or `structuredClone`; never mutate `state`.

## Provider pattern

```tsx
const TaskStateCtx = createContext<TaskState | null>(null);
const TaskDispatchCtx = createContext<Dispatch<TaskAction> | null>(null);

export function TaskProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(taskReducer, initialTaskState);
  return (
    <TaskStateCtx.Provider value={state}>
      <TaskDispatchCtx.Provider value={dispatch}>{children}</TaskDispatchCtx.Provider>
    </TaskStateCtx.Provider>
  );
}
```

**Why two contexts?** Components that only dispatch don't re-render when state changes. This is the cheapest perf win for Task 9.

## Selector hooks (per feature)

```ts
export function useTaskState() {
  const ctx = useContext(TaskStateCtx);
  if (!ctx) throw new Error('useTaskState outside TaskProvider');
  return ctx;
}

export function useTaskDispatch() {
  const ctx = useContext(TaskDispatchCtx);
  if (!ctx) throw new Error('useTaskDispatch outside TaskProvider');
  return ctx;
}

// derived
export function usePaginatedTasks() {
  const { items, page, pageSize } = useTaskState();
  return useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );
}
```

`useMemo` on derived state addresses Task 9 (Performance).

## Async (thunks via plain functions)

Context API has no built-in thunks. Compose a hook that dispatches around a service call:

```ts
export function useLoadTasks() {
  const dispatch = useTaskDispatch();
  return useCallback(async (signal?: AbortSignal) => {
    dispatch({ type: 'load/start' });
    try {
      const items = await taskService.list(signal);
      dispatch({ type: 'load/success', payload: items });
    } catch (e) {
      if (e instanceof Error) dispatch({ type: 'load/error', payload: e.message });
    }
  }, [dispatch]);
}
```

## Persistence (optional, only if needed)

- `pageSize` is fixed by the PDF — don't persist.
- `page` — keep in URL (`?page=2`) via React Router, not in context. Survives reload, shareable.
- Optimistic updates: dispatch the change before the network call; rollback on error.

## Testing the reducer

```ts
it('marks a task completed', () => {
  const prev = { ...initialTaskState, items: [taskFixture] };
  const next = taskReducer(prev, { type: 'toggleCompleted', payload: taskFixture.id });
  expect(next.items[0].completed).toBe(true);
});
```

Pure-function tests are the fastest path to coverage on the senior bar.

## Anti-patterns

- Putting all state in one global context (re-renders everything).
- Calling `fetch` inside the reducer.
- Persisting derived data (`completedCount`) — compute via selector.
- Reading context from `app/` — wire providers there, but never consume.
