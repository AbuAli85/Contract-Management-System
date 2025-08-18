import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withRBAC } from '@/lib/rbac/withRBAC';

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// User management operations
export const GET = withRBAC(['admin', 'manager'], async (req: Request) => {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        {
          error: 'Supabase is not configured',
          details:
            'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.',
        },
        { status: 500 }
      );
    }
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    // Build query
    let query = supabase
      .from('users')
      .select(
        `
        id,
        email,
        role,
        full_name,
        status,
        created_at,
        updated_at,
        profiles!inner(id, email, role, full_name),
        user_roles!inner(id, user_id, role)
      `
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq('role', role);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/users/management:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withRBAC(['admin'], async (req: Request) => {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        {
          error: 'Supabase is not configured',
          details:
            'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.',
        },
        { status: 500 }
      );
    }
    const body = await req.json();
    const { email, role, full_name, password, status = 'active' } = body;

    // Validate required fields
    if (!email || !role || !full_name || !password) {
      return NextResponse.json(
        {
          error: 'Missing required fields: email, role, full_name, password',
        },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'user', 'provider', 'client'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        {
          error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'User with this email already exists',
        },
        { status: 409 }
      );
    }

    // Create user in auth.users (this will be handled by Supabase auth)
    // For now, we'll create the user record directly
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        role,
        full_name,
        status,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        {
          error: 'Failed to create user',
        },
        { status: 500 }
      );
    }

    // Create profile record
    const profileRole = ['provider', 'client'].includes(role) ? 'user' : role;
    await supabase.from('profiles').upsert(
      {
        id: newUser.id,
        email,
        full_name,
        role: profileRole,
      },
      {
        onConflict: 'id',
      }
    );

    // Create user_roles record
    const userRoleRole = ['provider', 'client'].includes(role) ? 'user' : role;
    await supabase.from('user_roles').upsert(
      {
        user_id: newUser.id,
        role: userRoleRole,
      },
      {
        onConflict: 'user_id,role',
      }
    );

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: newUser.id,
      action: 'USER_CREATED',
      details: { email, role, full_name, status },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/users/management:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PUT = withRBAC(['admin', 'manager'], async (req: Request) => {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        {
          error: 'Supabase is not configured',
          details:
            'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.',
        },
        { status: 500 }
      );
    }
    const body = await req.json();
    const { id, email, role, full_name, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build update object
    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update user',
        },
        { status: 500 }
      );
    }

    // Update related tables if role changed
    if (role !== undefined && role !== currentUser.role) {
      const profileRole = ['provider', 'client'].includes(role) ? 'user' : role;
      const userRoleRole = ['provider', 'client'].includes(role)
        ? 'user'
        : role;

      // Update profiles
      await supabase.from('profiles').upsert(
        {
          id,
          email: updatedUser.email,
          full_name: updatedUser.full_name,
          role: profileRole,
        },
        {
          onConflict: 'id',
        }
      );

      // Update user_roles
      await supabase.from('user_roles').upsert(
        {
          user_id: id,
          role: userRoleRole,
        },
        {
          onConflict: 'user_id,role',
        }
      );
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: id,
      action: 'USER_UPDATED',
      details: {
        previous: currentUser,
        current: updatedUser,
        changed_fields: Object.keys(updateData),
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error in PUT /api/users/management:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const DELETE = withRBAC(['admin'], async (req: Request) => {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        {
          error: 'Supabase is not configured',
          details:
            'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.',
        },
        { status: 500 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check for dependencies (soft delete instead of hard delete)
    const { data: dependencies } = await supabase
      .from('provider_services')
      .select('id')
      .eq('provider_id', id)
      .limit(1);

    if (dependencies && dependencies.length > 0) {
      // Soft delete - mark as deleted instead of removing
      const { error: softDeleteError } = await supabase
        .from('users')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (softDeleteError) {
        console.error('Error soft deleting user:', softDeleteError);
        return NextResponse.json(
          {
            error: 'Failed to delete user',
          },
          { status: 500 }
        );
      }

      // Log the action
      await supabase.from('audit_logs').insert({
        user_id: id,
        action: 'USER_SOFT_DELETED',
        details: {
          reason: 'Has dependencies in provider_services',
          dependencies_count: dependencies.length,
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({
        message: 'User soft deleted due to dependencies',
        user_id: id,
      });
    }

    // Hard delete if no dependencies
    // Delete in reverse order to respect foreign keys
    await supabase.from('user_roles').delete().eq('user_id', id);
    await supabase.from('profiles').delete().eq('id', id);

    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        {
          error: 'Failed to delete user',
        },
        { status: 500 }
      );
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: id,
      action: 'USER_DELETED',
      details: {
        email: user.email,
        role: user.role,
      },
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      message: 'User deleted successfully',
      user_id: id,
    });
  } catch (error) {
    console.error('Error in DELETE /api/users/management:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
