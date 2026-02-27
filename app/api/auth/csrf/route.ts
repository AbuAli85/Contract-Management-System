import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, setCSRFCookie, CSRF_COOKIE_NAME } from '@/lib/security/csrf-protection';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/csrf
 *
 * Returns a CSRF token for the current session.
 * If a valid token already exists in the request cookie, it is reused.
 * Otherwise a new token is generated and set as a cookie.
 *
 * The client should call this endpoint once on app load and store the token
 * in memory, then include it as the X-CSRF-Token header on all
 * state-changing requests (POST, PUT, PATCH, DELETE).
 */
export async function GET(request: NextRequest) {
  const existing = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const token = existing && existing.length === 64 ? existing : generateCSRFToken();

  const response = NextResponse.json({ csrfToken: token });
  setCSRFCookie(response, token);

  // Prevent caching of this endpoint
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');

  return response;
}
