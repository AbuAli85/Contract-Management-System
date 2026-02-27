'use client';

/**
 * useCSRF — React hook for CSRF token management.
 *
 * Fetches a CSRF token from /api/auth/csrf on mount and provides
 * a helper to include it in fetch requests.
 *
 * Usage:
 *   const { csrfHeaders, isReady } = useCSRF();
 *
 *   await fetch('/api/some-endpoint', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json', ...csrfHeaders },
 *     body: JSON.stringify(data),
 *   });
 */

import { useState, useEffect, useCallback } from 'react';

interface UseCSRFResult {
  csrfToken: string | null;
  csrfHeaders: Record<string, string>;
  isReady: boolean;
  refresh: () => Promise<void>;
}

export function useCSRF(): UseCSRFResult {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.csrfToken) {
          setCsrfToken(data.csrfToken);
        }
      }
    } catch (err) {
      console.error('[useCSRF] Failed to fetch CSRF token:', err);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const csrfHeaders: Record<string, string> = csrfToken
    ? { 'X-CSRF-Token': csrfToken }
    : {};

  return {
    csrfToken,
    csrfHeaders,
    isReady,
    refresh: fetchToken,
  };
}

/**
 * Standalone function to get the CSRF token from the cookie.
 * Use this in non-React contexts (e.g., utility functions).
 */
export function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Add CSRF token to fetch options.
 * Reads from cookie if available, otherwise skips.
 */
export function withCSRF(
  options: RequestInit = {}
): RequestInit {
  const token = getCSRFTokenFromCookie();
  if (!token) return options;

  return {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': token,
    },
  };
}
