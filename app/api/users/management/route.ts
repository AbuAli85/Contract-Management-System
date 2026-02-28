import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';
import { withRBAC } from '@/lib/rbac/guard';
import {
  getAuthenticatedUser,
  getServiceRoleClient,
  type ServiceClient,
} from '../admin-utils';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const SORTABLE_FIELDS = new Set([
  'created_at',
  'updated_at',
  'last_sign_in_at',
  'email',
  'full_name',
]);

/** Allowed tenant membership roles (user_roles.role) - never touch user_role_assignments */
const TENANT_MEMBERSHIP_ROLES = ['admin', 'manager', 'provider', 'client'] as const;
type TenantRole = (typeof TENANT_MEMBERSHIP_ROLES)[number];

function isValidTenantRole(role: string): role is TenantRole {
  return TENANT_MEMBERSHIP_ROLES.includes(role as TenantRole);
}

function sanitizeSearchTerm(raw: string) {
  return raw.replace(/[%_]/g, '').trim();
}

async function refreshPermissionsCache(adminClient: ServiceClient) {
  try {
    const { error } = await adminClient.rpc('refresh_user_permissions_cache');
    if (error) {
      // Non-fatal; cache will refresh eventually
    }
  } catch {
    // Ignore
  }
}

/**
 * Upsert tenant membership in user_roles. Does NOT touch user_role_assignments.
 * companyId MUST come from getCompanyRole (server context), never from request.
 */
async function upsertTenantMembership(
  adminClient: ServiceClient,
  userId: string,
  companyId: string,
  role: TenantRole,
  actorId: string,
  isActive: boolean
) {
  const now = new Date().toISOString();
  const { error } = await adminClient
    .from('user_roles')
    .upsert(
      {
        user_id: userId,
        company_id: companyId,
        role,
        is_active: isActive,
        assigned_by: actorId,
        assigned_at: now,
      },
      {
        onConflict: 'user_id,company_id',
      }
    );

  if (error) {
    throw new Error(`Failed to update tenant membership: ${error.message}`);
  }
}

/**
 * Update tenant membership role only. Does NOT touch user_role_assignments.
 */
