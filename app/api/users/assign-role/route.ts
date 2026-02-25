import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';
import {
  getServiceRoleClient,
  getAuthenticatedUser,
  ensureUserCanManageUsers,
} from '../admin-utils';

async function assignRoleHandler(request: NextRequest) {
  try {
    const serviceClient = getServiceRoleClient();
    const currentUser = await getAuthenticatedUser();
    await ensureUserCanManageUsers(currentUser.id, serviceClient);

    const { userId, newRole } = await request.json();
    if (!userId || !newRole) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      );
    }

    // Use the management API's role assignment logic
    const response = await fetch(
      `${request.nextUrl.origin}/api/users/management`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('Cookie') || '',
        },
        body: JSON.stringify({
          action: 'update_role',
          userId,
          role: newRole,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to assign role' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Role assigned successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Export with RBAC protection
export const POST = withRBAC('role:assign:all', assignRoleHandler);
