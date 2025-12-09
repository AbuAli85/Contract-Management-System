import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { NextRequest } from 'next/server';

// Initialize Redis client only if credentials are available
// Falls back to allowing requests if Redis is not configured
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Rate limiter configurations for different endpoint types
// Only create rate limiters if Redis is configured
export const rateLimiters = redis
  ? {
      // Login endpoint: 5 requests per minute per IP
      login: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
        prefix: 'ratelimit:login',
      }),

      // Registration endpoint: 3 requests per hour per IP
      registration: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 h'),
        analytics: true,
        prefix: 'ratelimit:registration',
      }),

      // API read operations: 100 requests per minute per user
      apiRead: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        analytics: true,
        prefix: 'ratelimit:api:read',
      }),

      // API write operations: 30 requests per minute per user
      apiWrite: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '1 m'),
        analytics: true,
        prefix: 'ratelimit:api:write',
      }),

      // Legacy auth endpoint (for backward compatibility)
      auth: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
        prefix: 'ratelimit:auth',
      }),

      // Password reset: 3 requests per hour
      passwordReset: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 h'),
        analytics: true,
        prefix: 'ratelimit:password-reset',
      }),

      // File uploads: 10 requests per 10 minutes
      upload: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '10 m'),
        analytics: true,
        prefix: 'ratelimit:upload',
      }),

      // Dashboard/UI: 60 requests per minute
      dashboard: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, '1 m'),
        analytics: true,
        prefix: 'ratelimit:dashboard',
      }),
    }
  : ({} as any); // Empty object when Redis is not configured

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number | undefined;
}

export interface RateLimitConfig {
  type: keyof typeof rateLimiters;
  identifier?: string;
  customLimit?: {
    requests: number;
    window:
      | '1 s'
      | '10 s'
      | '30 s'
      | '1 m'
      | '5 m'
      | '10 m'
      | '15 m'
      | '1 h'
      | '1 d';
  };
}

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // If Redis is not configured, allow all requests (development mode)
  if (!redis) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        '⚠️  Rate limiting disabled: Upstash Redis not configured (development mode)'
      );
    }
    return {
      success: true,
      limit: 1000,
      remaining: 999,
      reset: Date.now() + 60000,
      retryAfter: undefined,
    };
  }

  try {
    // Get identifier (IP address or custom identifier)
    const identifier = config.identifier || getClientIdentifier(request);

    // Get the appropriate rate limiter
    const limiter = config.customLimit
      ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(
            config.customLimit.requests,
            config.customLimit.window
          ),
          analytics: true,
          prefix: 'ratelimit:custom',
        })
      : rateLimiters[config.type];

    // Apply rate limiting
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success
        ? undefined
        : Math.ceil((result.reset - Date.now()) / 1000),
    };
  } catch (error) {
    console.error('Rate limiting error:', error);

    // In case of Redis failure, allow the request but log the error
    // This prevents the entire system from failing due to rate limiting issues
    return {
      success: true,
      limit: 1000,
      remaining: 999,
      reset: Date.now() + 60000,
      retryAfter: undefined,
    };
  }
}

/**
 * Get client identifier for rate limiting
 * Exported for use in auth endpoints
 */
