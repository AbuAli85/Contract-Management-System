'use client';

import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Performance optimization utilities for Promoter Intelligence Hub
 * Provides memoization, caching, and performance monitoring
 */

// Memoized component wrapper
export function withPerformanceOptimization<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
) {
  const MemoizedComponent = memo(Component);
  MemoizedComponent.displayName = displayName || Component.displayName || 'MemoizedComponent';
  return MemoizedComponent;
}

// Debounce hook for search and filters
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange.start, visibleRange.end]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(
          `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (target: <16ms)`
        );
      }
    };
  });

  return useCallback((operation: string) => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (process.env.NODE_ENV === 'development' && duration > 100) {
        console.warn(
          `[Performance] ${componentName}.${operation} took ${duration.toFixed(2)}ms`
        );
      }
    };
  }, [componentName]);
}

// Optimized data fetching with caching
export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    staleTime?: number;
    gcTime?: number;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10 minutes default
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: false, // Use cache if available
    retry: 1, // Reduce retries for better performance
  });
}

// Batch operations hook
export function useBatchOperations<T>(
  items: T[],
  batchSize: number = 50
) {
  const [currentBatch, setCurrentBatch] = useState(0);

  const batches = useMemo(() => {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      result.push(items.slice(i, i + batchSize));
    }
    return result;
  }, [items, batchSize]);

  const currentBatchItems = useMemo(() => {
    return batches[currentBatch] || [];
  }, [batches, currentBatch]);

  const hasMore = currentBatch < batches.length - 1;
  const hasPrevious = currentBatch > 0;

  const loadNext = useCallback(() => {
    if (hasMore) {
      setCurrentBatch(prev => prev + 1);
    }
  }, [hasMore]);

  const loadPrevious = useCallback(() => {
    if (hasPrevious) {
      setCurrentBatch(prev => prev - 1);
    }
  }, [hasPrevious]);

  return {
    currentBatchItems,
    currentBatch,
    totalBatches: batches.length,
    hasMore,
    hasPrevious,
    loadNext,
    loadPrevious,
  };
}

