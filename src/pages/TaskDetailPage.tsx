import { Link, useParams } from 'react-router-dom';
import { useTaskById, lastState } from '@features/tasks';

const STATE_LABEL: Record<string, string> = {
  new: 'Nuevo', active: 'Activo', resolved: 'Resuelto', closed: 'Cerrado',
};
const STATE_BADGE: Record<string, string> = {
  new:      'bg-blue-50 text-blue-700 border-blue-200',
  active:   'bg-emi-red-50 text-emi-red-700 border-emi-red-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed:   'bg-emi-ink-100 text-emi-ink-500 border-emi-ink-200',
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const task = useTaskById(id);

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <p className="text-emi-ink-500">Tarea no encontrada.</p>
        <Link to="/tasks" className="btn-secondary">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver a tareas
        </Link>
      </div>
    );
  }

  const currentState = lastState(task);
  const notes = task.notes.map((n) => (typeof n === 'string' ? n : (n as { content: string }).content));

  return (
    <article className="max-w-2xl mx-auto space-y-5">
      {/* Card header */}
      <div className="card p-6">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-2xl font-semibold text-emi-ink-900 text-balance">
              {task.title}
            </h2>
            <p className="mt-2 text-sm text-emi-ink-500">{task.description}</p>
          </div>
          <span className={`badge border flex-shrink-0 ${STATE_BADGE[currentState] ?? STATE_BADGE.new}`}>
            {STATE_LABEL[currentState] ?? currentState}
          </span>
        </header>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm border-t border-emi-ink-50 pt-4">
          <dt className="text-emi-ink-400">Fecha límite</dt>
          <dd className="font-medium text-emi-ink-700">
            <time dateTime={task.dueDate}>{task.dueDate}</time>
          </dd>
          <dt className="text-emi-ink-400">Estado</dt>
          <dd className="font-medium text-emi-ink-700">{task.completed ? 'Completada' : 'Pendiente'}</dd>
        </dl>
      </div>

      {/* State history */}
      <div className="card p-5">
        <h3 className="font-serif text-base font-semibold text-emi-ink-800 mb-3">
          Historial de estados
        </h3>
        <ol className="space-y-2" aria-label="Historial de estados">
          {task.stateHistory.map((s, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATE_BADGE[s.state] ? 'bg-emi-red-400' : 'bg-emi-ink-200'}`} aria-hidden="true" />
              <time className="text-emi-ink-400 tabular-nums" dateTime={s.date}>{s.date}</time>
              <span className="font-medium text-emi-ink-700">{STATE_LABEL[s.state] ?? s.state}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Notes */}
      <div className="card p-5">
        <h3 className="font-serif text-base font-semibold text-emi-ink-800 mb-3">
          Notas
        </h3>
        <ul className="space-y-2" aria-label="Notas de la tarea">
          {notes.map((n, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-emi-ink-600">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emi-accent-500 flex-shrink-0" aria-hidden="true" />
              {n}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to={`/tasks/${task.id}/edit`} className="btn-primary min-h-[44px]">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
            <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          Editar
        </Link>
        <Link to="/tasks" className="btn-secondary min-h-[44px]">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver
        </Link>
      </div>
    </article>
  );
}
