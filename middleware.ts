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
  const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
  const defaultOrigins = [
    'https://portal.thesmartpro.io',
    'https://www.thesmartpro.io',
  ];
  
  // Add localhost in development
  if (process.env.NODE_ENV === 'development') {
    defaultOrigins.push('http://localhost:3000', 'http://localhost:3001');
  }
  
  return envOrigins.length > 0 ? envOrigins : defaultOrigins;
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

    // Validate origin for cross-origin requests
    if (origin && !allowedOrigins.includes(origin)) {
      console.warn(`🚫 CORS: Blocked request from unauthorized origin: ${origin}`);
      return new NextResponse('Forbidden: Origin not allowed', { 
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    // CSRF Protection for state-changing requests
    if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
      const csrfToken = request.headers.get('X-CSRF-Token');
      const sessionToken = request.cookies.get('csrf-token')?.value;
      
      // Skip CSRF check for auth endpoints during login/signup
      const skipCSRFPaths = ['/api/auth/signin', '/api/auth/signup', '/api/auth/callback'];
      const shouldSkipCSRF = skipCSRFPaths.some(path => pathname.startsWith(path));
      
      if (!shouldSkipCSRF && csrfToken && sessionToken && csrfToken !== sessionToken) {
        console.warn(`🚫 CSRF: Invalid token for ${pathname} from IP: ${ip}`);
        return new NextResponse('Forbidden: Invalid CSRF token', { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }
    }

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin || allowedOrigins[0] || 'https://portal.thesmartpro.io',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
  }

  // Only apply rate limiting to specific paths
  if (pathname === '/api/auth/check-session') {
    // Check rate limiting first
    if (isRateLimited(pathname, ip)) {
      // Log rate limiting only once per window to reduce spam
      const key = `${ip}:${pathname}`;
      const requestData = rateLimitStore.get(key);

      if (requestData && requestData.count === 1) {
        console.log(
          `🚫 Middleware: Rate limit exceeded for ${pathname} from IP: ${ip}`
        );
      }

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please wait 1 minute and try again.',
          retryAfter: 60,
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Window': '60',
          },
        }
      );
    }

    // Log successful processing (but not every request to reduce spam)
    const key = `${ip}:${pathname}`;
    const requestData = rateLimitStore.get(key);

    if (!requestData || requestData.count === 1) {
      console.log(`🔐 Middleware: Processing request for path: ${pathname}`);
    }

    // Continue with the request
    return NextResponse.next();
  }

  // For non-rate-limited paths, just continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*', // Apply to all API routes for CORS and CSRF protection
  ],
};
