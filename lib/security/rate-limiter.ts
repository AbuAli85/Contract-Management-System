import { NextRequest } from 'next/server';

interface RateLimitConfig {
  request: NextRequest;
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitResult {
  success: boolean;
  retryAfter?: number;
  resetTime?: number;
}

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = config.keyGenerator
    ? config.keyGenerator(config.request)
    : getDefaultKey(config.request);
  const now = Date.now();

  // Clean up expired entries
  for (const [storeKey, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(storeKey);
    }
  }

  const current = rateLimitStore.get(key);

  if (!current || current.resetTime < now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { success: true };
  }

  if (current.count >= config.maxRequests) {
    return {
      success: false,
      retryAfter: Math.ceil((current.resetTime - now) / 1000),
      resetTime: current.resetTime,
    };
  }

  // Increment count
  current.count++;
  rateLimitStore.set(key, current);

  return { success: true };
}

function getDefaultKey(request: NextRequest): string {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const path = request.nextUrl.pathname;
  return `${ip}:${path}`;
}

// Preset configurations
export const rateLimitPresets = {
  // Very strict for auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },

  // Moderate for API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },

  // Lenient for dashboard/UI
  dashboard: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },

  // Strict for file uploads
  upload: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 10,
  },
};