export function getClientIdentifier(request: NextRequest): string {
  // Get IP address
  const ip =
    request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Get user agent for additional context
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Get path for endpoint-specific rate limiting
  const path = request.nextUrl.pathname;

  // Create a unique identifier
  return `${ip}:${path}:${userAgent}`;
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };

  if (!result.success && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Create a rate-limited API route wrapper
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  config: RateLimitConfig
) {
  return async (request: NextRequest): Promise<Response> => {
    const startTime = Date.now();
    const identifier = config.identifier || getClientIdentifier(request);

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, config);

    if (!rateLimitResult.success) {
      // Log rate limit violation for monitoring
      const violation = {
        timestamp: new Date().toISOString(),
        endpoint: request.nextUrl.pathname,
        method: request.method,
        identifier: identifier.split(':')[0], // IP only for logging
        limitType: config.type,
        limit: rateLimitResult.limit,
        retryAfter: rateLimitResult.retryAfter,
        userAgent: request.headers.get('user-agent')?.substring(0, 100),
      };

      console.warn('⚠️ Rate limit violation:', JSON.stringify(violation));

      // Create user-friendly error message based on limit type
      let userMessage = 'Too many requests. Please try again later.';
      if (config.type === 'login') {
        userMessage = `Too many login attempts. Please wait ${rateLimitResult.retryAfter} seconds before trying again.`;
      } else if (config.type === 'registration') {
        userMessage = `Too many registration attempts. Please try again in ${Math.ceil((rateLimitResult.retryAfter || 0) / 60)} minutes.`;
      } else if (config.type === 'apiWrite') {
        userMessage =
          'You are making too many changes. Please slow down and try again in a moment.';
      } else if (config.type === 'apiRead') {
        userMessage =
          'You are requesting data too quickly. Please wait a moment before continuing.';
      }

      // Return rate limit exceeded response with helpful message
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          message: userMessage,
          retryAfter: rateLimitResult.retryAfter,
          limit: rateLimitResult.limit,
          remaining: 0,
          resetAt: new Date(rateLimitResult.reset).toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...getRateLimitHeaders(rateLimitResult),
          },
        }
      );
    }

    try {
      // Execute the handler
      const response = await handler(request);

      // Add rate limit headers to successful responses
      const headers = new Headers(response.headers);
      Object.entries(getRateLimitHeaders(rateLimitResult)).forEach(
        ([key, value]) => {
          headers.set(key, value);
        }
      );

      // Log successful request (only for monitoring, can be disabled in production)
      if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - startTime;
        console.log(
          `✅ ${request.method} ${request.nextUrl.pathname} - ${duration}ms - Remaining: ${rateLimitResult.remaining}/${rateLimitResult.limit}`
        );
      }

      // Return response with rate limit headers
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      console.error('API handler error:', error);

      // Return error response with rate limit headers
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Internal server error',
          message: 'An unexpected error occurred.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getRateLimitHeaders(rateLimitResult),
          },
        }
      );
    }
  };
}

/**
 * Predefined rate limit configurations for common use cases
 */
export const RATE_LIMIT_CONFIGS = {
  // Auth endpoints
  '/api/auth/login': { type: 'login' as const },
  '/api/auth/register': { type: 'registration' as const },
  '/api/auth/signup': { type: 'registration' as const },
  '/api/auth/forgot-password': { type: 'passwordReset' as const },
  '/api/auth/reset-password': { type: 'passwordReset' as const },
  '/api/auth/verify-email': { type: 'auth' as const },

  // Dashboard (higher limit)
  '/api/dashboard': { type: 'dashboard' as const },

  // File uploads (strict)
  '/api/upload': { type: 'upload' as const },
  '/api/documents': { type: 'upload' as const },
};

/**
 * Determine if an API request is a read or write operation
 */
export function isReadOperation(method: string): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}

export function isWriteOperation(method: string): boolean {
  return (
    method === 'POST' ||
    method === 'PUT' ||
    method === 'PATCH' ||
    method === 'DELETE'
  );
}

/**
 * Get rate limit configuration for a specific endpoint and method
 */
export function getRateLimitConfigForEndpoint(
  pathname: string,
  method?: string
): RateLimitConfig {
  // Find exact match first (auth endpoints)
  if (RATE_LIMIT_CONFIGS[pathname as keyof typeof RATE_LIMIT_CONFIGS]) {
    return RATE_LIMIT_CONFIGS[pathname as keyof typeof RATE_LIMIT_CONFIGS];
  }

  // Find pattern match (auth endpoints)
  for (const [pattern, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
    if (pathname.startsWith(pattern)) {
      return config;
    }
  }

  // For API endpoints, determine read vs write based on HTTP method
  if (pathname.startsWith('/api/')) {
    if (method) {
      if (isReadOperation(method)) {
        return { type: 'apiRead' };
      } else if (isWriteOperation(method)) {
        return { type: 'apiWrite' };
      }
    }
    // Default to read limit if method not specified
    return { type: 'apiRead' };
  }

  // Default to read rate limiting for unknown endpoints
  return { type: 'apiRead' };
}
