'use server';

import { cookies } from 'next/headers';
import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';

interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export async function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
) {
  const cookieStore = await Promise.resolve(cookies());
  cookieStore.set({
    name,
    value,
    path: options.path ?? '/',
    sameSite: options.sameSite ?? 'lax',
    secure: process.env.NODE_ENV === 'production' || options.secure,
    ...options,
  });
}

export async function removeCookie(name: string) {
  const cookieStore = await Promise.resolve(cookies());
  cookieStore.delete(name);
}

export async function getCookie(name: string): Promise<string | undefined> {
  const cookieStore = await Promise.resolve(cookies());
  const cookie: RequestCookie | undefined = cookieStore.get(name);
  return cookie?.value;
}

// Centralized error formatting for authentication errors
export function formatAuthError(error: any): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle Supabase auth errors
  if (error.message) {
    const message = error.message.toLowerCase();

    // Common Supabase auth error mappings
    if (message.includes('invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (message.includes('email not confirmed')) {
      return 'Please check your email and confirm your account before signing in.';
    }
    if (message.includes('too many requests')) {
      return 'Too many login attempts. Please wait a few minutes before trying again.';
    }
    if (message.includes('user not found')) {
      return 'No account found with this email address.';
    }
    if (message.includes('weak password')) {
      return 'Password is too weak. Please choose a stronger password.';
    }
    if (message.includes('email already registered')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    return error.message;
  }

  // Handle objects with error property
  if (error.error) {
    return formatAuthError(error.error);
  }

  // Handle objects with message property
  if (error.message) {
    return error.message;
  }

  // Fallback for unknown error types
  return 'An unexpected error occurred. Please try again.';
}

// Error types for better type safety
export interface AuthError {
  code?: string;
  message: string;
  status?: number;
}

// Specific error formatters for different auth flows
export function formatSignInError(error: any): string {
  const message = formatAuthError(error);

  // Additional sign-in specific formatting
  if (message.includes('Invalid email or password')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }

  return message;
}

export function formatSignUpError(error: any): string {
  const message = formatAuthError(error);

  // Additional sign-up specific formatting
  if (message.includes('email already registered')) {
    return 'An account with this email already exists. Please sign in or use a different email address.';
  }

  return message;
}

export function formatPasswordResetError(error: any): string {
  const message = formatAuthError(error);

  // Additional password reset specific formatting
  if (message.includes('user not found')) {
    return 'If an account with this email exists, you will receive a password reset link.';
  }

  return message;
}

// Network error detection
export function isNetworkError(error: any): boolean {
  if (!error) return false;

  const message = typeof error === 'string' ? error : error.message || '';
  return (
    message.toLowerCase().includes('network') ||
    message.toLowerCase().includes('fetch') ||
    message.toLowerCase().includes('connection')
  );
}

// Rate limiting error detection
export function isRateLimitError(error: any): boolean {
  if (!error) return false;

  const message = typeof error === 'string' ? error : error.message || '';
  return (
    message.toLowerCase().includes('too many requests') ||
    message.toLowerCase().includes('rate limit')
  );
}

// Session expiry error detection
export function isSessionExpiredError(error: any): boolean {
  if (!error) return false;

  const message = typeof error === 'string' ? error : error.message || '';
  return (
    message.toLowerCase().includes('jwt expired') ||
    message.toLowerCase().includes('token expired') ||
    message.toLowerCase().includes('session expired')
  );
}
