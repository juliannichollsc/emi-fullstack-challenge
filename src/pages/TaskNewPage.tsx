import { useNavigate } from 'react-router-dom';
import { TaskForm, useTasks, type TaskDraft } from '@features/tasks';

export default function TaskNewPage() {
  const { create } = useTasks();
  const navigate = useNavigate();

  async function handleSubmit(draft: TaskDraft) {
    const created = await create(draft);
    if (created) navigate(`/tasks/${created.id}`);
  }

  return (
    <section className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-semibold text-emi-ink-900 md:text-3xl">
          Nueva tarea
        </h2>
        <p className="mt-0.5 text-sm text-emi-ink-400">
          Completa todos los campos y agrega al menos una nota.
        </p>
      </div>
      <TaskForm onSubmit={handleSubmit} submitLabel="Crear tarea" />
    </section>
  );
}
