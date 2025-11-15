import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ServiceClient = SupabaseClient<any, any, any>;

const REQUIRED_ROLES = ['super_admin', 'admin', 'manager'];
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const SORTABLE_FIELDS = new Set([
  'created_at',
  'updated_at',
  'last_sign_in_at',
  'email',
  'full_name',
]);

type PermissionCacheRow = {
  roles: string[] | null;
  permissions: string[] | null;
};

type RoleAssignmentRow = {
  roles: { name: string | null } | null;
};

function getServiceRoleClient(): ServiceClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase service role credentials');
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as ServiceClient;
}

async function getAuthenticatedUser() {
  const supabaseServer = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabaseServer.auth.getUser();

  if (error || !user) {
    throw new Error(error?.message || 'Unauthorized');
  }

  return user;
}

async function ensureUserCanManageUsers(
  userId: string,
  adminClient: ServiceClient
) {
  try {
    const { data, error } = await adminClient
      .from('user_permissions_cache')
      .select('roles, permissions')
      .eq('user_id', userId)
      .single<PermissionCacheRow>();

    if (error) {
      console.warn(
        '⚠️ Unable to read user_permissions_cache, falling back to user_role_assignments:',
        error.message
      );
      const { data: fallbackRoles, error: fallbackError } = await adminClient
        .from('user_role_assignments')
        .select('roles(name)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .returns<RoleAssignmentRow[]>();

      if (fallbackError) {
        throw fallbackError;
      }

      const mappedRoles =
        fallbackRoles
          ?.map(entry => entry.roles?.name)
          .filter(Boolean) || [];

      if (!mappedRoles.some(role => REQUIRED_ROLES.includes(role as string))) {
        throw new Error('Insufficient permissions');
      }

      return {
        roles: mappedRoles,
        permissions: [],
      };
    }

    const roles = data?.roles || [];
    if (!roles.some(role => REQUIRED_ROLES.includes(role))) {
      throw new Error('Insufficient permissions');
    }

    return {
      roles,
      permissions: data?.permissions || [],
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Insufficient permissions';
    throw new Error(message);
  }
}

function sanitizeSearchTerm(raw: string) {
  return raw.replace(/[%_]/g, '').trim();
}

async function refreshPermissionsCache(adminClient: ServiceClient
) {
  try {
    const { error } = await adminClient.rpc('refresh_user_permissions_cache');
    if (error) {
      console.warn(
        '⚠️ Failed to refresh user_permissions_cache:',
        error.message
      );
    }
  } catch (refreshError) {
    console.warn(
      '⚠️ Exception refreshing user_permissions_cache:',
      refreshError
    );
  }
}

async function assignRoleToUser(
  adminClient: ServiceClient,
  userId: string,
  roleName: string,
  actorId: string
) {
  const { data: roleRecord, error: roleLookupError } = await adminClient
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single();

  if (roleLookupError || !roleRecord) {
    throw new Error(`Role "${roleName}" not found`);
  }

  const now = new Date().toISOString();

  const { error: upsertError } = await adminClient
    .from('user_role_assignments')
    .upsert(
      {
        user_id: userId,
        role_id: roleRecord.id,
        assigned_by: actorId,
        is_active: true,
        valid_from: now,
        updated_at: now,
      },
      {
        onConflict: 'user_id,role_id',
      }
    );

  if (upsertError) {
    throw new Error(`Failed to assign role: ${upsertError.message}`);
  }
}

async function deactivateOtherRoles(
  adminClient: ServiceClient,
  userId: string,
  roleNameToKeep: string
) {
  const { data: keepRole, error: lookupError } = await adminClient
    .from('roles')
    .select('id')
    .eq('name', roleNameToKeep)
    .single();

  if (lookupError || !keepRole) {
    throw new Error(`Role "${roleNameToKeep}" not found`);
  }

  const { error } = await adminClient
    .from('user_role_assignments')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .neq('role_id', keepRole.id);

  if (error) {
    throw new Error(`Failed to deactivate previous roles: ${error.message}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 User Management API: GET');

    const serviceClient = getServiceRoleClient();
    const currentUser = await getAuthenticatedUser();
    const adminContext = await ensureUserCanManageUsers(
      currentUser.id,
      serviceClient
    );

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

    let profileQuery = serviceClient
      .from('profiles')
      .select('*', { count: 'exact' })
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

    let filteredByRoleUserIds: string[] | null = null;

    if (roleFilter && roleFilter !== 'all') {
      const { data: roleMatches, error: roleMatchError } = await serviceClient
        .from('user_permissions_cache')
        .select('user_id')
        .contains('roles', [roleFilter]);

      if (roleMatchError) {
        console.error('❌ Failed to apply role filter:', roleMatchError);
        return NextResponse.json(
          {
            error: 'Failed to apply role filter',
            details: roleMatchError.message,
          },
          { status: 500 }
        );
      }

      filteredByRoleUserIds =
        roleMatches?.map(entry => entry.user_id).filter(Boolean) || [];

      if (filteredByRoleUserIds.length === 0) {
        return NextResponse.json({
          success: true,
          users: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
          stats: {
            total: 0,
            active: 0,
            pending: 0,
            inactive: 0,
            admins: 0,
          },
          context: {
            roles: adminContext.roles,
            permissions: adminContext.permissions,
          },
        });
      }

      profileQuery = profileQuery.in('id', filteredByRoleUserIds);
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
        .eq('status', 'active'),
      serviceClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      serviceClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'inactive'),
      serviceClient
        .from('user_permissions_cache')
        .select('user_id', { count: 'exact', head: true })
        .contains('roles', ['admin']),
    ]);

    if (profilesError) {
      console.error('❌ Failed to fetch profiles:', profilesError);
      return NextResponse.json(
        {
          error: 'Failed to fetch users',
          details: profilesError.message,
        },
        { status: 500 }
      );
    }

    const userIds = profiles?.map(profile => profile.id) || [];
    let permissionsByUser: Record<
      string,
      { roles: string[]; permissions: string[] }
    > = {};

    if (userIds.length > 0) {
      const { data: permissionsData, error: permissionsError } =
        await serviceClient
          .from('user_permissions_cache')
          .select('user_id, roles, permissions')
          .in('user_id', userIds);

      if (permissionsError) {
        console.warn(
          '⚠️ Unable to join permissions cache:',
          permissionsError.message
        );
      } else if (permissionsData) {
        permissionsByUser = permissionsData.reduce((acc, entry) => {
          acc[entry.user_id] = {
            roles: entry.roles || [],
            permissions: entry.permissions || [],
          };
          return acc;
        }, {} as Record<string, { roles: string[]; permissions: string[] }>);
      }
    }

    const sanitizedUsers =
      profiles?.map(profile => {
        const roleData = permissionsByUser[profile.id] || {
          roles: [],
          permissions: [],
        };

        return {
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
          roles: roleData.roles,
          permissions: roleData.permissions,
        };
      }) || [];

    const total = count || 0;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    const stats = {
      total,
      active: activeCountPromise.count || 0,
      pending: pendingCountPromise.count || 0,
      inactive: inactiveCountPromise.count || 0,
      admins: adminCountPromise.count || 0,
    };

    return NextResponse.json({
      success: true,
      users: sanitizedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      stats,
      context: {
        roles: adminContext.roles,
        permissions: adminContext.permissions,
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
    console.error('❌ User management GET error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status =
      message === 'Unauthorized'
        ? 401
        : message === 'Insufficient permissions'
        ? 403
        : 500;

    return NextResponse.json(
      {
        error: message,
      },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 User Management API: POST');

    const serviceClient = getServiceRoleClient();
    const currentUser = await getAuthenticatedUser();
    await ensureUserCanManageUsers(currentUser.id, serviceClient);

    const body = await request.json();
    const { action, userId, role, status } = body;

    if (!action || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'approve': {
        const updates = {
          status: 'active',
          updated_at: new Date().toISOString(),
          updated_by: currentUser.id,
        };

        const { error } = await serviceClient
          .from('profiles')
          .update(updates)
          .eq('id', userId);

        if (error) {
          throw new Error(`Failed to approve user: ${error.message}`);
        }

        const targetRole = role || 'user';
        await assignRoleToUser(serviceClient, userId, targetRole, currentUser.id);
        await deactivateOtherRoles(serviceClient, userId, targetRole);
        await refreshPermissionsCache(serviceClient);

        return NextResponse.json({
          success: true,
          message: 'User approved successfully',
        });
      }

      case 'reject': {
        const updates = {
          status: 'inactive',
          updated_at: new Date().toISOString(),
          updated_by: currentUser.id,
        };

        const { error } = await serviceClient
          .from('profiles')
          .update(updates)
          .eq('id', userId);

        if (error) {
          throw new Error(`Failed to reject user: ${error.message}`);
        }

        await refreshPermissionsCache(serviceClient);

        return NextResponse.json({
          success: true,
          message: 'User rejected successfully',
        });
      }

      case 'update_role': {
        if (!role) {
          return NextResponse.json(
            { error: 'Role is required for update_role action' },
            { status: 400 }
          );
        }

        await assignRoleToUser(serviceClient, userId, role, currentUser.id);
        await deactivateOtherRoles(serviceClient, userId, role);
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

        const updates = {
          status,
          updated_at: new Date().toISOString(),
          updated_by: currentUser.id,
        };

        const { error } = await serviceClient
          .from('profiles')
          .update(updates)
          .eq('id', userId);

        if (error) {
          throw new Error(`Failed to update status: ${error.message}`);
        }

        return NextResponse.json({
          success: true,
          message: `Status updated to ${status}`,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ User management POST error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status =
      message === 'Unauthorized'
        ? 401
        : message === 'Insufficient permissions'
        ? 403
        : 500;

    return NextResponse.json(
      {
        error: message,
      },
      { status }
    );
  }
}
