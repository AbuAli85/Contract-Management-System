/**
 * Performance Utility Functions
 * Helpers for optimizing React performance and user experience
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Debounce hook - delays execution until user stops typing
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
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

/**
 * Throttle hook - limits execution rate
 */
export function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();

    if (now >= lastExecuted.current + interval) {
      lastExecuted.current = now;
      setThrottledValue(value);
    } else {
      const timerId = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, interval);

      return () => clearTimeout(timerId);
    }

    return undefined;
  }, [value, interval]);

  return throttledValue;
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry?.isIntersecting || false);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

/**
 * Window size hook with debouncing
 */
export function useWindowSize(debounceMs: number = 150) {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceMs);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [debounceMs]);

  return windowSize;
}

/**
 * Prefetch hook for data prefetching
 */
export function usePrefetch<T>(fetchFn: () => Promise<T>, delay: number = 500) {
  const [isPrefetching, setIsPrefetching] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const startPrefetch = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsPrefetching(true);
      fetchFn()
        .then(() => setIsPrefetching(false))
        .catch(() => setIsPrefetching(false));
    }, delay);
  }, [fetchFn, delay]);

  const cancelPrefetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsPrefetching(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { startPrefetch, cancelPrefetch, isPrefetching };
}

/**
 * Optimistic update helper
 */
export function useOptimisticUpdate<T>(
  initialValue: T,
  updateFn: (value: T) => Promise<T>
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const previousValueRef = useRef<T>(initialValue);

  const update = useCallback(
    async (newValue: T) => {
      previousValueRef.current = value;
      setValue(newValue);
      setIsPending(true);
      setError(null);

      try {
        const result = await updateFn(newValue);
        setValue(result);
      } catch (err) {
        // Rollback on error
        setValue(previousValueRef.current);
        setError(err instanceof Error ? err : new Error('Update failed'));
      } finally {
        setIsPending(false);
      }
    },
    [value, updateFn]
  );

  return { value, update, isPending, error };
}

/**
 * Request deduplication
 */
export function createDeduplicatedFetcher<T>() {
  const cache = new Map<string, Promise<T>>();

  return async function fetch(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const promise = fetcher();
    cache.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      // Remove from cache after completion
      setTimeout(() => cache.delete(key), 1000);
    }
  };
}

/**
 * Virtual scrolling calculations
 */
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  return { startIndex, endIndex, visibleCount: endIndex - startIndex + 1 };
}

/**
 * Measure performance of a function
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  label?: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);

    // Handle async functions
    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now();
        console.log(`⏱️ ${label || fn.name}: ${(end - start).toFixed(2)}ms`);
      });
    }

    const end = performance.now();
    console.log(`⏱️ ${label || fn.name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }) as T;
}

/**
 * Batch updates to reduce renders
 */
export function useBatchedUpdates<T>(
  initialValue: T,
  delay: number = 50
): [T, (update: Partial<T>) => void, () => void] {
  const [value, setValue] = useState<T>(initialValue);
  const pendingUpdatesRef = useRef<Partial<T>>({});
  const timeoutRef = useRef<NodeJS.Timeout>();

  const queueUpdate = useCallback(
    (update: Partial<T>) => {
      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        ...update,
      };

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setValue(prev => ({
          ...prev,
          ...pendingUpdatesRef.current,
        }));
        pendingUpdatesRef.current = {};
      }, delay);
    },
    [delay]
  );

  const flushUpdates = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (Object.keys(pendingUpdatesRef.current).length > 0) {
      setValue(prev => ({
        ...prev,
        ...pendingUpdatesRef.current,
      }));
      pendingUpdatesRef.current = {};
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, queueUpdate, flushUpdates];
}

/**
 * Idle callback hook - run tasks when browser is idle
 */
export function useIdleCallback(
  callback: () => void,
  dependencies: any[] = []
) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('requestIdleCallback' in window)) {
      // Fallback for browsers that don't support requestIdleCallback
      const timeoutId = setTimeout(callback, 1);
      return () => clearTimeout(timeoutId);
    }

    const handle = window.requestIdleCallback(callback, { timeout: 2000 });

    return () => window.cancelIdleCallback(handle);
  }, dependencies);
}
