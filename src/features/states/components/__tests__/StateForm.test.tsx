// Task 7 — StateForm tests: render list, add, remove, validation.
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MockAdapter from 'axios-mock-adapter';
import { httpClient } from '@shared/utils/httpClient';
import { StateForm } from '@features/states/components/StateForm';
import { StateProvider } from '@features/states/context/StateContext';
import { ToastProvider } from '@shared/context/ToastContext';

let mock: MockAdapter;

beforeEach(() => {
  mock = new MockAdapter(httpClient, { onNoMatch: 'throwException' });
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

function renderStateForm() {
  return render(<StateForm />, { wrapper: Wrapper });
}

describe('StateForm', () => {
  it('renders the existing states from the server', async () => {
    mock.onGet('/states').reply(200, [{ name: 'new' }, { name: 'active' }]);
    renderStateForm();

    await screen.findByText('new');
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('shows empty message when there are no states', async () => {
    mock.onGet('/states').reply(200, []);
    renderStateForm();

    await screen.findByText(/no hay estados/i);
  });

  it('shows validation error when name is empty on submit', async () => {
    const user = userEvent.setup();
    mock.onGet('/states').reply(200, []);
    renderStateForm();

    await screen.findByText(/no hay estados/i);

    await user.click(screen.getByRole('button', { name: /agregar/i }));

    await screen.findByText(/nombre es requerido/i);
  });

  it('shows validation error when state name already exists', async () => {
    const user = userEvent.setup();
    mock.onGet('/states').reply(200, [{ name: 'active' }]);
    renderStateForm();

    await screen.findByText('active');

    await user.type(screen.getByLabelText(/nombre del estado/i), 'active');
    await user.click(screen.getByRole('button', { name: /agregar/i }));

    await screen.findByText(/estado ya existe/i);
  });

  it('adds a new state after successful submit', async () => {
    const user = userEvent.setup();
    mock.onGet('/states').reply(200, [{ name: 'new' }]);
    mock.onPost('/states').reply(201, { name: 'blocked' });
    renderStateForm();

    await screen.findByText('new');

    await user.type(screen.getByLabelText(/nombre del estado/i), 'blocked');
    await user.click(screen.getByRole('button', { name: /agregar/i }));

    await screen.findByText('blocked');
    // Input should be cleared
    expect(screen.getByLabelText(/nombre del estado/i)).toHaveValue('');
  });

  it('removes a state when delete button is clicked', async () => {
    const user = userEvent.setup();
    mock.onGet('/states').reply(200, [{ name: 'new' }, { name: 'active' }]);
    mock.onDelete('/states/active').reply(204);
    renderStateForm();

    await screen.findByText('active');

    await user.click(screen.getByRole('button', { name: /eliminar estado active/i }));

    await waitFor(() => {
      expect(screen.queryByText('active')).not.toBeInTheDocument();
    });
  });

  it('shows the count of states in the badge', async () => {
    mock.onGet('/states').reply(200, [{ name: 'new' }, { name: 'active' }, { name: 'resolved' }]);
    renderStateForm();

    // The badge shows item count
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
