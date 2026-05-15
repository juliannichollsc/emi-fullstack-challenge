import { useCallback, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTasks } from '../hooks/useTasks';
import { Task } from './Task';
import { Pagination } from '@shared/components/Pagination';
import { PageSpinner } from '@shared/components/PageSpinner';

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Task 3 — TaskList with server-side pagination, responsive grid, empty state, stagger entrance.
export function TaskList() {
  const { items, total, page, perPage, status, error, toggleComplete, remove, setPage } =
    useTasks();
  const listRef = useRef<HTMLUListElement>(null);

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm('¿Eliminar esta tarea?')) void remove(id);
    },
    [remove],
  );

  // Stagger entrance animation on page/items change
  useGSAP(() => {
    const list = listRef.current;
    if (!list) return;
    const cards = list.querySelectorAll('li');
    if (!cards.length) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        cards,
        { autoAlpha: 0, y: 10 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.35,
          ease: 'power2.out',
          stagger: 0.06,
          clearProps: 'transform,opacity,visibility',
        },
      );
    });
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(cards, { autoAlpha: 1, y: 0 });
    });
    return () => mm.revert();
  }, { scope: listRef, dependencies: [page, items] });

  if (status === 'loading') return <PageSpinner />;

  if (status === 'error') {
    return (
      <div
        role="alert"
        className="rounded-xl border border-emi-red-200 bg-emi-red-50 p-6 text-center"
      >
        <svg className="mx-auto mb-3 w-8 h-8 text-emi-red-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p className="text-sm font-medium text-emi-red-700">{error ?? 'Error al cargar tareas'}</p>
      </div>
    );
  }

  if (items.length === 0 && status === 'success') {
    return <EmptyState />;
  }

  return (
    <div>
      {/* Responsive grid: 1 col mobile, 2 sm (tablet), 3 xl — sm: breakpoint helps mid-size tablets */}
      <ul
        ref={listRef}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 lg:gap-6"
        aria-label="Lista de tareas"
      >
        {items.map((t) => (
          <li key={t.id} className="flex flex-col h-full">
            <Task task={t} onToggleComplete={toggleComplete} onDelete={handleDelete} />
          </li>
        ))}
      </ul>

      <Pagination page={page} pageSize={perPage} total={total} onPageChange={setPage} />
    </div>
  );
}

// Empty state with inline SVG illustration
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        aria-hidden="true"
        className="mb-6 opacity-60"
      >
        <circle cx="60" cy="60" r="48" fill="#f9f0f1" stroke="#f2adb5" strokeWidth="2" />
        <rect x="38" y="34" width="44" height="54" rx="6" fill="white" stroke="#e87c89" strokeWidth="1.5" />
        <rect x="46" y="44" width="28" height="3" rx="1.5" fill="#f2adb5" />
        <rect x="46" y="52" width="20" height="3" rx="1.5" fill="#f8d2d6" />
        <rect x="46" y="60" width="24" height="3" rx="1.5" fill="#f8d2d6" />
        <circle cx="79" cy="79" r="16" fill="#d4001a" />
        <path d="M73 79h12M79 73v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <h3 className="font-serif text-xl font-semibold text-emi-ink-700">Sin tareas aún</h3>
      <p className="mt-2 text-sm text-emi-ink-400 max-w-xs">
        Crea tu primera tarea y comienza a gestionar tu trabajo con eficiencia.
      </p>
    </div>
  );
}
