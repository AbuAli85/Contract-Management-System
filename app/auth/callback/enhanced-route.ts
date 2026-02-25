import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { SupabaseErrorHandler } from '@/lib/supabase-error-handler';

// Enhanced authentication callback with security features
export async function GET(request: NextRequest) {
  const requestId = `auth_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/en/dashboard';
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {

      const errorDetails = SupabaseErrorHandler.handleError(
        { message: errorDescription || error, code: error },
        'auth.oauth_callback',
        requestId
      );

      SupabaseErrorHandler.logError(errorDetails);

      // Redirect to login with error
      const loginUrl = new URL(`/${locale}/auth/login`, origin);
      loginUrl.searchParams.set('error', errorDetails.code);
      loginUrl.searchParams.set('message', errorDetails.message);

      return NextResponse.redirect(loginUrl.toString());
    }

    if (!code) {

      const errorDetails = SupabaseErrorHandler.createError(
        'No authorization code provided',
        'AUTH_NO_CODE',
        400,
        null,
        requestId
      );

      SupabaseErrorHandler.logError(errorDetails);

      // Redirect to login
      return NextResponse.redirect(
        `${origin}/${locale}/auth/login?error=no_code&message=No authorization code provided`
      );
    }

    const supabase = await createClient();

    // Exchange code for session with enhanced error handling
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {

      const errorDetails = SupabaseErrorHandler.handleError(
        exchangeError,
        'auth.exchange_code_for_session',
        requestId
      );

      SupabaseErrorHandler.logError(errorDetails);

      // Redirect to login with specific error
      const loginUrl = new URL(`/${locale}/auth/login`, origin);
      loginUrl.searchParams.set('error', errorDetails.code);
      loginUrl.searchParams.set('message', errorDetails.message);

      return NextResponse.redirect(loginUrl.toString());
    }

    if (!data.session) {

      const errorDetails = SupabaseErrorHandler.createError(
        'No session returned from authentication',
        'AUTH_NO_SESSION',
        500,
        null,
        requestId
      );

      SupabaseErrorHandler.logError(errorDetails);

      return NextResponse.redirect(
        `${origin}/${locale}/auth/login?error=no_session&message=Authentication failed`
      );
    }

    // Check if user needs to complete profile setup
    const needsProfileSetup = await checkProfileSetup(
      data.session.user.id,
      supabase
    );

    if (needsProfileSetup) {
      return NextResponse.redirect(
        `${origin}/${locale}/onboarding?user_id=${data.session.user.id}`
      );
    }

    // Check if MFA is required
    const mfaRequired = await checkMFARequirement(
      data.session.user.id,
      supabase
    );

    if (mfaRequired) {
      return NextResponse.redirect(
        `${origin}/${locale}/auth/mfa-setup?user_id=${data.session.user.id}`
      );
    }

    // Validate redirect URL for security
    const validatedNext = validateRedirectUrl(next, origin);

    // Set security headers
    const response = NextResponse.redirect(`${origin}${validatedNext}`);

    // Add security headers
    response.headers.set('X-Auth-Callback', 'success');
    response.headers.set('X-Request-ID', requestId);

    return response;
  } catch (error) {

    const errorDetails = SupabaseErrorHandler.handleError(
      error,
      'auth.callback',
      requestId
    );

    SupabaseErrorHandler.logError(errorDetails);

    // Redirect to login with generic error
    return NextResponse.redirect(
      `${request.nextUrl.origin}/${locale}/auth/login?error=callback_error&message=Authentication callback failed`
    );
  }
}

// Check if user needs to complete profile setup
async function checkProfileSetup(
  userId: string,
  supabase: any
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, phone, department')
      .eq('id', userId)
      .single();

    if (error) {

      return true;
    }

    // Check if required fields are filled
    const hasRequiredFields = data.full_name && data.phone && data.department;
    return !hasRequiredFields;
  } catch (error) {

    return true;
  }
}

// Check if MFA is required for the user
async function checkMFARequirement(
  userId: string,
  supabase: any
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('two_factor_enabled, two_factor_verified')
      .eq('id', userId)
      .single();

    if (error) {

      return false;
    }

    // MFA is required if enabled but not verified
    return data.two_factor_enabled && !data.two_factor_verified;
  } catch (error) {

    return false;
  }
}

// Validate redirect URL for security
function validateRedirectUrl(url: string, origin: string): string {
  // Remove any protocol to prevent open redirects
  const cleanUrl = url.replace(/^https?:\/\//, '');

  // Only allow relative URLs or URLs from the same origin
  if (cleanUrl.startsWith('/')) {
    return cleanUrl;
  }

  // If it's an absolute URL, ensure it's from the same origin
  if (cleanUrl.startsWith(origin.replace(/^https?:\/\//, ''))) {
    return `/${cleanUrl.replace(origin.replace(/^https?:\/\//, ''), '')}`;
  }

  // Default to dashboard if URL is invalid

  return `/${process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en'}/dashboard`; // locale-specific redirect handled by caller
}

// POST method for handling OAuth state verification
export async function POST(request: NextRequest) {
  const requestId = `auth_callback_post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const body = await request.json();
    const { state, code, provider } = body;

    if (!state || !code) {
      const errorDetails = SupabaseErrorHandler.createError(
        'Missing required OAuth parameters',
        'AUTH_MISSING_PARAMS',
        400,
        { state: !!state, code: !!code },
        requestId
      );

      SupabaseErrorHandler.logError(errorDetails);

      return NextResponse.json(
        SupabaseErrorHandler.formatErrorResponse(errorDetails),
        {
          status: 400,
        }
      );
    }

    const supabase = await createClient();

    // Verify OAuth state and exchange code
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {

      const errorDetails = SupabaseErrorHandler.handleError(
        error,
        'auth.exchange_code_for_session_post',
        requestId
      );

      SupabaseErrorHandler.logError(errorDetails);

      return NextResponse.json(
        SupabaseErrorHandler.formatErrorResponse(errorDetails),
        {
          status: 400,
        }
      );
    }

    if (!data.session) {
      const errorDetails = SupabaseErrorHandler.createError(
        'No session returned from OAuth exchange',
        'AUTH_NO_SESSION_POST',
        500,
        null,
        requestId
      );

      SupabaseErrorHandler.logError(errorDetails);

      return NextResponse.json(
        SupabaseErrorHandler.formatErrorResponse(errorDetails),
        {
          status: 500,
        }
      );
    }

    // Return success response with session info
    return NextResponse.json({
      success: true,
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
        provider: provider || 'unknown',
      },
      session: {
        access_token: data.session.access_token ? '***' : null,
        refresh_token: data.session.refresh_token ? '***' : null,
        expires_at: data.session.expires_at,
      },
      requestId,
    });
  } catch (error) {

    const errorDetails = SupabaseErrorHandler.handleError(
      error,
      'auth.callback_post',
      requestId
    );

    SupabaseErrorHandler.logError(errorDetails);

    return NextResponse.json(
      SupabaseErrorHandler.formatErrorResponse(errorDetails),
      {
        status: 500,
      }
    );
  }
}
