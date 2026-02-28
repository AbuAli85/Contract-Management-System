import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthErrorHandler } from '@/lib/auth-error-handler';
import {
  rateLimiters,
  getRateLimitHeaders,
  getClientIdentifier,
} from '@/lib/security/upstash-rate-limiter';
import { createAuditLog, logAuditEvent } from '@/lib/security';
import {
  checkBruteForce,
  recordFailedAttempt,
  clearFailedAttempts,
  getClientIP,
} from '@/lib/auth/brute-force-protection';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: skip if middleware already enforced (avoids double Redis call)
    const alreadyChecked = request.headers.get('x-ratelimit-checked') === '1';
    const identifier = getClientIdentifier(request);
    let rateLimitResult: { success: boolean; limit: number; remaining: number; reset: number } | null = null;

    if (!alreadyChecked) {
      try {
        rateLimitResult = rateLimiters.login
          ? await rateLimiters.login.limit(identifier)
          : { success: true, limit: 5, remaining: 5, reset: Date.now() + 60000 };
      } catch (err) {
        console.error('Login rate limiter failure:', err);
        return NextResponse.json(
          { success: false, error: 'Authentication temporarily unavailable' },
          { status: 503 }
        );
      }

      if (!rateLimitResult.success) {
        const headers = getRateLimitHeaders({
          success: rateLimitResult.success,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        });
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
            message: `Too many login attempts. Please wait ${Math.ceil(
              (rateLimitResult.reset - Date.now()) / 1000
            )} seconds before trying again.`,
            retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
          },
          { status: 429, headers }
        );
      }
    } else {
      rateLimitResult = { success: true, limit: 5, remaining: 4, reset: Date.now() + 60000 };
    }

    // Parse and validate input
    let body: { email?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      const auditEntry = createAuditLog(request, 'LOGIN_VALIDATION_FAILED', false, {
        email: email || 'missing',
        reason: 'missing_credentials',
      });
      logAuditEvent(auditEntry);
      return NextResponse.json(
        AuthErrorHandler.createError('Email and password are required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Normalize email to prevent case-sensitivity attacks
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Server-side brute-force protection
    const supabase = await createClient();
    const ipAddress = getClientIP(request);

    const bruteForceCheck = await checkBruteForce(supabase, normalizedEmail, ipAddress);
    if (bruteForceCheck.isBlocked) {
      const auditEntry = createAuditLog(request, 'LOGIN_BLOCKED_BRUTE_FORCE', false, {
        email: normalizedEmail,
        ip: ipAddress,
        blockedUntil: bruteForceCheck.blockedUntil?.toISOString(),
      });
      logAuditEvent(auditEntry);
      return NextResponse.json(
        {
          success: false,
          error: 'Account temporarily locked',
          message: `Too many failed login attempts. Please try again in ${Math.ceil(
            bruteForceCheck.retryAfterSeconds / 60
          )} minute(s).`,
          retryAfter: bruteForceCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // Supabase authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data.user) {
      await recordFailedAttempt(supabase, normalizedEmail, ipAddress);
      const auditEntry = createAuditLog(request, 'LOGIN_FAILED', false, {
        email: normalizedEmail,
        error: error?.message,
        errorCode: error?.status,
      });
      logAuditEvent(auditEntry);
      // SECURITY: Generic message — do NOT reveal whether email exists
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check account status
    const { data: userProfile } = await supabase
      .from('users')
      .select('status, role')
      .eq('id', data.user.id)
      .single();

    if (userProfile?.status && userProfile.status !== 'active') {
      await supabase.auth.signOut();
      const auditEntry = createAuditLog(request, 'LOGIN_REJECTED_INACTIVE', false, {
        userId: data.user.id,
        email: normalizedEmail,
        status: userProfile.status,
      });
      logAuditEvent(auditEntry);
      const statusMessages: Record<string, string> = {
        pending: 'Your account is pending approval. Please contact an administrator.',
        suspended: 'Your account has been suspended. Please contact an administrator.',
        deactivated: 'Your account has been deactivated. Please contact an administrator.',
      };
      return NextResponse.json(
        { success: false, error: statusMessages[userProfile.status] ?? 'Account is not active' },
        { status: 403 }
      );
    }

    // Successful login — clear brute-force record
    await clearFailedAttempts(supabase, normalizedEmail, ipAddress);

    const auditEntry = createAuditLog(request, 'LOGIN_SUCCESS', true, {
      userId: data.user.id,
      email: data.user.email,
    });
    logAuditEvent(auditEntry);

    const responseHeaders = getRateLimitHeaders({
      success: rateLimitResult.success,
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      reset: rateLimitResult.reset,
      retryAfter: undefined,
    });

    return NextResponse.json(
      AuthErrorHandler.createSuccess(
        {
          user: {
            id: data.user.id,
            email: data.user.email,
            role: userProfile?.role ?? data.user.user_metadata?.role ?? 'user',
          },
        },
        'Login successful'
      ),
      { headers: responseHeaders }
    );
  } catch (error) {
    const auditEntry = createAuditLog(request, 'LOGIN_ERROR', false, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    logAuditEvent(auditEntry);
    const apiError = AuthErrorHandler.handleGenericError(error);
    return NextResponse.json(apiError, { status: 500 });
  }
}
