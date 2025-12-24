import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// ========================================
// RATE LIMITING CONFIGURATION
// ========================================

// Initialize Redis client for distributed rate limiting
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Fallback in-memory store for development (when Redis is not configured)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Create rate limiter instance (distributed if Redis is available)
const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 requests per 60 seconds
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  : null;

// Rate limiting configuration for specific endpoints
const RATE_LIMIT_CONFIG = {
  '/api/auth/check-session': {
    windowMs: 60000, // 1 minute
    maxRequests: 5, // 5 requests per minute
    skipSuccessfulRequests: true,
  },
  '/api/auth/login': {
    windowMs: 900000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
    skipSuccessfulRequests: false,
  },
  '/api/auth/signup': {
    windowMs: 3600000, // 1 hour
    maxRequests: 3, // 3 signup attempts per hour
    skipSuccessfulRequests: false,
  },
};

// ========================================
// CORS CONFIGURATION
// ========================================

function getAllowedOrigins(): string[] {
  const envOrigins =
    process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim().replace(/\/$/, '')) || [];
  
  // Production origins
  const productionOrigins = [
    'https://portal.thesmartpro.io',
    'https://www.thesmartpro.io',
    'https://thesmartpro.io',
  ];

  // Add localhost in development
  if (process.env.NODE_ENV === 'development') {
    productionOrigins.push('http://localhost:3000', 'http://localhost:3001');
  }

  return envOrigins.length > 0 ? envOrigins : productionOrigins;
}

// Check if origin matches allowed patterns
function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return true; // Same-origin requests don't include origin header
  
  // Normalize origin (remove trailing slash)
  const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();
  
  // Check exact match
  if (allowedOrigins.some(allowed => allowed.toLowerCase() === normalizedOrigin)) {
    return true;
  }
  
  // In production, be more restrictive with Vercel preview deployments
  if (process.env.NODE_ENV === 'production') {
    // Only allow specific Vercel preview URLs if configured
    const allowedVercelPreviews = process.env.ALLOWED_VERCEL_PREVIEWS?.split(',') || [];
    if (allowedVercelPreviews.some(preview => normalizedOrigin.includes(preview))) {
      return true;
    }
  } else {
    // In development, allow all Vercel preview deployments
    if (normalizedOrigin.endsWith('.vercel.app')) {
      return true;
    }
  }
  
  // Allow any thesmartpro.io subdomain
  if (normalizedOrigin.endsWith('.thesmartpro.io') || normalizedOrigin === 'https://thesmartpro.io') {
    return true;
  }
  
  return false;
}

// ========================================
// RATE LIMITING FUNCTIONS
// ========================================

async function isRateLimitedDistributed(path: string, ip: string): Promise<boolean> {
  if (!ratelimit) {
    // Fallback to in-memory rate limiting
    return isRateLimitedInMemory(path, ip);
  }

  try {
    const identifier = `${ip}:${path}`;
    const { success } = await ratelimit.limit(identifier);
    return !success;
  } catch (error) {
    console.error('Rate limiting error:', error);
    // On error, allow the request to proceed (fail open)
    return false;
  }
}

function isRateLimitedInMemory(path: string, ip: string): boolean {
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

// ========================================
// SUPABASE SESSION REFRESH
// ========================================

async function refreshSupabaseSession(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response; // Skip if Supabase not configured
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    // Refresh session - this ensures cookies are set correctly
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If session exists, refresh it to update cookies
    if (session) {
      await supabase.auth.refreshSession();
    }
  } catch (error) {
    // Silently fail - don't break the request if session refresh fails
    console.debug('Supabase session refresh in middleware:', error);
  }

  return response;
}

// ========================================
// MIDDLEWARE FUNCTION
// ========================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);
  
  // Create response early for Supabase session refresh
  let response = NextResponse.next();

  // Apply CORS validation to all API routes
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = getAllowedOrigins();

    // Determine the CORS origin to use in response headers
    const corsOrigin = origin && isOriginAllowed(origin, allowedOrigins) 
      ? origin 
      : allowedOrigins[0] || 'https://portal.thesmartpro.io';

    // Validate origin for cross-origin requests
    if (!isOriginAllowed(origin, allowedOrigins)) {
      console.warn(
        `🚫 CORS: Blocked request from unauthorized origin: ${origin} (IP: ${ip})`
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

    // Rate limiting for specific paths
    const rateLimitedPaths = Object.keys(RATE_LIMIT_CONFIG);
    if (rateLimitedPaths.some(path => pathname.startsWith(path))) {
      const isLimited = await isRateLimitedDistributed(pathname, ip);
      
      if (isLimited) {
        console.log(
          `🚫 Middleware: Rate limit exceeded for ${pathname} from IP: ${ip}`
        );

        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please wait and try again.',
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
    response.headers.set('Access-Control-Allow-Origin', corsOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
    
    // Refresh Supabase session for API routes
    response = await refreshSupabaseSession(request, response);
    
    return response;
  }

  // For non-API paths, refresh Supabase session and continue
  response = await refreshSupabaseSession(request, response);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
