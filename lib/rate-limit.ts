import { NextRequest, NextResponse } from 'next/server';
import {
  rateLimit,
  getClientIdentifier,
  createAuditLog,
  logAuditEvent,
} from './security';

export interface RateLimitConfig {
  requests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const identifier = getClientIdentifier(req);
    const result = rateLimit(identifier, config.requests, config.windowMs);

    if (!result.success) {
      // Log rate limit violation
      const auditEntry = createAuditLog(req, 'RATE_LIMIT_EXCEEDED', false, {
        limit: result.limit,
        windowMs: config.windowMs,
        identifier,
      });
      logAuditEvent(auditEntry);

      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil(
              (result.resetTime - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    try {
      const response = await handler(req);

      // Add rate limit headers to successful responses
      response.headers.set('X-RateLimit-Limit', result.limit.toString());
      response.headers.set(
        'X-RateLimit-Remaining',
        result.remaining.toString()
      );
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

      return response;
    } catch (error) {
      // Log API error
      const auditEntry = createAuditLog(req, 'API_ERROR', false, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      logAuditEvent(auditEntry);

      return new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
          },
        }
      );
    }
  };
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  auth: {
    requests: parseInt(process.env.RATE_LIMIT_AUTH_REQUESTS || '5'),
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000'), // 15 minutes
  },
  dashboard: {
    requests: parseInt(process.env.RATE_LIMIT_DASHBOARD_REQUESTS || '60'),
    windowMs: parseInt(process.env.RATE_LIMIT_DASHBOARD_WINDOW_MS || '60000'), // 1 minute
  },
  clients: {
    requests: parseInt(process.env.RATE_LIMIT_CLIENTS_REQUESTS || '30'),
    windowMs: parseInt(process.env.RATE_LIMIT_CLIENTS_WINDOW_MS || '120000'), // 2 minutes
  },
  providers: {
    requests: parseInt(process.env.RATE_LIMIT_PROVIDERS_REQUESTS || '30'),
    windowMs: parseInt(process.env.RATE_LIMIT_PROVIDERS_WINDOW_MS || '120000'), // 2 minutes
  },
  promoters: {
    requests: parseInt(process.env.RATE_LIMIT_PROMOTERS_REQUESTS || '30'),
    windowMs: parseInt(process.env.RATE_LIMIT_PROMOTERS_WINDOW_MS || '120000'), // 2 minutes
  },
  upload: {
    requests: parseInt(process.env.RATE_LIMIT_UPLOAD_REQUESTS || '10'),
    windowMs: parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS || '300000'), // 5 minutes
  },
};

// Helper function to get rate limit config by endpoint type
export function getRateLimitConfig(endpoint: string): RateLimitConfig {
  if (endpoint.includes('/auth/')) return RATE_LIMITS.auth;
  if (endpoint.includes('/dashboard/')) return RATE_LIMITS.dashboard;
  if (endpoint.includes('/clients/')) return RATE_LIMITS.clients;
  if (endpoint.includes('/providers/')) return RATE_LIMITS.providers;
  if (endpoint.includes('/promoters/')) return RATE_LIMITS.promoters;
  if (endpoint.includes('/upload/')) return RATE_LIMITS.upload;

  // Default rate limit
  return {
    requests: 100,
    windowMs: 60000, // 1 minute
  };
}
