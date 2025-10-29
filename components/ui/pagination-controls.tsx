'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = true,
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateURL = useCallback(
    (page: number, limit: number) => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    if (onPageChange) {
      onPageChange(page);
    } else {
      updateURL(page, pageSize);
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const limit = parseInt(newPageSize);
    
    if (onPageSizeChange) {
      onPageSizeChange(limit);
    } else {
      updateURL(1, limit); // Reset to page 1 when changing page size
    }
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift(1, '...');
    } else if (totalPages > 1) {
      range.unshift(1);
    }

    if (currentPage + delta < totalPages - 1) {
      range.push('...', totalPages);
    } else if (totalPages > 1 && range[range.length - 1] !== totalPages) {
      range.push(totalPages);
    }

    return range.filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
  };

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  if (totalPages <= 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Results info */}
        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Showing{' '}
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {startIndex}
          </span>
          {' '}to{' '}
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {endIndex}
          </span>
          {' '}of{' '}
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {totalItems.toLocaleString()}
          </span>
          {' '}members
        </div>
        
        {/* Visual separator */}
        <div className="hidden sm:block w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
        
        {/* Page size selector */}
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Per page:
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[70px] border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Another visual separator */}
        <div className="hidden sm:block w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
        
        {/* Page indicator with jump input */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm">
            Page{' '}
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {currentPage}
            </span>
            {' '}of{' '}
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {totalPages}
            </span>
          </div>
          {totalPages > 5 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Go to:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                placeholder="#"
                className="w-16 h-8 px-2 text-xs text-center border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const page = parseInt((e.target as HTMLInputElement).value);
                    if (page >= 1 && page <= totalPages) {
                      handlePageChange(page);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center sm:justify-end">
        <Pagination className="mx-0">
          <PaginationContent className="gap-1">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(currentPage - 1)}
                className={
                  currentPage <= 1
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-900/20 dark:hover:to-blue-900/20 transition-all duration-200 border-slate-200 dark:border-slate-700'
                }
              />
            </PaginationItem>

            {getVisiblePages().map((page, index) => (
              <PaginationItem key={`${page}-${index}`}>
                {page === '...' ? (
                  <PaginationEllipsis className="text-slate-400 dark:text-slate-500" />
                ) : (
                  <PaginationLink
                    onClick={() => handlePageChange(page as number)}
                    isActive={currentPage === page}
                    className={`cursor-pointer transition-all duration-200 border ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 border-indigo-600 shadow-md'
                        : 'hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-900/20 dark:hover:to-blue-900/20 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                    }`}
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                className={
                  currentPage >= totalPages
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-900/20 dark:hover:to-blue-900/20 transition-all duration-200 border-slate-200 dark:border-slate-700'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

