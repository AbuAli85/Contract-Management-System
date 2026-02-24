import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getUserPermissions,
  getUserRole,
  getDefaultPermissionsForRole,
} from '@/lib/services/permission-service';
import { withAnyRBAC } from '@/lib/rbac/guard';

async function getUserPermissionsHandler(
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

// Export with RBAC protection - allow viewing own permissions or admin viewing all
export const GET = withAnyRBAC(
  ['user:read:own', 'user:read:all'],
  getUserPermissionsHandler
);

async function updateUserPermissionsHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { permissions } = await request.json();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the management API to assign permissions
    const response = await fetch(
      `${request.nextUrl.origin}/api/users/management`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('Cookie') || '',
        },
        body: JSON.stringify({
          action: 'assign_permissions',
          userId: id,
          permissions: Array.isArray(permissions)
            ? permissions.map((p: any) =>
                typeof p === 'string' ? p : p.permission
              )
            : [],
        }),
      }
    );

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

// Export with RBAC protection - only admins can modify permissions
export const POST = withAnyRBAC(
  ['user:edit:all', 'permission:assign:all'],
  updateUserPermissionsHandler
);
