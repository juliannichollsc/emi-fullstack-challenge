// Task 8 — Axios instance: single source of truth for all HTTP in the app.
// Architecture: services depend on this; components never import axios directly.
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { HttpError } from './http';

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Retry: 1 extra attempt on 5xx, GET/HEAD/OPTIONS only (idempotent).
axiosRetry(httpClient, {
  retries: 1,
  retryDelay: () => 500,
  retryCondition: (err) =>
    axiosRetry.isNetworkOrIdempotentRequestError(err) ||
    (err.response?.status ?? 0) >= 500,
});

// Response interceptor — maps every failure to HttpError so components
// never see raw AxiosError. Aborted requests are re-thrown as-is so callers
// can filter with axios.isCancel().
httpClient.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    // Let cancellations propagate without wrapping.
    if (axios.isCancel(err)) return Promise.reject(err);

    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 0;
      const body = err.response?.data;
      const message = friendlyMessage(status, err.message);
      return Promise.reject(new HttpError(status, message, body));
    }

    return Promise.reject(new HttpError(0, 'Unexpected error', err));
  },
);

function friendlyMessage(status: number, fallback: string): string {
  if (status === 0) return 'No connection. Check your network.';
  if (status === 404) return 'Resource not found.';
  if (status === 422) return 'Invalid data sent to the server.';
  if (status >= 500) return 'Server error. Please try again.';
  if (status === 401 || status === 403) return 'You are not authorised to perform this action.';
  return fallback;
}
