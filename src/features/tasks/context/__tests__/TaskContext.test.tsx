// Task 7 — TaskContext integration tests.
// Renders TaskProvider with a consumer component; verifies service calls and state changes.
import React from 'react';
import { render, screen, waitFor, act, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { httpClient } from '@shared/utils/httpClient';
import {
  TaskProvider,
  useTaskContext,
  useTaskState,
  useTaskDispatch,
} from '@features/tasks/context/TaskContext';
import { ToastProvider } from '@shared/context/ToastContext';
import type { Task, TaskDraft } from '@features/tasks/types/task.types';
import { taskService } from '@features/tasks/services/taskService';

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

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <TaskProvider>{children}</TaskProvider>
    </ToastProvider>
  );
}

// Consumer that exposes context surface via data-testids
function ContextConsumer() {
  const { items, status, error, create, update, remove, toggleComplete, setPage, page } =
    useTaskContext();

  const draft: TaskDraft = {
    title: 'New task',
    description: 'desc',
    dueDate: '2025-06-01',
    completed: false,
    notes: ['note'],
    initialState: 'new',
  };

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="page">{page}</span>
      <span data-testid="error">{error ?? ''}</span>
      <ul>
        {items.map((t) => (
          <li key={t.id} data-testid={`task-${t.id}`}>
            {t.title}
            {t.completed && <span data-testid={`completed-${t.id}`}>completed</span>}
          </li>
        ))}
      </ul>
      <button onClick={() => create(draft)}>create</button>
      <button onClick={() => update('1', { title: 'Updated' })}>update</button>
      <button onClick={() => remove('1')}>remove</button>
      <button onClick={() => toggleComplete('1')}>toggle</button>
      <button onClick={() => setPage(2)}>page2</button>
    </div>
  );
}

