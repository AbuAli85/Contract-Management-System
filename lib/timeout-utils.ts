/**
 * Timeout utilities for API routes to prevent FUNCTION_INVOCATION_TIMEOUT errors
 */

export interface TimeoutConfig {
  timeoutMs: number;
  errorMessage?: string;
}

export interface TimeoutResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime: number;
  timedOut: boolean;
}

/**
 * Wraps an async function with timeout handling
 * @param fn - The async function to execute
 * @param config - Timeout configuration
 * @returns Promise with timeout handling
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  config: TimeoutConfig
): Promise<TimeoutResult<T>> {
  const startTime = Date.now();
  const { timeoutMs, errorMessage = 'Operation timeout' } = config;

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeoutMs);
    });

    // Race between the function and timeout
    const result = await Promise.race([fn(), timeoutPromise]);
    const processingTime = Date.now() - startTime;

    return {
      success: true,
      data: result,
      processingTime,
      timedOut: false,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const isTimeout = error instanceof Error && error.message === errorMessage;

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
      timedOut: isTimeout,
    };
  }
}

/**
 * Standard timeout configurations for different API operations
 */
export const TIMEOUT_CONFIGS = {
  // Quick operations (authentication, simple queries)
  QUICK: { timeoutMs: 10000, errorMessage: 'Quick operation timeout' },

  // Standard operations (CRUD operations, moderate queries)
  STANDARD: { timeoutMs: 30000, errorMessage: 'Standard operation timeout' },

  // Heavy operations (complex queries, file processing)
  HEAVY: { timeoutMs: 60000, errorMessage: 'Heavy operation timeout' },

  // PDF generation (file creation, external API calls)
  PDF_GENERATION: { timeoutMs: 120000, errorMessage: 'PDF generation timeout' },

  // Contract generation (multiple API calls, webhooks)
  CONTRACT_GENERATION: {
    timeoutMs: 90000,
    errorMessage: 'Contract generation timeout',
  },

  // Webhook processing (external integrations)
  WEBHOOK: { timeoutMs: 60000, errorMessage: 'Webhook processing timeout' },

  // Analytics (complex aggregations)
  ANALYTICS: { timeoutMs: 45000, errorMessage: 'Analytics processing timeout' },
} as const;

/**
 * Creates a timeout wrapper for API route handlers
 * @param handler - The API route handler function
 * @param config - Timeout configuration
 * @returns Wrapped handler with timeout protection
 */
export function createTimeoutHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  config: TimeoutConfig
) {
  return async (...args: T): Promise<R> => {
    const result = await withTimeout(() => handler(...args), config);

    if (!result.success) {
      if (result.timedOut) {
        throw new Error(`Operation timed out after ${result.processingTime}ms`);
      } else {
        throw new Error(result.error || 'Operation failed');
      }
    }

    return result.data!;
  };
}

/**
 * Logs timeout information for monitoring
 * @param operation - Operation name
 * @param processingTime - Time taken
 * @param timedOut - Whether operation timed out
 */
export function logTimeoutInfo(
  operation: string,
  processingTime: number,
  timedOut: boolean
) {
  const level = timedOut ? 'error' : processingTime > 30000 ? 'warn' : 'info';
  const message = `${operation} ${timedOut ? 'timed out' : 'completed'} in ${processingTime}ms`;

  console[level](message);

  // In production, you might want to send this to a monitoring service
  if (timedOut || processingTime > 30000) {
    // Example: Send to monitoring service
    // monitoringService.recordTimeout(operation, processingTime, timedOut);
  }
}
