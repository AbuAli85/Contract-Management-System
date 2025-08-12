'use client';

import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import {
  PermissionUtils,
  canPerformAction,
  hasPermission,
} from '@/lib/permissions/permissionMatrix';

interface EnhancedRBACProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredResource?: string;
  requiredAction?: string;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
  showUnauthorized?: boolean;
}

interface EnhancedRBACHOCProps {
  requiredPermissions?: string[];
  requiredResource?: string;
  requiredAction?: string;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
  showUnauthorized?: boolean;
}

// Enhanced RBAC Component Wrapper
export function EnhancedRBAC({
  children,
  requiredPermissions = [],
  requiredResource,
  requiredAction,
  requiredRoles = [],
  fallback = null,
  showUnauthorized = false,
}: EnhancedRBACProps) {
  const { user, role } = useUserRole();
  const loading = !user;

  if (loading) {
    return <div className='animate-pulse'>Loading...</div>;
  }

  if (!user) {
    return fallback || <div>Please log in to access this resource.</div>;
  }

  // Check role-based access
  if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
    if (showUnauthorized) {
      return (
        <div className='p-4 border border-red-200 bg-red-50 rounded-md'>
          <div className='flex items-center gap-2 text-red-800'>
            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                clipRule='evenodd'
              />
            </svg>
            <span className='font-medium'>Access Denied</span>
          </div>
          <p className='text-red-700 mt-1'>
            You need one of these roles: {requiredRoles.join(', ')}
          </p>
        </div>
      );
    }
    return fallback;
  }

  // Check specific permissions
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission =>
      hasPermission(role, permission)
    );

    if (!hasAllPermissions) {
      if (showUnauthorized) {
        return (
          <div className='p-4 border border-red-200 bg-red-50 rounded-md'>
            <div className='flex items-center gap-2 text-red-800'>
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='font-medium'>Insufficient Permissions</span>
            </div>
            <p className='text-red-700 mt-1'>
              Required permissions: {requiredPermissions.join(', ')}
            </p>
          </div>
        );
      }
      return fallback;
    }
  }

  // Check resource-action based access
  if (requiredResource && requiredAction) {
    if (!canPerformAction(role, requiredResource, requiredAction)) {
      if (showUnauthorized) {
        return (
          <div className='p-4 border border-red-200 bg-red-50 rounded-md'>
            <div className='flex items-center gap-2 text-red-800'>
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='font-medium'>Action Not Allowed</span>
            </div>
            <p className='text-red-700 mt-1'>
              You cannot perform {requiredAction} on {requiredResource}
            </p>
          </div>
        );
      }
      return fallback;
    }
  }

  return <>{children}</>;
}

// Enhanced RBAC HOC for components
export function withEnhancedRBAC<P extends object>(
  Component: React.ComponentType<P>,
  {
    requiredPermissions = [],
    requiredResource,
    requiredAction,
    requiredRoles = [],
    fallback,
    showUnauthorized = false,
  }: EnhancedRBACHOCProps = {}
) {
  const EnhancedComponent = (props: P) => (
    <EnhancedRBAC
      requiredPermissions={requiredPermissions}
      requiredResource={requiredResource}
      requiredAction={requiredAction}
      requiredRoles={requiredRoles}
      fallback={fallback}
      showUnauthorized={showUnauthorized}
    >
      <Component {...props} />
    </EnhancedRBAC>
  );

  EnhancedComponent.displayName = `withEnhancedRBAC(${Component.displayName || Component.name})`;

  return EnhancedComponent;
}

// Permission-based conditional rendering
export function PermissionGate({
  children,
  permission,
  resource,
  action,
  role,
  fallback = null,
  showUnauthorized = false,
}: {
  children: React.ReactNode;
  permission?: string;
  resource?: string;
  action?: string;
  role?: string;
  fallback?: React.ReactNode;
  showUnauthorized?: boolean;
}) {
  const { user, role: userRole } = useUserRole();
  const loading = !user;

  if (!user) return fallback;

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(userRole, permission);
  } else if (resource && action) {
    hasAccess = canPerformAction(userRole, resource, action);
  } else if (role) {
    hasAccess = userRole === role;
  }

  if (!hasAccess) {
    if (showUnauthorized) {
      return (
        <div className='text-sm text-muted-foreground'>Access restricted</div>
      );
    }
    return fallback;
  }

  return <>{children}</>;
}

// Role-based conditional rendering
export function RoleGate({
  children,
  roles,
  fallback = null,
  showUnauthorized = false,
}: {
  children: React.ReactNode;
  roles: string[];
  fallback?: React.ReactNode;
  showUnauthorized?: boolean;
}) {
  const { user, role: userRole } = useUserRole();
  const loading = !user;

  if (loading) return null;

  if (!user || !roles.includes(userRole)) {
    if (showUnauthorized) {
      return (
        <div className='text-sm text-muted-foreground'>
          Role access required: {roles.join(', ')}
        </div>
      );
    }
    return fallback;
  }

  return <>{children}</>;
}

// Permission-based button wrapper
export function PermissionButton({
  children,
  permission,
  resource,
  action,
  role,
  disabled,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  permission?: string;
  resource?: string;
  action?: string;
  role?: string;
}) {
  const { user, role: userRole } = useUserRole();

  if (!user) return null;

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(userRole, permission);
  } else if (resource && action) {
    hasAccess = canPerformAction(userRole, resource, action);
  } else if (role) {
    hasAccess = userRole === role;
  }

  if (!hasAccess) return null;

  return (
    <button {...props} disabled={disabled} className={className}>
      {children}
    </button>
  );
}

// Export all utilities
export { PermissionUtils, canPerformAction, hasPermission };
