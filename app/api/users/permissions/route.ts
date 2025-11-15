import { NextRequest, NextResponse } from 'next/server';
import {
  ensureUserCanManageUsers,
  getAuthenticatedUser,
  getServiceRoleClient,
} from '../admin-utils';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all permissions
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Permissions API: Starting GET request');

    const serviceClient = getServiceRoleClient();
    const currentUser = await getAuthenticatedUser();
    await ensureUserCanManageUsers(currentUser.id, serviceClient);

    const { data: permissions, error } = await serviceClient
      .from('permissions')
      .select('*');

    if (error) {
      console.error('❌ Error fetching permissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch permissions', details: error.message },
        { status: 500 }
      );
    }

    const basePermissions = (permissions ?? []) as Array<Record<string, any>>;
    const sortedPermissions = basePermissions.sort((a, b) => {
      const keyA =
        (a.category as string | undefined) ||
        (a.resource as string | undefined) ||
        '';
      const keyB =
        (b.category as string | undefined) ||
        (b.resource as string | undefined) ||
        '';
      const compareKey = keyA.localeCompare(keyB);
      if (compareKey !== 0) {
        return compareKey;
      }
      return String(a.name ?? '').localeCompare(String(b.name ?? ''));
    });

    const transformedPermissions = sortedPermissions.map(permission => ({
      id: permission.id,
      name: permission.name,
      description: permission.description ?? null,
      category: permission.category ?? null,
      resource: permission.resource ?? null,
      action: permission.action ?? null,
      scope: permission.scope ?? null,
    }));

    return NextResponse.json({
      success: true,
      permissions: transformedPermissions,
    });
  } catch (error) {
    console.error('❌ Error in GET /api/users/permissions:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const status =
      errorMessage === 'Unauthorized'
        ? 401
        : errorMessage === 'Insufficient permissions'
        ? 403
        : 500;

    return NextResponse.json(
      { error: errorMessage },
      { status }
    );
  }
}
