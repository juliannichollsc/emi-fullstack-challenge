// Task 8 — Two error boundary exports:
// 1. RouteErrorBoundary — used as `errorElement` in react-router routes (uses useRouteError).
// 2. ErrorBoundary — class-based React error boundary for wrapping arbitrary subtrees.
import { Component, ErrorInfo, PropsWithChildren, ReactNode } from 'react';
import { isRouteErrorResponse, useRouteError, Link } from 'react-router-dom';
import { HttpError } from '@shared/utils/http';

// ── Route-level error boundary ─────────────────────────────────────────────
export function RouteErrorBoundary() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let detail = 'An unexpected error occurred.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    detail = typeof error.data === 'object' && error.data !== null
      ? (error.data as { message?: string }).message ?? detail
      : detail;
  } else if (error instanceof HttpError) {
    title = `Error ${error.status}`;
    detail = error.message;
  } else if (error instanceof Error) {
    detail = error.message;
  }

  return (
    <div
      data-testid="error-boundary-fallback"
      className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center"
    >
      {/* Illustration */}
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true" className="mb-6">
        <circle cx="40" cy="40" r="36" fill="#fdf2f3" stroke="#f8d2d6" strokeWidth="2" />
        <path d="M40 24v22M40 52h.01" stroke="#d4001a" strokeWidth="3" strokeLinecap="round" />
        <circle cx="40" cy="40" r="28" stroke="#f2adb5" strokeWidth="1.5" strokeDasharray="4 3" />
      </svg>
      <h2 className="font-serif text-2xl font-semibold text-emi-red-700">{title}</h2>
      <p className="mt-2 text-sm text-emi-ink-500 max-w-sm">{detail}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-secondary min-h-[44px]"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
            <path d="M13 8A5 5 0 1 1 8 3c1.5 0 2.8.66 3.75 1.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 1v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Reintentar
        </button>
        <Link to="/tasks" className="btn-primary min-h-[44px]">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver a tareas
        </Link>
      </div>
    </div>
  );
}

// Keep backward-compatible export name for existing router.tsx usage.
export { RouteErrorBoundary as ErrorBoundary };

// ── Class-based error boundary for arbitrary subtrees ──────────────────────
interface ErrorBoundaryClassProps extends PropsWithChildren {
  fallback?: ReactNode;
}

interface ErrorBoundaryClassState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundaryClass extends Component<
  ErrorBoundaryClassProps,
  ErrorBoundaryClassState
> {
  constructor(props: ErrorBoundaryClassProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryClassState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          data-testid="error-boundary-fallback"
          className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center"
        >
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true" className="mb-6">
            <circle cx="40" cy="40" r="36" fill="#fdf2f3" stroke="#f8d2d6" strokeWidth="2" />
            <path d="M40 24v22M40 52h.01" stroke="#d4001a" strokeWidth="3" strokeLinecap="round" />
            <circle cx="40" cy="40" r="28" stroke="#f2adb5" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          <h2 className="font-serif text-2xl font-semibold text-emi-red-700">Algo salió mal</h2>
          <p className="mt-2 text-sm text-emi-ink-500 max-w-sm">{this.state.error?.message ?? 'Error desconocido'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-secondary mt-6 min-h-[44px]"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
              <path d="M13 8A5 5 0 1 1 8 3c1.5 0 2.8.66 3.75 1.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 1v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
