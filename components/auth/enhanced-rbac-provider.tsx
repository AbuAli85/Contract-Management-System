'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useAuth } from '@/app/providers';
import { createClient } from '@/lib/supabase/client';
import type { EnhancedRBACContext } from '@/lib/enhanced-rbac';
import {
  EnhancedUserRole,
  EnhancedRBACContext as EnhancedRBACContextType,
  PermissionKey,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRoleLevel,
  getUserPermissions,
  getUserRoleInfo,
} from '@/lib/enhanced-rbac';

const EnhancedRBACContext = createContext<EnhancedRBACContextType | undefined>(
  undefined
);

export function useEnhancedRBAC(): EnhancedRBACContextType {
  const context = useContext(EnhancedRBACContext);
  if (!context) {
    // Development-only error logging
    if (process.env.NODE_ENV === 'development') {
      console.trace('Component stack trace:');
    }
    throw new Error(
      'useEnhancedRBAC must be used within an EnhancedRBACProvider'
    );
  }
  return context;
}

interface EnhancedRBACProviderProps {
  children: React.ReactNode;
}

export function EnhancedRBACProvider({ children }: EnhancedRBACProviderProps) {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<EnhancedUserRole | null>(null);
  const [userPermissions, setUserPermissions] = useState<PermissionKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isCompanyMember, setIsCompanyMember] = useState(false);

  // Safety timeout — 8 seconds max, then treat as unauthenticated (not 'user')
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        setUserRole(null);
        setUserPermissions([]);
        setIsLoading(false);
      }
    }, 8000);

    return () => clearTimeout(safetyTimer);
  }, [isLoading]);

  const refreshRoles = useCallback(async () => {
    if (!user?.id) {
      setUserRole(null);
      setUserPermissions([]);
      setCompanyId(null);
      setIsCompanyMember(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // 1. Resolve profile id and active_company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, active_company_id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        setUserRole(null);
        setUserPermissions([]);
        setCompanyId(null);
        setIsCompanyMember(false);
        setIsLoading(false);
        return;
      }

      const targetCompanyId = profile.active_company_id;

      if (!targetCompanyId) {
        setUserRole(null);
        setUserPermissions([]);
        setCompanyId(null);
        setIsCompanyMember(false);
        setIsLoading(false);
        return;
      }

      // 2. Look up role in user_roles — the canonical, company-scoped source
      const { data: userRoleRow, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id)
        .eq('company_id', targetCompanyId)
        .eq('is_active', true)
        .single();

      const role = (!roleError && userRoleRow?.role)
        ? (userRoleRow.role as EnhancedUserRole)
        : null;

      const permissions = role ? getUserPermissions(role) : [];

      setUserRole(role);
      setUserPermissions(permissions);
      setCompanyId(targetCompanyId);
      setIsCompanyMember(!!role);
    } catch {
      setUserRole(null);
      setUserPermissions([]);
      setCompanyId(null);
      setIsCompanyMember(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load roles when user changes
  useEffect(() => {
    refreshRoles();
  }, [refreshRoles]);

  // Permission checking functions
  const checkPermission = useCallback(
    (permission: PermissionKey): boolean => {
      if (!userRole) return false;
      return hasPermission(userRole, permission);
    },
    [userRole]
  );

  const checkAnyPermission = useCallback(
    (permissions: PermissionKey[]): boolean => {
      if (!userRole) return false;
      return hasAnyPermission(userRole, permissions);
    },
    [userRole]
  );

  const checkAllPermissions = useCallback(
    (permissions: PermissionKey[]): boolean => {
      if (!userRole) return false;
      return hasAllPermissions(userRole, permissions);
    },
    [userRole]
  );

  const checkRoleLevel = useCallback(
    (requiredRole: EnhancedUserRole): boolean => {
      if (!userRole) return false;
      return hasRoleLevel(userRole, requiredRole);
    },
    [userRole]
  );

  const contextValue: EnhancedRBACContext = {
    userRole,
    userPermissions,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    hasRoleLevel: checkRoleLevel,
    isLoading,
    companyId,
    isCompanyMember,
    refreshRoles,
  };

  return (
    <EnhancedRBACContext.Provider value={contextValue}>
      {children}
    </EnhancedRBACContext.Provider>
  );
}

// Permission-based wrapper components
interface PermissionWrapperProps {
  permission: PermissionKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionWrapper({
  permission,
  children,
  fallback = null,
}: PermissionWrapperProps) {
  const { hasPermission } = useEnhancedRBAC();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RoleWrapperProps {
  role: EnhancedUserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleWrapper({
  role,
  children,
  fallback = null,
}: RoleWrapperProps) {
  const { hasRoleLevel } = useEnhancedRBAC();

  if (!hasRoleLevel(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface MultiPermissionWrapperProps {
  permissions: PermissionKey[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function MultiPermissionWrapper({
  permissions,
  requireAll = false,
  children,
  fallback = null,
}: MultiPermissionWrapperProps) {
  const { hasAnyPermission, hasAllPermissions } = useEnhancedRBAC();

  const hasAccess = requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Loading component for RBAC checks
export function RBACLoading() {
  return (
    <div className='flex items-center justify-center p-8'>
      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      <span className='ml-2 text-gray-600'>Loading permissions...</span>
    </div>
  );
}

// Role-based redirect component
interface RoleRedirectProps {
  allowedRoles: EnhancedUserRole[];
  redirectTo?: string;
  children: React.ReactNode;
}

export function RoleRedirect({
  allowedRoles,
  redirectTo = '/unauthorized',
  children,
}: RoleRedirectProps) {
  const { userRole, isLoading } = useEnhancedRBAC();

  useEffect(() => {
    if (!isLoading && userRole && !allowedRoles.includes(userRole)) {
      // Use proper Next.js navigation
      const currentLocale = window.location.pathname.match(/^\/([a-z]{2})\//)?.[1] ?? 'en';
      const fullRedirectPath = `/${currentLocale}${redirectTo}`;
      window.location.href = fullRedirectPath;
    }
  }, [userRole, isLoading, allowedRoles, redirectTo]);

  if (isLoading) {
    return <RBACLoading />;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return (
      <div className='text-center p-8'>
        <h2 className='text-xl font-semibold text-gray-800 mb-2'>
          Access Denied
        </h2>
        <p className='text-gray-600'>
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

// Company membership wrapper
interface CompanyWrapperProps {
  requireMembership?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function CompanyWrapper({
  requireMembership = true,
  children,
  fallback = null,
}: CompanyWrapperProps) {
  const { isCompanyMember } = useEnhancedRBAC();

  if (requireMembership && !isCompanyMember) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
