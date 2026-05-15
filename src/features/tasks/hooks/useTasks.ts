// Task 6 + 9 — Public hook surface for task feature.
// useTasks() is the primary consumer hook; it wraps useTaskContext.
// useTaskById is a memoized point-lookup for detail/edit pages.
// lastState is a pure helper (exported for jest-tester and components).
import { useMemo } from 'react';
import { useTaskContext } from '../context/TaskContext';
import type { Task } from '../types/task.types';

/**
 * Primary hook for task consumers.
 * Returns state + async operations (create, update, remove, toggleComplete, setPage, refresh).
 */
export function useTasks() {
  return useTaskContext();
}

/**
 * Finds a task by id in the current in-memory list.
 * Returns undefined while the list is loading or if not found.
 */
export function useTaskById(id: string | undefined): Task | undefined {
  const { items } = useTaskContext();
  return useMemo(() => items.find((t) => t.id === id), [items, id]);
}

/**
 * Returns the most recent state name from stateHistory.
 * Exported as a pure utility so Task component and jest tests can use it directly.
 */
export function lastState(task: Task): string {
  return task.stateHistory.at(-1)?.state ?? 'new';
}
