/**
 * useUserPermissions Hook
 * Client-side hook for checking user permissions
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';

export interface UserPermission {
  permission: string;
  granted: boolean;
}

export function useUserPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/users/${user.id}/permissions`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch permissions');
        }

        if (data.permissions) {
          setPermissions(data.permissions);
        } else {
          setPermissions([]);
        }
      } catch (err) {
        console.error('Error fetching user permissions:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch permissions'
        );
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user?.id]);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return permissions.some(p => p.permission === permission && p.granted);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    if (!user) return false;
    return permissionList.some(perm => hasPermission(perm));
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    if (!user) return false;
    return permissionList.every(perm => hasPermission(perm));
  };

  const refreshPermissions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${user.id}/permissions`);
      const data = await response.json();

      if (response.ok && data.permissions) {
        setPermissions(data.permissions);
      }
    } catch (err) {
      console.error('Error refreshing permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions,
  };
}