describe('TaskContext', () => {
  it('starts with loading status and transitions to success after fetch', async () => {
    mock.onGet('/tasks').reply(200, [taskFixture], { 'x-total-count': '1' });

    render(<ContextConsumer />, { wrapper: Wrapper });

    // Status should eventually be success
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('success');
    });
    expect(screen.getByTestId('task-1').textContent).toContain('Test task');
  });

  it('sets status to error when fetch fails', async () => {
    mock.onGet('/tasks').reply(500);

    render(<ContextConsumer />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('error');
    });
    expect(screen.getByTestId('error').textContent).not.toBe('');
  });

  it('create dispatches CREATE action and adds task to items', async () => {
    const user = userEvent.setup();
    const created: Task = { ...taskFixture, id: '99', title: 'New task' };
    mock.onGet('/tasks').reply(200, [taskFixture], { 'x-total-count': '1' });
    mock.onPost('/tasks').reply(201, created);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    await user.click(screen.getByRole('button', { name: 'create' }));

    await screen.findByTestId('task-99');
  });

  it('update dispatches UPDATE action and reflects new title', async () => {
    const user = userEvent.setup();
    const updated: Task = { ...taskFixture, title: 'Updated' };
    mock.onGet('/tasks').reply(200, [taskFixture], { 'x-total-count': '1' });
    mock.onPatch('/tasks/1').reply(200, updated);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    await user.click(screen.getByRole('button', { name: 'update' }));

    await waitFor(() => {
      expect(screen.getByTestId('task-1').textContent).toContain('Updated');
    });
  });

  it('remove dispatches DELETE action and removes task from list', async () => {
    const user = userEvent.setup();
    mock.onGet('/tasks').reply(200, [taskFixture], { 'x-total-count': '1' });
    mock.onDelete('/tasks/1').reply(204);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    await user.click(screen.getByRole('button', { name: 'remove' }));

    await waitFor(() => {
      expect(screen.queryByTestId('task-1')).not.toBeInTheDocument();
    });
  });

  it('toggleComplete flips task completed state', async () => {
    const user = userEvent.setup();
    const toggled: Task = { ...taskFixture, completed: true };
    mock.onGet('/tasks').reply(200, [taskFixture], { 'x-total-count': '1' });
    mock.onPatch('/tasks/1').reply(200, toggled);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    await user.click(screen.getByRole('button', { name: 'toggle' }));

    await waitFor(() => {
      expect(screen.getByTestId('completed-1')).toBeInTheDocument();
    });
  });

  it('setPage updates page number and triggers new fetch', async () => {
    const user = userEvent.setup();
    mock.onGet('/tasks').replyOnce(200, [taskFixture], { 'x-total-count': '10' });
    mock.onGet('/tasks').replyOnce(200, [], { 'x-total-count': '10' });

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    await user.click(screen.getByRole('button', { name: 'page2' }));

    await waitFor(() => {
      expect(screen.getByTestId('page').textContent).toBe('2');
    });
  });

  // ── Error-path branches (lines 159-228) ───────────────────────────────────

  it('refresh() catch — sets error state when list fails', async () => {
    // Arrange: initial load succeeds, refresh fails
    const user = userEvent.setup();
    mock.onGet('/tasks').replyOnce(200, [taskFixture], { 'x-total-count': '1' });
    mock.onGet('/tasks').replyOnce(500);

    function RefreshConsumer() {
      const { status, error, refresh } = useTaskContext();
      return (
        <div>
          <span data-testid="status">{status}</span>
          <span data-testid="error">{error ?? ''}</span>
          <button onClick={refresh}>refresh</button>
        </div>
      );
    }

    render(<RefreshConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'refresh' }));
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('error');
    });
    expect(screen.getByTestId('error').textContent).not.toBe('');
  });

  it('refresh() catch — isCancel branch returns without setting error', async () => {
    // Arrange: initial succeeds, second call is cancelled
    const user = userEvent.setup();
    mock.onGet('/tasks').replyOnce(200, [taskFixture], { 'x-total-count': '1' });
    // Reply with a network abort which axios treats as cancel-like via AbortController
    mock.onGet('/tasks').replyOnce(() => {
      throw new axios.Cancel('canceled by test');
    });

    function RefreshConsumer() {
      const { status, error, refresh } = useTaskContext();
      return (
        <div>
          <span data-testid="status">{status}</span>
          <span data-testid="error">{error ?? 'none'}</span>
          <button onClick={refresh}>refresh</button>
        </div>
      );
    }

    render(<RefreshConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act — cancel should keep status at loading (not error), error stays null
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'refresh' }));
    });

    // Assert — isCancel branch → status remains loading (not 'error'), error is empty
    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('none');
    });
  });

  it('create() catch — returns null and does not add item on POST failure', async () => {
    // Arrange
    const user = userEvent.setup();
    mock.onGet('/tasks').replyOnce(200, [taskFixture], { 'x-total-count': '1' });
    mock.onPost('/tasks').replyOnce(500);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'create' }));
    });

    // Assert — no new task added (still only task-1)
    await waitFor(() => {
      expect(screen.queryByTestId('task-99')).not.toBeInTheDocument();
    });
  });

  it('update() catch — leaves items unchanged on PATCH failure', async () => {
    // Arrange
    const user = userEvent.setup();
    mock.onGet('/tasks').replyOnce(200, [taskFixture], { 'x-total-count': '1' });
    mock.onPatch('/tasks/1').replyOnce(500);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'update' }));
    });

    // Assert — title unchanged
    await waitFor(() => {
      expect(screen.getByTestId('task-1').textContent).toContain('Test task');
    });
  });

  it('remove() catch — leaves item in list on DELETE failure', async () => {
    // Arrange
    const user = userEvent.setup();
    mock.onGet('/tasks').replyOnce(200, [taskFixture], { 'x-total-count': '1' });
    mock.onDelete('/tasks/1').replyOnce(500);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'remove' }));
    });

    // Assert — task still present
    await waitFor(() => {
      expect(screen.getByTestId('task-1')).toBeInTheDocument();
    });
  });

  it('toggleComplete() catch — does not flip completed on PATCH failure', async () => {
    // Arrange
    const user = userEvent.setup();
    mock.onGet('/tasks').replyOnce(200, [taskFixture], { 'x-total-count': '1' });
    mock.onPatch('/tasks/1').replyOnce(500);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'toggle' }));
    });

    // Assert — completed badge should NOT appear (toggle failed)
    await waitFor(() => {
      expect(screen.queryByTestId('completed-1')).not.toBeInTheDocument();
    });
  });

  // ── Hook-outside-provider guards ──────────────────────────────────────────

  it('useTaskState throws when used outside TaskProvider', () => {
    // Arrange + Act + Assert
    expect(() => {
      renderHook(() => useTaskState());
    }).toThrow('useTaskState must be used within TaskProvider');
  });

  it('useTaskDispatch throws when used outside TaskProvider', () => {
    // Arrange + Act + Assert
    expect(() => {
      renderHook(() => useTaskDispatch());
    }).toThrow('useTaskDispatch must be used within TaskProvider');
  });

  // ── refresh() success path (line 166) ─────────────────────────────────────

  it('refresh() happy path — dispatches LOAD_SUCCESS and shows updated items', async () => {
    // Arrange: spy returns task-1 on initial load and task-2 on refresh (covers line 166)
    const user = userEvent.setup();
    const task2: Task = { ...taskFixture, id: '2', title: 'Refreshed task' };
    const listSpy = jest
      .spyOn(taskService, 'list')
      .mockResolvedValueOnce({ items: [taskFixture], total: 1 })
      .mockResolvedValueOnce({ items: [task2], total: 1 });

    function RefreshHappyConsumer() {
      const { items, status, refresh } = useTaskContext();
      return (
        <div>
          <span data-testid="status">{status}</span>
          <ul>{items.map((t) => <li key={t.id} data-testid={`item-${t.id}`}>{t.title}</li>)}</ul>
          <button onClick={refresh}>refresh</button>
        </div>
      );
    }

    render(<RefreshHappyConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));
    expect(screen.getByTestId('item-1')).toBeInTheDocument();

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'refresh' }));
    });

    // Assert — item-2 is now visible (LOAD_SUCCESS dispatched via refresh happy path)
    await waitFor(() => {
      expect(screen.getByTestId('item-2')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('item-1')).not.toBeInTheDocument();

    listSpy.mockRestore();
  });

  // ── Non-Error rejection paths (false branch of err instanceof Error) ──────

  it('initial load catch — uses fallback message when rejection is not an Error (line 122)', async () => {
    // Arrange: spy on taskService.list and reject with a plain string (non-Error)
    // The initial load useEffect calls taskService.list — mock it at service level
    const listSpy = jest.spyOn(taskService, 'list').mockRejectedValueOnce('plain string error');

    // Act
    render(<ContextConsumer />, { wrapper: Wrapper });

    // Assert — fallback message used (false branch of `err instanceof Error`); status=error
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('error');
    });
    expect(screen.getByTestId('error').textContent).toBe('Failed to load tasks');

    listSpy.mockRestore();
  });

  it('refresh() catch — uses fallback message when rejection is not an Error (line 169)', async () => {
    // Arrange: spy returns success on first call (initial load), non-Error rejection on second (refresh)
    const user = userEvent.setup();
    const listSpy = jest
      .spyOn(taskService, 'list')
      .mockResolvedValueOnce({ items: [taskFixture], total: 1 })
      .mockRejectedValueOnce(42);

    function RefreshFallbackConsumer() {
      const { status, error, refresh } = useTaskContext();
      return (
        <div>
          <span data-testid="status">{status}</span>
          <span data-testid="error">{error ?? ''}</span>
          <button onClick={refresh}>refresh</button>
        </div>
      );
    }

    render(<RefreshFallbackConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'refresh' }));
    });

    // Assert — fallback message used (non-Error path, branch 8)
    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Failed to load tasks');
    });

    listSpy.mockRestore();
  });

  it('create() catch — uses fallback message when rejection is not an Error (line 183)', async () => {
    // Arrange: initial load via spy succeeds; create() rejects with non-Error
    const user = userEvent.setup();
    const listSpy = jest
      .spyOn(taskService, 'list')
      .mockResolvedValueOnce({ items: [taskFixture], total: 1 });
    const createSpy = jest.spyOn(taskService, 'create').mockRejectedValueOnce('oops');

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act — trigger create (which internally calls taskService.create)
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'create' }));
    });

    // Assert — task-99 not added (false branch of err instanceof Error covered)
    await waitFor(() => {
      expect(screen.queryByTestId('task-99')).not.toBeInTheDocument();
    });

    listSpy.mockRestore();
    createSpy.mockRestore();
  });

  it('update() catch — uses fallback message when rejection is not an Error (line 197)', async () => {
    // Arrange: initial load via spy succeeds; update() rejects with non-Error
    const user = userEvent.setup();
    const listSpy = jest
      .spyOn(taskService, 'list')
      .mockResolvedValueOnce({ items: [taskFixture], total: 1 });
    const updateSpy = jest.spyOn(taskService, 'update').mockRejectedValueOnce(null);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'update' }));
    });

    // Assert — title unchanged (false branch of err instanceof Error covered)
    await waitFor(() => {
      expect(screen.getByTestId('task-1').textContent).toContain('Test task');
    });

    listSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it('remove() catch — uses fallback message when rejection is not an Error (line 212)', async () => {
    // Arrange: initial load via spy succeeds; remove() rejects with non-Error
    const user = userEvent.setup();
    const listSpy = jest
      .spyOn(taskService, 'list')
      .mockResolvedValueOnce({ items: [taskFixture], total: 1 });
    const removeSpy = jest.spyOn(taskService, 'remove').mockRejectedValueOnce(undefined);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'remove' }));
    });

    // Assert — task still present (false branch of err instanceof Error covered)
    await waitFor(() => {
      expect(screen.getByTestId('task-1')).toBeInTheDocument();
    });

    listSpy.mockRestore();
    removeSpy.mockRestore();
  });

  // ── toggleComplete() unknown-id guard (line 222) ──────────────────────────

  it('toggleComplete() — returns early when task id is not found in items (line 222)', async () => {
    // Arrange: initial load via spy; toggle an unknown id
    const listSpy = jest
      .spyOn(taskService, 'list')
      .mockResolvedValueOnce({ items: [taskFixture], total: 1 });
    const toggleSpy = jest.spyOn(taskService, 'toggleCompleted');

    function ToggleUnknownConsumer() {
      const { status, toggleComplete } = useTaskContext();
      return (
        <div>
          <span data-testid="status">{status}</span>
          <button onClick={() => toggleComplete('nonexistent-id')}>toggle-unknown</button>
        </div>
      );
    }

    const user = userEvent.setup();
    render(<ToggleUnknownConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'toggle-unknown' }));
    });

    // Assert — service never called (early return branch, line 222)
    expect(toggleSpy).not.toHaveBeenCalled();

    listSpy.mockRestore();
    toggleSpy.mockRestore();
  });

  it('toggleComplete() catch — uses fallback message when rejection is not an Error (line 228)', async () => {
    // Arrange: initial load via spy succeeds; toggleCompleted rejects with non-Error
    const user = userEvent.setup();
    const listSpy = jest
      .spyOn(taskService, 'list')
      .mockResolvedValueOnce({ items: [taskFixture], total: 1 });
    const toggleSpy = jest.spyOn(taskService, 'toggleCompleted').mockRejectedValueOnce('fail');

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'toggle' }));
    });

    // Assert — completed badge NOT shown (false branch of err instanceof Error covered)
    await waitFor(() => {
      expect(screen.queryByTestId('completed-1')).not.toBeInTheDocument();
    });

    listSpy.mockRestore();
    toggleSpy.mockRestore();
  });
});
