---
name: http
description: Single rule for HTTP work in the EMI task-app.
metadata:
  type: feedback
---

All HTTP traffic flows through `src/shared/utils/httpClient.ts` (axios instance with `VITE_API_URL`, timeout, JSON header) and a response interceptor that converts every `AxiosError` into the existing `HttpError`.

Domain services (`taskService`, `stateService`) call `httpClient` only — never raw axios, never raw fetch from a component. Components depend on hooks; hooks depend on services; services depend on `httpClient`.

**Why:** Task 8 (Senior) requires graceful, user-facing error handling. A single interceptor gives one place to map status → message, set up retries, attach `signal`, and propagate cancellations.

**How to apply:** before adding a new endpoint, add it to the relevant service. If a component needs a one-off request, expose a hook from the feature — never call axios directly from the component.
