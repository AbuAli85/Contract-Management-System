'use client';

import { useState, useEffect } from 'react';

export type CompanyPermission =
  | 'company:create'
  | 'company:edit'
  | 'company:delete'
  | 'company:view'
  | 'company:settings'
  | 'company:manage_members'
  | 'company:invite_users';

interface UseCompanyPermissionsResult {
  permissions: CompanyPermission[];
  hasPermission: (permission: CompanyPermission) => boolean;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to check company permissions for the current user
 */
export function useCompanyPermissions(
  companyId: string | null
): UseCompanyPermissionsResult {
  const [permissions, setPermissions] = useState<CompanyPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPermissions = async () => {
    if (!companyId) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/company/permissions?company_id=${companyId}`
      );
      const data = await response.json();

      if (response.ok && data.success) {
        const activePermissions = (data.permissions || [])
          .filter((p: any) => p.granted && p.is_active)
          .map((p: any) => p.permission as CompanyPermission);
        setPermissions(activePermissions);
      } else {
        throw new Error(data.error || 'Failed to fetch permissions');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [companyId]);

  const hasPermission = (permission: CompanyPermission): boolean => {
    return permissions.includes(permission);
  };

  return {
    permissions,
    hasPermission,
    loading,
    error,
    refresh: fetchPermissions,
  };
}

/**
 * Hook to check if user can perform specific company actions
 * Uses role-based fallback if explicit permissions not found
 */
export function useCompanyActions(companyId: string | null, userRole: string) {
  const { permissions, hasPermission, loading } =
    useCompanyPermissions(companyId);

  // Role-based default permissions
  const rolePermissions: Record<string, CompanyPermission[]> = {
    owner: [
      'company:create',
      'company:edit',
      'company:delete',
      'company:view',
      'company:settings',
      'company:manage_members',
      'company:invite_users',
    ],
    admin: [
      'company:create',
      'company:edit',
      'company:view',
      'company:settings',
      'company:manage_members',
      'company:invite_users',
    ],
    manager: ['company:view', 'company:edit'],
  };

  const canCreate = () => {
    if (loading) return false;
    return (
      hasPermission('company:create') ||
      rolePermissions[userRole]?.includes('company:create') ||
      false
    );
  };

  const canEdit = () => {
    if (loading) return false;
    return (
      hasPermission('company:edit') ||
      rolePermissions[userRole]?.includes('company:edit') ||
      false
    );
  };

  const canDelete = () => {
    if (loading) return false;
    return (
      hasPermission('company:delete') ||
      rolePermissions[userRole]?.includes('company:delete') ||
      false
    );
  };

  const canView = () => {
    if (loading) return true; // Default to true for view
    return (
      hasPermission('company:view') ||
      rolePermissions[userRole]?.includes('company:view') ||
      true
    );
  };

  const canManageSettings = () => {
    if (loading) return false;
    return (
      hasPermission('company:settings') ||
      rolePermissions[userRole]?.includes('company:settings') ||
      false
    );
  };

  const canManageMembers = () => {
    if (loading) return false;
    return (
      hasPermission('company:manage_members') ||
      rolePermissions[userRole]?.includes('company:manage_members') ||
      false
    );
  };

  const canInviteUsers = () => {
    if (loading) return false;
    return (
      hasPermission('company:invite_users') ||
      rolePermissions[userRole]?.includes('company:invite_users') ||
      false
    );
  };

  return {
    canCreate,
    canEdit,
    canDelete,
    canView,
    canManageSettings,
    canManageMembers,
    canInviteUsers,
    loading,
  };
}
