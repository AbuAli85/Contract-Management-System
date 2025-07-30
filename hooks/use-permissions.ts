import React from "react"
import { useRBAC } from "@/src/components/auth/rbac-provider"
import { useAuth } from "@/lib/auth-service"
import type { Action, Resource } from "@/lib/permissions"
import {
  canPerformAction,
  canPerformAnyAction,
  canPerformAllActions,
  canManageResource,
  canReadResource,
  canCreateResource,
  canUpdateResource,
  canDeleteResource,
  hasAnyResourcePermission,
} from "@/lib/permissions"

// Define Role type locally since it's not exported from RBAC provider
type Role = "admin" | "user" | "manager" | "reviewer" | "promoter"

export function usePermissions() {
  const { userRoles, refreshRoles, isLoading } = useRBAC()
  const { user } = useAuth()

  // Use only RBAC roles since auth service doesn't provide roles
  const effectiveRoles = userRoles
  const primaryRole = (effectiveRoles && effectiveRoles.length > 0) ? effectiveRoles[0] : "admin"

  return {
    // Current user's role
    role: primaryRole,
    roles: effectiveRoles,
    isLoading,
    refreshRoles,

    // Action-based permissions
    can: (action: Action): boolean => {
      return (effectiveRoles && effectiveRoles.some((role: string) => canPerformAction(role as Role, action))) || false
    },

    canAny: (actions: Action[]): boolean => {
      return (effectiveRoles && effectiveRoles.some((role: string) => canPerformAnyAction(role as Role, actions))) || false
    },

    canAll: (actions: Action[]): boolean => {
      return (effectiveRoles && effectiveRoles.some((role: string) => canPerformAllActions(role as Role, actions))) || false
    },

    // Resource-based permissions
    canManage: (resource: Resource): boolean => {
      return (effectiveRoles && effectiveRoles.some((role: string) => canManageResource(role as Role, resource))) || false
    },

    canRead: (resource: Resource): boolean => {
      return (effectiveRoles && effectiveRoles.some((role: string) => canReadResource(role as Role, resource))) || false
    },

    canCreate: (resource: Resource): boolean => {
      return (effectiveRoles && effectiveRoles.some((role: string) => canCreateResource(role as Role, resource))) || false
    },

    canUpdate: (resource: Resource): boolean => {
      return (effectiveRoles && effectiveRoles.some((role: string) => canUpdateResource(role as Role, resource))) || false
    },

    canDelete: (resource: Resource): boolean => {
      return (effectiveRoles && effectiveRoles.some((role: string) => canDeleteResource(role as Role, resource))) || false
    },

    hasAnyPermission: (resource: Resource): boolean => {
      return (effectiveRoles && effectiveRoles.some((role: string) => hasAnyResourcePermission(role as Role, resource))) || false
    },

    // Specific permission checks for common actions
    canAddPromoter: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "promoter:create")),
    canEditPromoter: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "promoter:update")),
    canDeletePromoter: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "promoter:delete")),
    canBulkDeletePromoters: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "promoter:bulk_delete")),
    canExportPromoters: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "promoter:export")),

    canAddParty: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "party:create")),
    canEditParty: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "party:update")),
    canDeleteParty: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "party:delete")),
    canBulkDeleteParties: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "party:bulk_delete")),
    canExportParties: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "party:export")),

    canCreateContract: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "contract:create")),
    canEditContract: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "contract:update")),
    canDeleteContract: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "contract:delete")),
    canGenerateContract: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "contract:generate")),
    canApproveContract: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "contract:approve")),
    canExportContracts: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "contract:export")),

    canManageUsers: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "user:create")),
    canAssignRoles: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "user:assign_role")),

    canAccessSettings: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "system:settings")),
    canAccessAnalytics: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "system:analytics")),
    canAccessAuditLogs: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "system:audit_logs")),
    canAccessNotifications: () =>
      effectiveRoles.some((role: string) => canPerformAction(role as Role, "system:notifications")),
  }
}

// Higher-order component for permission-based rendering
export function withPermission<T extends object>(
  Component: React.ComponentType<T>,
  requiredAction: Action,
  fallback?: React.ComponentType<T>,
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
  action: "read" | "create" | "update" | "delete" | "manage"
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ResourcePermissionGuard({
  resource,
  action,
  children,
  fallback,
}: ResourcePermissionGuardProps) {
  const permissions = usePermissions()

  let hasPermission = false

  switch (action) {
    case "read":
      hasPermission = permissions.canRead(resource)
      break
    case "create":
      hasPermission = permissions.canCreate(resource)
      break
    case "update":
      hasPermission = permissions.canUpdate(resource)
      break
    case "delete":
      hasPermission = permissions.canDelete(resource)
      break
    case "manage":
      hasPermission = permissions.canManage(resource)
      break
  }

  if (hasPermission) {
    return React.createElement(React.Fragment, null, children)
  }

  return React.createElement(React.Fragment, null, fallback)
}
