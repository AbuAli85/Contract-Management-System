import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabaseServer';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();

    // First try to get the session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log('🔍 API Users Fixed: Session check:', {
      hasSession: !!session,
      sessionError: sessionError?.message,
    });

    // If no session, try to get user directly
    let user = session?.user;
    if (!user) {
      const {
        data: { user: directUser },
        error: authError,
      } = await supabase.auth.getUser();
      user = directUser;
      console.log('🔍 API Users Fixed: Direct user check:', {
        hasUser: !!user,
        authError: authError?.message,
      });
    }

    if (!user) {
      console.log('❌ API Users Fixed: No user found');
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: 'No authenticated user found',
        },
        { status: 401 }
      );
    }

    console.log('✅ API Users Fixed: User authenticated:', user.id, user.email);

    // Check if user has admin permissions
    let userProfile = null;
    let users = null;
    const error = null;

    // Try profiles table first
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profileError && profileData) {
        userProfile = profileData;
        console.log('✅ API Users Fixed: Found profile:', profileData.role);
      }
    } catch (profileError) {
      console.log('⚠️ API Users Fixed: Profile check failed:', profileError);
    }

    // If no profile found, check if it's admin by email
    if (!userProfile && user.email === 'luxsess2001@gmail.com') {
      console.log('✅ API Users Fixed: Admin user detected by email');
      userProfile = { role: 'admin' };
    }

    // Check permissions
    if (
      !userProfile ||
      !userProfile.role ||
      !['admin', 'manager'].includes(userProfile.role)
    ) {
      console.log('❌ API Users Fixed: Insufficient permissions');
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          details: `User role: ${userProfile?.role || 'none'}`,
        },
        { status: 403 }
      );
    }

    // Fetch users from profiles table
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, status, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error(
          '❌ API Users Fixed: Error fetching profiles:',
          profilesError
        );
        return NextResponse.json(
          {
            error: 'Failed to fetch users',
            details: profilesError.message,
          },
          { status: 500 }
        );
      }

      users = profilesData || [];
      console.log('✅ API Users Fixed: Fetched users:', users.length);
    } catch (fetchError) {
      console.error('❌ API Users Fixed: Fetch error:', fetchError);
      return NextResponse.json(
        {
          error: 'Failed to fetch users',
          details: fetchError.message,
        },
        { status: 500 }
      );
    }

    // Return response
    const total = users.length;
    const page = 1;
    const limit = total;
    const totalPages = 1;

    console.log('✅ API Users Fixed: Returning response with', total, 'users');

    return NextResponse.json({
      users,
      pagination: { total, page, limit, totalPages },
    });
  } catch (error) {
    console.error('❌ API Users Fixed: Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
