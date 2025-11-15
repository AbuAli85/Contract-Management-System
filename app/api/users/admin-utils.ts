import { createClient as createServerClient } from '@/lib/supabase/server';
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from '@supabase/supabase-js';

export type ServiceClient = SupabaseClient<any, any, any>;

type PermissionCacheRow = {
  roles: string[] | null;
  permissions: string[] | null;
};

type RoleAssignmentRow = {
  roles: {
    name: string | null;
  } | null;
};

const REQUIRED_ROLES = ['super_admin', 'admin', 'manager'];

export function getServiceRoleClient(): ServiceClient {
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

export async function getAuthenticatedUser() {
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

export async function ensureUserCanManageUsers(
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
          .filter((roleName): roleName is string => Boolean(roleName)) || [];

      if (!mappedRoles.some(role => REQUIRED_ROLES.includes(role))) {
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

