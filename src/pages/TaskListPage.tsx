import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { TaskList } from '@features/tasks';

gsap.registerPlugin(useGSAP);

export default function TaskListPage() {
  const headRef = useRef<HTMLDivElement>(null);

  // Stagger page heading words on mount
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        headRef.current,
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out', clearProps: 'transform,opacity,visibility' },
      );
    });
    return () => mm.revert();
  }, { scope: headRef });

  return (
    <section>
      <div ref={headRef} className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-emi-ink-900 md:text-3xl">
            Tareas
          </h2>
          <p className="mt-0.5 text-sm text-emi-ink-400">
            Gestiona y organiza tu trabajo
          </p>
        </div>
        <Link to="/tasks/new" className="btn-primary min-h-[44px]">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Nueva tarea
        </Link>
      </div>
      <TaskList />
    </section>
  );
}
