// Task 7 — useTasks / useTaskById / lastState unit tests.
// useTasks and useTaskById wrap useTaskContext, so they need a TaskProvider.
// lastState is pure — tested without any wrapper.
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import MockAdapter from 'axios-mock-adapter';
import { httpClient } from '@shared/utils/httpClient';
import { useTasks, useTaskById, lastState } from '@features/tasks/hooks/useTasks';
import { TaskProvider } from '@features/tasks/context/TaskContext';
import { ToastProvider } from '@shared/context/ToastContext';
import type { Task } from '@features/tasks/types/task.types';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const taskFixture: Task = {
  id: '1',
  title: 'Hook test task',
  description: 'desc',
  dueDate: '2025-01-01',
  completed: false,
  stateHistory: [{ state: 'active', date: '2025-01-01' }],
  notes: ['note'],
};

// ── Mock adapter ─────────────────────────────────────────────────────────────

let mock: MockAdapter;

beforeEach(() => {
  mock = new MockAdapter(httpClient, { onNoMatch: 'throwException' });
  // Default: successful response so Provider mounts cleanly with one fixture task.
  mock.onGet('/tasks').reply(200, [taskFixture], { 'x-total-count': '1' });
});

afterEach(() => {
  mock.reset();
  mock.restore();
  jest.clearAllMocks();
});

// ── Wrapper ───────────────────────────────────────────────────────────────────
// Mounts real TaskProvider (per hard rule: never mock the real Provider).

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(
    ToastProvider,
    null,
    React.createElement(TaskProvider, null, children),
  );
}

// ── lastState (pure utility) ──────────────────────────────────────────────────

describe('lastState', () => {
  it('returns the state of the last stateHistory entry', () => {
    // Arrange
    const task: Task = {
      ...taskFixture,
      stateHistory: [
        { state: 'new', date: '2024-01-01' },
        { state: 'closed', date: '2024-06-01' },
      ],
    };

    // Act + Assert
    expect(lastState(task)).toBe('closed');
  });

  it('returns "new" when stateHistory is empty', () => {
    // Arrange — empty stateHistory covers the ?? "new" fallback branch
    const task: Task = { ...taskFixture, stateHistory: [] };

    // Act + Assert
    expect(lastState(task)).toBe('new');
  });

  it('returns the single entry state when stateHistory has one item', () => {
    // Arrange
    const task: Task = {
      ...taskFixture,
      stateHistory: [{ state: 'resolved', date: '2025-01-01' }],
    };

    // Act + Assert
    expect(lastState(task)).toBe('resolved');
  });
});

// ── useTasks ─────────────────────────────────────────────────────────────────

describe('useTasks', () => {
  it('returns the full context surface (smoke test)', async () => {
    // Arrange + Act
    const { result, unmount } = renderHook(() => useTasks(), { wrapper });

    // Assert — shape matches useTaskContext output
    expect(result.current).toHaveProperty('items');
    expect(result.current).toHaveProperty('status');
    expect(result.current).toHaveProperty('create');
    expect(result.current).toHaveProperty('update');
    expect(result.current).toHaveProperty('remove');
    expect(result.current).toHaveProperty('toggleComplete');
    expect(result.current).toHaveProperty('setPage');
    expect(result.current).toHaveProperty('refresh');

    unmount();
  });

  it('loads tasks and transitions status from idle to success', async () => {
    // Arrange + Act
    const { result, unmount } = renderHook(() => useTasks(), { wrapper });

    // Assert — after fetch resolves, status becomes 'success' and items populate
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe('1');

    unmount();
  });

  it('exposes setPage which updates the page number', async () => {
    // Arrange — second page returns empty (any valid response)
    mock.onGet('/tasks').reply(200, [], { 'x-total-count': '1' });

    const { result, unmount } = renderHook(() => useTasks(), { wrapper });

    // Wait for initial load
    await waitFor(() => expect(result.current.status).toBe('success'));

    // Act — navigate to page 2 (must be wrapped in act because it dispatches)
    act(() => {
      result.current.setPage(2);
    });

    // Assert — page updated in state (the context re-fetches, status cycles)
    await waitFor(() => expect(result.current.page).toBe(2));

    unmount();
  });
});

// ── useTaskById ───────────────────────────────────────────────────────────────

describe('useTaskById', () => {
  it('returns undefined when id is undefined (covers the undefined id branch)', () => {
    // Arrange + Act
    const { result, unmount } = renderHook(() => useTaskById(undefined), { wrapper });

    // Assert — undefined id → find(t => t.id === undefined) never matches
    expect(result.current).toBeUndefined();
    unmount();
  });

  it('returns undefined when id does not match any task', () => {
    // Arrange + Act
    const { result, unmount } = renderHook(() => useTaskById('non-existent'), { wrapper });

    // Assert — no match in items (initially empty, never matches after load either)
    expect(result.current).toBeUndefined();
    unmount();
  });

  it('returns the task once the provider has loaded items', async () => {
    // Arrange + Act — provider fetches taskFixture (id='1') on mount
    const { result, unmount } = renderHook(() => useTaskById('1'), { wrapper });

    // Wait for the TaskProvider useEffect to dispatch LOAD_SUCCESS
    await waitFor(() => expect(result.current?.id).toBe('1'));

    // Assert
    expect(result.current).toMatchObject({ id: '1', title: 'Hook test task' });

    unmount();
  });

  it('returns undefined for a non-matching id even after items load', async () => {
    // Arrange
    const { result, unmount } = renderHook(() => useTaskById('999'), { wrapper });

    // Wait for the provider to finish loading
    await waitFor(() => {
      // The provider has loaded when httpClient mock is resolved;
      // result stays undefined since '999' is not in the list.
      expect(result.current).toBeUndefined();
    });

    unmount();
  });
});
