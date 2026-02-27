/**
 * Rate Limiting Utility
 *
 * Provides rate limiting functionality to protect API endpoints from abuse.
 * Uses in-memory storage for development and can be extended to use Redis in production.
 *
 * @example
 * ```typescript
 * import { ratelimit, getClientIdentifier } from '@/lib/rate-limit';
 *
 * const identifier = getClientIdentifier(request);
 * const { success, remaining } = await ratelimit.limit(identifier);
 *
 * if (!success) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 * }
 * ```
 */

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit?: number;
}

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in the window
}

/**
 * In-Memory Rate Limiter
 *
 * Simple rate limiter using Map for development.
 * For production, consider using Redis with Upstash or similar.
 */
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.config.interval;

    // Get existing requests for this identifier
    const userRequests = this.requests.get(identifier) || [];

    // Filter to only recent requests within the time window
    const recentRequests = userRequests.filter(time => time > windowStart);

    // Check if limit exceeded
    if (recentRequests.length >= this.config.maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const resetTime = oldestRequest + this.config.interval;

      return {
        success: false,
        remaining: 0,
        reset: resetTime,
        limit: this.config.maxRequests,
      };
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    const remaining = this.config.maxRequests - recentRequests.length;
    const resetTime = now + this.config.interval;

    return {
      success: true,
      remaining,
      reset: resetTime,
      limit: this.config.maxRequests,
    };
  }

  private cleanup() {
    const now = Date.now();
    const cutoff = now - this.config.interval * 2; // Keep 2x window for safety

    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => time > cutoff);

      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }

  reset(identifier: string) {
    this.requests.delete(identifier);
  }

  /**
   * Peek at the current rate limit status without consuming a request.
   */
  peek(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.interval;
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    const remaining = Math.max(0, this.config.maxRequests - recentRequests.length);
    const isLimited = recentRequests.length >= this.config.maxRequests;
    const oldestRequest = recentRequests.length > 0 ? Math.min(...recentRequests) : now;
    const resetTime = isLimited
      ? oldestRequest + this.config.interval
      : now + this.config.interval;
    return {
      success: !isLimited,
      remaining,
      reset: resetTime,
      limit: this.config.maxRequests,
    };
  }

  getStats() {
    return {
      totalIdentifiers: this.requests.size,
      totalRequests: Array.from(this.requests.values()).reduce(
        (sum, reqs) => sum + reqs.length,
        0
      ),
    };
  }
}

/**
 * Rate limiter configurations
 */
const RATE_LIMIT_CONFIGS = {
  // Standard API endpoints: 60 requests per minute
  api: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 60,
  },

  // Stricter limit for resource-intensive endpoints: 10 requests per minute
  apiStrict: {
    interval: 60 * 1000,
    maxRequests: 10,
  },

  // Authentication endpoints: 5 requests per minute
  auth: {
    interval: 60 * 1000,
    maxRequests: 5,
  },

  // Very strict for sensitive operations: 3 requests per minute
  sensitive: {
    interval: 60 * 1000,
    maxRequests: 3,
  },
} as const;

// Create rate limiter instances
export const ratelimit = new InMemoryRateLimiter(RATE_LIMIT_CONFIGS.api);
export const ratelimitStrict = new InMemoryRateLimiter(
  RATE_LIMIT_CONFIGS.apiStrict
);
export const ratelimitAuth = new InMemoryRateLimiter(RATE_LIMIT_CONFIGS.auth);
export const ratelimitSensitive = new InMemoryRateLimiter(
  RATE_LIMIT_CONFIGS.sensitive
);

/**
 * Get client identifier from request
 *
 * Attempts to get the client's IP address from various headers,
 * falling back to 'anonymous' if not available.
 *
 * @param request - The incoming request
 * @returns Client identifier string
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (in order of preference)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0] || 'anonymous';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to anonymous if no IP found
  return 'anonymous';
}

/**
 * Format rate limit headers for response
 *
 * @param result - Rate limit result
 * @returns Headers object
 */
export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': result.limit?.toString() || '0',
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    ...(result.success === false && {
      'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
    }),
  };
}

/**
 * Create a rate limit response
 *
 * @param result - Rate limit result
 * @returns Response with appropriate status and headers
 */
export function createRateLimitResponse(result: RateLimitResult) {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

  return {
    success: false,
    error: 'Too many requests',
    message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
    retryAfter,
  };
}

/**
 * HOC to add rate limiting to API routes
 *
 * @example
 * ```typescript
 * export const GET = withRateLimit(
 *   ratelimit,
 *   async (request: Request) => {
 *     // Your handler code
 *   }
 * );
 * ```
 */
export function withRateLimit(
  limiter: InMemoryRateLimiter,
  handler: (request: Request, ...args: any[]) => Promise<Response>
) {
  return async (request: Request, ...args: any[]) => {
    const identifier = getClientIdentifier(request);
    const result = await limiter.limit(identifier);

    if (!result.success) {
      const headers = getRateLimitHeaders(result);
      const body = createRateLimitResponse(result);

      return new Response(JSON.stringify(body), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });
    }

    // Call the actual handler
    const response = await handler(request, ...args);

    // Add rate limit headers to successful responses
    const headers = getRateLimitHeaders(result);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Check rate limit status without consuming a request.
 * Useful for checking limits before performing expensive operations.
 */
export async function checkRateLimit(
  identifier: string,
  limiter: InMemoryRateLimiter = ratelimit
): Promise<RateLimitResult> {
  // Peek at the current state without recording a new request
  // by temporarily using the limiter's internal state
  return limiter.peek(identifier);
}

/**
 * Reset rate limit for an identifier
 * Useful for testing or administrative purposes
 */
export function resetRateLimit(
  identifier: string,
  limiter: InMemoryRateLimiter = ratelimit
): void {
  limiter.reset(identifier);
}

/**
 * Get rate limit statistics
 * Useful for monitoring and debugging
 */
export function getRateLimitStats() {
  return {
    api: ratelimit.getStats(),
    apiStrict: ratelimitStrict.getStats(),
    auth: ratelimitAuth.getStats(),
    sensitive: ratelimitSensitive.getStats(),
  };
}

// Export configs for external use
export { RATE_LIMIT_CONFIGS };

// Export types
export type { RateLimitResult, RateLimitConfig };
