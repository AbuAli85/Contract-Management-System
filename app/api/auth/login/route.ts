import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthErrorHandler } from '@/lib/auth-error-handler';
import { ApiErrorHandler } from '@/lib/api-error-handler';
import {
  rateLimiters,
  getRateLimitHeaders,
  getClientIdentifier,
} from '@/lib/security/upstash-rate-limiter';
import { createAuditLog, logAuditEvent } from '@/lib/security';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Apply strict rate limiting for login (5 requests per minute per IP)
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimiters.login.limit(identifier);

    if (!rateLimitResult.success) {
      const headers = getRateLimitHeaders({
        success: rateLimitResult.success,
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      });

      // Log rate limit violation
      const violation = {
        timestamp: new Date().toISOString(),
        endpoint: '/api/auth/login',
        method: 'POST',
        ip: identifier.split(':')[0],
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
      };
      console.warn('⚠️ Login rate limit exceeded:', JSON.stringify(violation));

      // Log audit event
      const auditEntry = createAuditLog(request, 'LOGIN_RATE_LIMITED', false, {
        identifier,
        attemptsRemaining: rateLimitResult.remaining,
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      });
      logAuditEvent(auditEntry);

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: `Too many login attempts. Please wait ${Math.ceil((rateLimitResult.reset - Date.now()) / 1000)} seconds before trying again.`,
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers,
        }
      );
    }

    console.log('🔐 Server login API called');

    const { email, password } = await request.json();

    if (!email || !password) {
      const error = AuthErrorHandler.createError(
        'Email and password are required',
        'VALIDATION_ERROR'
      );

      // Log failed validation attempt
      const auditEntry = createAuditLog(
        request,
        'LOGIN_VALIDATION_FAILED',
        false,
        { email: email || 'missing', reason: 'missing_credentials' }
      );
      logAuditEvent(auditEntry);

      return NextResponse.json(error, { status: 400 });
    }

    const supabase = await createClient();

    console.log('🔐 Attempting server-side sign in...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('🔐 Server login error:', error);

      // Log failed login attempt
      const auditEntry = createAuditLog(request, 'LOGIN_FAILED', false, {
        email,
        error: error.message,
        errorCode: error.status,
      });
      logAuditEvent(auditEntry);

      // SECURITY FIX: Return generic error message
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!data.user) {
      console.error('🔐 No user returned from sign in');

      // Log authentication failure
      const auditEntry = createAuditLog(request, 'LOGIN_AUTH_FAILED', false, {
        email,
        reason: 'no_user_returned',
      });
      logAuditEvent(auditEntry);

      // SECURITY FIX: Return generic error message
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('🔐 Server login successful for user:', data.user.id);

    // Log successful login
    const auditEntry = createAuditLog(request, 'LOGIN_SUCCESS', true, {
      userId: data.user.id,
      email: data.user.email,
      sessionId: `${data.session?.access_token?.substring(0, 10)}...`,
    });
    logAuditEvent(auditEntry);

    // Debug: Log session details
    if (data.session) {
      console.log('🔐 Session details:', {
        accessTokenLength: data.session.access_token?.length || 0,
        refreshTokenLength: data.session.refresh_token?.length || 0,
        accessTokenPreview: `${data.session.access_token?.substring(0, 50)}...`,
        refreshTokenPreview: `${data.session.refresh_token?.substring(0, 50)}...`,
        expiresAt: data.session.expires_at,
        tokenType: data.session.token_type,
      });
    }

    // Add rate limit headers to response
    const responseHeaders = getRateLimitHeaders({
      success: rateLimitResult.success,
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      reset: rateLimitResult.reset,
      retryAfter: undefined,
    });

    // Create response with success
    const response = NextResponse.json(
      AuthErrorHandler.createSuccess(
        {
          user: {
            id: data.user.id,
            email: data.user.email,
          },
        },
        'Login successful'
      ),
      {
        headers: responseHeaders,
      }
    );

    // Let Supabase handle cookie management automatically
    // The createClient() function will handle setting the appropriate cookies
    console.log('🔐 Login completed, cookies should be set by Supabase');

    return response;
  } catch (error) {
    console.error('🔐 Server login API error:', error);

    // Log unexpected error
    const auditEntry = createAuditLog(request, 'LOGIN_ERROR', false, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    logAuditEvent(auditEntry);

    const apiError = AuthErrorHandler.handleGenericError(error);
    return NextResponse.json(apiError, { status: 500 });
  }
}
