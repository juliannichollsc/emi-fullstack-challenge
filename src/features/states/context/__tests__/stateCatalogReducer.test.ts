// Task 7 — pure stateCatalogReducer unit tests.
import { stateCatalogReducer } from '@features/states/context/StateContext';
import type { TaskState } from '@features/states/types/state.types';

type ReducerState = Parameters<typeof stateCatalogReducer>[0];
type ReducerAction = Parameters<typeof stateCatalogReducer>[1];

const initialState: ReducerState = { items: [], status: 'idle', error: null };

const makeState = (name: string): TaskState => ({ name });

describe('stateCatalogReducer', () => {
  it('LOAD_START sets status to loading and clears error', () => {
    const state: ReducerState = { ...initialState, status: 'error', error: 'old error' };
    const next = stateCatalogReducer(state, { type: 'LOAD_START' });
    expect(next.status).toBe('loading');
    expect(next.error).toBeNull();
  });

  it('LOAD_SUCCESS updates items and sets status to success', () => {
    const items = [makeState('new'), makeState('active')];
    const next = stateCatalogReducer(initialState, { type: 'LOAD_SUCCESS', payload: items });
    expect(next.status).toBe('success');
    expect(next.items).toHaveLength(2);
    expect(next.error).toBeNull();
  });

  it('LOAD_ERROR sets status to error and stores message', () => {
    const next = stateCatalogReducer(initialState, { type: 'LOAD_ERROR', error: 'Network fail' });
    expect(next.status).toBe('error');
    expect(next.error).toBe('Network fail');
  });

  it('CREATE appends the new state item', () => {
    const state: ReducerState = { ...initialState, items: [makeState('new')] };
    const next = stateCatalogReducer(state, { type: 'CREATE', item: makeState('active') });
    expect(next.items).toHaveLength(2);
    expect(next.items[1].name).toBe('active');
  });

  it('DELETE removes state item by name', () => {
    const state: ReducerState = {
      ...initialState,
      items: [makeState('new'), makeState('active'), makeState('resolved')],
    };
    const next = stateCatalogReducer(state, { type: 'DELETE', name: 'active' });
    expect(next.items).toHaveLength(2);
    expect(next.items.find((s) => s.name === 'active')).toBeUndefined();
  });

  it('DELETE with unknown name leaves items unchanged', () => {
    const state: ReducerState = { ...initialState, items: [makeState('new')] };
    const next = stateCatalogReducer(state, { type: 'DELETE', name: 'unknown' });
    expect(next.items).toHaveLength(1);
  });

  it('unknown action returns state unchanged', () => {
    const next = stateCatalogReducer(initialState, { type: 'UNKNOWN' } as unknown as ReducerAction);
    expect(next).toBe(initialState);
  });
});
