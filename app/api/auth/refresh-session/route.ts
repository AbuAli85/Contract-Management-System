import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  try {

    const supabase = await createClient();

    // First, try to get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json({
        success: false,
        error: sessionError.message,
        hasSession: false,
      });
    }

    if (!session) {

      // Try to refresh the session
      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError) {
        return NextResponse.json({
          success: false,
          error: refreshError.message,
          hasSession: false,
        });
      }

      if (refreshedSession) {
        return NextResponse.json({
          success: true,
          hasSession: true,
          user: {
            id: refreshedSession.user.id,
            email: refreshedSession.user.email,
          },
        });
      } else {
        return NextResponse.json({
          success: true,
          hasSession: false,
          message: 'No valid session found',
        });
      }
    } else {
      return NextResponse.json({
        success: true,
        hasSession: true,
        user: {
          id: session.user.id,
          email: session.user.email,
        },
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        hasSession: false,
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {

    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json({
        success: false,
        hasSession: false,
        error: sessionError.message,
      });
    }

    const hasValidSession = !!session && !!session.user;


    return NextResponse.json({
      success: true,
      hasSession: hasValidSession,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
          }
        : null,
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
