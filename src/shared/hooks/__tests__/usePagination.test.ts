// usePagination — hook is exported but currently unused in production code.
// Tests are kept to document the API and prevent accidental breaking.
// If the hook is removed in a future cleanup, delete this file too.
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@shared/hooks/usePagination';

const items = Array.from({ length: 12 }, (_, i) => i + 1);

describe('usePagination', () => {
  it('returns first page of items by default', () => {
    const { result } = renderHook(() => usePagination(items, 5));
    expect(result.current.items).toEqual([1, 2, 3, 4, 5]);
    expect(result.current.page).toBe(1);
  });

  it('returns correct slice for second page', () => {
    const { result } = renderHook(() => usePagination(items, 5));
    act(() => { result.current.setPage(2); });
    expect(result.current.items).toEqual([6, 7, 8, 9, 10]);
  });

  it('returns correct total', () => {
    const { result } = renderHook(() => usePagination(items, 5));
    expect(result.current.total).toBe(12);
  });

  it('clamps page to totalPages when page exceeds it', () => {
    const { result } = renderHook(() => usePagination(items, 5));
    act(() => { result.current.setPage(100); });
    // totalPages = ceil(12/5) = 3
    expect(result.current.page).toBe(3);
  });

  it('returns all items on one page when pageSize >= items.length', () => {
    const { result } = renderHook(() => usePagination(items, 20));
    expect(result.current.items).toHaveLength(12);
    expect(result.current.page).toBe(1);
  });

  it('handles empty array without error', () => {
    const { result } = renderHook(() => usePagination<number>([], 5));
    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
    expect(result.current.page).toBe(1);
  });

  it('reports correct pageSize', () => {
    const { result } = renderHook(() => usePagination(items, 4));
    expect(result.current.pageSize).toBe(4);
  });
});
