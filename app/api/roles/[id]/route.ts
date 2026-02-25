import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { name, description, permissions } = await request.json();
    const { id: roleId } = await params;

    // Validate input
    if (!name || !description) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and description are required',
        },
        { status: 400 }
      );
    }

    // Check if role exists by checking if any users have this role
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('role', roleId)
      .limit(1);

    if (checkError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check existing role',
        },
        { status: 500 }
      );
    }

    if (!existingUsers || existingUsers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Role not found',
        },
        { status: 404 }
      );
    }

    // Check if new name conflicts with existing role
    if (name !== roleId) {
      const { data: conflictingUsers, error: conflictError } = await supabase
        .from('users')
        .select('id')
        .eq('role', name)
        .limit(1);

      if (conflictError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to check role conflict',
          },
          { status: 500 }
        );
      }

      if (conflictingUsers && conflictingUsers.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Role with this name already exists',
          },
          { status: 400 }
        );
      }
    }

    // Update users with the old role to have the new role name
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: name })
      .eq('role', roleId);

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update role',
        },
        { status: 500 }
      );
    }

    // Get updated user count
    const { count: userCount, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', name);

    const updatedRole = {
      id: name,
      name,
      description,
      permissions: permissions || [],
      userCount: userCount || 0,
      created_at: new Date().toISOString(),
      is_system: name === 'admin' || name === 'user',
    };

    return NextResponse.json({
      success: true,
      role: updatedRole,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: roleId } = await params;

    // Check if role exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('role', roleId)
      .limit(1);

    if (checkError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check existing role',
        },
        { status: 500 }
      );
    }

    if (!existingUsers || existingUsers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Role not found',
        },
        { status: 404 }
      );
    }

    // Check if it's a system role
    if (roleId === 'admin' || roleId === 'user') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete system roles',
        },
        { status: 400 }
      );
    }

    // Update users with this role to have 'user' role instead
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'user' })
      .eq('role', roleId);

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update users after role deletion',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
