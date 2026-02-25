import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {

    // Create server component client that properly reads cookies
    const supabase = await createServerComponentClient();

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json({ error: 'Session error' }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    // First, ensure the user profile exists
    try {
      await (supabase as any).rpc('ensure_user_profile', { user_id: user.id });
    } catch (error) {
      // Continue anyway, we'll try to get the role from existing data
    }

    // Get the latest role from all possible sources
    let currentRole = 'user';
    let roleSource = 'default';

    // Check users table
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!usersError && usersData?.role) {
        currentRole = usersData.role;
        roleSource = 'users';
      }
    } catch (error) {
    }

    // Check profiles table if users didn't have role
    if (roleSource === 'default') {
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profilesError && profilesData?.role) {
          currentRole = profilesData.role;
          roleSource = 'profiles';
        }
      } catch (error) {
      }
    }

    // Check app_users table if still no role
    if (roleSource === 'default') {
      try {
        const { data: appUsersData, error: appUsersError } = await supabase
          .from('app_users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!appUsersError && appUsersData?.role) {
          currentRole = appUsersData.role;
          roleSource = 'app_users';
        }
      } catch (error) {
      }
    }

    // If no role found, set admin role
    if (roleSource === 'default') {
      currentRole = 'admin';
      roleSource = 'default (admin)';
    }


    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      role: {
        value: currentRole,
        source: roleSource,
        timestamp: new Date().toISOString(),
      },
      summary: {
        finalRole: currentRole,
        roleSource,
        message: `Current role: ${currentRole} (from ${roleSource})`,
      },
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        error: 'Get user role failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
