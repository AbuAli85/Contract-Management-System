/**
 * React Hooks for Retry Logic
 *
 * Provides easy-to-use hooks for handling retries in React components
 */

import { useState, useCallback, useRef } from 'react';
import { retryAsync, RetryStrategies } from '@/lib/utils/retry';
import type { RetryOptions } from '@/lib/utils/retry';

interface UseRetryResult<T> {
  /** Current data */
  data: T | null;
  /** Error from last failed attempt */
  error: Error | null;
  /** Whether operation is currently running */
  isLoading: boolean;
  /** Whether operation is currently retrying */
  isRetrying: boolean;
  /** Current retry attempt number (0 if not retrying) */
  retryAttempt: number;
  /** Execute the operation with retry logic */
  execute: (...args: any[]) => Promise<T>;
  /** Reset the state */
  reset: () => void;
}

/**
 * Hook for operations with automatic retry logic
 *
 * @example
 * ```tsx
 * const { data, error, isLoading, execute } = useRetry(
 *   async (id: string) => {
 *     const res = await fetch(`/api/contracts/${id}`);
 *     return res.json();
 *   },
 *   { maxAttempts: 3, initialDelay: 1000 }
 * );
 *
 * useEffect(() => {
 *   execute('contract-id');
 * }, []);
 * ```
 */
export function useRetry<T, TArgs extends any[]>(
  fn: (...args: TArgs) => Promise<T>,
  options: RetryOptions = {}
): UseRetryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const isMounted = useRef(true);

  const execute = useCallback(
    async (...args: TArgs): Promise<T> => {
      setIsLoading(true);
      setError(null);
      setRetryAttempt(0);

      try {
        const result = await retryAsync(() => fn(...args), {
          ...options,
          onRetry: (err, attempt, delay) => {
            if (isMounted.current) {
              setIsRetrying(true);
              setRetryAttempt(attempt);
            }
            // Call user's onRetry if provided
            options.onRetry?.(err, attempt, delay);
          },
        });

        if (isMounted.current) {
          setData(result);
          setIsRetrying(false);
          setRetryAttempt(0);
        }

        return result;
      } catch (err) {
        if (isMounted.current) {
          setError(err as Error);
          setIsRetrying(false);
          setRetryAttempt(0);
        }
        throw err;
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    },
    [fn, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsRetrying(false);
    setRetryAttempt(0);
  }, []);

  return {
    data,
    error,
    isLoading,
    isRetrying,
    retryAttempt,
    execute,
    reset,
  };
}

/**
 * Hook for API fetch operations with automatic retry
 *
 * @example
 * ```tsx
 * const { data, error, isLoading, refetch } = useFetchWithRetry(
 *   '/api/contracts',
 *   { maxAttempts: 3 }
 * );
 * ```
 */
export function useFetchWithRetry<T>(
  url: string,
  fetchOptions?: RequestInit,
  retryOptions?: RetryOptions
) {
  const fetchFn = useCallback(async () => {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const error: any = new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
      error.status = response.status;
      error.response = response;
      throw error;
    }

    return response.json() as Promise<T>;
  }, [url, fetchOptions]);

  return useRetry(fetchFn, {
    ...RetryStrategies.networkOnly,
    ...retryOptions,
  });
}

/**
 * Hook for mutations with retry logic
 *
 * @example
 * ```tsx
 * const { mutate, isLoading, error } = useMutationWithRetry(
 *   async (data) => {
 *     const res = await fetch('/api/contracts', {
 *       method: 'POST',
 *       body: JSON.stringify(data)
 *     });
 *     return res.json();
 *   }
 * );
 *
 * <Button onClick={() => mutate({ name: 'New Contract' })}>
 *   Create
 * </Button>
 * ```
 */
export function useMutationWithRetry<T, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<T>,
  options: RetryOptions & {
    onSuccess?: (data: T, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
  } = {}
) {
  const { onSuccess, onError, ...retryOptions } = options;

  const { execute, ...rest } = useRetry(mutationFn, retryOptions);

  const mutate = useCallback(
    async (variables: TVariables) => {
      try {
        const result = await execute(variables);
        onSuccess?.(result, variables);
        return result;
      } catch (error) {
        onError?.(error as Error, variables);
        throw error;
      }
    },
    [execute, onSuccess, onError]
  );

  return {
    mutate,
    ...rest,
  };
}

/**
 * Hook for operations with exponential backoff and toast notifications
 *
 * @example
 * ```tsx
 * const { execute, isLoading } = useRetryWithToast(
 *   async () => fetchContracts(),
 *   {
 *     successMessage: 'Contracts loaded!',
 *     errorMessage: 'Failed to load contracts'
 *   }
 * );
 * ```
 */
export function useRetryWithToast<T, TArgs extends any[]>(
  fn: (...args: TArgs) => Promise<T>,
  messages: {
    successMessage?: string;
    errorMessage?: string;
    retryMessage?: string;
  } = {},
  retryOptions?: RetryOptions
) {
  // Note: Import toast dynamically in the component using this hook
  return useRetry(fn, {
    ...retryOptions,
    onRetry: (error, attempt, delay) => {
      // Users can import and use toast in their onRetry callback
      retryOptions?.onRetry?.(error, attempt, delay);
    },
  });
}
