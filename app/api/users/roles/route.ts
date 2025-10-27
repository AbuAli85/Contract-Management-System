import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all roles with user counts
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Roles API: Starting GET request');
    
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
        { error: 'Only admins can view roles', currentRole: userProfile?.role },
        { status: 403 }
      );
    }

    console.log('✅ Admin access granted');

    // Fetch roles with user counts using the roles table
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (rolesError) {
      console.error('❌ Error fetching roles:', rolesError);
      return NextResponse.json(
        { error: 'Failed to fetch roles', details: rolesError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Fetched ${roles?.length || 0} roles`);

    // Transform the data to match the expected format
    const transformedRoles =
      roles?.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: [],
        userCount: 0,
      })) || [];

    return NextResponse.json({
      success: true,
      roles: transformedRoles,
    });
  } catch (error) {
    console.error('❌ Error in GET /api/users/roles:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}

// POST - Create new role
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Roles API: Starting POST request');
    
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
    
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (usersData) {
      userProfile = usersData;
    } else if (usersError) {
      console.log('⚠️ Users table query failed, trying profiles...');
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profilesData) {
        userProfile = profilesData;
      } else {
        console.error('❌ Profile not found in either table');
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        );
      }
    }

    console.log('👤 User role:', userProfile?.role);

    // Check if user has admin permissions
    if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
      console.error('❌ Insufficient permissions. Role:', userProfile?.role);
      return NextResponse.json(
        { error: 'Only admins can create roles', currentRole: userProfile?.role },
        { status: 403 }
      );
    }

    console.log('✅ Admin access granted');

    const body = await request.json();
    const { name, description, permissions } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    // Check if role already exists
    const { data: existingRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', name.toLowerCase())
      .single();

    if (existingRole) {
      console.error('❌ Role already exists:', name);
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    // Create new role
    const { data: newRole, error: createError } = await supabase
      .from('roles')
      .insert({
        name: name.toLowerCase(),
        display_name: name,
        description,
        permissions: permissions || [],
        is_system: false,
        is_active: true,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating role:', createError);
      return NextResponse.json(
        { error: 'Failed to create role', details: createError.message },
        { status: 500 }
      );
    }

    console.log('✅ Role created successfully:', name);

    // Log the activity
    try {
      await supabase.from('user_activity_log').insert({
        user_id: user.id,
        action: 'role_create',
        resource_type: 'role',
        resource_id: newRole.id,
        details: {
          role_name: name,
          role_description: description,
          permissions_count: permissions?.length || 0,
        },
      });
    } catch (logError) {
      console.warn('⚠️ Failed to log activity (non-critical):', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Role created successfully',
      role: {
        id: newRole.id,
        name: newRole.name,
        description: newRole.description,
        permissions: [],
        userCount: 0,
      },
    });
  } catch (error) {
    console.error('❌ Error in POST /api/users/roles:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}
