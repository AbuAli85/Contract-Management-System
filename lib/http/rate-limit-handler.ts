/**
 * Client-side handler for rate limit errors
 * Shows user-friendly messages when rate limits are exceeded
 */

import { toast } from 'sonner';

export interface RateLimitError {
  error: string;
  message: string;
  retryAfter?: number;
  resetAt?: string;
  limit?: number;
  remaining?: number;
}

/**
 * Check if a response is a rate limit error
 */
export function isRateLimitError(response: Response): boolean {
  return response.status === 429;
}

/**
 * Parse rate limit error from response
 */
export async function parseRateLimitError(
  response: Response
): Promise<RateLimitError | null> {
  if (!isRateLimitError(response)) {
    return null;
  }

  try {
    const data = await response.json();
    return data as RateLimitError;
  } catch (error) {
    return {
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
    };
  }
}

/**
 * Show user-friendly toast for rate limit errors
 */
export function showRateLimitToast(error: RateLimitError) {
  const retryMinutes = error.retryAfter
    ? Math.ceil(error.retryAfter / 60)
    : null;

  let message = error.message;
  if (retryMinutes && retryMinutes > 1) {
    message += ` (Try again in ${retryMinutes} minute${retryMinutes > 1 ? 's' : ''})`;
  } else if (error.retryAfter) {
    message += ` (Try again in ${error.retryAfter} second${error.retryAfter > 1 ? 's' : ''})`;
  }

  toast.error(message, {
    duration: 5000,
    description: error.resetAt
      ? `Rate limit resets at ${new Date(error.resetAt).toLocaleTimeString()}`
      : undefined,
  });
}

/**
 * Get rate limit info from response headers
 */
export function getRateLimitInfo(response: Response): {
  limit: number | null;
  remaining: number | null;
  reset: string | null;
  retryAfter: number | null;
} {
  return {
    limit: response.headers.get('X-RateLimit-Limit')
      ? parseInt(response.headers.get('X-RateLimit-Limit')!)
      : null,
    remaining: response.headers.get('X-RateLimit-Remaining')
      ? parseInt(response.headers.get('X-RateLimit-Remaining')!)
      : null,
    reset: response.headers.get('X-RateLimit-Reset'),
    retryAfter: response.headers.get('Retry-After')
      ? parseInt(response.headers.get('Retry-After')!)
      : null,
  };
}

/**
 * Enhance fetch to automatically handle rate limit errors
 */
export async function fetchWithRateLimitHandling(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, options);

  if (isRateLimitError(response)) {
    const error = await parseRateLimitError(response);
    if (error) {
      showRateLimitToast(error);
    }
  }

  return response;
}
