// Task 7 — TaskList integration tests.
// Renders with real TaskProvider + MemoryRouter. HTTP mocked via axios-mock-adapter.
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import { httpClient } from '@shared/utils/httpClient';
import { TaskList } from '../TaskList';
import { TaskProvider } from '@features/tasks/context/TaskContext';
import { ToastProvider } from '@shared/context/ToastContext';
import type { Task } from '@features/tasks/types/task.types';

let mock: MockAdapter;

beforeEach(() => {
  mock = new MockAdapter(httpClient, { onNoMatch: 'throwException' });
});

afterEach(() => {
  mock.reset();
  mock.restore();
});

function makeTask(id: string): Task {
  return {
    id,
    title: `Task ${id}`,
    description: `Description ${id}`,
    dueDate: '2025-01-01',
    completed: false,
    stateHistory: [{ state: 'new', date: '2025-01-01' }],
    notes: [`Note for ${id}`],
  };
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <TaskProvider>{children}</TaskProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

function renderList() {
  return render(<TaskList />, { wrapper: Wrapper });
}

describe('TaskList', () => {
  it('renders a list of tasks from the server', async () => {
    const tasks = [makeTask('1'), makeTask('2'), makeTask('3')];
    mock.onGet('/tasks').reply(200, tasks, { 'x-total-count': '3' });

    renderList();

    await screen.findByText('Task 1');
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  it('renders at most 5 tasks per page (perPage = 5)', async () => {
    const tasks = Array.from({ length: 5 }, (_, i) => makeTask(String(i + 1)));
    mock.onGet('/tasks').reply(200, tasks, { 'x-total-count': '10' });

    renderList();

    // Wait for tasks to load
    await screen.findByText('Task 1');
    const listItems = screen.getByRole('list', { name: /lista de tareas/i });
    // Use :scope > li to count only direct children (not nested note lists)
    expect(listItems.querySelectorAll(':scope > li')).toHaveLength(5);
  });

  it('shows empty state when no tasks are returned', async () => {
    mock.onGet('/tasks').reply(200, [], { 'x-total-count': '0' });

    renderList();

    await screen.findByText(/sin tareas/i);
  });

  it('shows error state when the request fails', async () => {
    mock.onGet('/tasks').reply(500);

    renderList();

    await screen.findByRole('alert');
  });

  it('renders pagination when there are more than perPage tasks', async () => {
    const tasks = Array.from({ length: 5 }, (_, i) => makeTask(String(i + 1)));
    mock.onGet('/tasks').reply(200, tasks, { 'x-total-count': '10' });

    renderList();

    await screen.findByRole('navigation', { name: /paginación/i });
  });

  it('does not render pagination when total <= perPage', async () => {
    const tasks = [makeTask('1')];
    mock.onGet('/tasks').reply(200, tasks, { 'x-total-count': '1' });

    renderList();

    await screen.findByText('Task 1');
    expect(screen.queryByRole('navigation', { name: /paginación/i })).not.toBeInTheDocument();
  });

  it('advances to next page when next page button is clicked', async () => {
    const user = userEvent.setup();
    const page1 = Array.from({ length: 5 }, (_, i) => makeTask(String(i + 1)));
    const page2 = [makeTask('6')];

    // First call: page 1; second call: page 2
    mock.onGet('/tasks').replyOnce(200, page1, { 'x-total-count': '6' });
    mock.onGet('/tasks').replyOnce(200, page2, { 'x-total-count': '6' });

    renderList();

    await screen.findByText('Task 1');

    const nextBtn = screen.getByRole('button', { name: /página siguiente/i });
    await user.click(nextBtn);

    await screen.findByText('Task 6');
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
  });

  it('calls delete handler when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup();
    const task = makeTask('1');
    mock.onGet('/tasks').reply(200, [task], { 'x-total-count': '1' });
    mock.onDelete('/tasks/1').reply(204);

    // Mock window.confirm to return true
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    renderList();

    await screen.findByText('Task 1');
    await user.click(screen.getByRole('button', { name: /eliminar "Task 1"/i }));

    await waitFor(() => {
      expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
    });

    (window.confirm as jest.Mock).mockRestore();
  });

  it('does not delete when confirm is cancelled', async () => {
    const user = userEvent.setup();
    const task = makeTask('1');
    mock.onGet('/tasks').reply(200, [task], { 'x-total-count': '1' });

    jest.spyOn(window, 'confirm').mockReturnValue(false);

    renderList();

    await screen.findByText('Task 1');
    await user.click(screen.getByRole('button', { name: /eliminar "Task 1"/i }));

    expect(screen.getByText('Task 1')).toBeInTheDocument();

    (window.confirm as jest.Mock).mockRestore();
  });
});
