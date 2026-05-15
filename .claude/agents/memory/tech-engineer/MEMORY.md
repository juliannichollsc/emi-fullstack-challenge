- [Domain scope](scope.md) — Which PDF tasks the tech engineer owns.
- [HTTP rule](http.md) — All HTTP goes through `httpClient` + interceptor → `HttpError`.
- [State rule](state.md) — Context API + useReducer per PDF Task 6; split state/dispatch contexts.

## Durable decisions (2026-05-14)

### HTTP layer
- **`src/shared/utils/httpClient.ts`** is the single axios instance. `baseURL` from `VITE_API_URL ?? 'http://localhost:3001'`, `timeout: 10_000`.
- **Retry**: `axios-retry`, `retries: 1`, 500ms delay, idempotent + 5xx only.
- **Interceptor**: maps `AxiosError` → `HttpError(status, friendlyMessage, body)`. Cancellations are re-thrown as-is (components filter with `axios.isCancel()`).
- **`src/shared/utils/http.ts`**: keeps `HttpError` class + legacy `http()` fetch wrapper (not used by services, only for backward compat with types).

### Services
- `taskService.list({ page, perPage }, signal?)` returns `{ items: Task[], total: number }` reading `X-Total-Count` header from json-server.
- All service methods accept `AbortSignal` as last optional param.
- `taskService.toggleCompleted(id, completed, signal?)` — dedicated method instead of reusing `update`.
- `stateService.create({ name }, signal?)` — takes plain `{ name }` not full `TaskState`.

### State (TaskContext)
- **Split contexts**: `TaskStateCtx` + `TaskDispatchCtx` — dispatch-only consumers don't re-render on state changes.
- **`taskReducer`** is exported from `TaskContext.tsx` for jest-tester direct unit testing.
- **Pagination is server-side**: `state.page` drives a `useEffect` that fetches from json-server with `_page`/`_limit`. `total` comes from `X-Total-Count`.
- **Action discriminators** (PascalCase): `LOAD_START`, `LOAD_SUCCESS`, `LOAD_ERROR`, `CREATE`, `UPDATE`, `DELETE`, `TOGGLE_COMPLETED`, `SET_PAGE`.
- `useTaskContext()` is a unified hook kept for backward compat (pages already import it). Returns full state + async operations.
- **AbortController** in `useEffect` — cancels in-flight requests on unmount or page change.

### StateContext
- Now uses `useReducer` (was `useState`). `stateCatalogReducer` exported for testing.
- `create({ name })` signature (not `TaskState` shape) — matches `stateService.create`.

### ErrorBoundary
- **`RouteErrorBoundary`** (also exported as `ErrorBoundary` for backward compat) — `useRouteError` hook, used in `router.tsx`.
- **`ErrorBoundaryClass`** — class-based, wraps arbitrary subtrees, uses `data-testid="error-boundary-fallback"` and a Retry button.

### TaskList
- Updated to use **server-side pagination** from context (`page`, `total`, `perPage`, `setPage`) instead of client-side `usePagination`. `usePagination` hook is still available in shared for other uses.

### ESLint
- **`eslint.config.js`** at root, ESLint 9 flat config, `typescript-eslint` v8.
- `react-refresh/only-export-components` disabled for `**/context/**` files (standard Provider+hook pattern).
- 0 errors, 0 warnings confirmed.

### jest.config.ts
- Fixed: `setupFilesAfterEach` (wrong) → `setupFilesAfterEnv` (correct Jest key).
- Added `!src/**/*.types.ts` to `collectCoverageFrom` excludes.
- `isolatedModules: true` lives inside the `ts-jest` transform config object (not in deprecated `globals['ts-jest']`). No migration needed.

