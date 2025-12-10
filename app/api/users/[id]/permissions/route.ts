import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPermissions, getUserRole, getDefaultPermissionsForRole } from '@/lib/services/permission-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions or is viewing their own permissions
    const isOwnPermissions = user.id === id;
    
    if (!isOwnPermissions) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userProfile || userProfile.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only admins can view other users\' permissions' },
          { status: 403 }
        );
      }
    }

    // Get user's permissions from the database
    const userPermissions = await getUserPermissions(id);
    const userRole = await getUserRole(id);

    // If no permissions found, return default permissions based on role
    if (userPermissions.length === 0 && userRole) {
      const defaultPermissions = getDefaultPermissionsForRole(userRole);
      return NextResponse.json({
        success: true,
        permissions: defaultPermissions.map(perm => ({
          permission: perm,
          granted: true,
        })),
        userRole,
      });
    }

    return NextResponse.json({
      success: true,
      permissions: userPermissions,
      userRole,
    });
  } catch (error) {
    console.error('Error in GET /api/users/[id]/permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { permissions } = await request.json();

    // Check if current user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can modify user permissions' },
        { status: 403 }
      );
    }

    // Use the management API to assign permissions
    const response = await fetch(`${request.nextUrl.origin}/api/users/management`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || '',
      },
      body: JSON.stringify({
        action: 'assign_permissions',
        userId: id,
        permissions: Array.isArray(permissions)
          ? permissions.map((p: any) => typeof p === 'string' ? p : p.permission)
          : [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to update permissions' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Permissions updated successfully',
      permissions: data.permissions || permissions,
    });
  } catch (error) {
    console.error('Error in POST /api/users/[id]/permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Note: getDefaultPermissionsForRole is now imported from permission-service
