// Bonus — State catalog HTTP service.
// All calls go through httpClient (axios). AbortSignal forwarded for cleanup.
import { httpClient } from '@shared/utils/httpClient';
import type { TaskState } from '../types/state.types';

export const stateService = {
  list: (signal?: AbortSignal): Promise<TaskState[]> =>
    httpClient.get<TaskState[]>('/states', { signal }).then((r) => r.data),

  create: (payload: { name: string }, signal?: AbortSignal): Promise<TaskState> =>
    httpClient.post<TaskState>('/states', payload, { signal }).then((r) => r.data),

  remove: (name: string, signal?: AbortSignal): Promise<void> =>
    httpClient.delete<void>(`/states/${name}`, { signal }).then(() => undefined),
};
