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
 */
export function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
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
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true; // Same-origin requests don't have origin header
  
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Get CORS headers for API responses
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = getAllowedOrigins();
  const allowedOrigin = origin && isOriginAllowed(origin) 
    ? origin 
    : allowedOrigins[0] || 'https://portal.thesmartpro.io';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Handle CORS preflight OPTIONS request
 */
export function handleCorsPreflightRequest(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  
  if (origin && !isOriginAllowed(origin)) {
    console.warn(`🚫 CORS: Blocked preflight from unauthorized origin: ${origin}`);
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
 */
export function validateCorsRequest(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  
  // Only validate cross-origin requests
  if (!origin) return null;
  
  if (!isOriginAllowed(origin)) {
    console.warn(`🚫 CORS: Blocked request from unauthorized origin: ${origin}`);
    return new NextResponse('Forbidden: Origin not allowed', { 
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      }
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

