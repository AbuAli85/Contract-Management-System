/**
 * Permission Service
 * Centralized service for managing and checking user permissions
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource?: string;
  action?: string;
}

export interface UserPermission {
  permission: string;
  granted: boolean;
}

/**
 * Get all available permissions from the database
 */
export async function getAllPermissions(): Promise<Permission[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllPermissions:', error);
    return [];
  }
}

/**
 * Get user's permissions from the database
 */
function getServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error('Service role key or Supabase URL not configured');
  }
  
  return createServiceClient(supabaseUrl, serviceRoleKey);
}

export async function getUserPermissions(userId: string): Promise<UserPermission[]> {
  try {
    const serviceClient = getServiceRoleClient();

    // Try to get from user_permissions_cache first
    const { data: cacheData, error: cacheError } = await serviceClient
      .from('user_permissions_cache')
      .select('permissions')
      .eq('user_id', userId)
      .single();

    if (!cacheError && cacheData?.permissions) {
      // Convert array of permission strings to UserPermission format
      const permissions = Array.isArray(cacheData.permissions)
        ? cacheData.permissions
        : [];
      
      return permissions.map((perm: string) => ({
        permission: perm,
        granted: true,
      }));
    }

    // Fallback: Get permissions from roles
    const { data: roleData, error: roleError } = await serviceClient
      .from('user_role_assignments')
      .select(`
        roles:role_id (
          role_permissions (
            permissions:permission_id (
              name
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (roleError || !roleData) {
      console.warn('Error fetching user permissions from roles:', roleError);
      return [];
    }

    // Extract unique permissions from roles
    const permissionSet = new Set<string>();
    roleData.forEach((assignment: any) => {
      if (assignment.roles?.role_permissions) {
        assignment.roles.role_permissions.forEach((rp: any) => {
          if (rp.permissions?.name) {
            permissionSet.add(rp.permissions.name);
          }
        });
      }
    });

    return Array.from(permissionSet).map(perm => ({
      permission: perm,
      granted: true,
    }));
  } catch (error) {
    console.error('Error in getUserPermissions:', error);
    return [];
  }
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  try {
    const userPermissions = await getUserPermissions(userId);
    return userPermissions.some(
      up => up.permission === permission && up.granted
    );
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  try {
    const userPermissions = await getUserPermissions(userId);
    const grantedPermissions = userPermissions
      .filter(up => up.granted)
      .map(up => up.permission);
    
    return permissions.some(perm => grantedPermissions.includes(perm));
  } catch (error) {
    console.error('Error checking any permission:', error);
    return false;
  }
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  try {
    const userPermissions = await getUserPermissions(userId);
    const grantedPermissions = userPermissions
      .filter(up => up.granted)
      .map(up => up.permission);
    
    return permissions.every(perm => grantedPermissions.includes(perm));
  } catch (error) {
    console.error('Error checking all permissions:', error);
    return false;
  }
}

/**
 * Get user's role from profiles table
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Error fetching user role:', error);
      return null;
    }

    return data?.role || null;
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return null;
  }
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissionsForRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'promoter:read',
      'promoter:read:own',
      'promoter:create',
      'promoter:update',
      'promoter:update:own',
      'promoter:delete',
      'promoter:export',
      'promoter:assign',
      'promoter:analytics',
      'promoter:bulk',
      'users:view',
      'users:create',
      'users:edit',
      'users:delete',
      'contracts:view',
      'contracts:create',
      'contracts:edit',
      'contracts:delete',
    ],
    manager: [
      'promoter:read',
      'promoter:read:own',
      'promoter:create',
      'promoter:update',
      'promoter:update:own',
      'promoter:export',
      'promoter:assign',
      'promoter:analytics',
      'promoter:bulk',
      'users:view',
      'contracts:view',
      'contracts:create',
      'contracts:edit',
    ],
    user: [
      'promoter:read:own',
      'promoter:update:own',
      'contracts:view',
    ],
    promoter: [
      'promoter:read:own',
      'promoter:update:own',
    ],
  };

  return rolePermissions[role] || [];
}

