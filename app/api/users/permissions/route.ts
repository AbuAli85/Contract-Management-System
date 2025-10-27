import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all permissions
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Permissions API: Starting GET request');
    
    const supabase = await createClient();

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError.message }, { status: 401 });
    }
    
    if (!user) {
      console.error('❌ No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Authenticated user:', user.id);

    // Try to get user profile from users table first, then profiles table
    let userProfile = null;
    let tableName = 'users';
    
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (usersData) {
      userProfile = usersData;
      tableName = 'users';
    } else if (usersError) {
      console.log('⚠️ Users table query failed, trying profiles...');
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profilesData) {
        userProfile = profilesData;
        tableName = 'profiles';
      } else {
        console.error('❌ Profile not found in either table');
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        );
      }
    }

    console.log('👤 User role:', userProfile?.role, 'from table:', tableName);

    // Check if user has admin permissions
    if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
      console.error('❌ Insufficient permissions. Role:', userProfile?.role);
      return NextResponse.json(
        { error: 'Only admins can view permissions', currentRole: userProfile?.role },
        { status: 403 }
      );
    }

    console.log('✅ Admin access granted');

    // Fetch all permissions
    const { data: permissions, error: permissionsError } = await supabase
      .from('permissions')
      .select('*')
      .order('category')
      .order('name');

    if (permissionsError) {
      console.error('❌ Error fetching permissions:', permissionsError);
      return NextResponse.json(
        { error: 'Failed to fetch permissions', details: permissionsError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Fetched ${permissions?.length || 0} permissions`);

    // Transform the data to match the expected format
    const transformedPermissions =
      permissions?.map(permission => ({
        id: permission.id,
        name: permission.name,
        description: permission.description,
        category: permission.category,
        isSystem: true, // All permissions in the permissions table are system permissions
      })) || [];

    return NextResponse.json({
      success: true,
      permissions: transformedPermissions,
    });
  } catch (error) {
    console.error('❌ Error in GET /api/users/permissions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}
