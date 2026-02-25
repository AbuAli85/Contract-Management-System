import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Extract locale from referer header or use default
function getLocaleFromRequest(request: NextRequest): string {
  const referer = request.headers.get('referer') ?? '';
  const match = referer.match(/\/([a-z]{2})\//);
  return match ? match[1] : (process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const locale = getLocaleFromRequest(request);
    const loginUrl = `${origin}/${locale}/auth/login`;
    const dashboardUrl = `${origin}/${locale}/dashboard`;

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        `${loginUrl}?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription ?? 'OAuth authentication failed')}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${loginUrl}?error=no_code&message=${encodeURIComponent('No authorization code provided')}`
      );
    }

    const supabase = await createClient();
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(
        `${loginUrl}?error=exchange_failed&message=${encodeURIComponent(exchangeError.message)}`
      );
    }

    if (!data.session) {
      return NextResponse.redirect(
        `${loginUrl}?error=no_session&message=${encodeURIComponent('Authentication failed')}`
      );
    }

    // Redirect to the next URL if provided and valid, otherwise to dashboard
    const redirectTo =
      next && next.startsWith('/') ? `${origin}${next}` : dashboardUrl;
    return NextResponse.redirect(redirectTo);
  } catch {
    const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en';
    return NextResponse.redirect(
      `${request.nextUrl.origin}/${locale}/auth/login?error=unexpected&message=${encodeURIComponent('An unexpected error occurred')}`
    );
  }
}
