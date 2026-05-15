// Task 7 — taskService HTTP tests using axios-mock-adapter.
import MockAdapter from 'axios-mock-adapter';
import { httpClient } from '@shared/utils/httpClient';
import { taskService } from '@features/tasks/services/taskService';
import type { Task, TaskDraft } from '@features/tasks/types/task.types';

let mock: MockAdapter;

beforeEach(() => {
  mock = new MockAdapter(httpClient, { onNoMatch: 'throwException' });
});

afterEach(() => {
  mock.reset();
  mock.restore();
});

const taskFixture: Task = {
  id: '1',
  title: 'Test task',
  description: 'desc',
  dueDate: '2025-01-01',
  completed: false,
  stateHistory: [{ state: 'new', date: '2025-01-01' }],
  notes: ['note'],
};

describe('taskService.list', () => {
  it('returns items and total from X-Total-Count header', async () => {
    mock.onGet('/tasks').reply(200, [taskFixture], { 'x-total-count': '42' });
    const result = await taskService.list({ page: 1, perPage: 5 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(42);
  });

  it('falls back to array length when X-Total-Count is missing', async () => {
    mock.onGet('/tasks').reply(200, [taskFixture, taskFixture]);
    const result = await taskService.list();
    expect(result.total).toBe(2);
  });

  it('sends _page and _limit query params', async () => {
    mock.onGet('/tasks', { params: { _page: 2, _limit: 5 } }).reply(200, [], { 'x-total-count': '0' });
    const result = await taskService.list({ page: 2, perPage: 5 });
    expect(result.items).toHaveLength(0);
  });

  it('propagates HttpError on 500 (after retry exhausted)', async () => {
    // httpClient has axiosRetry with 1 retry; mock must handle multiple calls
    mock.onGet('/tasks').reply(500, { message: 'Server error' });
    await expect(taskService.list()).rejects.toMatchObject({ status: 500 });
  });

  it('rejects with a cancellation error when abort signal fires', async () => {
    const ac = new AbortController();
    mock.onGet('/tasks').reply(() => {
      ac.abort();
      return [200, []];
    });
    // Aborted requests propagate the cancellation — caller filters with axios.isCancel()
    await expect(taskService.list({}, ac.signal)).rejects.toMatchObject({
      message: expect.stringContaining('cancel'),
    });
  });
});

describe('taskService.getById', () => {
  it('returns the task for a valid id', async () => {
    mock.onGet('/tasks/1').reply(200, taskFixture);
    const task = await taskService.getById('1');
    expect(task.id).toBe('1');
    expect(task.title).toBe('Test task');
  });

  it('throws HttpError with status 404 when not found', async () => {
    mock.onGet('/tasks/999').reply(404);
    await expect(taskService.getById('999')).rejects.toMatchObject({ status: 404 });
  });
});

describe('taskService.create', () => {
  it('POSTs correct payload and returns created task', async () => {
    const draft: TaskDraft = {
      title: 'New task',
      description: 'desc',
      dueDate: '2025-06-01',
      completed: false,
      notes: ['note'],
      initialState: 'new',
    };
    const created: Task = {
      ...taskFixture,
      title: 'New task',
      stateHistory: [{ state: 'new', date: '2025-01-01' }],
    };
    mock.onPost('/tasks').reply(201, created);
    const result = await taskService.create(draft);
    expect(result.title).toBe('New task');
    // Verify stateHistory is built from initialState
    const body = JSON.parse(mock.history.post[0].data as string);
    expect(body.stateHistory[0].state).toBe('new');
    // The service spreads the draft (which includes initialState) plus adds stateHistory
    expect(body.stateHistory).toHaveLength(1);
  });
});

describe('taskService.update', () => {
  it('PATCHes the correct endpoint with patch data', async () => {
    const updated: Task = { ...taskFixture, title: 'Updated' };
    mock.onPatch('/tasks/1').reply(200, updated);
    const result = await taskService.update('1', { title: 'Updated' });
    expect(result.title).toBe('Updated');
  });

  it('throws HttpError on 404', async () => {
    mock.onPatch('/tasks/999').reply(404);
    await expect(taskService.update('999', { title: 'x' })).rejects.toMatchObject({ status: 404 });
  });
});

describe('taskService.remove', () => {
  it('sends DELETE and resolves to undefined', async () => {
    mock.onDelete('/tasks/1').reply(204);
    const result = await taskService.remove('1');
    expect(result).toBeUndefined();
  });

  it('throws HttpError on 500', async () => {
    mock.onDelete('/tasks/1').reply(500);
    await expect(taskService.remove('1')).rejects.toMatchObject({ status: 500 });
  });
});

describe('taskService.toggleCompleted', () => {
  it('PATCHes /tasks/:id with {completed} payload', async () => {
    const toggled: Task = { ...taskFixture, completed: true };
    mock.onPatch('/tasks/1').reply(200, toggled);
    const result = await taskService.toggleCompleted('1', true);
    expect(result.completed).toBe(true);
    const body = JSON.parse(mock.history.patch[0].data as string);
    expect(body).toEqual({ completed: true });
  });
});
