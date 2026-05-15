import { FormEvent, useId, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useStateCatalog } from '../hooks/useStateCatalog';

gsap.registerPlugin(useGSAP);

// Bonus — state management form with animated list.
export function StateForm() {
  const { items, create, remove } = useStateCatalog();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('El nombre es requerido');
      return;
    }
    if (items.some((s) => s.name === trimmed)) {
      setError('El estado ya existe');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await create({ name: trimmed });
      setName('');
      // Animate new item in after state update
      requestAnimationFrame(() => {
        const list = listRef.current;
        if (!list) return;
        const newItem = list.querySelector('li:last-child');
        if (!newItem) return;
        const mm = gsap.matchMedia();
        mm.add('(prefers-reduced-motion: no-preference)', () => {
          gsap.fromTo(newItem, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power2.out' });
        });
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(stateName: string) {
    const list = listRef.current;
    const items = list?.querySelectorAll('li');
    const idx = Array.from(items ?? []).findIndex((li) => li.dataset.state === stateName);
    const item = items?.[idx];

    const doRemove = () => void remove(stateName);

    if (item) {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(item, {
          autoAlpha: 0, x: 12, height: 0, paddingTop: 0, paddingBottom: 0,
          duration: 0.25, ease: 'power2.in', onComplete: doRemove,
        });
      });
      mm.add('(prefers-reduced-motion: reduce)', () => { doRemove(); });
    } else {
      doRemove();
    }
  }

  return (
    <section className="flex flex-col gap-6 max-w-lg" aria-label="Gestión de estados">
      {/* Add form */}
      <div className="card p-5">
        <h3 className="font-serif text-base font-semibold text-emi-red-700 mb-4">
          Nuevo estado
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
          <div>
            <label htmlFor={`${formId}-name`} className="text-sm font-medium text-emi-ink-700 block mb-1">
              Nombre del estado
            </label>
            <div className="flex gap-2">
              <input
                id={`${formId}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. bloqueado"
                className="input flex-1"
                aria-invalid={!!error || undefined}
                aria-describedby={error ? `${formId}-name-err` : undefined}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-4 min-h-[40px] flex-shrink-0"
              >
                {submitting ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a8 8 0 00-8 8h4z" />
                  </svg>
                ) : (
                  'Agregar'
                )}
              </button>
            </div>
            {error && (
              <p id={`${formId}-name-err`} role="alert" className="mt-1.5 text-xs text-emi-red-600 flex items-center gap-1">
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5v3M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* State list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-emi-ink-100 flex items-center justify-between">
          <h3 className="font-serif text-sm font-semibold text-emi-ink-700">Estados existentes</h3>
          <span className="badge bg-emi-ink-100 text-emi-ink-500">{items.length}</span>
        </div>
        {items.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-emi-ink-400">
            No hay estados definidos aún.
          </div>
        ) : (
          <ul ref={listRef} aria-label="Lista de estados">
            {items.map((s) => (
              <li
                key={s.name}
                data-state={s.name}
                className="flex items-center justify-between px-5 py-3 border-b border-emi-ink-50
                           last:border-b-0 group hover:bg-emi-cream transition-colors duration-fast"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emi-red-300 group-hover:bg-emi-red-600 transition-colors duration-fast" aria-hidden="true" />
                  <span className="text-sm font-medium text-emi-ink-700">{s.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(s.name)}
                  className="btn-danger px-2.5 py-1 text-xs min-h-[32px] opacity-0 group-hover:opacity-100
                             transition-opacity duration-fast focus-visible:opacity-100"
                  aria-label={`Eliminar estado ${s.name}`}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
