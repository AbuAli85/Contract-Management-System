import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/refresh-session
 *
 * Refreshes the current Supabase session.
 * Uses getUser() (not getSession()) for secure server-side validation.
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // FIX: Use getUser() which validates against Supabase Auth server
    // getSession() only reads the local cookie and does NOT validate with the server
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      // Try to refresh the session token
      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError || !refreshedSession) {
        return NextResponse.json({
          success: false,
          hasSession: false,
          error: refreshError?.message ?? 'No valid session found',
        });
      }

      return NextResponse.json({
        success: true,
        hasSession: true,
        user: {
          id: refreshedSession.user.id,
          email: refreshedSession.user.email,
        },
      });
    }

    return NextResponse.json({
      success: true,
      hasSession: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        hasSession: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/refresh-session
 *
 * Check if the current session is valid (read-only, no refresh).
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // FIX: Use getUser() for secure server-side validation
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({
        success: true,
        hasSession: false,
        user: null,
      });
    }

    return NextResponse.json({
      success: true,
      hasSession: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        hasSession: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
