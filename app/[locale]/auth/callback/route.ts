import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.error('🔐 Auth Callback: OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/auth/login?error=${error}&message=${errorDescription || 'OAuth error'}`,
          request.url
        )
      );
    }

    if (!code) {
      console.error('🔐 Auth Callback: No code provided');
      return NextResponse.redirect(
        new URL(
          '/auth/login?error=no_code&message=No authorization code provided',
          request.url
        )
      );
    }

    const supabase = await createClient();

    // Exchange code for session
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('🔐 Auth Callback: Exchange error:', exchangeError);
      return NextResponse.redirect(
        new URL(
          `/auth/login?error=exchange_failed&message=${exchangeError.message}`,
          request.url
        )
      );
    }

    if (!data.session) {
      console.error('🔐 Auth Callback: No session after exchange');
      return NextResponse.redirect(
        new URL(
          '/auth/login?error=no_session&message=No session after OAuth exchange',
          request.url
        )
      );
    }

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('🔐 Auth Callback: Unexpected error:', error);
    return NextResponse.redirect(
      new URL(
        '/auth/login?error=unexpected&message=An unexpected error occurred',
        request.url
      )
    );
  }
}
