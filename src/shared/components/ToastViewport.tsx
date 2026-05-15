import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useToast } from '@shared/context/ToastContext';
import type { Toast } from '@shared/context/ToastContext';

// Variant visual config
const VARIANT: Record<string, { bg: string; border: string; icon: React.ReactNode; role: 'alert' | 'status' }> = {
  info: {
    bg: 'bg-emi-ink-800',
    border: 'border-emi-ink-700',
    role: 'status',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4 flex-shrink-0" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="#f59e0b" strokeWidth="1.5" />
        <path d="M8 7v4M8 5h.01" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  success: {
    bg: 'bg-emerald-800',
    border: 'border-emerald-700',
    role: 'status',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4 flex-shrink-0" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="#6ee7b7" strokeWidth="1.5" />
        <path d="M5 8l2 2 4-4" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  error: {
    bg: 'bg-emi-red-800',
    border: 'border-emi-red-700',
    role: 'alert',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4 flex-shrink-0" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="#ffc5c7" strokeWidth="1.5" />
        <path d="M8 5v3M8 11h.01" stroke="#ffc5c7" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
};

export function ToastViewport() {
  const { toasts, dismiss } = useToast();
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const cfg = VARIANT[toast.variant] ?? VARIANT.info;

  useEffect(() => {
    const el = ref.current;
    const prog = progressRef.current;
    if (!el) return;

    // Slide in from right
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(el, { x: 48, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.3, ease: 'power3.out' });
      if (prog) {
        gsap.fromTo(prog, { scaleX: 1 }, { scaleX: 0, duration: 4, ease: 'none', transformOrigin: 'left center' });
      }
    });
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(el, { autoAlpha: 1 });
    });
    return () => mm.revert();
  }, []);

  return (
    <div
      ref={ref}
      role={cfg.role}
      className={[
        'relative overflow-hidden rounded-xl border shadow-card-hover text-white px-4 py-3',
        'flex items-start gap-3 cursor-pointer select-none',
        cfg.bg, cfg.border,
      ].join(' ')}
      onClick={onDismiss}
      aria-label={`${toast.variant}: ${toast.message}. Clic para cerrar.`}
    >
      {cfg.icon}
      <span className="text-sm leading-snug flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity duration-fast"
        aria-label="Cerrar notificación"
      >
        <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {/* Auto-dismiss progress bar */}
      <div
        ref={progressRef}
        className="absolute bottom-0 left-0 h-0.5 w-full bg-white/30"
        aria-hidden="true"
      />
    </div>
  );
}
