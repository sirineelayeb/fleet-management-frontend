import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],
  showFirstLast = true,
  siblingCount = 1,
  showPageSizeSelector = true,
  totalItems = 0
}) => {
  if (totalPages <= 1 && !showPageSizeSelector) return null;

  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(1, currentPage - siblingCount);
    const end = Math.min(totalPages, currentPage + siblingCount);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
  };

  const baseBtn =
    "flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-all duration-200";

  const activeBtn =
    "bg-teal-700 text-white shadow-md scale-105";

  const inactiveBtn =
    "text-gray-700 hover:bg-gray-100 hover:text-gray-900";

  const navBtn =
    "flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed";

  // Calculate showing range
  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm">
      
      {/* Left side - Items per page selector */}
      {showPageSizeSelector && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Show</label>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white cursor-pointer"
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-700">entries</span>
        </div>
      )}

      {/* Center - Items info */}
      {totalItems > 0 && (
        <div className="text-sm text-gray-700">
          Showing <span className="font-semibold text-gray-900">{startItem}</span> to{' '}
          <span className="font-semibold text-gray-900">{endItem}</span> of{' '}
          <span className="font-semibold text-gray-900">{totalItems}</span> entries
        </div>
      )}

      {/* Right side - Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Page info */}
        <div className="text-sm text-gray-700 mr-2">
          Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
          <span className="font-semibold text-gray-900">{totalPages || 1}</span>
        </div>

        {/* Navigation buttons */}
        <nav className="flex items-center gap-1" aria-label="Pagination">
          {showFirstLast && (
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className={navBtn}
              title="First"
            >
              «
            </button>
          )}

          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={navBtn}
            title="Previous"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>

          {getPageNumbers().map((pageNum, idx) =>
            pageNum === '...' ? (
              <span
                key={`dots-${idx}`}
                className="px-2 text-gray-400"
              >
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`${baseBtn} ${
                  currentPage === pageNum ? activeBtn : inactiveBtn
                }`}
              >
                {pageNum}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={navBtn}
            title="Next"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>

          {showFirstLast && (
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={navBtn}
              title="Last"
            >
              »
            </button>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Pagination;