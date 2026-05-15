# Provider Error-Branch Patterns (jest-tester B)

Lessons learned while covering `TaskContext.tsx` and `StateContext.tsx` catch branches to reach 100% branch coverage.

## Core problem

Context Providers load data via `useEffect` + service calls. Tests using `axios-mock-adapter` (MockAdapter) only exercise the HTTP-error path, which always produces an `AxiosError` — itself an `instanceof Error`. That means the `else` branch of `err instanceof Error ? err.message : 'fallback'` is never hit by adapter-based mocks.

## Pattern: mock-service for non-Error rejections

Use `jest.spyOn` on the service object to reject with a primitive (string, number, `null`, `undefined`). This bypasses axios entirely and directly exercises the `false` branch of `err instanceof Error`.

```ts
const createSpy = jest.spyOn(taskService, 'create').mockRejectedValueOnce('oops');
// ... render, wait, click ...
// Assert fallback message displayed
createSpy.mockRestore();  // always restore in cleanup
```

**Key rule:** When the Provider's `useEffect` also calls the same service (e.g., `list`), the spy intercepts the INITIAL LOAD too, not just the later action. Chain `mockResolvedValueOnce` (first call) + `mockRejectedValueOnce` (second call):

```ts
const listSpy = jest
  .spyOn(taskService, 'list')
  .mockResolvedValueOnce({ items: [fixture], total: 1 })  // initial load
  .mockRejectedValueOnce(42);                              // refresh() call
```

Do NOT use `mock.onGet('/path').replyOnce(...)` for the initial load when a spy is active — the spy replaces the function and the adapter mock is never reached.

## Pattern: axios.isCancel branch

To hit the `axios.isCancel(err)` early-return branch without setting error state:

```ts
import axios from 'axios';

mock.onGet('/tasks').replyOnce(() => {
  throw new axios.Cancel('canceled by test');
});
```

`axios.Cancel` satisfies `axios.isCancel()`. The catch block returns early, so `dispatch({ type: 'LOAD_ERROR' })` and `push(msg, 'error')` are never called. Assert that `error` stays empty and `push` is not called.

Alternatively, any object with `.__CANCEL__ === true` satisfies `axios.isCancel`.

## Pattern: hook outside Provider

```ts
it('throws when used outside Provider', () => {
  expect(() => {
    renderHook(() => useTaskState());
  }).toThrow('useTaskState must be used within TaskProvider');
});
```

No `wrapper` argument — React renders without the Provider, the context returns `null`, the guard throws. React logs a console.error (from the error boundary mechanism) but the `toThrow` assertion captures it. This is expected noise.

## Pattern: refresh() happy path (success branch)

The `refresh()` function's try-block success dispatch (`LOAD_SUCCESS`) is only covered if the second network call succeeds. Use spy chaining:

```ts
const listSpy = jest
  .spyOn(taskService, 'list')
  .mockResolvedValueOnce({ items: [fixture1], total: 1 })
  .mockResolvedValueOnce({ items: [fixture2], total: 1 });
// After click-refresh, assert fixture2 appears
```

## Pattern: early-return guard (if !current return)

For `toggleComplete()` where the item ID doesn't exist in state:

```ts
const toggleSpy = jest.spyOn(taskService, 'toggleCompleted');
// render, wait for success, then click a button that calls toggleComplete('nonexistent-id')
expect(toggleSpy).not.toHaveBeenCalled();
toggleSpy.mockRestore();
```

The early return is hit before the service call, so `toggleCompleted` is never invoked.

## Coverage results (before / after)

| File | Branches before | Branches after |
|---|---|---|
| `TaskContext.tsx` | 76.66% | 100% |
| `StateContext.tsx` | 76.47% | 100% |
| Global branches | 83.92% | 91.07% |

## Gotchas

- `mock.reset()` / `mock.restore()` in `afterEach` clears the MockAdapter but does NOT restore `jest.spyOn` mocks — always call `spy.mockRestore()` explicitly.
- When both `MockAdapter` and `jest.spyOn` are active in the same test, the spy wins for the spied method because it replaces the function reference, not the HTTP interceptor.
- The coverage gate is `global` (not per-file). As long as overall branches ≥ 80%, the suite passes even if individual files have lower coverage. But reaching 100% on Providers is important for the `src/features/tasks/` gate.
