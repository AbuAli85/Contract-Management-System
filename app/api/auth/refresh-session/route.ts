import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  try {
    console.log('🔄 Refresh session API called');

    const supabase = await createClient();

    // First, try to get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('🔄 Session error:', sessionError);
      return NextResponse.json({
        success: false,
        error: sessionError.message,
        hasSession: false,
      });
    }

    if (!session) {
      console.log('🔄 No session found, attempting to refresh...');

      // Try to refresh the session
      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error('🔄 Refresh error:', refreshError);
        return NextResponse.json({
          success: false,
          error: refreshError.message,
          hasSession: false,
        });
      }

      if (refreshedSession) {
        console.log('🔄 Session refreshed successfully');
        return NextResponse.json({
          success: true,
          hasSession: true,
          user: {
            id: refreshedSession.user.id,
            email: refreshedSession.user.email,
          },
        });
      } else {
        console.log('🔄 No session after refresh attempt');
        return NextResponse.json({
          success: true,
          hasSession: false,
          message: 'No valid session found',
        });
      }
    } else {
      console.log('🔄 Session already exists');
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
    console.error('🔄 Refresh session API error:', error);
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
    console.log('🔄 Get session status API called');

    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('🔄 Session status error:', sessionError);
      return NextResponse.json({
        success: false,
        hasSession: false,
        error: sessionError.message,
      });
    }

    const hasValidSession = !!session && !!session.user;

    console.log('🔄 Session status:', {
      hasSession: hasValidSession,
      userId: session?.user?.id || null,
      userEmail: session?.user?.email || null,
    });

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
    console.error('🔄 Session status API error:', error);
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
