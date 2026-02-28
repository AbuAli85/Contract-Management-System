import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis/cloudflare';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { retryWithBackoff } from '@/lib/auth/retry';
import { extractCorrelationId, generateCorrelationId, logWithCorrelation } from '@/lib/utils/correlation';

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
    process.env.ALLOWED_ORIGINS?.split(',')
      .map(o => o.trim().replace(/\/$/, ''))
      .filter(Boolean) || [];

  if (envOrigins.length > 0) {
    return envOrigins;
  }

  // Explicit allowlist only — no wildcard subdomain matching
  if (process.env.NODE_ENV === 'production') {
    return [
      'https://portal.thesmartpro.io',
      'https://app.thesmartpro.io',
      'https://insights.thesmartpro.io',
      'https://sanad.thesmartpro.io',
      'https://www.thesmartpro.io',
      'https://thesmartpro.io',
    ];
  }

  return [
    'http://localhost:3000',
    'http://localhost:3001',
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.ALLOWED_VERCEL_PREVIEWS
      ? process.env.ALLOWED_VERCEL_PREVIEWS.split(',')
          .map(o => o.trim().replace(/\/$/, ''))
          .filter(Boolean)
      : []),
  ];
}

// Strict origin check — exact match only, no wildcard subdomains
// Treat null, "null", and empty string as NOT allowed (file://, sandboxed iframes)
function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (origin == null || origin === '' || origin === 'null') return false;

  const normalized = origin.replace(/\/$/, '').toLowerCase();
  return allowedOrigins.some(allowed => allowed.toLowerCase() === normalized);
}

// Whether to set CORS headers — only when Origin is present AND allowed
function shouldSetCorsHeaders(origin: string | null, allowedOrigins: string[]): boolean {
  return origin != null && origin !== '' && origin !== 'null' && isOriginAllowed(origin, allowedOrigins);
}

// ========================================
// RATE LIMITING FUNCTIONS
// ========================================

async function isRateLimitedDistributed(path: string, ip: string): Promise<boolean> {
  if (!ratelimit) {
    return isRateLimitedInMemory(path, ip);
  }

  try {
    const identifier = `${ip}:${path}`;
    const { success } = await ratelimit.limit(identifier);
    return !success;
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Auth paths: fail closed — do not allow request when rate limiter fails
    const isAuthPath = Object.keys(RATE_LIMIT_CONFIG).some(p => path.startsWith(p));
    if (isAuthPath) {
      throw error;
    }
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

  const correlationId = extractCorrelationId(request.headers) || generateCorrelationId();
  
  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          // Only set cookies on response, not request (request cookies are read-only)
          cookiesToSet.forEach(({ name, value, options }) => {
            // Determine domain based on request hostname
            const hostname = request.headers.get('host') || request.nextUrl.hostname;
            
            // Extract root domain for production (e.g., .thesmartpro.io from portal.thesmartpro.io)
            let domain: string | undefined = undefined;
            if (hostname && process.env.NODE_ENV === 'production' && !hostname.includes('localhost')) {
              const parts = hostname.split('.');
              if (parts.length >= 2) {
                // Use root domain (e.g., .thesmartpro.io) for subdomain support
                domain = `.${parts.slice(-2).join('.')}`;
              }
            }
            
            // Ensure cookies are set with proper attributes for cross-origin support
            const cookieOptions: CookieOptions = {
              ...options,
              httpOnly: options?.httpOnly ?? true,
              sameSite: options?.sameSite ?? 'lax',
              secure: options?.secure ?? process.env.NODE_ENV === 'production',
              path: options?.path ?? '/',
              ...(domain && { domain }), // Only set domain in production
            };
            response.cookies.set(name, value, cookieOptions);
          });
        },
      },
    });

    // Get current session with retry logic
    const {
      data: { session },
      error: sessionError,
    } = await retryWithBackoff(
      () => supabase.auth.getSession(),
      {
        maxRetries: 2,
        initialDelayMs: 50,
        onRetry: (attempt, error) => {
          logWithCorrelation(
            correlationId,
            'warn',
            `Session check retry ${attempt}`,
            { error: error.message }
          );
        },
      }
    );

    // Only refresh if we have a valid session
    if (session && !sessionError) {
      // Check if session is close to expiring (within 5 minutes)
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (expiresAt && (expiresAt - now) < fiveMinutes) {
        // Session is close to expiring, refresh it with retry
        await retryWithBackoff(
          () => supabase.auth.refreshSession(),
          {
            maxRetries: 2,
            initialDelayMs: 50,
            onRetry: (attempt, error) => {
              logWithCorrelation(
                correlationId,
                'warn',
                `Session refresh retry ${attempt}`,
                { error: error.message }
              );
            },
          }
        );
      }
    }
  } catch (error) {
    // Log error with correlation ID but don't break the request
    // This is expected if there's no valid session
    const errorMessage = error instanceof Error ? error.message : String(error);
    logWithCorrelation(
      correlationId,
      'debug',
      'Session refresh error (expected if no session)',
      { error: errorMessage }
    );
  }

  // Add correlation ID to response headers
  response.headers.set('X-Correlation-ID', correlationId);
  return response;
}

