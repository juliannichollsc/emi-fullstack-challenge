import { StateForm } from '@features/states';

export default function StatesPage() {
  return (
    <section className="max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-semibold text-emi-ink-900 md:text-3xl">
          Estados
        </h2>
        <p className="mt-0.5 text-sm text-emi-ink-400">
          Gestiona el catálogo de estados disponibles para las tareas.
        </p>
      </div>
      <StateForm />
    </section>
  );
}
