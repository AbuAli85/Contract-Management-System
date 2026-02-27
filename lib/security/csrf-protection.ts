/**
 * CSRF Protection Utilities
 *
 * Provides double-submit cookie pattern for CSRF protection.
 * Tokens are generated per-session using cryptographically secure random bytes.
 */

import { randomBytes, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const CSRF_COOKIE_NAME = 'csrf-token';
export const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32; // 256-bit token

/**
 * Generate a cryptographically secure CSRF token.
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Validate a CSRF token using timing-safe comparison.
 */
export function validateCSRFToken(
  headerToken: string | null | undefined,
  cookieToken: string | null | undefined
): boolean {
  if (!headerToken || !cookieToken) return false;
  try {
    const a = Buffer.from(headerToken, 'hex');
    const b = Buffer.from(cookieToken, 'hex');
    if (a.length !== b.length || a.length !== CSRF_TOKEN_LENGTH) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Set a CSRF token cookie on a response.
 * The cookie is NOT httpOnly so the client-side JS can read it.
 */
export function setCSRFCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
}

/**
 * Ensure a CSRF token exists in the response cookies.
 */
export function ensureCSRFToken(
  request: NextRequest,
  response: NextResponse
): string {
  const existing = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (existing && existing.length === CSRF_TOKEN_LENGTH * 2) {
    return existing;
  }
  const token = generateCSRFToken();
  setCSRFCookie(response, token);
  return token;
}

/**
 * Validate CSRF token from an incoming API request.
 */
export function validateRequestCSRF(request: NextRequest): {
  valid: boolean;
  reason?: string;
} {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!cookieToken) {
    return { valid: false, reason: 'No CSRF cookie found' };
  }
  if (!headerToken) {
    return { valid: false, reason: 'No CSRF token in request header' };
  }
  if (!validateCSRFToken(headerToken, cookieToken)) {
    return { valid: false, reason: 'CSRF token mismatch' };
  }
  return { valid: true };
}

/**
 * Paths that are exempt from CSRF validation.
 */
export const CSRF_EXEMPT_PATHS = [
  '/api/auth/callback',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/simple-login',
  '/api/auth/simple-register',
  '/api/auth/forgot-password',
  '/api/webhooks',
];

export function isCSRFExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some(exempt => pathname.startsWith(exempt));
}