// ========================================
// MIDDLEWARE FUNCTION
// ========================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);
  
  // Extract or generate correlation ID
  const correlationId = extractCorrelationId(request.headers) || generateCorrelationId();
  
  // Create response early for Supabase session refresh
  let response = NextResponse.next();
  
  // Add correlation ID to response
  response.headers.set('X-Correlation-ID', correlationId);

  // Apply CORS validation to all API routes
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = getAllowedOrigins();
    const setCors = shouldSetCorsHeaders(origin, allowedOrigins);

    // Reject null/"null"/empty origin (file://, sandboxed iframes)
    if (origin !== null && (origin === 'null' || origin === '')) {
      return new NextResponse(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Reject disallowed origins when Origin header is present
    if (origin !== null && !isOriginAllowed(origin, allowedOrigins)) {
      return new NextResponse(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // CORS headers only when Origin is present AND allowed (never when missing)
    // Vary: Origin required when using per-origin headers to prevent cache poisoning
    const corsHeaders = setCors
      ? {
          'Access-Control-Allow-Origin': origin!,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
          'Vary': 'Origin',
        }
      : {};

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

      // FIX: Block if CSRF token is missing OR if tokens don't match.
      // Previous logic only blocked when both tokens existed AND differed,
      // allowing requests with no CSRF token to pass through unchecked.
      if (!shouldSkipCSRF && sessionToken) {
        // A session cookie exists — require a valid CSRF token
        if (!csrfToken || csrfToken !== sessionToken) {
          return new NextResponse(JSON.stringify({ error: 'Invalid or missing CSRF token' }), {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      }
    }

    // Handle preflight OPTIONS — strict on Access-Control-Request-Method
    if (request.method === 'OPTIONS') {
      const requestMethod = request.headers.get('Access-Control-Request-Method');
      const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];

      if (!requestMethod || requestMethod.trim() === '') {
        return new NextResponse('Bad Request: Access-Control-Request-Method required', { status: 400 });
      }
      const method = requestMethod.trim().toUpperCase();
      if (!allowedMethods.includes(method)) {
        return new NextResponse('Method Not Allowed', { status: 405 });
      }

      // No Origin: allow (same-origin), return 204 without CORS headers
      if (origin === null) {
        return new NextResponse(null, { status: 204 });
      }
      if (!isOriginAllowed(origin, allowedOrigins)) {
        return new NextResponse('Forbidden', { status: 403 });
      }
      return new NextResponse(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Rate limiting for auth paths — fail closed on Redis error
    const rateLimitedPaths = Object.keys(RATE_LIMIT_CONFIG);
    if (rateLimitedPaths.some(path => pathname.startsWith(path))) {
      try {
        const isLimited = await isRateLimitedDistributed(pathname, ip);
        if (isLimited) {
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
                ...corsHeaders,
              },
            }
          );
        }
      } catch {
        return new NextResponse(
          JSON.stringify({ error: 'Authentication temporarily unavailable' }),
          {
            status: 503,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60',
              ...corsHeaders,
            },
          }
        );
      }
    }

    // For regular API requests, add CORS headers only when Origin present and allowed
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
    
    // Refresh Supabase session for API routes
    response = await refreshSupabaseSession(request, response);
    
    return response;
  }

  // For non-API paths, refresh Supabase session and continue
  response = await refreshSupabaseSession(request, response);

  // Ensure CSRF token is set for all page responses
  // This allows client-side JS to read it and include in subsequent API calls
  // Uses Web Crypto API (crypto.getRandomValues) — Edge Runtime compatible
  const existingCsrf = request.cookies.get('csrf-token')?.value;
  if (!existingCsrf || existingCsrf.length !== 64) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const newToken = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    response.cookies.set('csrf-token', newToken, {
      httpOnly: false, // Must be readable by JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

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
