// Task 7 — TaskForm unit tests. Tests validation, note management, and submit.
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import { httpClient } from '@shared/utils/httpClient';
import { TaskForm } from '../TaskForm';
import { StateProvider } from '@features/states/context/StateContext';
import { ToastProvider } from '@shared/context/ToastContext';
import type { TaskDraft } from '@features/tasks/types/task.types';

let mock: MockAdapter;

beforeEach(() => {
  mock = new MockAdapter(httpClient, { onNoMatch: 'throwException' });
  // Provide states for the initialState dropdown
  mock.onGet('/states').reply(200, [{ name: 'new' }, { name: 'active' }, { name: 'resolved' }]);
});

afterEach(() => {
  mock.reset();
  mock.restore();
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <StateProvider>{children}</StateProvider>
    </ToastProvider>
  );
}

async function renderForm(props: Partial<React.ComponentProps<typeof TaskForm>> = {}) {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  render(<TaskForm onSubmit={onSubmit} {...props} />, { wrapper: Wrapper });
  // Wait for state catalog to load (dropdown to be populated)
  await screen.findByRole('combobox', { name: /estado/i });
  return { onSubmit };
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/título/i), 'My Task');
  await user.type(screen.getByLabelText(/descripción/i), 'My Description');
  // Set date
  await user.type(screen.getByLabelText(/fecha límite/i), '2025-06-01');
  // Fill the first note via placeholder (note labels are sr-only and placeholder matches the same text)
  const noteInputs = screen.getAllByPlaceholderText(/nota \d+/i);
  await user.type(noteInputs[0], 'My note');
}

describe('TaskForm — validation', () => {
  it('shows error when title is missing', async () => {
    const user = userEvent.setup();
    await renderForm();

    // Fill everything except title
    await user.type(screen.getByLabelText(/descripción/i), 'desc');
    await user.type(screen.getByLabelText(/fecha límite/i), '2025-06-01');
    const noteInput = screen.getAllByPlaceholderText(/nota \d+/i)[0];
    await user.type(noteInput, 'note');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await screen.findByText(/título es requerido/i);
  });

  it('shows error when description is missing', async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.type(screen.getByLabelText(/título/i), 'Title');
    await user.type(screen.getByLabelText(/fecha límite/i), '2025-06-01');
    const noteInput = screen.getAllByPlaceholderText(/nota \d+/i)[0];
    await user.type(noteInput, 'note');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await screen.findByText(/descripción es requerida/i);
  });

  it('shows error when dueDate is missing', async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.type(screen.getByLabelText(/título/i), 'Title');
    await user.type(screen.getByLabelText(/descripción/i), 'desc');
    const noteInput = screen.getAllByPlaceholderText(/nota \d+/i)[0];
    await user.type(noteInput, 'note');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await screen.findByText(/fecha límite es requerida/i);
  });

  it('shows error when all notes are empty', async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.type(screen.getByLabelText(/título/i), 'Title');
    await user.type(screen.getByLabelText(/descripción/i), 'desc');
    await user.type(screen.getByLabelText(/fecha límite/i), '2025-06-01');
    // Leave note 1 empty
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await screen.findByText(/se requiere al menos una nota/i);
  });

  it('does not submit when validation fails', async () => {
    const user = userEvent.setup();
    const { onSubmit } = await renderForm();

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('TaskForm — note management', () => {
  it('starts with one empty note input', async () => {
    await renderForm();
    expect(screen.getAllByPlaceholderText(/nota \d+/i)).toHaveLength(1);
  });

  it('adds a note when "Agregar nota" is clicked', async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.click(screen.getByRole('button', { name: /agregar nota/i }));

    expect(screen.getAllByPlaceholderText(/nota \d+/i)).toHaveLength(2);
  });

  it('removes a note when its remove button is clicked (with 2+ notes)', async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.click(screen.getByRole('button', { name: /agregar nota/i }));
    expect(screen.getAllByPlaceholderText(/nota \d+/i)).toHaveLength(2);

    const removeButtons = screen.getAllByRole('button', { name: /eliminar nota/i });
    await user.click(removeButtons[1]);

    // May be async due to GSAP animation (mocked — immediate)
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText(/nota \d+/i)).toHaveLength(1);
    });
  });

  it('disables the remove button when only one note remains', async () => {
    await renderForm();
    const removeBtn = screen.getByRole('button', { name: /eliminar nota 1/i });
    expect(removeBtn).toBeDisabled();
  });
});

describe('TaskForm — submit', () => {
  it('calls onSubmit with correct TaskDraft payload on valid submit', async () => {
    const user = userEvent.setup();
    const { onSubmit } = await renderForm();

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const draft: TaskDraft = onSubmit.mock.calls[0][0];
    expect(draft.title).toBe('My Task');
    expect(draft.description).toBe('My Description');
    expect(draft.notes).toContain('My note');
    expect(draft.initialState).toBeTruthy();
    expect(typeof draft.dueDate).toBe('string');
  });

  it('filters out empty notes before submitting', async () => {
    const user = userEvent.setup();
    const { onSubmit } = await renderForm();

    await user.type(screen.getByLabelText(/título/i), 'Title');
    await user.type(screen.getByLabelText(/descripción/i), 'desc');
    await user.type(screen.getByLabelText(/fecha límite/i), '2025-06-01');
    // Add a second note but leave it empty
    await user.click(screen.getByRole('button', { name: /agregar nota/i }));
    const noteInputs = screen.getAllByPlaceholderText(/nota \d+/i);
    await user.type(noteInputs[0], 'filled note');
    // Note 2 stays empty

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const draft: TaskDraft = onSubmit.mock.calls[0][0];
    expect(draft.notes).toHaveLength(1);
    expect(draft.notes[0]).toBe('filled note');
  });

  it('shows submit button label from submitLabel prop', async () => {
    await renderForm({ submitLabel: 'Crear tarea' });
    expect(screen.getByRole('button', { name: /crear tarea/i })).toBeInTheDocument();
  });

  it('pre-fills fields when initial task is provided', async () => {
    const user = userEvent.setup();
    const initial = {
      id: '1',
      title: 'Existing task',
      description: 'Existing desc',
      dueDate: '2025-03-15',
      completed: false,
      stateHistory: [{ state: 'active', date: '2025-01-01' }],
      notes: ['existing note'],
    };

    await renderForm({ initial });

    expect(screen.getByLabelText(/título/i)).toHaveValue('Existing task');
    expect(screen.getByLabelText(/descripción/i)).toHaveValue('Existing desc');
    expect(screen.getAllByPlaceholderText(/nota \d+/i)[0]).toHaveValue('existing note');
  });
});
