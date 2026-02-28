/**
 * CORS Security Configuration
 *
 * This module provides secure CORS handling for API routes.
 * It ensures that only authorized origins can access the API endpoints.
 *
 * SECURITY BEST PRACTICES:
 * - Never use wildcards (*) in production
 * - Always validate origin against whitelist
 * - Use environment variables for configuration
 * - Log unauthorized access attempts
 * - Include credentials only when necessary
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Get list of allowed origins from environment configuration
 * Trims spaces and removes trailing slashes for exact matching
 */
export function getAllowedOrigins(): string[] {
  const envOrigins =
    process.env.ALLOWED_ORIGINS?.split(',')
      .map(o => o.trim().replace(/\/$/, ''))
      .filter(Boolean) || [];
  const defaultOrigins = [
    'https://portal.thesmartpro.io',
    'https://www.thesmartpro.io',
  ];

  // Add localhost in development mode only
  if (process.env.NODE_ENV === 'development') {
    defaultOrigins.push('http://localhost:3000', 'http://localhost:3001');
  }

  return envOrigins.length > 0 ? envOrigins : defaultOrigins;
}

/**
 * Validate if the request origin is allowed
 * Treat null, "null", and empty string as NOT allowed (file://, sandboxed iframes)
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (origin == null || origin === '' || origin === 'null') return false;

  const allowedOrigins = getAllowedOrigins();
  const normalized = origin.replace(/\/$/, '').toLowerCase();
  return allowedOrigins.some(a => a.toLowerCase() === normalized);
}

/**
 * Get CORS headers for API responses
 * Only sets CORS headers when Origin is present AND allowed (never when missing)
 * Credentials only when origin is allowed (never with wildcard)
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = getAllowedOrigins();
  const shouldSet = origin != null && origin !== '' && origin !== 'null' && isOriginAllowed(origin);

  if (!shouldSet) {
    return {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };
  }

  return {
    'Access-Control-Allow-Origin': origin!,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

const ALLOWED_PREFLIGHT_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];

/**
 * Handle CORS preflight OPTIONS request
 * Strict on Access-Control-Request-Method: missing → 400, disallowed → 405
 * No Origin: allow (204, no CORS headers). Origin "null"/""/disallowed: 403
 */
export function handleCorsPreflightRequest(request: NextRequest): NextResponse {
  const requestMethod = request.headers.get('Access-Control-Request-Method');
  if (!requestMethod || requestMethod.trim() === '') {
    return new NextResponse('Bad Request: Access-Control-Request-Method required', { status: 400 });
  }
  const method = requestMethod.trim().toUpperCase();
  if (!ALLOWED_PREFLIGHT_METHODS.includes(method)) {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }

  const origin = request.headers.get('origin');
  if (origin === null) {
    return new NextResponse(null, { status: 204 });
  }
  if (origin === 'null' || origin === '' || !isOriginAllowed(origin)) {
    return new NextResponse('Forbidden: Origin not allowed', { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

/**
 * Validate CORS for incoming request
 * Returns error response if origin is not allowed
 * - No Origin header: allow (same-origin)
 * - Origin "null" or "": reject
 * - Origin not in allowlist: reject
 */
export function validateCorsRequest(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');

  if (origin === null) return null; // Same-origin, no Origin header

  if (origin === 'null' || origin === '') {
    return new NextResponse('Forbidden: Origin not allowed', {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!isOriginAllowed(origin)) {
    return new NextResponse('Forbidden: Origin not allowed', {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
}

/**
 * Add CORS headers to NextResponse
 */
export function addCorsHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Wrapper function to easily add CORS to API route handlers
 *
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withCors(request, async () => {
 *     // Your API logic here
 *     return NextResponse.json({ data: 'your data' });
 *   });
 * }
 * ```
 */
export async function withCors(
  request: NextRequest,
  handler: () => Promise<NextResponse> | NextResponse
): Promise<NextResponse> {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request);
  }

  // Validate CORS
  const corsError = validateCorsRequest(request);
  if (corsError) return corsError;

  // Execute handler and add CORS headers
  const response = await handler();
  return addCorsHeaders(response, request);
}

/**
 * Create a secure Response with proper CORS headers
 *
 * @deprecated Use withCors wrapper instead for better security
 */
export function createCorsResponse(
  data: any,
  request: NextRequest,
  options: ResponseInit = {}
): NextResponse {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  return NextResponse.json(data, {
    ...options,
    headers: {
      ...options.headers,
      ...corsHeaders,
    },
  });
}
