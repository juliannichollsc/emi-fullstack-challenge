import { memo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import type { Task as TaskModel } from '../types/task.types';
import { lastState } from '../hooks/useTasks';

gsap.registerPlugin(useGSAP);

interface TaskProps {
  task: TaskModel;
  onToggleComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// State → visual config mapping
const STATE_CONFIG: Record<string, { label: string; badgeCls: string; borderCls: string; dotCls: string }> = {
  new:      { label: 'Nuevo',    badgeCls: 'bg-blue-50   text-blue-700   border-blue-200',   borderCls: 'border-l-blue-400',   dotCls: 'bg-blue-400' },
  // Active = corporate red — reads as "alert/in-progress", correct for security/emergency product
  active:   { label: 'Activo',   badgeCls: 'bg-emi-red-50 text-emi-red-700 border-emi-red-200', borderCls: 'border-l-emi-red-700', dotCls: 'bg-emi-red-700' },
  resolved: { label: 'Resuelto', badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200', borderCls: 'border-l-emerald-500', dotCls: 'bg-emerald-500' },
  closed:   { label: 'Cerrado',  badgeCls: 'bg-emi-ink-100 text-emi-ink-500  border-emi-ink-200',  borderCls: 'border-l-emi-ink-400',  dotCls: 'bg-emi-ink-400' },
};

function getStateConfig(state: string) {
  return STATE_CONFIG[state] ?? STATE_CONFIG.new;
}

// Task 2 — Task card. React.memo (Task 9).
function TaskComponent({ task, onToggleComplete, onDelete }: TaskProps) {
  const currentState = lastState(task);
  const cfg = getStateConfig(currentState);
  const cardRef = useRef<HTMLElement>(null);
  const checkRef = useRef<SVGSVGElement>(null);
  const checkPathRef = useRef<SVGPathElement>(null);

  // 3D hover effect — respects prefers-reduced-motion via matchMedia
  useGSAP(() => {
    const card = cardRef.current;
    if (!card) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const onEnter = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const rx = ((e.clientY - cy) / (rect.height / 2)) * -4;
        const ry = ((e.clientX - cx) / (rect.width / 2)) * 4;
        gsap.to(card, {
          rotateX: rx, rotateY: ry, translateZ: 12,
          boxShadow: '0 12px 32px 0 rgba(26,20,20,0.16)',
          duration: 0.4, ease: 'power2.out',
        });
      };

      const onLeave = () => {
        gsap.to(card, {
          rotateX: 0, rotateY: 0, translateZ: 0,
          boxShadow: '',
          duration: 0.5, ease: 'power3.out',
        });
      };

      card.addEventListener('mousemove', onEnter);
      card.addEventListener('mouseleave', onLeave);
      return () => {
        card.removeEventListener('mousemove', onEnter);
        card.removeEventListener('mouseleave', onLeave);
      };
    });
    return () => mm.revert();
  }, { scope: cardRef });

  // Animate check SVG on mount to show current completed state
  useGSAP(() => {
    const path = checkPathRef.current;
    if (!path) return;
    const len = path.getTotalLength?.() ?? 20;
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: task.completed ? 0 : len });
    if (task.completed) {
      gsap.from(path, { strokeDashoffset: len, duration: 0.35, ease: 'power2.out' });
    }
  }, { dependencies: [task.completed], revertOnUpdate: true });

  const handleToggle = () => {
    const path = checkPathRef.current;
    if (path) {
      const len = path.getTotalLength?.() ?? 20;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(path, {
          strokeDashoffset: task.completed ? len : 0,
          duration: 0.3, ease: 'power2.inOut',
        });
      });
    }
    onToggleComplete?.(task.id);
  };

  const notes = task.notes.map((n) => (typeof n === 'string' ? n : (n as { content: string }).content));

  return (
    <article
      ref={cardRef}
      className={[
        'card border-l-4 p-4 flex flex-col h-full gap-3',
        'transition-shadow duration-base ease-emi',
        cfg.borderCls,
        task.completed ? 'opacity-75' : '',
        'will-change-transform',
      ].join(' ')}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Content — grows to fill card height */}
      <div className="flex-1 min-w-0 space-y-2">
        <header className="flex items-start gap-3">
          {/* Custom checkbox */}
          <button
            type="button"
            role="checkbox"
            aria-checked={task.completed}
            aria-label={`Marcar "${task.title}" como completada`}
            onClick={handleToggle}
            className={[
              'mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center',
              'transition-[border-color,background-color] duration-base ease-emi',
              'focus-visible:ring-2 focus-visible:ring-emi-red-700 focus-visible:ring-offset-2',
              task.completed
                ? 'bg-emi-red-700 border-emi-red-700'
                : 'border-emi-ink-300 hover:border-emi-red-600',
            ].join(' ')}
          >
            <svg
              ref={checkRef}
              viewBox="0 0 12 10"
              className="w-3 h-3"
              aria-hidden="true"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                ref={checkPathRef}
                d="M1 5 L4.5 8.5 L11 1"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={[
                  'font-serif font-semibold text-base leading-snug line-clamp-2',
                  task.completed ? 'line-through text-emi-ink-400' : 'text-emi-ink-900',
                ].join(' ')}
              >
                {task.title}
              </h3>
              <span className={`badge border ${cfg.badgeCls}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dotCls}`} aria-hidden="true" />
                {getStateConfig(currentState).label}
              </span>
            </div>
            <p className="mt-1 text-sm text-emi-ink-500 line-clamp-2">{task.description}</p>
          </div>
        </header>

        {/* Due date badge */}
        <div className="ml-8 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs text-emi-ink-500">
            <svg className="w-3.5 h-3.5 text-emi-ink-400" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="1" y="3" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M1 7h14" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <time dateTime={task.dueDate}>{task.dueDate}</time>
          </span>

          {task.completed && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Completada
            </span>
          )}
        </div>

        {/* Notes compact list */}
        {notes.length > 0 && (
          <ul className="ml-8 space-y-0.5" aria-label="Notas">
            {notes.slice(0, 2).map((n, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-emi-ink-500">
                <span className="mt-1 w-1 h-1 rounded-full bg-emi-red-400 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{n}</span>
              </li>
            ))}
            {notes.length > 2 && (
              <li className="text-xs text-emi-ink-400 ml-2.5">+{notes.length - 2} más</li>
            )}
          </ul>
        )}
      </div>

      {/* Actions — docked at bottom with mt-auto so all cards in a row align */}
      <footer className="flex items-center justify-end gap-2 pt-3 mt-auto border-t border-emi-ink-100">
        <Link
          to={`/tasks/${task.id}/edit`}
          className="btn-secondary px-3 py-1.5 text-xs min-h-[36px]"
          aria-label={`Editar "${task.title}"`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          Editar
        </Link>
        <button
          type="button"
          onClick={() => onDelete?.(task.id)}
          className="btn-danger px-3 py-1.5 text-xs min-h-[36px]"
          aria-label={`Eliminar "${task.title}"`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Eliminar
        </button>
      </footer>
    </article>
  );
}

export const Task = memo(TaskComponent);
