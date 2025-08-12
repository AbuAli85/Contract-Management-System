import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Debug User Role: Checking user role for:', user.email);

    // Get user from auth.users
    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(user.id);

    if (authError) {
      console.error('❌ Debug User Role: Error fetching auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to fetch auth user' },
        { status: 500 }
      );
    }

    // Get user from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error(
        '❌ Debug User Role: Error fetching profile:',
        profileError
      );
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Get user from users table (if it exists)
    const { data: userRecord, error: userRecordError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userRecordError && userRecordError.code !== 'PGRST116') {
      console.error(
        '❌ Debug User Role: Error fetching user record:',
        userRecordError
      );
    }

    const debugInfo = {
      userId: user.id,
      email: user.email,
      authUser: {
        role: authUser.user?.user_metadata?.role || 'not set',
        full_name: authUser.user?.user_metadata?.full_name || 'not set',
        created_at: authUser.user?.created_at,
      },
      profile: profile
        ? {
            role: profile.role || 'not set',
            full_name: profile.full_name || 'not set',
            created_at: profile.created_at,
          }
        : 'Profile not found',
      userRecord: userRecord
        ? {
            role: userRecord.role || 'not set',
            status: userRecord.status || 'not set',
            created_at: userRecord.created_at,
          }
        : 'User record not found',
    };

    console.log('🔍 Debug User Role: Debug info:', debugInfo);

    // Determine the correct role
    let correctRole = 'user'; // default
    if (profile?.role) {
      correctRole = profile.role;
    } else if (userRecord?.role) {
      correctRole = userRecord.role;
    } else if (authUser.user?.user_metadata?.role) {
      correctRole = authUser.user.user_metadata.role;
    }

    // Check if role needs to be updated
    const needsUpdate = {
      profile: profile && profile.role !== correctRole,
      userRecord: userRecord && userRecord.role !== correctRole,
      authMetadata: authUser.user?.user_metadata?.role !== correctRole,
    };

    return NextResponse.json({
      debugInfo,
      correctRole,
      needsUpdate,
      recommendations: [
        needsUpdate.profile && 'Update profile.role in profiles table',
        needsUpdate.userRecord && 'Update role in users table',
        needsUpdate.authMetadata && 'Update user_metadata.role in auth.users',
        !profile && 'Create profile in profiles table',
        !userRecord && 'Create user record in users table',
      ].filter(Boolean),
    });
  } catch (error) {
    console.error('❌ Debug User Role: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { newRole } = body;

    if (!newRole) {
      return NextResponse.json(
        { error: 'newRole is required' },
        { status: 400 }
      );
    }

    console.log(
      '🔧 Debug User Role: Updating role to:',
      newRole,
      'for user:',
      user.email
    );

    const updates = [];

    // Update profile.role
    const { data: profileUpdate, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email || '',
        role: newRole,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: user.created_at || new Date().toISOString(),
        last_login: user.last_sign_in_at || null,
      })
      .select()
      .single();

    if (profileError) {
      console.error(
        '❌ Debug User Role: Error updating profile:',
        profileError
      );
      updates.push({
        type: 'profile',
        success: false,
        error: profileError.message,
      });
    } else {
      console.log('✅ Debug User Role: Profile updated successfully');
      updates.push({ type: 'profile', success: true });
    }

    // Update users table if it exists
    const { data: userUpdate, error: userUpdateError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email || '',
        role: newRole,
        status: 'active',
        created_at: user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userUpdateError) {
      console.error(
        '❌ Debug User Role: Error updating user record:',
        userUpdateError
      );
      updates.push({
        type: 'user_record',
        success: false,
        error: userUpdateError.message,
      });
    } else {
      console.log('✅ Debug User Role: User record updated successfully');
      updates.push({ type: 'user_record', success: true });
    }

    // Update auth metadata
    const { error: authError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          role: newRole,
        },
      }
    );

    if (authError) {
      console.error(
        '❌ Debug User Role: Error updating auth metadata:',
        authError
      );
      updates.push({
        type: 'auth_metadata',
        success: false,
        error: authError.message,
      });
    } else {
      console.log('✅ Debug User Role: Auth metadata updated successfully');
      updates.push({ type: 'auth_metadata', success: true });
    }

    return NextResponse.json({
      success: true,
      newRole,
      updates,
      message: 'Role update completed',
    });
  } catch (error) {
    console.error('❌ Debug User Role: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
