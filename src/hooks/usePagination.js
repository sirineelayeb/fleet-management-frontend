import { useState, useCallback } from 'react';

export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const resetPage = useCallback(() => setPage(1), []);
  
  const nextPage = useCallback(() => setPage(p => p + 1), []);
  
  const prevPage = useCallback(() => setPage(p => Math.max(1, p - 1)), []);
  
  const goToPage = useCallback((pageNum) => {
    setPage(Math.max(1, pageNum));
  }, []);

  // Handle page size change - resets to page 1
  const handleLimitChange = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  }, []);

  return {
    page,
    limit,
    setPage,
    setLimit,
    resetPage,
    nextPage,
    prevPage,
    goToPage,
    handleLimitChange  
  };
};