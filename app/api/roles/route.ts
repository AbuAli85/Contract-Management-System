import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';
import { withRBAC } from '@/lib/rbac/guard';
import { getRoleDisplay } from '@/lib/role-hierarchy';
import { getServiceRoleClient } from '@/app/api/users/admin-utils';

const TENANT_MEMBERSHIP_ROLES = ['admin', 'manager', 'provider', 'client'] as const;

async function getHandler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { companyId } = await getCompanyRole(supabase);
    if (!companyId) {
      return NextResponse.json(
        { success: false, code: 'NO_ACTIVE_COMPANY', error: 'No active company selected' },
        { status: 403 }
      );
    }

    const serviceClient = getServiceRoleClient();
    const { data: rows, error } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch roles' },
        { status: 500 }
      );
    }

    const roleCounts = (rows || []).reduce(
      (acc: Record<string, number>, r: { role: string }) => {
        if (r.role) {
          acc[r.role] = (acc[r.role] || 0) + 1;
        }
        return acc;
      },
      {}
    );

    const roles = (TENANT_MEMBERSHIP_ROLES as readonly string[]).map((roleName) => ({
      id: roleName,
      name: roleName,
      description: `${getRoleDisplay(roleName).displayText} role`,
      permissions: [],
      userCount: roleCounts[roleName] ?? 0,
      created_at: new Date().toISOString(),
      is_system: roleName === 'admin' || roleName === 'manager',
    }));

    return NextResponse.json({ success: true, roles });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Creating roles via this endpoint is not supported. Use user management to assign tenant membership roles.',
    },
    { status: 405 }
  );
}

export const GET = withRBAC('roles:read:company', getHandler);
export const POST = withRBAC('roles:read:company', postHandler);
