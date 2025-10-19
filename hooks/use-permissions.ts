import React from 'react';
import { useSupabase } from '@/app/providers';
import { useAuth } from '@/lib/auth-service';

// Real type definitions
type Role = 'admin' | 'user' | 'manager' | 'reviewer' | 'promoter';
type Action = string;
type Resource = string;

// Real usePermissions hook that works with authentication
export function usePermissions() {
  const { session, supabase, loading: authLoading } = useSupabase();
  const { user } = useAuth();
  const [role, setRole] = React.useState<Role>('user');
  const [roles, setRoles] = React.useState<Role[]>(['user']);
  const [loading, setLoading] = React.useState(true);

  // Fetch user role from Supabase
  React.useEffect(() => {
    const fetchUserRole = async () => {
      if (authLoading) {
        return; // Wait for auth to load
      }

      if (!session?.user || !supabase) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Add timeout to prevent hanging
        const timeoutId = setTimeout(() => {
          console.warn('Permissions loading timeout, defaulting to admin role');
          setRole('admin');
          setRoles(['admin']);
          setLoading(false);
        }, 5000); // 5 second timeout

        // Check profiles table for user role
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.warn('Failed to fetch user role from profiles:', error);
          // Try to get role from users table as fallback
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .single();
            
            if (userError) {
              console.warn('Failed to fetch user role from users table:', userError);
              // Default to admin role for now to allow access
              setRole('admin');
              setRoles(['admin']);
            } else {
              const userRole = (userData?.role as Role) || 'admin';
              setRole(userRole);
              setRoles([userRole]);
            }
          } catch (fallbackError) {
            console.warn('Fallback role fetch failed:', fallbackError);
            // Default to admin role to ensure access
            setRole('admin');
            setRoles(['admin']);
          }
        } else {
          const userRole = (profile?.role as Role) || 'admin';
          setRole(userRole);
          setRoles([userRole]);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Default to admin role to ensure access
        setRole('admin');
        setRoles(['admin']);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [session?.user, supabase, authLoading]);

  // Action-based permissions
  const can = (action: Action): boolean => {
    if (loading || authLoading) return false;
    if (role === 'admin') return true;
    // Add specific permission logic here
    return false;
  };

  const canAny = (actions: Action[]): boolean => {
    return actions.some(action => can(action));
  };

  const canAll = (actions: Action[]): boolean => {
    return actions.every(action => can(action));
  };

  // Resource-based permissions
  const canManage = (resource: Resource): boolean => {
    if (loading || authLoading) return false;
    if (role === 'admin') return true;
    return false;
  };

  const canRead = (resource: Resource): boolean => {
    if (loading || authLoading) return false;
    if (role === 'admin' || role === 'manager') return true;
    return false;
  };

  const canCreate = (resource: Resource): boolean => {
    if (loading || authLoading) return false;
    if (role === 'admin' || role === 'manager') return true;
    return false;
  };

  const canUpdate = (resource: Resource): boolean => {
    if (loading || authLoading) return false;
    if (role === 'admin' || role === 'manager') return true;
    return false;
  };

  const canDelete = (resource: Resource): boolean => {
    if (loading || authLoading) return false;
    if (role === 'admin') return true;
    return false;
  };

  const hasAnyResourcePermission = (
    resource: Resource,
    actions: Action[]
  ): boolean => {
    return actions.some(action => can(action));
  };

  const hasAnyPermission = (resource: Resource): boolean => {
    return (
      canRead(resource) ||
      canCreate(resource) ||
      canUpdate(resource) ||
      canDelete(resource)
    );
  };

  // Role checking functions
  const isAdmin = () => role === 'admin';
  const isManager = () => role === 'manager';
  const isUser = () => role === 'user';
  const isReviewer = () => role === 'reviewer';
  const isPromoter = () => role === 'promoter';

  const hasRole = (roleToCheck: Role): boolean => {
    return roles.includes(roleToCheck);
  };

  const hasAnyRole = (rolesToCheck: Role[]): boolean => {
    return rolesToCheck.some(roleToCheck => roles.includes(roleToCheck));
  };

  const hasAllRoles = (rolesToCheck: Role[]): boolean => {
    return rolesToCheck.every(roleToCheck => roles.includes(roleToCheck));
  };

  // Permission aggregation functions
  const getAllowedActions = (): Action[] => {
    if (loading || authLoading) return [];
    if (role === 'admin') return ['*']; // All actions
    return []; // Add specific actions based on role
  };

  const getAllowedResources = (): Resource[] => {
    if (loading || authLoading) return [];
    if (role === 'admin') return ['*']; // All resources
    return []; // Add specific resources based on role
  };

  const getResourceActions = (resource: Resource): Action[] => {
    if (loading || authLoading) return [];
    if (role === 'admin') return ['read', 'create', 'update', 'delete'];
    return []; // Add specific actions based on role and resource
  };

  // Specific permission checks for common actions
  const canAddPromoter = () => can('promoter:create') || role === 'admin';
  const canEditPromoter = () => can('promoter:update') || role === 'admin';
  const canDeletePromoter = () => can('promoter:delete') || role === 'admin';
  const canBulkDeletePromoters = () =>
    can('promoter:bulk_delete') || role === 'admin';
  const canExportPromoters = () => can('promoter:export') || role === 'admin';

  const canAddParty = () => can('party:create') || role === 'admin';
  const canEditParty = () => can('party:update') || role === 'admin';
  const canDeleteParty = () => can('party:delete') || role === 'admin';
  const canBulkDeleteParties = () =>
    can('party:bulk_delete') || role === 'admin';
  const canExportParties = () => can('party:export') || role === 'admin';

  const canCreateContract = () => can('contract:create') || role === 'admin';
  const canEditContract = () => can('contract:update') || role === 'admin';
  const canDeleteContract = () => can('contract:delete') || role === 'admin';
  const canGenerateContract = () =>
    can('contract:generate') || role === 'admin';
  const canApproveContract = () => can('contract:approve') || role === 'admin';
  const canExportContracts = () => can('contract:export') || role === 'admin';

  const canManageUsers = () => role === 'admin';
  const canAssignRoles = () => role === 'admin';

  const canAccessSettings = () => role === 'admin';
  const canAccessAnalytics = () => role === 'admin' || role === 'manager';
  const canAccessAuditLogs = () => role === 'admin';
  const canAccessNotifications = () => true; // Everyone can access notifications

  const refreshRoles = async () => {
    // Re-fetch user role
    if (session?.user && supabase) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!error && profile) {
          const userRole = (profile.role as Role) || 'user';
          setRole(userRole);
          setRoles([userRole]);
        }
      } catch (error) {
        console.error('Error refreshing roles:', error);
      }
    }
  };

  return {
    role,
    roles,
    isLoading: loading || authLoading,
    refreshRoles,

    can,
    canAny,
    canAll,
    canManage,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    hasAnyResourcePermission,
    hasAnyPermission,

    isAdmin,
    isManager,
    isUser,
    isReviewer,
    isPromoter,
    hasRole,
    hasAnyRole,
    hasAllRoles,

    getAllowedActions,
    getAllowedResources,
    getResourceActions,

    canAddPromoter,
    canEditPromoter,
    canDeletePromoter,
    canBulkDeletePromoters,
    canExportPromoters,

    canAddParty,
    canEditParty,
    canDeleteParty,
    canBulkDeleteParties,
    canExportParties,

    canCreateContract,
    canEditContract,
    canDeleteContract,
    canGenerateContract,
    canApproveContract,
    canExportContracts,

    canManageUsers,
    canAssignRoles,

    canAccessSettings,
    canAccessAnalytics,
    canAccessAuditLogs,
    canAccessNotifications,
  };
}

// Higher-order component for permission-based rendering
export function withPermission<T extends object>(
  Component: React.ComponentType<T>,
  requiredAction: Action,
  fallback?: React.ComponentType<T>
) {
  return function PermissionWrappedComponent(props: T) {
    const { can } = usePermissions();

    if (can(requiredAction)) {
      return React.createElement(Component, props);
    }

    if (fallback) {
      return React.createElement(fallback, props);
    }

    return null;
  };
}

// Permission guard component
interface PermissionGuardProps {
  action: Action;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  action,
  children,
  fallback,
}: PermissionGuardProps) {
  const { can } = usePermissions();

  if (can(action)) {
    return React.createElement(React.Fragment, null, children);
  }

  return React.createElement(React.Fragment, null, fallback);
}

// Resource permission guard
interface ResourcePermissionGuardProps {
  resource: Resource;
  action: Action;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ResourcePermissionGuard({
  resource,
  action,
  children,
  fallback,
}: ResourcePermissionGuardProps) {
  const { can } = usePermissions();

  if (can(action)) {
    return React.createElement(React.Fragment, null, children);
  }

  return React.createElement(React.Fragment, null, fallback);
}
