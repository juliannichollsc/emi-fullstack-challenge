// Task 7 — ToastContext tests: push, auto-dismiss, multiple toasts.
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '@shared/context/ToastContext';

jest.useFakeTimers();

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

function ToastTrigger({ message = 'Hello', variant }: { message?: string; variant?: 'info' | 'success' | 'error' }) {
  const { push } = useToast();
  return (
    <button onClick={() => push(message, variant)}>
      push toast
    </button>
  );
}

function ToastList() {
  const { toasts, dismiss } = useToast();
  return (
    <ul>
      {toasts.map((t) => (
        <li
          key={t.id}
          role={t.variant === 'error' ? 'alert' : 'status'}
          aria-label={t.message}
        >
          {t.message}
          <button onClick={() => dismiss(t.id)}>dismiss</button>
        </li>
      ))}
    </ul>
  );
}

function TestApp({ message = 'Hello', variant }: { message?: string; variant?: 'info' | 'success' | 'error' }) {
  return (
    <ToastProvider>
      <ToastTrigger message={message} variant={variant} />
      <ToastList />
    </ToastProvider>
  );
}

describe('ToastContext', () => {
  it('push shows an info toast with role="status"', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TestApp message="Info message" variant="info" />);

    await user.click(screen.getByRole('button', { name: 'push toast' }));

    expect(screen.getByRole('status', { name: 'Info message' })).toBeInTheDocument();
  });

  it('push shows an error toast with role="alert"', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TestApp message="Error message" variant="error" />);

    await user.click(screen.getByRole('button', { name: 'push toast' }));

    expect(screen.getByRole('alert', { name: 'Error message' })).toBeInTheDocument();
  });

  it('push shows a success toast with role="status"', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TestApp message="Success!" variant="success" />);

    await user.click(screen.getByRole('button', { name: 'push toast' }));

    expect(screen.getByRole('status', { name: 'Success!' })).toBeInTheDocument();
  });

  it('defaults to variant="info" when no variant is provided', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TestApp message="Default toast" />);

    await user.click(screen.getByRole('button', { name: 'push toast' }));

    expect(screen.getByRole('status', { name: 'Default toast' })).toBeInTheDocument();
  });

  it('auto-dismisses toast after 4000ms', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TestApp message="Temporary" variant="info" />);

    await user.click(screen.getByRole('button', { name: 'push toast' }));
    expect(screen.getByRole('status', { name: 'Temporary' })).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(4001);
    });

    await waitFor(() => {
      expect(screen.queryByRole('status', { name: 'Temporary' })).not.toBeInTheDocument();
    });
  });

  it('dismiss removes the toast immediately', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TestApp message="Dismiss me" variant="info" />);

    await user.click(screen.getByRole('button', { name: 'push toast' }));
    expect(screen.getByRole('status', { name: 'Dismiss me' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'dismiss' }));

    await waitFor(() => {
      expect(screen.queryByRole('status', { name: 'Dismiss me' })).not.toBeInTheDocument();
    });
  });

  it('stacks multiple toasts', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTrigger message="Toast A" variant="info" />
        <ToastTrigger message="Toast B" variant="error" />
        <ToastList />
      </ToastProvider>,
    );

    const buttons = screen.getAllByRole('button', { name: 'push toast' });
    await user.click(buttons[0]);
    await user.click(buttons[1]);

    expect(screen.getByRole('status', { name: 'Toast A' })).toBeInTheDocument();
    expect(screen.getByRole('alert', { name: 'Toast B' })).toBeInTheDocument();
  });
});
