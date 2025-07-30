import React from "react"
import { useRBAC } from "@/src/components/auth/rbac-provider"
import { useAuth } from "@/src/components/auth/simple-auth-provider"
import type { Role } from "@/src/components/auth/rbac-provider"
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
} from "@/lib/permissions"

export function usePermissions() {
  const { userRoles, refreshRoles, updateRoleDirectly, isLoading } = useRBAC()
  const { profile, roles: authRoles } = useAuth()

  // Prioritize auth provider roles over RBAC roles to prevent sync issues
  const effectiveRoles = authRoles.length > 0 ? authRoles : userRoles
  const primaryRole = effectiveRoles.length > 0 ? effectiveRoles[0] : "admin"

  // Force refresh function
  const forceRefresh = async () => {
    console.log("🔄 Force refreshing permissions...")
    console.log("Current role before refresh:", primaryRole)

    try {
      // Call the immediate role refresh API directly
      const response = await fetch("/api/immediate-role-refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Immediate role refresh API response:", data)

      if (data.success) {
        console.log("✅ API returned role:", data.role.value)

        // Update the role directly in the RBAC provider
        updateRoleDirectly(data.role.value as Role)

        // Force a small delay to ensure state updates propagate
        await new Promise((resolve) => setTimeout(resolve, 200))

        console.log("✅ Role updated directly to:", data.role.value)

        return data.role.value // Return the role from API response
      } else {
        console.error("❌ API refresh failed:", data.error)
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("❌ Force refresh failed:", error)
      throw error
    }
  }

  return {
    // Current user's role
    role: primaryRole,
    roles: effectiveRoles,
    isLoading,
    forceRefresh,

    // Action-based permissions
    can: (action: Action): boolean => {
      return effectiveRoles.some((role: string) => canPerformAction(role as Role, action))
    },

    canAny: (actions: Action[]): boolean => {
      return effectiveRoles.some((role: string) => canPerformAnyAction(role as Role, actions))
    },

    canAll: (actions: Action[]): boolean => {
      return effectiveRoles.some((role: string) => canPerformAllActions(role as Role, actions))
    },

    // Resource-based permissions
    canManage: (resource: Resource): boolean => {
      return effectiveRoles.some((role: string) => canManageResource(role as Role, resource))
    },

    canRead: (resource: Resource): boolean => {
      return effectiveRoles.some((role: string) => canReadResource(role as Role, resource))
    },

    canCreate: (resource: Resource): boolean => {
      return effectiveRoles.some((role: string) => canCreateResource(role as Role, resource))
    },

    canUpdate: (resource: Resource): boolean => {
      return effectiveRoles.some((role: string) => canUpdateResource(role as Role, resource))
    },

    canDelete: (resource: Resource): boolean => {
      return effectiveRoles.some((role: string) => canDeleteResource(role as Role, resource))
    },

    hasAnyPermission: (resource: Resource): boolean => {
      return effectiveRoles.some((role: string) => hasAnyResourcePermission(role as Role, resource))
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
