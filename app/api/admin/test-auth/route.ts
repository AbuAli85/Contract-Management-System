import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint to debug authentication
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Try to get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Try to get session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // Get cookies
    const cookieStore = await import('next/headers').then(m => m.cookies());
    const allCookies = cookieStore.getAll();

    return NextResponse.json({
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
      } : null,
      authError: authError?.message || null,
      hasSession: !!session,
      sessionError: sessionError?.message || null,
      cookieCount: allCookies.length,
      cookieNames: allCookies.map(c => c.name),
      debug: {
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        origin: request.headers.get('origin'),
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check authentication',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

