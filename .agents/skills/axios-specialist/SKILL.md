---
name: axios-specialist
description: Use for any HTTP work in the EMI task-app — axios instance config, interceptors, AbortController, retries, error mapping to ToastContext, TS generics, and test-time mocking with axios-mock-adapter. Loaded by orchestrator and jest-tester.
---

# Axios Specialist — EMI Task App

The repo currently ships a `fetch`-based `http()` helper (`src/shared/utils/http.ts`). For Task 8 (Error Handling — Senior), axios gives us richer error metadata, cancellation, and adapter-based tests. This skill is the canonical pattern.

## Where axios code lives

- Instance + interceptors → `src/shared/utils/httpClient.ts`
- Domain calls → `src/features/<dom>/services/*Service.ts`
- Error type / mapper → `src/shared/utils/HttpError.ts` (reuse the existing class).

**Architecture rule:** services depend on `httpClient`, never on a global axios singleton. Components depend on services via hooks, never on axios directly.

## Canonical instance

```ts
// src/shared/utils/httpClient.ts
import axios, { AxiosError, AxiosInstance } from 'axios';
import { HttpError } from './http';

export const httpClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const status = err.response?.status ?? 0;
    const body = err.response?.data;
    return Promise.reject(
      new HttpError(status, err.message, body),
    );
  },
);
```

## Service example

```ts
// src/features/tasks/services/taskService.ts
import { httpClient } from '@shared/utils/httpClient';
import type { Task } from '@features/tasks/types';

export const taskService = {
  list: (signal?: AbortSignal) =>
    httpClient.get<Task[]>('/tasks', { signal }).then((r) => r.data),

  create: (payload: Omit<Task, 'id'>) =>
    httpClient.post<Task>('/tasks', payload).then((r) => r.data),

  update: (id: string, patch: Partial<Task>) =>
    httpClient.patch<Task>(`/tasks/${id}`, patch).then((r) => r.data),

  remove: (id: string) =>
    httpClient.delete<void>(`/tasks/${id}`).then(() => undefined),
};
```

## Cancellation (pair with React effects)

```ts
useEffect(() => {
  const ac = new AbortController();
  taskService.list(ac.signal).then(setTasks).catch((e) => {
    if (axios.isCancel(e)) return;
    showToast('error', e.message);
  });
  return () => ac.abort();
}, []);
```

## Error mapping for Task 8

Funnel every axios failure through `HttpError`, then map to a user message:

```ts
function explain(e: unknown): string {
  if (e instanceof HttpError) {
    if (e.status === 404) return 'No encontramos ese recurso.';
    if (e.status >= 500) return 'El servidor falló. Intenta de nuevo.';
    if (e.status === 0)  return 'Sin conexión.';
    return e.message;
  }
  return 'Algo salió mal.';
}
```

Surface via `ToastContext` (`src/shared/context/ToastContext.tsx`) — components never read raw errors.

## Retries (only safe verbs)

Retry GET/HEAD/OPTIONS. Never retry POST without idempotency. Use `axios-retry`:

```ts
import axiosRetry from 'axios-retry';
axiosRetry(httpClient, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (err) =>
    axiosRetry.isNetworkOrIdempotentRequestError(err) ||
    err.response?.status === 502 ||
    err.response?.status === 503,
});
```

## Typing tips

- Type the response (`get<Task[]>`); type the request body via `Omit<Task, 'id'>` (json-server assigns id).
- Don't let `AxiosResponse` leak past the service — return `r.data`.

## Testing with `axios-mock-adapter`

```ts
import MockAdapter from 'axios-mock-adapter';
import { httpClient } from '@shared/utils/httpClient';
import { taskService } from '@features/tasks/services/taskService';

let mock: MockAdapter;
beforeEach(() => { mock = new MockAdapter(httpClient); });
afterEach(() => { mock.reset(); });

it('lists tasks', async () => {
  mock.onGet('/tasks').reply(200, [{ title: 't', /* ...db 1.json shape */ }]);
  await expect(taskService.list()).resolves.toHaveLength(1);
});

it('throws HttpError on 500', async () => {
  mock.onGet('/tasks').reply(500, { msg: 'boom' });
  await expect(taskService.list()).rejects.toMatchObject({ status: 500 });
});
```

## When NOT to use axios

- For simple SSR/edge fetches → native `fetch` is fine.
- For binary streams / multipart with progress in browser → axios is preferable.

## Dependencies to add

```
axios, axios-retry, axios-mock-adapter (dev)
```

## Anti-patterns

- Calling `axios` directly from components.
- Catching `AxiosError` in components — let the interceptor convert to `HttpError`.
- Swallowing `signal` parameter — always forward it from React effects.
- Hardcoding `http://localhost:3001` — go through `VITE_API_URL`.
