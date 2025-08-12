import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from './rate-limiter';
import { validateApiKey } from './api-key-validator';
import { sanitizeInput } from './input-sanitizer';
import { auditLogger } from './audit-logger';

export interface SecurityConfig {
  requireAuth?: boolean;
  requireRole?: string[];
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  requireApiKey?: boolean;
  logRequests?: boolean;
  sanitizeInput?: boolean;
}

export async function withSecurity(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  return async (req: NextRequest, context?: any) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // 1. Rate Limiting
      if (config.rateLimit) {
        const rateLimitResult = await rateLimit({
          request: req,
          windowMs: config.rateLimit.windowMs,
          maxRequests: config.rateLimit.maxRequests,
        });

        if (!rateLimitResult.success) {
          return NextResponse.json(
            {
              error: 'Rate limit exceeded',
              retryAfter: rateLimitResult.retryAfter,
            },
            {
              status: 429,
              headers: {
                'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
                'X-RateLimit-Limit': config.rateLimit.maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset':
                  rateLimitResult.resetTime?.toString() || '',
              },
            }
          );
        }
      }

      // 2. API Key Validation (if required)
      if (config.requireApiKey) {
        const apiKeyValid = await validateApiKey(req);
        if (!apiKeyValid) {
          return NextResponse.json(
            { error: 'Invalid or missing API key' },
            { status: 401 }
          );
        }
      }

      // 3. Authentication Check
      if (config.requireAuth) {
        const supabase = await createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          await auditLogger.logSecurityEvent({
            event: 'unauthorized_access_attempt',
            requestId,
            ip: req.ip || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown',
            path: req.nextUrl.pathname,
            timestamp: new Date().toISOString(),
          });

          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        // 4. Role-Based Access Control
        if (config.requireRole && config.requireRole.length > 0) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (!profile || !config.requireRole.includes(profile.role)) {
            await auditLogger.logSecurityEvent({
              event: 'insufficient_permissions',
              requestId,
              userId: user.id,
              userRole: profile?.role || 'unknown',
              requiredRoles: config.requireRole,
              path: req.nextUrl.pathname,
              timestamp: new Date().toISOString(),
            });

            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            );
          }
        }
      }

      // 5. Input Sanitization
      if (config.sanitizeInput && req.method !== 'GET') {
        const body = await req.json();
        const sanitizedBody = sanitizeInput(body);

        // Create new request with sanitized body
        const sanitizedRequest = new NextRequest(req.url, {
          method: req.method,
          headers: req.headers,
          body: JSON.stringify(sanitizedBody),
        });

        req = sanitizedRequest;
      }

      // 6. Log Request (if enabled)
      if (config.logRequests) {
        await auditLogger.logApiRequest({
          requestId,
          method: req.method,
          path: req.nextUrl.pathname,
          ip: req.ip || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString(),
        });
      }

      // Execute the handler
      const response = await handler(req, context);

      // Add security headers
      const secureResponse = addSecurityHeaders(response);

      // Log response time
      const responseTime = Date.now() - startTime;
      secureResponse.headers.set('X-Response-Time', responseTime.toString());
      secureResponse.headers.set('X-Request-ID', requestId);

      return secureResponse;
    } catch (error) {
      console.error(`Security middleware error [${requestId}]:`, error);

      await auditLogger.logSecurityEvent({
        event: 'security_middleware_error',
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.nextUrl.pathname,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: 'Internal security error' },
        { status: 500 }
      );
    }
  };
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // CORS headers (adjust based on your needs)
  response.headers.set(
    'Access-Control-Allow-Origin',
    process.env.ALLOWED_ORIGINS || 'https://your-domain.com'
  );
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-API-Key'
  );
  response.headers.set('Access-Control-Max-Age', '86400');

  // Cache control for sensitive data
  if (response.headers.get('content-type')?.includes('application/json')) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}
