import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestId = `auth_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/en/dashboard';
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log(`🔧 Auth Callback [${requestId}]: Processing request`);

    // Handle OAuth errors
    if (error) {
      console.error(
        `🔧 Auth Callback [${requestId}]: OAuth error:`,
        error,
        errorDescription
      );
      return NextResponse.redirect(
        `${origin}/en/auth/login?error=${error}&message=${errorDescription || 'OAuth authentication failed'}`
      );
    }

    if (!code) {
      console.warn(
        `🔧 Auth Callback [${requestId}]: No authorization code provided`
      );
      return NextResponse.redirect(
        `${origin}/en/auth/login?error=no_code&message=No authorization code provided`
      );
    }

    console.log(`🔧 Auth Callback [${requestId}]: Exchanging code for session`);
    const supabase = await createClient();
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error(
        `🔧 Auth Callback [${requestId}]: Code exchange error:`,
        exchangeError
      );
      return NextResponse.redirect(
        `${origin}/en/auth/login?error=exchange_failed&message=${exchangeError.message}`
      );
    }

    if (!data.session) {
      console.error(
        `🔧 Auth Callback [${requestId}]: No session returned from code exchange`
      );
      return NextResponse.redirect(
        `${origin}/en/auth/login?error=no_session&message=Authentication failed`
      );
    }

    console.log(
      `🔧 Auth Callback [${requestId}]: Success, redirecting to:`,
      next
    );
    return NextResponse.redirect(`${origin}${next}`);
  } catch (error) {
    console.error(`🔧 Auth Callback [${requestId}]: Unexpected error:`, error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/en/auth/login?error=unexpected&message=An unexpected error occurred`
    );
  }
}
