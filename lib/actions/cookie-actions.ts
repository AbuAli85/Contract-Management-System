import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Cookie management utilities for authentication and session handling
 */

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

export const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Set a cookie in the response
 */
export function setCookie(
  response: NextResponse,
  name: string,
  value: string,
  options: CookieOptions = {}
): NextResponse {
  const cookieOptions = { ...DEFAULT_COOKIE_OPTIONS, ...options };
  
  response.cookies.set(name, value, cookieOptions);
  return response;
}

/**
 * Get a cookie value from the request
 */
export function getCookie(request: NextRequest, name: string): string | undefined {
  return request.cookies.get(name)?.value;
}

/**
 * Get a cookie value from server-side cookies
 */
export function getServerCookie(name: string): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get(name)?.value;
}

/**
 * Delete a cookie by setting it to expire
 */
export function deleteCookie(
  response: NextResponse,
  name: string,
  options: CookieOptions = {}
): NextResponse {
  const cookieOptions = { 
    ...DEFAULT_COOKIE_OPTIONS, 
    ...options,
    maxAge: 0,
    expires: new Date(0)
  };
  
  response.cookies.set(name, '', cookieOptions);
  return response;
}

/**
 * Set authentication cookies
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  options: CookieOptions = {}
): NextResponse {
  // Set access token with shorter expiry
  setCookie(response, 'access_token', accessToken, {
    ...options,
    maxAge: 60 * 60, // 1 hour
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });

  // Set refresh token with longer expiry
  setCookie(response, 'refresh_token', refreshToken, {
    ...options,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  deleteCookie(response, 'access_token');
  deleteCookie(response, 'refresh_token');
  return response;
}

/**
 * Get authentication tokens from cookies
 */
export function getAuthTokens(request: NextRequest): {
  accessToken?: string;
  refreshToken?: string;
} {
  const accessToken = getCookie(request, 'access_token');
  const refreshToken = getCookie(request, 'refresh_token');
  
  return {
    ...(accessToken && { accessToken }),
    ...(refreshToken && { refreshToken }),
  };
}

/**
 * Get authentication tokens from server-side cookies
 */
export function getServerAuthTokens(): {
  accessToken?: string;
  refreshToken?: string;
} {
  const accessToken = getServerCookie('access_token');
  const refreshToken = getServerCookie('refresh_token');
  
  return {
    ...(accessToken && { accessToken }),
    ...(refreshToken && { refreshToken }),
  };
}

/**
 * Check if a cookie exists
 */
export function hasCookie(request: NextRequest, name: string): boolean {
  return request.cookies.has(name);
}

/**
 * Check if a server-side cookie exists
 */
export function hasServerCookie(name: string): boolean {
  const cookieStore = cookies();
  return cookieStore.has(name);
}

/**
 * Get all cookies from the request
 */
export function getAllCookies(request: NextRequest): Record<string, string> {
  const cookieMap: Record<string, string> = {};
  request.cookies.getAll().forEach(cookie => {
    cookieMap[cookie.name] = cookie.value;
  });
  return cookieMap;
}

/**
 * Get all server-side cookies
 */
export function getAllServerCookies(): Record<string, string> {
  const cookieStore = cookies();
  const cookieMap: Record<string, string> = {};
  cookieStore.getAll().forEach(cookie => {
    cookieMap[cookie.name] = cookie.value;
  });
  return cookieMap;
}

// ========================================
// 🚨 AUTHENTICATION ERROR HANDLING
// ========================================

export interface FormattedAuthError {
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
  retryable: boolean;
}

/**
 * Format authentication errors for user display
 */
export function formatAuthError(error: any): FormattedAuthError {
  if (!error) {
    return {
      message: 'An unknown authentication error occurred',
      severity: 'error',
      code: 'UNKNOWN_ERROR',
      retryable: false,
    };
  }

  const errorMessage = error.message || 'Authentication error';
  const errorCode = error.code || 'AUTH_ERROR';

  // Network-related errors
  if (isNetworkError(error)) {
    return {
      message: `Network error: ${errorMessage}`,
      severity: 'error',
      code: errorCode,
      retryable: true,
    };
  }

  // Rate limiting errors
  if (isRateLimitError(error)) {
    return {
      message: 'Too many attempts. Please try again later.',
      severity: 'warning',
      code: 'RATE_LIMIT',
      retryable: true,
    };
  }

  // Session expired errors
  if (isSessionExpiredError(error)) {
    return {
      message: 'Your session has expired. Please sign in again.',
      severity: 'info',
      code: 'SESSION_EXPIRED',
      retryable: false,
    };
  }

  // Invalid credentials
  if (errorCode === 'INVALID_CREDENTIALS' || errorMessage.includes('Invalid credentials')) {
    return {
      message: 'Invalid email or password',
      severity: 'error',
      code: errorCode,
      retryable: false,
    };
  }

  // Account locked
  if (errorCode === 'ACCOUNT_LOCKED' || errorMessage.includes('locked')) {
    return {
      message: 'Account temporarily locked. Please try again later.',
      severity: 'warning',
      code: errorCode,
      retryable: true,
    };
  }

  // Default error
  return {
    message: errorMessage,
    severity: 'error',
    code: errorCode,
    retryable: false,
  };
}

/**
 * Check if error is network-related
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const networkCodes = [
    'NETWORK_ERROR',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNRESET',
    'ENETUNREACH',
  ];
  
  return (
    networkCodes.includes(error.code) ||
    error.message?.includes('network') ||
    error.message?.includes('connection') ||
    error.message?.includes('timeout')
  );
}

/**
 * Check if error is rate limit related
 */
export function isRateLimitError(error: any): boolean {
  if (!error) return false;
  
  return (
    error.code === 'RATE_LIMIT_EXCEEDED' ||
    error.message?.includes('rate limit') ||
    error.message?.includes('too many') ||
    error.message?.includes('throttled')
  );
}

/**
 * Check if error is session expired
 */
export function isSessionExpiredError(error: any): boolean {
  if (!error) return false;
  
  return (
    error.code === 'SESSION_EXPIRED' ||
    error.code === 'TOKEN_EXPIRED' ||
    error.message?.includes('session expired') ||
    error.message?.includes('token expired') ||
    error.message?.includes('unauthorized')
  );
}

// ========================================
// 🔄 SESSION MANAGEMENT
// ========================================

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Check if a session is expired
 */
export function isSessionExpired(session: Session | null): boolean {
  if (!session) return true;
  
  const now = Date.now();
  const expiresAt = session.expires_at * 1000; // Convert to milliseconds
  
  return now >= expiresAt;
}

/**
 * Refresh session using refresh token
 */
export async function refreshSession(session: { refresh_token: string }): Promise<{ data: Session | null; error: any }> {
  try {
    // Mock implementation for testing
    // In real implementation, this would call your auth API
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: session.refresh_token,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh session');
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
