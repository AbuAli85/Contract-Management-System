import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Global rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  '/api/auth/check-session': {
    windowMs: 60000, // 1 minute
    maxRequests: 5, // 5 requests per minute
    skipSuccessfulRequests: true, // Don't count successful requests
  },
};

// CORS Configuration - Define allowed origins
function getAllowedOrigins(): string[] {
  const envOrigins =
    process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim().replace(/\/$/, '')) || [];
  const defaultOrigins = [
    'https://portal.thesmartpro.io',
    'https://www.thesmartpro.io',
    'https://thesmartpro.io',
    // Vercel preview deployments
    'https://contract-management-system.vercel.app',
  ];

  // Add localhost in development
  if (process.env.NODE_ENV === 'development') {
    defaultOrigins.push('http://localhost:3000', 'http://localhost:3001');
  }

  return envOrigins.length > 0 ? envOrigins : defaultOrigins;
}

// Check if origin matches allowed patterns (including Vercel preview URLs)
function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return true; // Same-origin requests don't include origin header
  
  // Normalize origin (remove trailing slash)
  const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
  
  // Check exact match
  if (allowedOrigins.some(allowed => allowed.toLowerCase() === normalizedOrigin)) {
    return true;
  }
  
  // Allow Vercel preview deployments (*.vercel.app)
  if (normalizedOrigin.endsWith('.vercel.app')) {
    return true;
  }
  
  // Allow any thesmartpro.io subdomain
  if (normalizedOrigin.endsWith('.thesmartpro.io') || normalizedOrigin === 'https://thesmartpro.io') {
    return true;
  }
  
  return false;
}

function isRateLimited(path: string, ip: string): boolean {
  const config = RATE_LIMIT_CONFIG[path as keyof typeof RATE_LIMIT_CONFIG];
  if (!config) return false;

  const now = Date.now();
  const key = `${ip}:${path}`;
  const requestData = rateLimitStore.get(key);

  if (!requestData || now > requestData.resetTime) {
    // Reset or initialize
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return false;
  }

  if (requestData.count >= config.maxRequests) {
    return true;
  }

  requestData.count++;
  return false;
}

function getClientIP(request: NextRequest): string {
  return (
    request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);

  // Apply CORS validation to all API routes
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = getAllowedOrigins();

    // Determine the CORS origin to use in response headers
    const corsOrigin = origin && isOriginAllowed(origin, allowedOrigins) 
      ? origin 
      : allowedOrigins[0] || 'https://portal.thesmartpro.io';

    // Validate origin for cross-origin requests using flexible matching
    if (!isOriginAllowed(origin, allowedOrigins)) {
      console.warn(
        `🚫 CORS: Blocked request from unauthorized origin: ${origin}`
      );
      return new NextResponse(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // CSRF Protection for state-changing requests
    if (
      request.method !== 'GET' &&
      request.method !== 'HEAD' &&
      request.method !== 'OPTIONS'
    ) {
      const csrfToken = request.headers.get('X-CSRF-Token');
      const sessionToken = request.cookies.get('csrf-token')?.value;

      // Skip CSRF check for auth endpoints during login/signup
      const skipCSRFPaths = [
        '/api/auth/signin',
        '/api/auth/signup',
        '/api/auth/callback',
      ];
      const shouldSkipCSRF = skipCSRFPaths.some(path =>
        pathname.startsWith(path)
      );

      if (
        !shouldSkipCSRF &&
        csrfToken &&
        sessionToken &&
        csrfToken !== sessionToken
      ) {
        console.warn(`🚫 CSRF: Invalid token for ${pathname} from IP: ${ip}`);
        return new NextResponse(JSON.stringify({ error: 'Invalid CSRF token' }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': corsOrigin,
            'Access-Control-Allow-Credentials': 'true',
          },
        });
      }
    }

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': corsOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Rate limiting for specific paths (before returning response)
    if (pathname === '/api/auth/check-session') {
      if (isRateLimited(pathname, ip)) {
        const key = `${ip}:${pathname}`;
        const requestData = rateLimitStore.get(key);

        if (requestData && requestData.count === 1) {
          console.log(
            `🚫 Middleware: Rate limit exceeded for ${pathname} from IP: ${ip}`
          );
        }

        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please wait 1 minute and try again.',
            retryAfter: 60,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60',
              'X-RateLimit-Limit': '5',
              'X-RateLimit-Window': '60',
              'Access-Control-Allow-Origin': corsOrigin,
              'Access-Control-Allow-Credentials': 'true',
            },
          }
        );
      }
    }

    // For regular API requests, add CORS headers to the response
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', corsOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
    
    return response;
  }

  // For non-API paths, just continue without CORS headers
  // NOTE: We do NOT enforce httpOnly on Supabase cookies because:
  // 1. Supabase's client-side JS library needs to read auth cookies
  // 2. Setting httpOnly breaks client-side authentication state
  // 3. Supabase handles cookie security through other mechanisms (encryption, short expiry)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*', // Apply to all API routes for CORS and CSRF protection
  ],
};
