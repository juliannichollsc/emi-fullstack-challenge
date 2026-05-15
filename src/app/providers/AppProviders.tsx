import { ReactNode } from 'react';
import { TaskProvider } from '@features/tasks/context/TaskContext';
import { StateProvider } from '@features/states/context/StateContext';
import { ToastProvider } from '@shared/context/ToastContext';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Tasks 6 & 8 — composición de providers (Context API).
 * Orden: outer-most (toast) → state → tasks (que puede emitir toasts).
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ToastProvider>
      <StateProvider>
        <TaskProvider>{children}</TaskProvider>
      </StateProvider>
    </ToastProvider>
  );
}