async function updateTenantRole(
  adminClient: ServiceClient,
  userId: string,
  companyId: string,
  role: TenantRole
) {
  const { error } = await adminClient
    .from('user_roles')
    .update({
      role,
      assigned_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('company_id', companyId);

  if (error) {
    throw new Error(`Failed to update role: ${error.message}`);
  }
}

/**
 * Deactivate tenant membership. Does NOT touch user_role_assignments.
 */
async function deactivateTenantMembership(
  adminClient: ServiceClient,
  userId: string,
  companyId: string
) {
  const { error } = await adminClient
    .from('user_roles')
    .update({
      is_active: false,
      assigned_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('company_id', companyId);

  if (error) {
    throw new Error(`Failed to deactivate membership: ${error.message}`);
  }
}

/** Ensure target user is a member of the company (for update/disable operations) */
async function assertUserInCompany(
  adminClient: ServiceClient,
  userId: string,
  companyId: string
) {
  const { data, error } = await adminClient
    .from('user_roles')
    .select('user_id')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .single();

  if (error || !data) {
    throw new Error('User is not a member of this company');
  }
}

// ---------------------------------------------------------------------------
// GET: List users in tenant (scoped by companyId from getCompanyRole)
// ---------------------------------------------------------------------------
async function getHandler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { companyId } = await getCompanyRole(supabase);
    if (!companyId) {
      return NextResponse.json(
        {
          code: 'NO_ACTIVE_COMPANY',
          error: 'No active company selected',
          message: 'Please select a company from the switcher to manage users in that organization.',
        },
        { status: 403 }
      );
    }

    const serviceClient = getServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const statusFilter = searchParams.get('status');
    const roleFilter = searchParams.get('role');
    const sortByParam = searchParams.get('sortBy');
    const sortDirParam = searchParams.get('sortOrder');
    const pageParam = Number.parseInt(searchParams.get('page') || '1', 10);
    const limitParam = Number.parseInt(
      searchParams.get('limit') || `${DEFAULT_LIMIT}`,
      10
    );

    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const limit = Number.isNaN(limitParam)
      ? DEFAULT_LIMIT
      : Math.max(1, Math.min(limitParam, MAX_LIMIT));
    const offset = (page - 1) * limit;

    const sortBy =
      sortByParam && SORTABLE_FIELDS.has(sortByParam)
        ? sortByParam
        : 'created_at';
    const sortOrder = sortDirParam === 'asc' ? 'asc' : 'desc';

    const searchTerm = search ? sanitizeSearchTerm(search) : '';

    // Get user IDs in this company (tenant members only)
    let memberUserIdsQuery = serviceClient
      .from('user_roles')
      .select('user_id')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (roleFilter && roleFilter !== 'all' && isValidTenantRole(roleFilter)) {
      memberUserIdsQuery = memberUserIdsQuery.eq('role', roleFilter);
    }

    const { data: memberRows, error: memberError } = await memberUserIdsQuery;

    if (memberError) {
      return NextResponse.json(
        { error: 'Failed to fetch company members', details: memberError.message },
        { status: 500 }
      );
    }

    const memberUserIds =
      memberRows?.map((r: { user_id: string }) => r.user_id).filter(Boolean) ||
      [];

    if (memberUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        users: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        stats: { total: 0, active: 0, pending: 0, inactive: 0, admins: 0 },
        context: {
          roles: [...TENANT_MEMBERSHIP_ROLES],
          permissions: [],
        },
        appliedFilters: {
          search: searchTerm || undefined,
          status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
          role: roleFilter && roleFilter !== 'all' ? roleFilter : undefined,
          sortBy,
          sortOrder,
        },
      });
    }

    let profileQuery = serviceClient
      .from('profiles')
      .select('*', { count: 'exact' })
      .in('id', memberUserIds)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (searchTerm) {
      profileQuery = profileQuery.or(
        `email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      profileQuery = profileQuery.eq('status', statusFilter);
    }

    const [
      { data: profiles, error: profilesError, count },
      activeCountPromise,
      pendingCountPromise,
      inactiveCountPromise,
      adminCountPromise,
    ] = await Promise.all([
      profileQuery,
      serviceClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .in('id', memberUserIds)
        .eq('status', 'active'),
      serviceClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .in('id', memberUserIds)
        .eq('status', 'pending'),
      serviceClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .in('id', memberUserIds)
        .eq('status', 'inactive'),
      serviceClient
        .from('user_roles')
        .select('user_id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('role', 'admin')
        .eq('is_active', true),
    ]);

    if (profilesError) {
      return NextResponse.json(
        { error: 'Failed to fetch users', details: profilesError.message },
        { status: 500 }
      );
    }

    const userIds = profiles?.map((p: { id: string }) => p.id) || [];
    let rolesByUser: Record<string, string[]> = {};

    if (userIds.length > 0) {
      const { data: roleData } = await serviceClient
        .from('user_roles')
        .select('user_id, role')
        .eq('company_id', companyId)
        .in('user_id', userIds);

      if (roleData) {
        rolesByUser = roleData.reduce(
          (acc: Record<string, string[]>, r: { user_id: string; role: string }) => {
            if (!acc[r.user_id]) acc[r.user_id] = [];
            acc[r.user_id].push(r.role);
            return acc;
          },
          {}
        );
      }
    }

    const sanitizedUsers =
      profiles?.map((profile: Record<string, unknown>) => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        status: profile.status,
        department: profile.department,
        position: profile.position,
        company: profile.company,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_sign_in_at: profile.last_sign_in_at,
        roles: rolesByUser[profile.id as string] || [],
        permissions: [],
      })) || [];

    const total = count || 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      users: sanitizedUsers,
      pagination: { page, limit, total, totalPages },
      stats: {
        total,
        active: activeCountPromise?.count ?? 0,
        pending: pendingCountPromise?.count ?? 0,
        inactive: inactiveCountPromise?.count ?? 0,
        admins: adminCountPromise?.count ?? 0,
      },
      context: {
        roles: [...TENANT_MEMBERSHIP_ROLES],
        permissions: [],
      },
      appliedFilters: {
        search: searchTerm || undefined,
        status:
          statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
        role: roleFilter && roleFilter !== 'all' ? roleFilter : undefined,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status =
      message === 'Unauthorized'
        ? 401
        : message === 'Insufficient permissions'
          ? 403
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// ---------------------------------------------------------------------------
// POST: Tenant membership operations only (user_roles). Never user_role_assignments.
// ---------------------------------------------------------------------------
async function postHandler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { companyId } = await getCompanyRole(supabase);
    if (!companyId) {
      return NextResponse.json(
        {
          code: 'NO_ACTIVE_COMPANY',
          error: 'No active company selected',
          message: 'Please select a company from the switcher to manage users in that organization.',
        },
        { status: 403 }
      );
    }

    const serviceClient = getServiceRoleClient();
    const currentUser = await getAuthenticatedUser();

    const body = await request.json();
    const {
      action,
      userId,
      role,
      status,
      company_id: _ignoredCompanyId, // Never trust company_id from request
    } = body;

    if (!action || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'approve': {
        const membershipRole = role && isValidTenantRole(role) ? role : 'client';
        const profileUpdates = {
          status: 'active',
          updated_at: new Date().toISOString(),
          updated_by: currentUser.id,
        };

        const { error: profileError } = await serviceClient
          .from('profiles')
          .update(profileUpdates)
          .eq('id', userId);

        if (profileError) {
          throw new Error(`Failed to approve user: ${profileError.message}`);
        }

        await upsertTenantMembership(
          serviceClient,
          userId,
          companyId,
          membershipRole,
          currentUser.id,
          true
        );
        await refreshPermissionsCache(serviceClient);

        return NextResponse.json({
          success: true,
          message: 'User approved successfully',
        });
      }

      case 'reject': {
        const profileUpdates = {
          status: 'inactive',
          updated_at: new Date().toISOString(),
          updated_by: currentUser.id,
        };

        const { error: profileError } = await serviceClient
          .from('profiles')
          .update(profileUpdates)
          .eq('id', userId);

        if (profileError) {
          throw new Error(`Failed to reject user: ${profileError.message}`);
        }

        await upsertTenantMembership(
          serviceClient,
          userId,
          companyId,
          'client',
          currentUser.id,
          false
        );
        await refreshPermissionsCache(serviceClient);

        return NextResponse.json({
          success: true,
          message: 'User rejected successfully',
        });
      }

      case 'update_role': {
        if (!role || !isValidTenantRole(role)) {
          return NextResponse.json(
            {
              error: 'Role is required and must be one of: ' +
                TENANT_MEMBERSHIP_ROLES.join(', '),
            },
            { status: 400 }
          );
        }

        await assertUserInCompany(serviceClient, userId, companyId);
        await updateTenantRole(serviceClient, userId, companyId, role);
        await refreshPermissionsCache(serviceClient);

        return NextResponse.json({
          success: true,
          message: `Role updated to ${role}`,
        });
      }

      case 'update_status': {
        if (!status) {
          return NextResponse.json(
            { error: 'Status is required for update_status action' },
            { status: 400 }
          );
        }

        await assertUserInCompany(serviceClient, userId, companyId);

        if (status === 'inactive') {
          await deactivateTenantMembership(serviceClient, userId, companyId);
        } else if (status === 'active') {
          const { data: existing } = await serviceClient
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('company_id', companyId)
            .single();

          await upsertTenantMembership(
            serviceClient,
            userId,
            companyId,
            (existing?.role as TenantRole) || 'client',
            currentUser.id,
            true
          );
        }

        const profileUpdates = {
          status,
          updated_at: new Date().toISOString(),
          updated_by: currentUser.id,
        };

        const { error: profileError } = await serviceClient
          .from('profiles')
          .update(profileUpdates)
          .eq('id', userId);

        if (profileError) {
          throw new Error(`Failed to update status: ${profileError.message}`);
        }

        await refreshPermissionsCache(serviceClient);

        return NextResponse.json({
          success: true,
          message: `Status updated to ${status}`,
        });
      }

      case 'assign_permissions': {
        return NextResponse.json(
          {
            error:
              'assign_permissions is not available for tenant admins. Use platform admin API.',
          },
          { status: 405 }
        );
      }

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status =
      message === 'Unauthorized'
        ? 401
        : message === 'Insufficient permissions'
          ? 403
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export const GET = withRBAC('users:manage:company', getHandler);
export const POST = withRBAC('users:manage:company', postHandler);
