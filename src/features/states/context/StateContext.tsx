// Bonus + Task 8 — State catalog context (useReducer pattern, AbortController cleanup).
// Reducer exported for jest-tester.
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
import type { TaskState } from '../types/state.types';
import { stateService } from '../services/stateService';
import { useToast } from '@shared/context/ToastContext';

// ── State shape ────────────────────────────────────────────────────────────
interface StateCatalogState {
  items: TaskState[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}

// ── Discriminated action union ─────────────────────────────────────────────
type StateCatalogAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: TaskState[] }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'CREATE'; item: TaskState }
  | { type: 'DELETE'; name: string };

// ── Initial state ──────────────────────────────────────────────────────────
const initialState: StateCatalogState = {
  items: [],
  status: 'idle',
  error: null,
};

// ── Pure reducer — exported for jest-tester ────────────────────────────────
export function stateCatalogReducer(
  state: StateCatalogState,
  action: StateCatalogAction,
): StateCatalogState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, status: 'loading', error: null };
    case 'LOAD_SUCCESS':
      return { ...state, status: 'success', items: action.payload, error: null };
    case 'LOAD_ERROR':
      return { ...state, status: 'error', error: action.error };
    case 'CREATE':
      return { ...state, items: [...state.items, action.item] };
    case 'DELETE':
      return { ...state, items: state.items.filter((s) => s.name !== action.name) };
    default:
      return state;
  }
}

// ── Context value ─────────────────────────────────────────────────────────
interface StateContextValue {
  items: TaskState[];
  status: StateCatalogState['status'];
  error: string | null;
  refresh: () => void;
  create: (payload: { name: string }) => Promise<void>;
  remove: (name: string) => Promise<void>;
}

const StateContext = createContext<StateContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────
export function StateProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(stateCatalogReducer, initialState);
  const { push } = useToast();

  useEffect(() => {
    const ac = new AbortController();

    dispatch({ type: 'LOAD_START' });
    stateService
      .list(ac.signal)
      .then((items) => {
        dispatch({ type: 'LOAD_SUCCESS', payload: items });
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        const msg = err instanceof Error ? err.message : 'Failed to load states';
        dispatch({ type: 'LOAD_ERROR', error: msg });
        push(msg, 'error');
      });

    return () => ac.abort();
  }, [push]);

  const refresh = useCallback(() => {
    const ac = new AbortController();
    dispatch({ type: 'LOAD_START' });
    stateService
      .list(ac.signal)
      .then((items) => dispatch({ type: 'LOAD_SUCCESS', payload: items }))
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        const msg = err instanceof Error ? err.message : 'Failed to load states';
        dispatch({ type: 'LOAD_ERROR', error: msg });
        push(msg, 'error');
      });
  }, [push]);

  const create = useCallback(
    async (payload: { name: string }) => {
      try {
        const item = await stateService.create(payload);
        dispatch({ type: 'CREATE', item });
        push('State created', 'success');
      } catch (err: unknown) {
        push(err instanceof Error ? err.message : 'Failed to create state', 'error');
      }
    },
    [push],
  );

  const remove = useCallback(
    async (name: string) => {
      try {
        await stateService.remove(name);
        dispatch({ type: 'DELETE', name });
        push('State removed', 'success');
      } catch (err: unknown) {
        push(err instanceof Error ? err.message : 'Failed to delete state', 'error');
      }
    },
    [push],
  );

  const value = useMemo<StateContextValue>(
    () => ({ items: state.items, status: state.status, error: state.error, refresh, create, remove }),
    [state.items, state.status, state.error, refresh, create, remove],
  );

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useStateContext(): StateContextValue {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('useStateContext must be used within StateProvider');
  return ctx;
}
