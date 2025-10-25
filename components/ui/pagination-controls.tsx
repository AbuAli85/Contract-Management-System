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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
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
        
        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      <Pagination className="mx-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(currentPage - 1)}
              className={
                currentPage <= 1
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors'
              }
            />
          </PaginationItem>

          {getVisiblePages().map((page, index) => (
            <PaginationItem key={`${page}-${index}`}>
              {page === '...' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => handlePageChange(page as number)}
                  isActive={currentPage === page}
                  className={`cursor-pointer transition-colors ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                      : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
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
                  : 'cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors'
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

