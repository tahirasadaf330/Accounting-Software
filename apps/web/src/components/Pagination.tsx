'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-white px-4 py-3 text-sm text-gray-600',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span>
          {total === 0
            ? 'No results'
            : `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()}`}
        </span>
        {onPageSizeChange && (
          <label className="flex items-center gap-2 text-gray-500">
            <span className="hidden sm:inline">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>
        <span className="px-2 text-gray-500">
          Page <span className="font-medium text-gray-900">{safePage}</span> of{' '}
          <span className="font-medium text-gray-900">{totalPages}</span>
        </span>
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
