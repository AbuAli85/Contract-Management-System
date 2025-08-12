import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch specific role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can view roles' },
        { status: 403 }
      );
    }

    // Fetch the specific role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();

    if (roleError) {
      console.error('Error fetching role:', roleError);
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Get user count for this role
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', role.name);

    return NextResponse.json({
      success: true,
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/users/roles/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update roles' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    // Check if role exists and is not a system role
    const { data: existingRole, error: fetchError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Check if new name conflicts with existing role
    if (name.toLowerCase() !== existingRole.name) {
      const { data: nameConflict } = await supabase
        .from('roles')
        .select('id')
        .eq('name', name.toLowerCase())
        .neq('id', id)
        .single();

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Role with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update the role
    const { data: updatedRole, error: updateError } = await supabase
      .from('roles')
      .update({
        name: name.toLowerCase(),
        description,
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating role:', updateError);
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      );
    }

    // Log the activity
    await supabase.from('user_activity_log').insert({
      user_id: user.id,
      action: 'role_update',
      resource_type: 'role',
      resource_id: id,
      details: {
        role_name: name,
        role_description: description,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/users/roles/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can delete roles' },
        { status: 403 }
      );
    }

    // Check if role exists and is not a system role
    const { data: existingRole, error: fetchError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Check if any users are assigned to this role
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', existingRole.name);

    if (userCount && userCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete role. ${userCount} user(s) are currently assigned to this role. Please reassign them first.`,
        },
        { status: 400 }
      );
    }

    // Delete the role
    const { error: deleteError } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting role:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete role' },
        { status: 500 }
      );
    }

    // Log the activity
    await supabase.from('user_activity_log').insert({
      user_id: user.id,
      action: 'role_delete',
      resource_type: 'role',
      resource_id: id,
      details: {
        role_name: existingRole.name,
        role_description: existingRole.description,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/users/roles/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
