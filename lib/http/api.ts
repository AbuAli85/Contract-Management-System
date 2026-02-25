// Auto base URL + fetch wrapper for same-origin client calls and absolute server calls

import { toast } from 'sonner';

export function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');
  return appUrl.replace(/\/+$/, '');
}

export function apiUrl(path: string): string {
  const p = `/${path}`.replace(/\/+/, '/');
  return `${getBaseUrl()}${p}`;
}

/**
 * Enhanced fetch wrapper with rate limit handling
 */
export async function apiFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    ...init,
  });

  // Handle rate limit errors
  if (response.status === 429) {
    const rateLimitInfo = {
      limit: response.headers.get('X-RateLimit-Limit'),
      remaining: response.headers.get('X-RateLimit-Remaining'),
      reset: response.headers.get('X-RateLimit-Reset'),
      retryAfter: response.headers.get('Retry-After'),
    };

    try {
      const errorData = await response.clone().json();
      const retryMinutes = errorData.retryAfter
        ? Math.ceil(errorData.retryAfter / 60)
        : null;

      let message =
        errorData.message || 'Too many requests. Please try again later.';
      if (retryMinutes && retryMinutes > 1) {
        message = `${message.split('.')[0]}. Try again in ${retryMinutes} minute${retryMinutes > 1 ? 's' : ''}.`;
      } else if (errorData.retryAfter) {
        message = `${message.split('.')[0]}. Try again in ${errorData.retryAfter} second${errorData.retryAfter > 1 ? 's' : ''}.`;
      }

      // Show user-friendly toast
      if (typeof window !== 'undefined') {
        toast.error('Rate Limit Exceeded', {
          description: message,
          duration: 5000,
        });
      }

      // Log rate limit info
    } catch (e) {
    }
  }

  return response;
}

export async function apiJson<T>(path: string, init: RequestInit = {}) {
  const res = await apiFetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`
    );
  }
  return (await res.json()) as T;
}
