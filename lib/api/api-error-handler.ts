/**
 * API Error Handling Utilities
 *
 * Provides consistent error handling, formatting, and user-friendly error messages
 * across all API interactions.
 */

export interface APIError {
  error: string;
  message?: string;
  details?: any;
  status?: number;
}

export class APIException extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.name = 'APIException';
    this.status = status;
    this.details = details;
  }
}

/**
 * Extract a user-friendly error message from various error formats
 */
export function extractErrorMessage(error: unknown): string {
  // Handle APIException
  if (error instanceof APIException) {
    return error.message;
  }

  // Handle standard Error
  if (error instanceof Error) {
    return error.message;
  }

  // Handle API error objects
  if (typeof error === 'object' && error !== null) {
    const apiError = error as Partial<APIError>;

    // Try different common error message fields
    if (apiError.message) return apiError.message;
    if (apiError.error) return apiError.error;
    if (apiError.details && typeof apiError.details === 'string') {
      return apiError.details;
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Fallback
  return 'An unexpected error occurred';
}

/**
 * Parse API error from fetch response
 */
export async function parseAPIError(response: Response): Promise<APIException> {
  const status = response.status;

  try {
    const data = await response.json();
    const message = extractErrorMessage(data);
    return new APIException(message, status, data);
  } catch {
    // If response is not JSON, use status text
    return new APIException(response.statusText || 'Request failed', status);
  }
}

/**
 * Create consistent error response for API routes
 */
export function createErrorResponse(
  status: number,
  message: string,
  details?: any
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Common API error responses
 */
export const ErrorResponses = {
  badRequest: (message = 'Invalid request') =>
    createErrorResponse(400, message),

  unauthorized: (message = 'Authentication required') =>
    createErrorResponse(401, message),

  forbidden: (message = 'Access denied') => createErrorResponse(403, message),

  notFound: (message = 'Resource not found') =>
    createErrorResponse(404, message),

  conflict: (message = 'Resource conflict') =>
    createErrorResponse(409, message),

  unprocessable: (message = 'Validation failed', details?: any) =>
    createErrorResponse(422, message, details),

  tooManyRequests: (message = 'Too many requests', retryAfter?: number) => {
    const response = createErrorResponse(429, message);
    if (retryAfter) {
      response.headers.set('Retry-After', retryAfter.toString());
    }
    return response;
  },

  serverError: (message = 'Internal server error', details?: any) =>
    createErrorResponse(500, message, details),

  serviceUnavailable: (message = 'Service temporarily unavailable') =>
    createErrorResponse(503, message),
};

/**
 * Retry a failed API call with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = error => {
      // Retry on network errors and 5xx server errors
      if (error instanceof APIException) {
        return error.status >= 500;
      }
      return true;
    },
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts or if we shouldn't retry this error
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Safe fetch wrapper with consistent error handling
 */
export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw await parseAPIError(response);
    }

    return await response.json();
  } catch (error) {
    // Re-throw APIException as-is
    if (error instanceof APIException) {
      throw error;
    }

    // Wrap other errors
    throw new APIException(extractErrorMessage(error), 500, error);
  }
}

/**
 * Type guard for API error objects
 */
export function isAPIError(value: unknown): value is APIError {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('error' in value || 'message' in value)
  );
}

/**
 * Get user-friendly error message for specific HTTP status codes
 */
export function getStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'The request was invalid',
    401: 'Please log in to continue',
    403: "You don't have permission to perform this action",
    404: 'The requested resource was not found',
    409: 'This operation conflicts with existing data',
    422: 'The provided data is invalid',
    429: 'Too many requests. Please slow down',
    500: 'An internal server error occurred',
    502: 'The server is temporarily unavailable',
    503: 'The service is currently under maintenance',
  };

  return messages[status] || `Request failed with status ${status}`;
}

/**
 * Log API errors with context (useful for debugging)
 */
export function logAPIError(
  error: unknown,
  context?: Record<string, any>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔴 API Error');
    console.error('Error:', error);
    if (context) {
      console.error('Context:', context);
    }
    if (error instanceof APIException) {
      console.error('Status:', error.status);
      console.error('Details:', error.details);
    }
    console.groupEnd();
  }
}