### HTTP mock strategy for jest-tester (2026-05-15)
- `moduleNameMapper` routes `@shared/utils/httpClient` → `src/shared/utils/__mocks__/httpClient.ts` unconditionally. This plain `axios.create()` instance lacks interceptors; `axios-mock-adapter` attached to it will not cover interceptor branches.
- **Do NOT use `axios-mock-adapter` against `httpClient` in service tests.** Instead, mock at the service module boundary: `jest.mock('@features/tasks/services/taskService')` / `jest.mock('@features/states/services/stateService')`. This is the correct seam for Provider/context tests.
- For interceptor-specific tests (error mapping, retry), a dedicated test file must import the real `httpClient` after clearing the module registry — or test `HttpError` shape in isolation (preferred since the interceptor logic is a pure function `friendlyMessage`).

### GSAP mock — matchMedia cleanup seam (2026-05-15)
- `src/__mocks__/gsap.ts`: `matchMediaInstance.add` now captures the cleanup function returned by each callback in `matchMediaCleanups[]`. `matchMediaInstance.revert()` drains and invokes all captured cleanups. This lets tests reach both the "animation runs" branch (callback executes immediately) and the "cleanup on revert" branch without modifying production code.

### asset-fetcher skill (2026-05-15)
- Created `.claude/skills/asset-fetcher/` — zero-dep ESM skill for vendoring brand assets from `grupoemi.com` into `public/brand/`.
- `fetch-asset.mjs` sha256: `7c34c8e537ed77d824fb4eef0ce16cb0fde37bcdeff9856c7b9e34405c2d931f`
- Self-test 4/4 PASS: Case A downloaded `https://www.grupoemi.com/favicon.ico` (15086 bytes); Case B SKIPPED (constructed SVG URL returned NETWORK_ERROR, rejection logic verified by inspection); Case C rejected `example.com` correctly; Case D rejected size > 100 bytes correctly.
- Discovered Phase 2A asset URLs: favicon only at `https://www.grupoemi.com/favicon.ico` (site is JS-rendered, no static PNG/JPEG in HTML). Logo likely served via JS bundle — Phase 2A must inspect Network tab or JS sources for the logo URL.
- `public/brand/.gitkeep` created so the folder is tracked by git.

### asset-fetcher allowlist extension + brand assets downloaded (2026-05-15)
- `EXACT_HOSTS` / `SUFFIX_HOSTS` split: `isHostAllowed()` now checks a `Set` for exact matches and an array for suffix matches. This prevents the `.grupoemi.com` suffix-wildcard from accidentally applying to new entries like Azure Blob hostnames.
- Added exact-host exception: `stpaginawebpdn.blob.core.windows.net` — CDN for Grupo EMI Falck's Next.js site brand assets. Broad suffix-matching (`*.blob.core.windows.net`) remains forbidden.
- Added `application/octet-stream` passthrough + `resolveOctetStream()` helper: Azure Blob serves PNGs without a declared MIME type. Magic-byte sniffing now resolves the real type and rejects anything that is not PNG/JPEG/WEBP/ICO. SVG is still explicitly rejected upstream.
- New `fetch-asset.mjs` sha256: `a308d4924891aee3be22936a901ea32f7c23d52ed7667495a6023d6c1419e464`
- `public/brand/emi-falck-logo.png` — 3713 bytes, sha256: `b7697437eeca3827aa0bf25a8ed1e7a1aeed309af464bbfe9437b1ef916e0b4c` (source: `https://stpaginawebpdn.blob.core.windows.net/pdn/site/logo-emi-falck_1.png`)
- `public/brand/favicon.ico` — 15086 bytes, sha256: `45d859b9ce9df8f10283c407d8e6114bb975bfe6829bc79f08089e0d30c2366d` (source: `https://www.grupoemi.com/favicon.ico`)
- `public/brand/footer-background.png` — 198784 bytes, sha256: `8e189ef52f8e7fede454ca748507f3d5e0f2df507bd2b7cae840ff93934817ce` (source: `https://www.grupoemi.com/backgorund-footer.62e6c886f9d71a96.png`, downloaded 2026-05-15)
