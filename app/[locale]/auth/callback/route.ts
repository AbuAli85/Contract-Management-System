import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {

      return NextResponse.redirect(
        new URL(
          `/auth/login?error=${error}&message=${errorDescription || 'OAuth error'}`,
          request.url
        )
      );
    }

    if (!code) {

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

      return NextResponse.redirect(
        new URL(
          `/auth/login?error=exchange_failed&message=${exchangeError.message}`,
          request.url
        )
      );
    }

    if (!data.session) {

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

    return NextResponse.redirect(
      new URL(
        '/auth/login?error=unexpected&message=An unexpected error occurred',
        request.url
      )
    );
  }
}
