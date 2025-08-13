import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { NextRequest } from 'next/server';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiter configurations for different endpoint types
export const rateLimiters = {
  // Very strict for auth endpoints (5 requests per 15 minutes)
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),

  // Moderate for API endpoints (100 requests per 15 minutes)
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '15 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  // Lenient for dashboard/UI (60 requests per minute)
  dashboard: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
    prefix: 'ratelimit:dashboard',
  }),

  // Strict for file uploads (10 requests per 10 minutes)
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 m'),
    analytics: true,
    prefix: 'ratelimit:upload',
  }),

  // Very strict for login attempts (3 requests per 15 minutes)
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '15 m'),
    analytics: true,
    prefix: 'ratelimit:login',
  }),

  // Strict for registration (2 requests per hour)
  registration: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(2, '1 h'),
    analytics: true,
    prefix: 'ratelimit:registration',
  }),

  // Strict for password reset (3 requests per hour)
  passwordReset: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    analytics: true,
    prefix: 'ratelimit:password-reset',
  }),
};

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface RateLimitConfig {
  type: keyof typeof rateLimiters;
  identifier?: string;
  customLimit?: {
    requests: number;
    window: string;
  };
}

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
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
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
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
    };
  }
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Get IP address
  const ip = request.ip || 
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
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
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
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, config);

    if (!rateLimitResult.success) {
      // Return rate limit exceeded response
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
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
      Object.entries(getRateLimitHeaders(rateLimitResult)).forEach(([key, value]) => {
        headers.set(key, value);
      });

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
  '/api/auth/forgot-password': { type: 'passwordReset' as const },
  '/api/auth/reset-password': { type: 'passwordReset' as const },
  '/api/auth/verify-email': { type: 'auth' as const },
  
  // API endpoints
  '/api/contracts': { type: 'api' as const },
  '/api/users': { type: 'api' as const },
  '/api/dashboard': { type: 'dashboard' as const },
  
  // File uploads
  '/api/upload': { type: 'upload' as const },
  '/api/documents': { type: 'upload' as const },
};

/**
 * Get rate limit configuration for a specific endpoint
 */
export function getRateLimitConfigForEndpoint(pathname: string): RateLimitConfig {
  // Find exact match first
  if (RATE_LIMIT_CONFIGS[pathname as keyof typeof RATE_LIMIT_CONFIGS]) {
    return RATE_LIMIT_CONFIGS[pathname as keyof typeof RATE_LIMIT_CONFIGS];
  }

  // Find pattern match
  for (const [pattern, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
    if (pathname.startsWith(pattern)) {
      return config;
    }
  }

  // Default to API rate limiting
  return { type: 'api' };
}
