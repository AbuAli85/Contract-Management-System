/**
 * Company Permissions Utility
 * 
 * Helper functions to check if a user has specific permissions for a company
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';

export type CompanyPermission = 
  | 'company:create'
  | 'company:edit'
  | 'company:delete'
  | 'company:view'
  | 'company:settings'
  | 'company:manage_members'
  | 'company:invite_users';

/**
 * Check if user has a specific permission for a company
 */
export async function hasCompanyPermission(
  userId: string,
  companyId: string,
  permission: CompanyPermission
): Promise<boolean> {
  try {
    const adminClient = createAdminClient();

    // First check role-based permissions
    const { data: membership } = await adminClient
      .from('company_members')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    const { data: ownedCompany } = await adminClient
      .from('companies')
      .select('owner_id')
      .eq('id', companyId)
      .maybeSingle();

    const userRole = membership?.role || (ownedCompany?.owner_id === userId ? 'owner' : null);

    // Role-based default permissions
    if (userRole === 'owner') {
      return true; // Owners have all permissions
    }

    if (userRole === 'admin') {
      // Admins can do everything except delete
      return permission !== 'company:delete';
    }

    if (userRole === 'manager') {
      // Managers can view and edit
      return ['company:view', 'company:edit'].includes(permission);
    }

    // Check explicit permissions
    const { data: explicitPermission } = await adminClient
      .from('company_permissions')
      .select('granted')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('permission', permission)
      .eq('is_active', true)
      .eq('granted', true)
      .is('expires_at', null)
      .maybeSingle();

    return explicitPermission?.granted === true;
  } catch (error) {
    console.error('Error checking company permission:', error);
    return false;
  }
}

/**
 * Get all permissions for a user in a company
 */
export async function getUserCompanyPermissions(
  userId: string,
  companyId: string
): Promise<CompanyPermission[]> {
  try {
    const adminClient = createAdminClient();

    // Get role-based permissions
    const { data: membership } = await adminClient
      .from('company_members')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    const { data: ownedCompany } = await adminClient
      .from('companies')
      .select('owner_id')
      .eq('id', companyId)
      .maybeSingle();

    const userRole = membership?.role || (ownedCompany?.owner_id === userId ? 'owner' : null);

    const permissions: CompanyPermission[] = [];

    if (userRole === 'owner') {
      // Owners have all permissions
      return [
        'company:create',
        'company:edit',
        'company:delete',
        'company:view',
        'company:settings',
        'company:manage_members',
        'company:invite_users',
      ];
    }

    if (userRole === 'admin') {
      permissions.push(
        'company:create',
        'company:edit',
        'company:view',
        'company:settings',
        'company:manage_members',
        'company:invite_users'
      );
    }

    if (userRole === 'manager') {
      permissions.push('company:view', 'company:edit');
    }

    // Get explicit permissions
    const { data: explicitPermissions } = await adminClient
      .from('company_permissions')
      .select('permission')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .eq('granted', true)
      .is('expires_at', null);

    if (explicitPermissions) {
      explicitPermissions.forEach((p) => {
        if (!permissions.includes(p.permission as CompanyPermission)) {
          permissions.push(p.permission as CompanyPermission);
        }
      });
    }

    return permissions;
  } catch (error) {
    console.error('Error getting user company permissions:', error);
    return [];
  }
}

/**
 * Check if user can perform action on company (combines role and explicit permissions)
 */
export async function canPerformCompanyAction(
  userId: string,
  companyId: string,
  action: 'create' | 'edit' | 'delete' | 'view' | 'settings' | 'manage_members' | 'invite_users'
): Promise<boolean> {
  const permission: CompanyPermission = `company:${action}` as CompanyPermission;
  return hasCompanyPermission(userId, companyId, permission);
}

