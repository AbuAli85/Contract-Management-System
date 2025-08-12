import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { userId, role = 'provider' } = await request.json();

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const targetUserId = userId || session.user.id;

    console.log(`Setting up ${role} role for user:`, targetUserId);

    // 1. Update users table
    const { error: usersError } = await supabase
      .from('users')
      .upsert({
        id: targetUserId,
        email: session.user.email,
        full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
        role: role,
        status: 'active',
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (usersError) {
      console.error('Error updating users table:', usersError);
    }

    // 2. Update user_roles table
    const { error: userRolesError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: targetUserId,
        role: role,
        assigned_at: new Date().toISOString(),
        assigned_by: session.user.id,
      }, {
        onConflict: 'user_id'
      });

    if (userRolesError) {
      console.error('Error updating user_roles table:', userRolesError);
    }

    // 3. Create profile entry if it doesn't exist
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: targetUserId,
        username: session.user.email?.split('@')[0] || 'user',
        full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
        avatar_url: session.user.user_metadata?.avatar_url,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Error updating profiles table:', profileError);
    }

    // 4. For providers, ensure they have necessary provider-specific setup
    if (role === 'provider') {
      // Create provider-specific data structure if needed
      const { error: providerSetupError } = await supabase
        .from('provider_profiles')
        .upsert({
          user_id: targetUserId,
          business_name: session.user.user_metadata?.full_name || 'My Business',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (providerSetupError) {
        console.log('Provider profile setup not needed or already exists');
      }
    }

    // 5. Verify the role was set correctly
    const { data: verifyData } = await supabase
      .from('users')
      .select('role')
      .eq('id', targetUserId)
      .single();

    console.log(`Role setup completed. User ${targetUserId} role:`, verifyData?.role);

    return NextResponse.json({
      success: true,
      message: `User role set to ${role} successfully`,
      userId: targetUserId,
      role: verifyData?.role || role,
    });

  } catch (error) {
    console.error('Setup user role error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to setup user role',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const targetUserId = userId || session.user.id;

    // Get user role and profile information
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        created_at,
        profiles (
          username,
          avatar_url
        ),
        user_roles (
          role,
          assigned_at
        )
      `)
      .eq('id', targetUserId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userData,
      isProvider: userData.role === 'provider',
      hasProfile: !!userData.profiles,
      hasUserRole: !!userData.user_roles,
    });

  } catch (error) {
    console.error('Get user role setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get user role setup',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
