import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/check-session
 *
 * Returns the current authenticated user's session status.
 *
 * FIX: Returns 401 for unauthenticated requests (was returning 200 with authenticated: false).
 * FIX: Removed development bypass that exposed a fake user object.
 * FIX: Uses getUser() instead of getSession() for server-side security.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Use getUser() — validates the JWT against Supabase Auth server
    // This is more secure than getSession() which only reads the local cookie
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // FIX: Return 401 for unauthenticated requests
      return NextResponse.json(
        { authenticated: false, user: null, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user profile from the database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, role, status, phone, avatar_url')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = row not found — fall back to auth metadata
      console.error('[check-session] Profile fetch error:', profileError.message);
    }

    // Check account status
    if (userProfile?.status && userProfile.status !== 'active') {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          error: `Account is ${userProfile.status}. Please contact an administrator.`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
        role: userProfile?.role ?? user.user_metadata?.role ?? 'user',
        full_name:
          userProfile?.full_name ??
          user.user_metadata?.full_name ??
          user.email?.split('@')[0] ??
          null,
        phone: userProfile?.phone ?? user.user_metadata?.phone ?? null,
        avatar_url: userProfile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
        email_confirmed: !!user.email_confirmed_at,
      },
    });
  } catch (error) {
    console.error('[check-session] Unexpected error:', error);
    return NextResponse.json(
      { authenticated: false, user: null, error: 'Unexpected authentication error' },
      { status: 500 }
    );
  }
}
