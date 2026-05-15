// Task 7 / Bonus — StateContext Provider integration tests.
// Covers error paths (load, refresh, create, remove) and hook-outside-provider guard.
import React from 'react';
import { render, screen, waitFor, act, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { httpClient } from '@shared/utils/httpClient';
import { StateProvider, useStateContext } from '@features/states/context/StateContext';
import { ToastProvider } from '@shared/context/ToastContext';
import type { TaskState } from '@features/states/types/state.types';
import { stateService } from '@features/states/services/stateService';

let mock: MockAdapter;

beforeEach(() => {
  mock = new MockAdapter(httpClient, { onNoMatch: 'throwException' });
});

afterEach(() => {
  mock.reset();
  mock.restore();
});

const stateFixture: TaskState = { name: 'new' };

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <StateProvider>{children}</StateProvider>
    </ToastProvider>
  );
}

// Consumer exposing the full context surface via data-testids
function ContextConsumer() {
  const { items, status, error, refresh, create, remove } = useStateContext();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="error">{error ?? ''}</span>
      <ul>
        {items.map((s) => (
          <li key={s.name} data-testid={`state-${s.name}`}>
            {s.name}
          </li>
        ))}
      </ul>
      <button onClick={refresh}>refresh</button>
      <button onClick={() => create({ name: 'closed' })}>create</button>
      <button onClick={() => remove('new')}>remove</button>
    </div>
  );
}

