/**
 * Retry helper with exponential backoff
 * Based on MCP server patterns for resilient authentication
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Retries a function with exponential backoff
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => supabase.auth.getUser(),
 *   {
 *     maxRetries: 3,
 *     onRetry: (attempt, error) => console.warn(`Retry ${attempt}:`, error)
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 100,
    maxDelayMs = 1000,
    onRetry,
    shouldRetry = error => {
      // Retry on network errors, timeouts, and transient DB errors
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('econnreset') ||
        message.includes('etimedout') ||
        message.includes('temporary') ||
        message.includes('transient')
      );
    },
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (!shouldRetry(lastError)) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        const delay = Math.min(
          initialDelayMs * Math.pow(2, attempt),
          maxDelayMs
        );

        onRetry?.(attempt + 1, lastError);

        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError || new Error('Unknown error during retry');
}

/**
 * Retries a Supabase operation with backoff
 * Handles Supabase-specific error patterns
 */
export async function retrySupabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  return retryWithBackoff(
    async () => {
      const result = await operation();

      // If there's an error, check if it's retryable
      if (result.error) {
        const errorMessage = result.error.message?.toLowerCase() || '';
        const isRetryable =
          errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('temporary') ||
          result.error.status === 408 || // Request Timeout
          result.error.status === 429 || // Too Many Requests
          result.error.status === 503; // Service Unavailable

        if (isRetryable) {
          throw new Error(result.error.message || 'Supabase operation failed');
        }
      }

      return result;
    },
    {
      shouldRetry: error => {
        // Don't retry auth errors (401, 403) or validation errors (400)
        const message = error.message.toLowerCase();
        if (
          message.includes('unauthorized') ||
          message.includes('forbidden') ||
          message.includes('invalid') ||
          message.includes('validation')
        ) {
          return false;
        }
        return true;
      },
      ...options,
    }
  );
}
