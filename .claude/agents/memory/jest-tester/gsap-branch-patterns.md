# GSAP Branch-Coverage Patterns (jest-tester A)

Lessons learned while covering `Task.tsx` lines 42-72 (hover animation) and 79-82 (SVG animation).
Established during the branch-coverage push from 72% → 92%+ global branches.

---

## Core problem: useGSAP mock fires before DOM commit

The `@gsap/react` mock (at `src/__mocks__/@gsap/react.ts`) calls `cb()` synchronously:

```ts
export const useGSAP = jest.fn((cb) => { try { cb(); } catch { /* ignore */ } });
```

React sets refs AFTER the render phase commits the DOM. The mock fires during the render phase,
so `cardRef.current` and `checkPathRef.current` are always `null` inside the callbacks at
hook-call time. The guards `if (!card) return` and `if (!path) return` exit early, leaving
the body of the callbacks uncovered.

---

## Pattern A: capture-then-invoke (covers hover animation lines 43-71)

Intercept a specific `useGSAP` call with `mockImplementationOnce` to capture the callback
WITHOUT calling it. After `render()` completes (refs are now populated), invoke the callback
inside `act()`.

**Critical discovery:** `jest.requireMock('@gsap/react')` returns a DIFFERENT object reference
than the named import used by the component's module graph. Always use the **direct named import**
for `mockImplementationOnce`:

```ts
// ✓ correct — same reference Task.tsx uses
import { useGSAP as mockUseGSAP } from '@gsap/react';
(mockUseGSAP as jest.Mock).mockImplementationOnce((cb: () => void) => {
  hoverCb = cb;
});

// ✗ wrong — different reference; mockImplementationOnce has no effect on Task.tsx
const { useGSAP } = jest.requireMock('@gsap/react');
useGSAP.mockImplementationOnce(...);
```

Full pattern for hover setup:

```ts
let hoverCb: (() => void) | null = null;
(mockUseGSAP as jest.Mock).mockImplementationOnce((cb: () => void) => {
  hoverCb = cb;
});

const { container } = renderTask();
const article = container.querySelector('article') as HTMLElement;

act(() => {
  article.getBoundingClientRect = () => ({
    left: 0, top: 0, width: 200, height: 100,
    right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}),
  });
  if (hoverCb) hoverCb();
});

// Now addEventListener('mousemove', onEnter) is registered on the real article.
// Firing events covers onEnter/onLeave.
act(() => {
  fireEvent(article, new MouseEvent('mousemove', { bubbles: true, clientX: 150, clientY: 60 }));
});
expect(gsapTo).toHaveBeenCalledTimes(1);
```

---

## Pattern B: covering matchMedia cleanup (lines 68-69 — removeEventListener)

After `hoverCb()` sets up the listeners, the inner cleanup function (`return () => { removeEventListener... }`)
is stored in `matchMediaCleanups` inside the mock. Calling `mm.revert()` fires all stored cleanups.

The `gsap.matchMedia()` mock returns the singleton `matchMediaInstance`. Its `revert()` method
invokes all stored cleanups, covering the `removeEventListener` lines.

```ts
act(() => {
  const mm = (gsapMock as unknown as { matchMedia: jest.Mock }).matchMedia();
  mm.revert();
});
// After revert, event listeners are gone — gsap.to is NOT called on subsequent mousemove.
```

---

## Pattern C: capturing the SECOND useGSAP callback (SVG animation, lines 79-82)

When a component calls `useGSAP` twice, use two sequential `mockImplementationOnce` calls.
The first mock intercepts the hover-setup call (skip it), the second captures the SVG callback.

```ts
// Skip first useGSAP (hover setup)
(mockUseGSAP as jest.Mock).mockImplementationOnce((_cb: () => void) => {});

// Capture second useGSAP (SVG animation)
let svgCb: (() => void) | null = null;
(mockUseGSAP as jest.Mock).mockImplementationOnce((cb: () => void) => { svgCb = cb; });

const { container } = renderTask({ task: { ...baseFixture, completed: true } });

// jsdom doesn't implement getTotalLength — patch it on the real DOM element
const pathEl = container.querySelector('path[d="M1 5 L4.5 8.5 L11 1"]') as SVGPathElement;
if (pathEl) pathEl.getTotalLength = () => 20;

act(() => { if (svgCb) svgCb(); });

// Now gsap.set (line 80) and gsap.from (line 82, when completed=true) have run.
expect(gsapSet).toHaveBeenCalled();
expect(gsapFrom).toHaveBeenCalled();
```

---

## Pattern D: handleToggle matchMedia branch (lines 91-96)

`handleToggle` calls `gsap.matchMedia()` inline (not via `useGSAP`). The mock's `add()` fires
its callback synchronously, so clicking the checkbox is sufficient to run the branch. No capture
needed — just click and assert `gsap.to` was called.

```ts
const gsapTo = (gsapMock as unknown as { to: jest.Mock }).to;
await user.click(screen.getByRole('checkbox'));
expect(gsapTo).toHaveBeenCalled();
```

---

## Pattern E: renderHook with real TaskProvider (useTaskById coverage)

Always use the real `TaskProvider` with `axios-mock-adapter` for `renderHook` tests.
Do NOT mock the Provider. Use `waitFor` to wait for async load before asserting items.

```ts
function wrapper({ children }) {
  return React.createElement(ToastProvider, null,
    React.createElement(TaskProvider, null, children));
}

it('returns task after provider loads', async () => {
  mock.onGet('/tasks').reply(200, [taskFixture], { 'x-total-count': '1' });
  const { result, unmount } = renderHook(() => useTaskById('1'), { wrapper });
  await waitFor(() => expect(result.current?.id).toBe('1'));
  unmount();
});
```

State-dispatching calls (like `setPage`) inside tests must be wrapped in `act()` to avoid
"not wrapped in act" warnings:

```ts
act(() => { result.current.setPage(2); });
await waitFor(() => expect(result.current.page).toBe(2));
```

---

## React Router v6 future flag warnings

Every `<MemoryRouter>` in tests should include future flags to silence deprecation warnings:

```tsx
<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
```

These warnings come from `react-router@6.30.x` which has v7 compatibility flags. The warnings
are noisy but tests still pass without them. Adding the flags ensures clean output.

---

## Coverage delta from these patterns

| File | Stmts before | Stmts after | Branches before | Branches after |
|---|---|---|---|---|
| `Task.tsx` | 61.4% | 98.24% | 78.57% | 96.42% |
| `useTasks.ts` | 90.9% | 100% | 100% | 100% |
| Global all files | 92.09% | 97.67% | 83.33% | 92.85% |
| Global branches | 83.33% | 92.85% | — | — |

Total tests: 139 → 159 (20 new tests added).
