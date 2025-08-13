import { NextRequest, NextResponse } from 'next/server';
import type { NextRequest as NextRequestType } from 'next/server';
import { verifyUserRoleFromToken, hasRequiredRole } from '@/lib/auth/middleware-utils';
import { getRateLimitConfigForEndpoint, applyRateLimit } from '@/lib/security/upstash-rate-limiter';

// Fix for next-intl import issue
const createMiddleware = require('next-intl/middleware').default;

// Emergency middleware with enhanced error handling
const intlMiddleware = createMiddleware({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'always',
  localeDetection: true,
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();
  
  console.log('🔐 Middleware: Processing request for path:', pathname);
  
  // Handle root path redirect
  if (pathname === '/') {
    console.log('🔐 Middleware: Redirecting root path to /en');
    return NextResponse.redirect(new URL('/en', request.url));
  }
  
  // SECURITY FIX: Replace insecure cookie-based role with secure JWT verification
  const userAuth = await verifyUserRoleFromToken(request);
  const role = userAuth.role;
  
  console.log('🔐 Middleware: User auth result:', { 
    role, 
    isValid: userAuth.isValid, 
    userId: userAuth.userId 
  });

  // Role-based access control (before API route handling)
  if (pathname.startsWith('/api/admin/') && !hasRequiredRole(role, ['admin'])) {
    console.log('🚫 Middleware: Access denied to admin API for role:', role);
    return NextResponse.json(
      { error: 'Access denied. Admin privileges required.' },
      { status: 403 }
    );
  }

  if (pathname.startsWith('/api/manager/') && !hasRequiredRole(role, ['admin', 'manager'])) {
    console.log('🚫 Middleware: Access denied to manager API for role:', role);
    return NextResponse.json(
      { error: 'Access denied. Manager privileges required.' },
      { status: 403 }
    );
  }

  // SECURITY FIX: Apply rate limiting to all API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitConfig = getRateLimitConfigForEndpoint(pathname);
    const rateLimitResult = await applyRateLimit(request, rateLimitConfig);
    
    if (!rateLimitResult.success) {
      console.log('🚫 Middleware: Rate limit exceeded for:', pathname);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          },
        }
      );
    }
  }

  // Create response object
  let response: NextResponse;

  // Handle API routes with enhanced security
  if (pathname.startsWith('/api/')) {
    response = NextResponse.next();
    
    // SECURITY FIX: Always apply security headers for API routes
    applySecurityHeaders(response);
    
    // SECURITY FIX: Strict CORS whitelisting
    applyStrictCORS(request, response);
    
  } else {
    // Handle page routes
    response = NextResponse.next();
    
    // SECURITY FIX: Always apply security headers for all routes
    applySecurityHeaders(response);
  }

  // Request logging
  if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
    console.log(
      `[${new Date().toISOString()}] ${request.method} ${request.url}`
    );
  }

  return response;
}

/**
 * SECURITY FIX: Always apply security headers (no more conditional logic)
 */
function applySecurityHeaders(response: NextResponse): void {
  // Essential security headers - always applied
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Remove server information
  response.headers.delete('server');
  response.headers.delete('x-powered-by');
}

/**
 * SECURITY FIX: Strict CORS whitelisting with exact domain matching
 */
function applyStrictCORS(request: NextRequest, response: NextResponse): void {
  // Get allowed origins from environment (comma-separated)
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];
  const origin = request.headers.get('origin');

  // SECURITY FIX: Only allow exact domain matches, no wildcards
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    // Allow localhost in development only
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  }
  // If no valid origin, don't set Access-Control-Allow-Origin header

  // Set other CORS headers
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
}

// Handle root path redirect with error handling
export function GET(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname === '/') {
    try {
      console.log('🔐 Middleware: Redirecting root path to /en');
      return NextResponse.redirect(new URL('/en', request.url));
    } catch (error) {
      console.error('Emergency middleware redirect error:', error);
      return NextResponse.next();
    }
  }
  
  return NextResponse.next();
}

// Apply i18n middleware with comprehensive error handling
export function POST(request: NextRequest) {
  try {
    return intlMiddleware(request);
  } catch (error) {
    console.error('Emergency middleware i18n error:', error);
    return NextResponse.next();
  }
}

// Configure middleware matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
