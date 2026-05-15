import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from '@app/layouts/RootLayout';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { PageSpinner } from '@shared/components/PageSpinner';

// Task 9 — Performance: rutas perezosas (code-splitting por página)
const TaskListPage = lazy(() => import('@pages/TaskListPage'));
const TaskDetailPage = lazy(() => import('@pages/TaskDetailPage'));
const TaskNewPage = lazy(() => import('@pages/TaskNewPage'));
const TaskEditPage = lazy(() => import('@pages/TaskEditPage'));
const StatesPage = lazy(() => import('@pages/StatesPage'));
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'));

const withSuspense = (node: React.ReactNode) => (
  <Suspense fallback={<PageSpinner />}>{node}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/tasks" replace /> },
      { path: 'tasks', element: withSuspense(<TaskListPage />) },
      { path: 'tasks/new', element: withSuspense(<TaskNewPage />) },
      { path: 'tasks/:id', element: withSuspense(<TaskDetailPage />) },
      { path: 'tasks/:id/edit', element: withSuspense(<TaskEditPage />) },
      { path: 'states', element: withSuspense(<StatesPage />) },
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
]);
