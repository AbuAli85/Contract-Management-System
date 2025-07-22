import React from 'react'
import { useRBAC } from '@/src/components/auth/rbac-provider'
import {
  type Action,
  type Resource,
  canPerformAction,
  canPerformAnyAction,
  canPerformAllActions,
  canManageResource,
  canReadResource,
  canCreateResource,
  canUpdateResource,
  canDeleteResource,
  hasAnyResourcePermission,
} from '@/lib/permissions'

export function usePermissions() {
  const { userRoles } = useRBAC()
  
  // Get the primary role (first role in the array)
  const primaryRole = userRoles[0] || 'user'
  
  return {
    // Current user's role
    role: primaryRole,
    roles: userRoles,
    
    // Action-based permissions
    can: (action: Action): boolean => {
      return userRoles.some(role => canPerformAction(role, action))
    },
    
    canAny: (actions: Action[]): boolean => {
      return userRoles.some(role => canPerformAnyAction(role, actions))
    },
    
    canAll: (actions: Action[]): boolean => {
      return userRoles.some(role => canPerformAllActions(role, actions))
    },
    
    // Resource-based permissions
    canManage: (resource: Resource): boolean => {
      return userRoles.some(role => canManageResource(role, resource))
    },
    
    canRead: (resource: Resource): boolean => {
      return userRoles.some(role => canReadResource(role, resource))
    },
    
    canCreate: (resource: Resource): boolean => {
      return userRoles.some(role => canCreateResource(role, resource))
    },
    
    canUpdate: (resource: Resource): boolean => {
      return userRoles.some(role => canUpdateResource(role, resource))
    },
    
    canDelete: (resource: Resource): boolean => {
      return userRoles.some(role => canDeleteResource(role, resource))
    },
    
    hasAnyPermission: (resource: Resource): boolean => {
      return userRoles.some(role => hasAnyResourcePermission(role, resource))
    },
    
    // Specific permission checks for common actions
    canAddPromoter: () => userRoles.some(role => canPerformAction(role, 'promoter:create')),
    canEditPromoter: () => userRoles.some(role => canPerformAction(role, 'promoter:update')),
    canDeletePromoter: () => userRoles.some(role => canPerformAction(role, 'promoter:delete')),
    canBulkDeletePromoters: () => userRoles.some(role => canPerformAction(role, 'promoter:bulk_delete')),
    canExportPromoters: () => userRoles.some(role => canPerformAction(role, 'promoter:export')),
    
    canAddParty: () => userRoles.some(role => canPerformAction(role, 'party:create')),
    canEditParty: () => userRoles.some(role => canPerformAction(role, 'party:update')),
    canDeleteParty: () => userRoles.some(role => canPerformAction(role, 'party:delete')),
    canBulkDeleteParties: () => userRoles.some(role => canPerformAction(role, 'party:bulk_delete')),
    canExportParties: () => userRoles.some(role => canPerformAction(role, 'party:export')),
    
    canCreateContract: () => userRoles.some(role => canPerformAction(role, 'contract:create')),
    canEditContract: () => userRoles.some(role => canPerformAction(role, 'contract:update')),
    canDeleteContract: () => userRoles.some(role => canPerformAction(role, 'contract:delete')),
    canGenerateContract: () => userRoles.some(role => canPerformAction(role, 'contract:generate')),
    canApproveContract: () => userRoles.some(role => canPerformAction(role, 'contract:approve')),
    canExportContracts: () => userRoles.some(role => canPerformAction(role, 'contract:export')),
    
    canManageUsers: () => userRoles.some(role => canPerformAction(role, 'user:create')),
    canAssignRoles: () => userRoles.some(role => canPerformAction(role, 'user:assign_role')),
    
    canAccessSettings: () => userRoles.some(role => canPerformAction(role, 'system:settings')),
    canAccessAnalytics: () => userRoles.some(role => canPerformAction(role, 'system:analytics')),
    canAccessAuditLogs: () => userRoles.some(role => canPerformAction(role, 'system:audit_logs')),
    canAccessNotifications: () => userRoles.some(role => canPerformAction(role, 'system:notifications')),
  }
}

// Higher-order component for permission-based rendering
export function withPermission<T extends object>(
  Component: React.ComponentType<T>,
  requiredAction: Action,
  fallback?: React.ComponentType<T>
) {
  return function PermissionWrappedComponent(props: T) {
    const { can } = usePermissions()
    
    if (can(requiredAction)) {
      return React.createElement(Component, props)
    }
    
    if (fallback) {
      return React.createElement(fallback, props)
    }
    
    return null
  }
}

// Permission guard component
interface PermissionGuardProps {
  action: Action
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({ action, children, fallback }: PermissionGuardProps) {
  const { can } = usePermissions()
  
  if (can(action)) {
    return React.createElement(React.Fragment, null, children)
  }
  
  return React.createElement(React.Fragment, null, fallback)
}

// Resource permission guard
interface ResourcePermissionGuardProps {
  resource: Resource
  action: 'read' | 'create' | 'update' | 'delete' | 'manage'
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ResourcePermissionGuard({ 
  resource, 
  action, 
  children, 
  fallback 
}: ResourcePermissionGuardProps) {
  const permissions = usePermissions()
  
  let hasPermission = false
  
  switch (action) {
    case 'read':
      hasPermission = permissions.canRead(resource)
      break
    case 'create':
      hasPermission = permissions.canCreate(resource)
      break
    case 'update':
      hasPermission = permissions.canUpdate(resource)
      break
    case 'delete':
      hasPermission = permissions.canDelete(resource)
      break
    case 'manage':
      hasPermission = permissions.canManage(resource)
      break
  }
  
  if (hasPermission) {
    return React.createElement(React.Fragment, null, children)
  }
  
  return React.createElement(React.Fragment, null, fallback)
} 