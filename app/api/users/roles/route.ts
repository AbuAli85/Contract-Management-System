import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all roles with user counts
export async function GET(request: NextRequest) {
  try {

    const supabase = await createClient();

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


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

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profilesData) {
        userProfile = profilesData;
        tableName = 'profiles';
      } else {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        );
      }
    }


    // Check if user has admin permissions
    if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Only admins can view roles', currentRole: userProfile?.role },
        { status: 403 }
      );
    }


    // Fetch roles with user counts using the roles table
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (rolesError) {
      return NextResponse.json(
        { error: 'Failed to fetch roles', details: rolesError.message },
        { status: 500 }
      );
    }


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
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}

// POST - Create new role
export async function POST(request: NextRequest) {
  try {

    const supabase = await createClient();

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


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

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profilesData) {
        userProfile = profilesData;
      } else {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        );
      }
    }


    // Check if user has admin permissions
    if (!userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
      return NextResponse.json(
        {
          error: 'Only admins can create roles',
          currentRole: userProfile?.role,
        },
        { status: 403 }
      );
    }


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
      return NextResponse.json(
        { error: 'Failed to create role', details: createError.message },
        { status: 500 }
      );
    }


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
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
}
