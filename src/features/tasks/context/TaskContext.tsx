// Task 6 + 8 + 9 — Context API + useReducer for tasks.
// Split into two contexts (state / dispatch) so dispatch-only consumers don't re-render on state changes.
// Reducer is exported for direct unit testing without a Provider (jest-tester seam).
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import axios from 'axios';
import type { Task, TaskDraft } from '../types/task.types';
import { taskService } from '../services/taskService';
import { useToast } from '@shared/context/ToastContext';
import type { AsyncStatus } from '@shared/types/api';

// ── State shape ────────────────────────────────────────────────────────────
export interface TaskState {
  items: Task[];
  total: number;
  page: number;
  perPage: 5;
  status: AsyncStatus;
  error: string | null;
}

// ── Discriminated action union ─────────────────────────────────────────────
export type TaskAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: { items: Task[]; total: number; page: number } }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'CREATE'; task: Task }
  | { type: 'UPDATE'; task: Task }
  | { type: 'DELETE'; id: string }
  | { type: 'TOGGLE_COMPLETED'; id: string; completed: boolean }
  | { type: 'SET_PAGE'; page: number };

// ── Initial state ──────────────────────────────────────────────────────────
export const initialTaskState: TaskState = {
  items: [],
  total: 0,
  page: 1,
  perPage: 5,
  status: 'idle',
  error: null,
};

// ── Pure reducer — exported for jest-tester ────────────────────────────────
export function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, status: 'loading', error: null };

    case 'LOAD_SUCCESS':
      return {
        ...state,
        status: 'success',
        items: action.payload.items,
        total: action.payload.total,
        page: action.payload.page,
        error: null,
      };

    case 'LOAD_ERROR':
      return { ...state, status: 'error', error: action.error };

    case 'CREATE':
      return { ...state, items: [...state.items, action.task], total: state.total + 1 };

    case 'UPDATE':
      return {
        ...state,
        items: state.items.map((t) => (t.id === action.task.id ? action.task : t)),
      };

    case 'DELETE':
      return {
        ...state,
        items: state.items.filter((t) => t.id !== action.id),
        total: Math.max(0, state.total - 1),
      };

    case 'TOGGLE_COMPLETED':
      return {
        ...state,
        items: state.items.map((t) =>
          t.id === action.id ? { ...t, completed: action.completed } : t,
        ),
      };

    case 'SET_PAGE':
      return { ...state, page: action.page };

    default:
      return state;
  }
}

// ── Contexts — split to avoid unnecessary re-renders ──────────────────────
const TaskStateCtx = createContext<TaskState | null>(null);
const TaskDispatchCtx = createContext<React.Dispatch<TaskAction> | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────
export function TaskProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(taskReducer, initialTaskState);
  const { push } = useToast();

  // Load tasks for current page; abort on unmount or page change.
  useEffect(() => {
    const ac = new AbortController();

    dispatch({ type: 'LOAD_START' });
    taskService
      .list({ page: state.page, perPage: state.perPage }, ac.signal)
      .then(({ items, total }) => {
        dispatch({ type: 'LOAD_SUCCESS', payload: { items, total, page: state.page } });
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        const msg = err instanceof Error ? err.message : 'Failed to load tasks';
        dispatch({ type: 'LOAD_ERROR', error: msg });
        push(msg, 'error');
      });

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.page, push]);

  return (
    <TaskStateCtx.Provider value={state}>
      <TaskDispatchCtx.Provider value={dispatch}>{children}</TaskDispatchCtx.Provider>
    </TaskStateCtx.Provider>
  );
}

// ── Selector hooks ────────────────────────────────────────────────────────
export function useTaskState(): TaskState {
  const ctx = useContext(TaskStateCtx);
  if (!ctx) throw new Error('useTaskState must be used within TaskProvider');
  return ctx;
}

export function useTaskDispatch(): React.Dispatch<TaskAction> {
  const ctx = useContext(TaskDispatchCtx);
  if (!ctx) throw new Error('useTaskDispatch must be used within TaskProvider');
  return ctx;
}

// ── Legacy unified hook — keeps existing consumers working ────────────────
// Provides create/update/remove/toggleComplete + full state surface.
export function useTaskContext() {
  const state = useTaskState();
  const dispatch = useTaskDispatch();
  const { push } = useToast();

  const refresh = useCallback(async () => {
    const ac = new AbortController();
    dispatch({ type: 'LOAD_START' });
    try {
      const { items, total } = await taskService.list(
        { page: state.page, perPage: state.perPage },
        ac.signal,
      );
      dispatch({ type: 'LOAD_SUCCESS', payload: { items, total, page: state.page } });
    } catch (err: unknown) {
      if (axios.isCancel(err)) return;
      const msg = err instanceof Error ? err.message : 'Failed to load tasks';
      dispatch({ type: 'LOAD_ERROR', error: msg });
      push(msg, 'error');
    }
  }, [dispatch, state.page, state.perPage, push]);

  const create = useCallback(
    async (draft: TaskDraft): Promise<Task | null> => {
      try {
        const task = await taskService.create(draft);
        dispatch({ type: 'CREATE', task });
        push('Task created', 'success');
        return task;
      } catch (err: unknown) {
        push(err instanceof Error ? err.message : 'Failed to create task', 'error');
        return null;
      }
    },
    [dispatch, push],
  );

  const update = useCallback(
    async (id: string, patch: Partial<Task>): Promise<Task | null> => {
      try {
        const task = await taskService.update(id, patch);
        dispatch({ type: 'UPDATE', task });
        return task;
      } catch (err: unknown) {
        push(err instanceof Error ? err.message : 'Failed to update task', 'error');
        return null;
      }
    },
    [dispatch, push],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await taskService.remove(id);
        dispatch({ type: 'DELETE', id });
        push('Task deleted', 'success');
        return true;
      } catch (err: unknown) {
        push(err instanceof Error ? err.message : 'Failed to delete task', 'error');
        return false;
      }
    },
    [dispatch, push],
  );

  const toggleComplete = useCallback(
    async (id: string): Promise<void> => {
      const current = state.items.find((t) => t.id === id);
      if (!current) return;
      const completed = !current.completed;
      try {
        await taskService.toggleCompleted(id, completed);
        dispatch({ type: 'TOGGLE_COMPLETED', id, completed });
      } catch (err: unknown) {
        push(err instanceof Error ? err.message : 'Failed to update task', 'error');
      }
    },
    [dispatch, push, state.items],
  );

  const setPage = useCallback(
    (page: number) => dispatch({ type: 'SET_PAGE', page }),
    [dispatch],
  );

  return useMemo(
    () => ({
      ...state,
      refresh,
      create,
      update,
      remove,
      toggleComplete,
      setPage,
    }),
    [state, refresh, create, update, remove, toggleComplete, setPage],
  );
}
