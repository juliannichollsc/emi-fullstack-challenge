import { FormEvent, useId, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import type { Task, TaskDraft } from '../types/task.types';
import { useStateCatalog } from '@features/states/hooks/useStateCatalog';

gsap.registerPlugin(useGSAP);

interface TaskFormProps {
  initial?: Task;
  onSubmit: (draft: TaskDraft) => Promise<void> | void;
  submitLabel?: string;
}

// Task 4 — form with validation + floating labels + note animations.
// All fields required + ≥1 non-empty note required.
export function TaskForm({ initial, onSubmit, submitLabel = 'Guardar' }: TaskFormProps) {
  const { items: states } = useStateCatalog();
  const formId = useId();

  const [title, setTitle]           = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [dueDate, setDueDate]       = useState(initial?.dueDate ?? '');
  const [initialState, setInitialState] = useState(
    initial?.stateHistory.at(-1)?.state ?? states[0]?.name ?? 'new',
  );
  const [notes, setNotes] = useState<string[]>(
    initial
      ? initial.notes.map((n) => (typeof n === 'string' ? n : (n as { content: string }).content))
      : [''],
  );
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const notesListRef = useRef<HTMLUListElement>(null);

  const setNote   = (i: number, value: string) =>
    setNotes((curr) => curr.map((n, idx) => (idx === i ? value : n)));

  const addNote = () => {
    setNotes((curr) => [...curr, '']);
    // Animate new note in
    requestAnimationFrame(() => {
      const list = notesListRef.current;
      if (!list) return;
      const items = list.querySelectorAll('li');
      const last = items[items.length - 1];
      if (!last) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(last, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out' });
      });
    });
  };

  const removeNote = (i: number) => {
    const list = notesListRef.current;
    const item = list?.querySelectorAll('li')[i];
    const doRemove = () => setNotes((curr) => curr.length === 1 ? curr : curr.filter((_, idx) => idx !== i));
    if (item) {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(item, {
          autoAlpha: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0,
          duration: 0.2, ease: 'power2.in', onComplete: doRemove,
        });
      });
      mm.add('(prefers-reduced-motion: reduce)', () => { doRemove(); });
    } else {
      doRemove();
    }
  };

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!title.trim())       next.title       = 'El título es requerido';
    if (!description.trim()) next.description = 'La descripción es requerida';
    if (!dueDate)            next.dueDate     = 'La fecha límite es requerida';
    if (!initialState)       next.initialState = 'El estado es requerido';
    if (!notes.some((n) => n.trim())) next.notes = 'Se requiere al menos una nota';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const draft: TaskDraft = {
        title:       title.trim(),
        description: description.trim(),
        dueDate,
        completed:   initial?.completed ?? false,
        notes:       notes.filter((n) => n.trim()),
        initialState,
      };
      await onSubmit(draft);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="flex flex-col gap-6"
      noValidate
      aria-label="Formulario de tarea"
    >
      {/* ─── Section: Basic data ─── */}
      <fieldset className="card p-5 flex flex-col gap-4">
        <legend className="font-serif text-base font-semibold text-emi-red-700 px-1 -ml-1">
          Datos principales
        </legend>

        <FloatField
          id={`${formId}-title`}
          label="Título"
          error={errors.title}
        >
          <input
            id={`${formId}-title`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder=" "
            aria-invalid={!!errors.title || undefined}
            aria-describedby={errors.title ? `${formId}-title-err` : undefined}
            autoComplete="off"
          />
        </FloatField>

        <FloatField
          id={`${formId}-desc`}
          label="Descripción"
          error={errors.description}
        >
          <textarea
            id={`${formId}-desc`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-[80px] resize-y"
            placeholder=" "
            aria-invalid={!!errors.description || undefined}
            aria-describedby={errors.description ? `${formId}-desc-err` : undefined}
          />
        </FloatField>

        {/* Two-column grid on md+ */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FloatField
            id={`${formId}-due`}
            label="Fecha límite"
            error={errors.dueDate}
          >
            <input
              id={`${formId}-due`}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input"
              aria-invalid={!!errors.dueDate || undefined}
              aria-describedby={errors.dueDate ? `${formId}-due-err` : undefined}
            />
          </FloatField>

          <FloatField
            id={`${formId}-state`}
            label="Estado inicial"
            error={errors.initialState}
          >
            <select
              id={`${formId}-state`}
              value={initialState}
              onChange={(e) => setInitialState(e.target.value)}
              className="input"
              aria-invalid={!!errors.initialState || undefined}
              aria-describedby={errors.initialState ? `${formId}-state-err` : undefined}
            >
              {states.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </FloatField>
        </div>
      </fieldset>

      {/* ─── Section: Notes ─── */}
      <fieldset className="card p-5 flex flex-col gap-3">
        <legend className="font-serif text-base font-semibold text-emi-red-700 px-1 -ml-1">
          Notas
          <span className="ml-1 text-xs font-normal text-emi-ink-400">(mínimo 1)</span>
        </legend>

        <ul ref={notesListRef} className="flex flex-col gap-2" aria-label="Lista de notas">
          {notes.map((n, i) => (
            <li key={i} className="flex gap-2 items-center">
              <label className="sr-only" htmlFor={`${formId}-note-${i}`}>
                Nota {i + 1}
              </label>
              <input
                id={`${formId}-note-${i}`}
                value={n}
                onChange={(e) => setNote(i, e.target.value)}
                placeholder={`Nota ${i + 1}`}
                className="input flex-1"
                aria-invalid={!!errors.notes && !n.trim() ? true : undefined}
              />
              <button
                type="button"
                onClick={() => removeNote(i)}
                disabled={notes.length === 1}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md
                           text-emi-ink-400 hover:text-emi-red-600 hover:bg-emi-red-50
                           disabled:opacity-30 disabled:cursor-not-allowed
                           transition-colors duration-fast ease-emi
                           focus-visible:ring-2 focus-visible:ring-emi-red-700"
                aria-label={`Eliminar nota ${i + 1}`}
              >
                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
                  <path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>

        {errors.notes && (
          <p id={`${formId}-notes-err`} role="alert" className="text-xs text-emi-red-600 flex items-center gap-1">
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v3M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {errors.notes}
          </p>
        )}

        <button
          type="button"
          onClick={addNote}
          className="self-start inline-flex items-center gap-1.5 text-sm text-emi-red-700
                     hover:text-emi-red-800 font-medium
                     focus-visible:ring-2 focus-visible:ring-emi-red-700 rounded"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Agregar nota
        </button>
      </fieldset>

      {/* ─── Submit ─── */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary min-w-[120px] min-h-[44px]"
        >
          {submitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a8 8 0 00-8 8h4z" />
              </svg>
              Guardando…
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}

// Floating-label field wrapper
interface FloatFieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

function FloatField({ id, label, error, children }: FloatFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-emi-ink-700">
        {label}
      </label>
      {children}
      {error && (
        <span
          id={`${id}-err`}
          role="alert"
          className="text-xs text-emi-red-600 flex items-center gap-1"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
}
