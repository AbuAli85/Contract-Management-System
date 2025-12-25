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
      console.error(
        'useEnhancedRBAC must be used within an EnhancedRBACProvider'
      );
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
      console.log('🔐 Enhanced RBAC: Loading user roles for:', user.id);

      const supabase = createClient();

      // Try to fetch user data from profiles table (which exists)
      let userData = null;
      const companyData = null;

      // First try profiles table by email
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role, status, first_name, last_name')
        .eq('email', user.email || '')
        .maybeSingle();

      if (!profilesError && profilesData?.role) {
        console.log(
          '✅ Enhanced RBAC: Found user in profiles by email, role:',
          profilesData.role
        );
        userData = {
          id: profilesData.id,
          role: profilesData.role,
          company_id: null, // profiles table doesn't have company_id
          status: profilesData.status || 'active',
          email: profilesData.email,
        };
      } else {
        // If not found by email, try by auth ID
        console.log(
          '📋 Enhanced RBAC: User not found by email, trying auth ID...'
        );
        const { data: authIdProfile, error: authIdError } = await supabase
          .from('profiles')
          .select('id, email, role, status, first_name, last_name')
          .eq('id', user.id)
          .maybeSingle();

        if (!authIdError && authIdProfile?.role) {
          console.log(
            '✅ Enhanced RBAC: Found user in profiles by auth ID, role:',
            authIdProfile.role
          );
          userData = {
            id: authIdProfile.id,
            role: authIdProfile.role,
            company_id: null, // profiles table doesn't have company_id
            status: authIdProfile.status || 'active',
            email: authIdProfile.email,
          };
        } else {
          // Fallback: Use admin detection by email (same as working provider)
          console.log('📋 Enhanced RBAC: Using admin email fallback...');
          const fallbackRole =
            user.email === 'luxsess2001@gmail.com' ? 'admin' : 'user';
          console.log(
            '🔄 Enhanced RBAC: Using email fallback role:',
            fallbackRole
          );

          userData = {
            id: user.id,
            role: fallbackRole,
            company_id: null,
            status: 'active',
            email: user.email,
          };
        }
      }

      if (!userData) {
        console.warn(
          '⚠️ Enhanced RBAC: No user data found, using default user role'
        );
        setUserRole('user' as EnhancedUserRole);
        setUserPermissions(getUserPermissions('user'));
        setCompanyId(null);
        setIsCompanyMember(false);
        setIsLoading(false);
        return;
      }

      const role = userData.role as EnhancedUserRole;
      const permissions = getUserPermissions(role);
      const userCompanyId = userData.company_id;
      const isCompanyMemberStatus = !!(userCompanyId && companyData?.is_active);

      console.log('✅ Enhanced RBAC: User role loaded:', {
        role,
        permissions: permissions.length,
        companyId: userCompanyId,
        isCompanyMember: isCompanyMemberStatus,
      });

      setUserRole(role);
      setUserPermissions(permissions);
      setCompanyId(userCompanyId);
      setIsCompanyMember(isCompanyMemberStatus);
    } catch (error) {
      console.error('❌ Enhanced RBAC: Failed to load user roles:', error);

      // Fallback to basic user role
      setUserRole('user');
      setUserPermissions(getUserPermissions('user'));
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
      const currentLocale = window.location.pathname.split('/')[1] || 'en';
      const fullRedirectPath = `/${currentLocale}${redirectTo}`;
      console.log(`🚫 Access denied. Redirecting to: ${fullRedirectPath}`);
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
