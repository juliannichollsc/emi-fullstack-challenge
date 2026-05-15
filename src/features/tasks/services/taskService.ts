// Task 6 + 8 — Task HTTP service.
// All calls go through httpClient (axios). AbortSignal forwarded for cleanup.
// list() returns {items, total} reading json-server's X-Total-Count header.
import { httpClient } from '@shared/utils/httpClient';
import type { Task, TaskDraft } from '../types/task.types';

const PER_PAGE = 5;

export interface TaskPage {
  items: Task[];
  total: number;
}

export const taskService = {
  list: (
    params: { page?: number; perPage?: number } = {},
    signal?: AbortSignal,
  ): Promise<TaskPage> => {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? PER_PAGE;
    return httpClient
      .get<Task[]>('/tasks', {
        params: { _page: page, _limit: perPage },
        signal,
      })
      .then((res) => ({
        items: res.data,
        total: Number(res.headers['x-total-count'] ?? res.data.length),
      }));
  },

  getById: (id: string, signal?: AbortSignal): Promise<Task> =>
    httpClient.get<Task>(`/tasks/${id}`, { signal }).then((r) => r.data),

  create: (draft: TaskDraft, signal?: AbortSignal): Promise<Task> =>
    httpClient
      .post<Task>(
        '/tasks',
        {
          ...draft,
          stateHistory: [
            { state: draft.initialState, date: new Date().toISOString().slice(0, 10) },
          ],
        },
        { signal },
      )
      .then((r) => r.data),

  update: (id: string, patch: Partial<Task>, signal?: AbortSignal): Promise<Task> =>
    httpClient.patch<Task>(`/tasks/${id}`, patch, { signal }).then((r) => r.data),

  remove: (id: string, signal?: AbortSignal): Promise<void> =>
    httpClient.delete<void>(`/tasks/${id}`, { signal }).then(() => undefined),

  toggleCompleted: (id: string, completed: boolean, signal?: AbortSignal): Promise<Task> =>
    httpClient
      .patch<Task>(`/tasks/${id}`, { completed }, { signal })
      .then((r) => r.data),
};
