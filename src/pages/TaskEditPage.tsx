import { useNavigate, useParams, Link } from 'react-router-dom';
import { TaskForm, useTasks, useTaskById, type TaskDraft } from '@features/tasks';

export default function TaskEditPage() {
  const { id } = useParams<{ id: string }>();
  const task = useTaskById(id);
  const { update } = useTasks();
  const navigate = useNavigate();

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <p className="text-emi-ink-500">Tarea no encontrada.</p>
        <Link to="/tasks" className="btn-secondary">
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver
        </Link>
      </div>
    );
  }

  async function handleSubmit(draft: TaskDraft) {
    if (!task) return;
    const updated = await update(task.id, {
      title: draft.title,
      description: draft.description,
      dueDate: draft.dueDate,
      notes: draft.notes,
    });
    if (updated) navigate(`/tasks/${task.id}`);
  }

  return (
    <section className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-semibold text-emi-ink-900 md:text-3xl">
          Editar tarea
        </h2>
        <p className="mt-0.5 text-sm text-emi-ink-400 truncate max-w-md">
          {task.title}
        </p>
      </div>
      <TaskForm initial={task} onSubmit={handleSubmit} submitLabel="Guardar cambios" />
    </section>
  );
}