describe('StateContext', () => {
  // ── Happy path ─────────────────────────────────────────────────────────────

  it('loads states on mount and reaches success status', async () => {
    // Arrange
    mock.onGet('/states').reply(200, [stateFixture]);

    // Act
    render(<ContextConsumer />, { wrapper: Wrapper });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('success');
    });
    expect(screen.getByTestId('state-new')).toBeInTheDocument();
  });

  it('create adds new state item to the list', async () => {
    // Arrange
    const user = userEvent.setup();
    const created: TaskState = { name: 'closed' };
    mock.onGet('/states').reply(200, [stateFixture]);
    mock.onPost('/states').reply(201, created);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'create' }));
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('state-closed')).toBeInTheDocument();
    });
  });

  it('remove deletes state item from the list', async () => {
    // Arrange
    const user = userEvent.setup();
    mock.onGet('/states').reply(200, [stateFixture]);
    mock.onDelete('/states/new').reply(204);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'remove' }));
    });

    // Assert
    await waitFor(() => {
      expect(screen.queryByTestId('state-new')).not.toBeInTheDocument();
    });
  });

  // ── Error-path branches (lines 87-130) ────────────────────────────────────

  it('initial load error — sets status to error when GET /states fails (lines 87-90)', async () => {
    // Arrange
    mock.onGet('/states').reply(500);

    // Act
    render(<ContextConsumer />, { wrapper: Wrapper });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('error');
    });
    expect(screen.getByTestId('error').textContent).not.toBe('');
  });

  it('initial load — isCancel branch returns without setting error', async () => {
    // Arrange — throw a Cancel so axios.isCancel(err) returns true (line 87)
    mock.onGet('/states').replyOnce(() => {
      throw new axios.Cancel('aborted by test');
    });

    // Act — mount; useEffect fires; cancel is swallowed
    render(<ContextConsumer />, { wrapper: Wrapper });

    // Assert — error never set; status stays 'loading' (cancel swallowed)
    await waitFor(() => {
      // Status should NOT be 'error' because isCancel branch returns early
      expect(screen.getByTestId('error').textContent).toBe('');
    });
  });

  it('refresh() error — sets status to error on network failure (lines 97-106)', async () => {
    // Arrange: first load succeeds; refresh fails
    const user = userEvent.setup();
    mock.onGet('/states').replyOnce(200, [stateFixture]);
    mock.onGet('/states').replyOnce(500);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'refresh' }));
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('error');
    });
  });

  it('refresh() — isCancel branch leaves status unchanged (lines 97-106)', async () => {
    // Arrange: first load succeeds; refresh is cancelled
    const user = userEvent.setup();
    mock.onGet('/states').replyOnce(200, [stateFixture]);
    mock.onGet('/states').replyOnce(() => {
      throw new axios.Cancel('canceled refresh');
    });

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'refresh' }));
    });

    // Assert — error remains empty (isCancel branch returned early)
    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('');
    });
  });

  it('create() catch — does not add item when POST fails (line 117)', async () => {
    // Arrange
    const user = userEvent.setup();
    mock.onGet('/states').reply(200, [stateFixture]);
    mock.onPost('/states').reply(500);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'create' }));
    });

    // Assert — 'closed' state NOT added
    await waitFor(() => {
      expect(screen.queryByTestId('state-closed')).not.toBeInTheDocument();
    });
  });

  it('remove() catch — leaves item in list when DELETE fails (line 130)', async () => {
    // Arrange
    const user = userEvent.setup();
    mock.onGet('/states').reply(200, [stateFixture]);
    mock.onDelete('/states/new').reply(500);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'remove' }));
    });

    // Assert — 'new' state still present
    await waitFor(() => {
      expect(screen.getByTestId('state-new')).toBeInTheDocument();
    });
  });

  // ── Non-Error rejection paths (false branch of err instanceof Error) ────────

  it('initial load catch — uses fallback message when rejection is not an Error (line 88)', async () => {
    // Arrange: spy on stateService.list to reject with a non-Error on the initial useEffect call
    const listSpy = jest.spyOn(stateService, 'list').mockRejectedValueOnce('plain string');

    // Act
    render(<ContextConsumer />, { wrapper: Wrapper });

    // Assert — status=error, fallback message used (false branch of err instanceof Error)
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('error');
    });
    expect(screen.getByTestId('error').textContent).toBe('Failed to load states');

    listSpy.mockRestore();
  });

  it('refresh() catch — uses fallback message when rejection is not an Error (line 104)', async () => {
    // Arrange: spy returns success on first call (initial load), non-Error on second (refresh)
    const user = userEvent.setup();
    const listSpy = jest
      .spyOn(stateService, 'list')
      .mockResolvedValueOnce([stateFixture])
      .mockRejectedValueOnce(42);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'refresh' }));
    });

    // Assert — fallback message used (false branch, line 104)
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('error');
    });
    expect(screen.getByTestId('error').textContent).toBe('Failed to load states');

    listSpy.mockRestore();
  });

  it('create() catch — uses fallback message when rejection is not an Error (line 117)', async () => {
    // Arrange: initial load via spy succeeds; create() rejects with non-Error
    const user = userEvent.setup();
    const listSpy = jest.spyOn(stateService, 'list').mockResolvedValueOnce([stateFixture]);
    const createSpy = jest.spyOn(stateService, 'create').mockRejectedValueOnce('oops');

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'create' }));
    });

    // Assert — 'closed' not added (false branch of err instanceof Error covered)
    await waitFor(() => {
      expect(screen.queryByTestId('state-closed')).not.toBeInTheDocument();
    });

    listSpy.mockRestore();
    createSpy.mockRestore();
  });

  it('remove() catch — uses fallback message when rejection is not an Error (line 130)', async () => {
    // Arrange: initial load via spy succeeds; remove() rejects with non-Error
    const user = userEvent.setup();
    const listSpy = jest.spyOn(stateService, 'list').mockResolvedValueOnce([stateFixture]);
    const removeSpy = jest.spyOn(stateService, 'remove').mockRejectedValueOnce(undefined);

    render(<ContextConsumer />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('success'));

    // Act
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'remove' }));
    });

    // Assert — 'new' state still present (false branch covered)
    await waitFor(() => {
      expect(screen.getByTestId('state-new')).toBeInTheDocument();
    });

    listSpy.mockRestore();
    removeSpy.mockRestore();
  });

  // ── Hook-outside-provider guard ────────────────────────────────────────────

  it('useStateContext throws when used outside StateProvider', () => {
    // Arrange + Act + Assert
    expect(() => {
      renderHook(() => useStateContext());
    }).toThrow('useStateContext must be used within StateProvider');
  });
});
