import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearAuthCookies } from '@/lib/actions/cookie-actions';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/logout
 *
 * Signs the user out of Supabase and clears all auth cookies.
 * Always returns 200 to avoid leaking session state.
 */
export async function POST(_request: NextRequest) {
  try {
    // FIX: createClient() is async — must be awaited
    const supabase = await createClient();

    // Sign out from Supabase (invalidates the server-side session)
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[auth/logout] Supabase signOut error:', error.message);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear all auth-related cookies
    await clearAuthCookies(response);

    // Clear CSRF cookie on logout
    response.cookies.set('csrf-token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('[auth/logout] Unexpected error:', error);

    // Even on error, clear cookies and return success to client
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    try {
      await clearAuthCookies(response);
    } catch (cookieError) {
      console.error('[auth/logout] Failed to clear cookies:', cookieError);
    }

    return response;
  }
}
