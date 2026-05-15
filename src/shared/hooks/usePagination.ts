import { useMemo, useState } from 'react';

// Task 3 + Task 9 — paginación memoizada.
export function usePagination<T>(items: T[], pageSize = 5) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    page: safePage,
    pageSize,
    total: items.length,
    items: paged,
    setPage,
  };
}
