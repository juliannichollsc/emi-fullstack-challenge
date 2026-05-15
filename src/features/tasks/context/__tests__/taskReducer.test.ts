// Task 7 — pure reducer unit tests (no Provider, no HTTP).
import { taskReducer, initialTaskState } from '@features/tasks/context/TaskContext';
import type { TaskState, TaskAction } from '@features/tasks/context/TaskContext';
import type { Task } from '@features/tasks/types/task.types';

const makeTask = (id: string, completed = false): Task => ({
  id,
  title: `Task ${id}`,
  description: 'desc',
  dueDate: '2025-01-01',
  completed,
  stateHistory: [{ state: 'new', date: '2025-01-01' }],
  notes: ['note'],
});

describe('taskReducer', () => {
  it('LOAD_START sets status to loading and clears error', () => {
    // Arrange
    const state: TaskState = { ...initialTaskState, status: 'error', error: 'boom' };
    // Act
    const next = taskReducer(state, { type: 'LOAD_START' });
    // Assert
    expect(next.status).toBe('loading');
    expect(next.error).toBeNull();
  });

  it('LOAD_SUCCESS updates items, total, page and sets status to success', () => {
    const items = [makeTask('1'), makeTask('2')];
    const next = taskReducer(initialTaskState, {
      type: 'LOAD_SUCCESS',
      payload: { items, total: 10, page: 2 },
    });
    expect(next.status).toBe('success');
    expect(next.items).toHaveLength(2);
    expect(next.total).toBe(10);
    expect(next.page).toBe(2);
    expect(next.error).toBeNull();
  });

  it('LOAD_ERROR sets status to error and stores message', () => {
    const next = taskReducer(initialTaskState, { type: 'LOAD_ERROR', error: 'Network failed' });
    expect(next.status).toBe('error');
    expect(next.error).toBe('Network failed');
  });

  it('CREATE appends task and increments total', () => {
    const task = makeTask('42');
    const next = taskReducer(
      { ...initialTaskState, items: [makeTask('1')], total: 1 },
      { type: 'CREATE', task },
    );
    expect(next.items).toHaveLength(2);
    expect(next.items[1].id).toBe('42');
    expect(next.total).toBe(2);
  });

  it('UPDATE replaces the matching task by id', () => {
    const original = makeTask('1');
    const updated: Task = { ...original, title: 'Updated title' };
    const next = taskReducer(
      { ...initialTaskState, items: [original, makeTask('2')] },
      { type: 'UPDATE', task: updated },
    );
    expect(next.items[0].title).toBe('Updated title');
    expect(next.items).toHaveLength(2);
  });

  it('UPDATE does not change state when id does not match', () => {
    const task = makeTask('1');
    const state: TaskState = { ...initialTaskState, items: [task] };
    const next = taskReducer(state, { type: 'UPDATE', task: { ...task, id: '999' } });
    expect(next.items[0].title).toBe('Task 1');
  });

  it('DELETE removes task by id and decrements total', () => {
    const state: TaskState = { ...initialTaskState, items: [makeTask('1'), makeTask('2')], total: 2 };
    const next = taskReducer(state, { type: 'DELETE', id: '1' });
    expect(next.items).toHaveLength(1);
    expect(next.items[0].id).toBe('2');
    expect(next.total).toBe(1);
  });

  it('DELETE does not go below 0 for total', () => {
    const state: TaskState = { ...initialTaskState, items: [], total: 0 };
    const next = taskReducer(state, { type: 'DELETE', id: '999' });
    expect(next.total).toBe(0);
  });

  it('TOGGLE_COMPLETED flips completed for matching task', () => {
    const state: TaskState = { ...initialTaskState, items: [makeTask('1', false)] };
    const next = taskReducer(state, { type: 'TOGGLE_COMPLETED', id: '1', completed: true });
    expect(next.items[0].completed).toBe(true);
  });

  it('TOGGLE_COMPLETED does not affect other tasks', () => {
    const state: TaskState = {
      ...initialTaskState,
      items: [makeTask('1', false), makeTask('2', false)],
    };
    const next = taskReducer(state, { type: 'TOGGLE_COMPLETED', id: '1', completed: true });
    expect(next.items[1].completed).toBe(false);
  });

  it('SET_PAGE updates page number', () => {
    const next = taskReducer(initialTaskState, { type: 'SET_PAGE', page: 3 });
    expect(next.page).toBe(3);
  });

  it('unknown action returns state unchanged', () => {
    const next = taskReducer(initialTaskState, { type: 'UNKNOWN' } as unknown as TaskAction);
    expect(next).toBe(initialTaskState);
  });

  it('initialTaskState has expected shape', () => {
    expect(initialTaskState).toMatchObject({
      items: [],
      total: 0,
      page: 1,
      perPage: 5,
      status: 'idle',
      error: null,
    });
  });
});
