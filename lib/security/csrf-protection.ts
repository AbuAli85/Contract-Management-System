/**
 * CSRF Protection Utilities - Edge Runtime Compatible
 *
 * Uses the Web Crypto API (crypto.getRandomValues, crypto.subtle) which is
 * available in both the Vercel Edge Runtime and Node.js 18+.
 *
 * IMPORTANT: Node.js `crypto` module APIs (randomBytes, timingSafeEqual,
 * Buffer) are NOT available in the Edge Runtime and must NOT be used here.
 */
import { NextRequest, NextResponse } from 'next/server';

export const CSRF_COOKIE_NAME = 'csrf-token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

/** Token is 32 random bytes encoded as 64 hex characters */
const CSRF_TOKEN_BYTES = 32;

// Token Generation

/**
 * Generate a cryptographically secure CSRF token using the Web Crypto API.
 * Returns a 64-character lowercase hex string.
 *
 * Compatible with: Edge Runtime, Node.js 18+, browsers.
 */
export function generateCSRFToken(): string {
  const bytes = new Uint8Array(CSRF_TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Token Validation

/**
 * Validate a CSRF token using constant-time comparison.
 * Avoids timing attacks by comparing all characters regardless of mismatch.
 *
 * Uses only Web Crypto / standard JS — no Node.js Buffer or timingSafeEqual.
 */
export function validateCSRFToken(
  headerToken: string | null | undefined,
  cookieToken: string | null | undefined
): boolean {
  if (!headerToken || !cookieToken) return false;
  if (headerToken.length !== cookieToken.length || headerToken.length !== 64) return false;

  // Constant-time XOR comparison
  let diff = 0;
  for (let i = 0; i < headerToken.length; i++) {
    diff |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }
  return diff === 0;
}

// Cookie Helpers

/**
 * Set a CSRF token cookie on a response.
 * The cookie is NOT httpOnly so client-side JS can read it for the
 * double-submit cookie pattern.
 */
export function setCSRFCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Ensure a CSRF token exists on the response.
 * If the request already has a valid token cookie, reuse it.
 * Otherwise generate a new token and set it.
 */
export function ensureCSRFToken(
  request: NextRequest,
  response: NextResponse
): string {
  const existing = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (existing && existing.length === 64) {
    return existing;
  }
  const token = generateCSRFToken();
  setCSRFCookie(response, token);
  return token;
}

// Request Validation

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

// Exempt Paths

/**
 * Paths that are exempt from CSRF validation.
 * These are auth endpoints that need to work before a session exists,
 * or webhook endpoints that use their own signature verification.
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
