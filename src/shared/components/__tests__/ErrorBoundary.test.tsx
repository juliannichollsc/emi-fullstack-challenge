// Task 7 — ErrorBoundaryClass tests.
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundaryClass } from '@shared/components/ErrorBoundary';

// Suppress console.error noise from intentional error throws
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

function BrokenChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test component error');
  return <div>Normal content</div>;
}

describe('ErrorBoundaryClass', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundaryClass>
        <BrokenChild shouldThrow={false} />
      </ErrorBoundaryClass>,
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders fallback with data-testid when child throws', () => {
    render(
      <ErrorBoundaryClass>
        <BrokenChild shouldThrow />
      </ErrorBoundaryClass>,
    );
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
  });

  it('shows the error message in the fallback', () => {
    render(
      <ErrorBoundaryClass>
        <BrokenChild shouldThrow />
      </ErrorBoundaryClass>,
    );
    expect(screen.getByText('Test component error')).toBeInTheDocument();
  });

  it('renders custom fallback prop instead of default when provided', () => {
    render(
      <ErrorBoundaryClass fallback={<div>Custom fallback</div>}>
        <BrokenChild shouldThrow />
      </ErrorBoundaryClass>,
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
  });

  it('renders a Retry button in the default fallback', () => {
    render(
      <ErrorBoundaryClass>
        <BrokenChild shouldThrow />
      </ErrorBoundaryClass>,
    );
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('clicking Retry calls window.location.reload', async () => {
    const user = userEvent.setup();
    const reloadMock = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundaryClass>
        <BrokenChild shouldThrow />
      </ErrorBoundaryClass>,
    );

    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
