interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

// Task 3 — Pagination — EMI pill buttons, glow-red for active page, a11y labels.
export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  // Build page window: show up to 5 pages around current
  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  if (totalPages <= 1) return null;

  return (
    <nav
      className="mt-6 flex items-center justify-between gap-2"
      aria-label="Paginación de tareas"
    >
      <p className="text-xs text-emi-ink-400" aria-live="polite">
        Página <strong className="text-emi-ink-700">{page}</strong> de{' '}
        <strong className="text-emi-ink-700">{totalPages}</strong>
        &nbsp;·&nbsp;{total} tarea{total !== 1 ? 's' : ''}
      </p>

      <div className="flex items-center gap-1">
        {/* Previous */}
        <PagButton
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label="Página anterior"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </PagButton>

        {/* Page numbers */}
        {pages.map((p, idx) =>
          p === '…' ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-8 h-8 flex items-center justify-center text-xs text-emi-ink-400 select-none"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <PagButton
              key={p}
              onClick={() => onPageChange(p as number)}
              disabled={p === page}
              active={p === page}
              aria-label={`Ir a página ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </PagButton>
          ),
        )}

        {/* Next */}
        <PagButton
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label="Página siguiente"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </PagButton>
      </div>
    </nav>
  );
}

interface PagButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}

function PagButton({ active, children, disabled, className = '', ...props }: PagButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        'w-8 h-8 flex items-center justify-center rounded-md text-xs font-medium',
        'transition-[background-color,box-shadow,color] duration-fast ease-emi',
        'focus-visible:ring-2 focus-visible:ring-emi-red-700 focus-visible:ring-offset-1',
        active
          ? 'bg-emi-red-700 text-white shadow-glow-red cursor-default'
          : 'border border-emi-ink-200 bg-white text-emi-ink-600 hover:bg-emi-ink-50 hover:border-emi-ink-300 disabled:opacity-40 disabled:cursor-not-allowed',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
