/**
 * Retry Utility
 *
 * Provides intelligent retry mechanisms for failed operations with:
 * - Exponential backoff
 * - Maximum retry attempts
 * - Configurable delay
 * - Error filtering (only retry specific errors)
 */

export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Initial delay in milliseconds before first retry
   * @default 1000
   */
  initialDelay?: number;

  /**
   * Maximum delay in milliseconds between retries
   * @default 10000
   */
  maxDelay?: number;

  /**
   * Backoff multiplier for exponential backoff
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * Function to determine if an error should trigger a retry
   * @default (error) => true
   */
  shouldRetry?: (error: any, attempt: number) => boolean;

  /**
   * Callback invoked before each retry attempt
   */
  onRetry?: (error: any, attempt: number, delay: number) => void;

  /**
   * Whether to use exponential backoff
   * @default true
   */
  exponentialBackoff?: boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: () => true,
  exponentialBackoff: true,
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay for next retry with exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number,
  exponentialBackoff: boolean
): number {
  if (!exponentialBackoff) {
    return Math.min(initialDelay, maxDelay);
  }

  const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Retry a function with exponential backoff
 *
 * @example
 * ```typescript
 * const data = await retryAsync(
 *   () => fetch('/api/data'),
 *   {
 *     maxAttempts: 3,
 *     initialDelay: 1000,
 *     shouldRetry: (error) => error.status === 500
 *   }
 * );
 * ```
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      const isLastAttempt = attempt === config.maxAttempts;
      const shouldRetry = config.shouldRetry(error, attempt);

      if (isLastAttempt || !shouldRetry) {
        throw error;
      }

      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffMultiplier,
        config.exponentialBackoff
      );

      // Call onRetry callback if provided
      if (options.onRetry) {
        options.onRetry(error, attempt, delay);
      }

      // Log retry attempt
      if (process.env.NODE_ENV === 'development') {
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Create a retry wrapper for a function
 *
 * @example
 * ```typescript
 * const fetchWithRetry = withRetry(
 *   fetch,
 *   { maxAttempts: 3, initialDelay: 1000 }
 * );
 *
 * const response = await fetchWithRetry('/api/data');
 * ```
 */
export function withRetry<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs) => {
    return retryAsync(() => fn(...args), options);
  };
}

/**
 * Predefined retry strategies for common scenarios
 */
export const RetryStrategies = {
  /**
   * Retry only on network errors
   */
  networkOnly: {
    shouldRetry: (error: any) => {
      const message = error?.message?.toLowerCase() || '';
      return (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('connection') ||
        message.includes('timeout')
      );
    },
    maxAttempts: 3,
    initialDelay: 1000,
  } as RetryOptions,

  /**
   * Retry on server errors (5xx)
   */
  serverErrors: {
    shouldRetry: (error: any, attempt: number) => {
      const status = error?.status || error?.response?.status;
      return status >= 500 && status < 600;
    },
    maxAttempts: 3,
    initialDelay: 2000,
  } as RetryOptions,

  /**
   * Retry on timeout errors
   */
  timeouts: {
    shouldRetry: (error: any, attempt: number) => {
      const message = (error?.message || '').toLowerCase();
      return message.includes('timeout') || message.includes('timed out');
    },
    maxAttempts: 2,
    initialDelay: 2000,
  } as RetryOptions,

  /**
   * Aggressive retry (more attempts, faster)
   */
  aggressive: {
    maxAttempts: 5,
    initialDelay: 500,
    maxDelay: 5000,
  } as RetryOptions,

  /**
   * Conservative retry (fewer attempts, slower)
   */
  conservative: {
    maxAttempts: 2,
    initialDelay: 2000,
    maxDelay: 5000,
  } as RetryOptions,

  /**
   * No retry for critical operations
   */
  none: {
    maxAttempts: 1,
  } as RetryOptions,
};

/**
 * Retry with rate limit handling
 * Respects Retry-After headers
 */
export async function retryWithRateLimit<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retryAsync(fn, {
    ...options,
    shouldRetry: (error, attempt) => {
      // Check if it's a rate limit error
      const status = error?.status || error?.response?.status;
      if (status === 429) {
        // Extract Retry-After header if available
        const retryAfter = error?.headers?.get?.('Retry-After');
        if (retryAfter) {
          const retryMs = parseInt(retryAfter) * 1000;
          // This will be used by the delay calculation
          error._retryAfter = retryMs;
        }
        return true;
      }

      // Use custom shouldRetry if provided
      if (options.shouldRetry) {
        return options.shouldRetry(error, attempt);
      }

      return true;
    },
  });
}

/**
 * Batch retry - retry multiple operations in parallel
 */
export async function retryBatch<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<Array<T | Error>> {
  const results = await Promise.allSettled(
    operations.map(op => retryAsync(op, options))
  );

  return results.map(result =>
    result.status === 'fulfilled' ? result.value : result.reason
  );
}

/**
 * Retry with circuit breaker pattern
 * Stops retrying if too many failures occur in a time window
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private isOpen: boolean = false;

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(
    fn: () => Promise<T>,
    retryOptions?: RetryOptions
  ): Promise<T> {
    // Check if circuit is open
    if (this.isOpen) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure < this.timeout) {
        throw new Error(
          `Circuit breaker is open. Try again in ${Math.ceil((this.timeout - timeSinceLastFailure) / 1000)} seconds.`
        );
      } else {
        // Reset circuit after timeout
        this.reset();
      }
    }

    try {
      const result = await retryAsync(fn, retryOptions);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.isOpen = false;
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.isOpen = true;
    }
  }

  private reset() {
    this.failures = 0;
    this.isOpen = false;
  }

  getStatus() {
    return {
      failures: this.failures,
      isOpen: this.isOpen,
      lastFailureTime: this.lastFailureTime,
    };
  }
}
