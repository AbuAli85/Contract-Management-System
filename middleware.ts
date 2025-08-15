import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Global rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  '/api/auth/check-session': {
    windowMs: 60000, // 1 minute
    maxRequests: 5,  // 5 requests per minute
    skipSuccessfulRequests: true, // Don't count successful requests
  }
};

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
  return request.ip || 
         request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);

  // Only apply rate limiting to specific paths
  if (pathname === '/api/auth/check-session') {
    // Check rate limiting first
    if (isRateLimited(pathname, ip)) {
      // Log rate limiting only once per window to reduce spam
      const key = `${ip}:${pathname}`;
      const requestData = rateLimitStore.get(key);
      
      if (requestData && requestData.count === 1) {
        console.log(`🚫 Middleware: Rate limit exceeded for ${pathname} from IP: ${ip}`);
      }

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please wait 1 minute and try again.',
          retryAfter: 60
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Window': '60'
          }
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
    '/api/auth/check-session',
    // Add other paths that need rate limiting here
  ],
};
