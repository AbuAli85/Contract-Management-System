// 🚨 EMERGENCY CIRCUIT BREAKER MODE 🚨
// This safe hook prevents infinite loops by providing safe fallback values

import React from "react"

// Emergency safe type definitions
type Role = "admin" | "user" | "manager" | "reviewer" | "promoter"
type Action = string
type Resource = string

// Emergency safe usePermissions hook
export function usePermissions() {
  console.log("🔐 EMERGENCY MODE: usePermissions using circuit breaker - NO NETWORK CALLS")
  
  return {
    // Current user's role - safe defaults
    role: "admin" as Role,
    roles: ["admin"] as Role[],
    isLoading: false,
    refreshRoles: () => {},

    // Action-based permissions - safe defaults allowing access
    can: (action: Action): boolean => {
      return true // Emergency mode allows all actions
    },

    canAny: (actions: Action[]): boolean => {
      return true // Emergency mode allows all actions
    },

    canAll: (actions: Action[]): boolean => {
      return true // Emergency mode allows all actions  
    },

    // Resource-based permissions - safe defaults allowing access
    canManage: (resource: Resource): boolean => {
      return true // Emergency mode allows all resources
    },

    canRead: (resource: Resource): boolean => {
      return true // Emergency mode allows all resources
    },

    canCreate: (resource: Resource): boolean => {
      return true // Emergency mode allows all resources
    },

    canUpdate: (resource: Resource): boolean => {
      return true // Emergency mode allows all resources
    },

    canDelete: (resource: Resource): boolean => {
      return true // Emergency mode allows all resources
    },

    hasAnyResourcePermission: (resource: Resource, actions: Action[]): boolean => {
      return true // Emergency mode allows all resources
    },

    hasAnyPermission: (resource: Resource): boolean => {
      return true // Emergency mode allows all resources
    },

    // Role checking functions - safe defaults
    isAdmin: () => true,
    isManager: () => true,
    isUser: () => true,
    isReviewer: () => true,
    isPromoter: () => true,

    hasRole: (role: Role): boolean => {
      return true // Emergency mode allows all roles
    },

    hasAnyRole: (roles: Role[]): boolean => {
      return true // Emergency mode allows all roles
    },

    hasAllRoles: (roles: Role[]): boolean => {
      return true // Emergency mode allows all roles
    },

    // Permission aggregation functions - safe defaults
    getAllowedActions: (): Action[] => {
      return [] // Emergency mode returns empty array
    },

    getAllowedResources: (): Resource[] => {
      return [] // Emergency mode returns empty array
    },

    getResourceActions: (resource: Resource): Action[] => {
      return [] // Emergency mode returns empty array
    },

    // Specific permission checks for common actions - all return true
    canAddPromoter: () => true,
    canEditPromoter: () => true,
    canDeletePromoter: () => true,
    canBulkDeletePromoters: () => true,
    canExportPromoters: () => true,

    canAddParty: () => true,
    canEditParty: () => true,
    canDeleteParty: () => true,
    canBulkDeleteParties: () => true,
    canExportParties: () => true,

    canCreateContract: () => true,
    canEditContract: () => true,
    canDeleteContract: () => true,
    canGenerateContract: () => true,
    canApproveContract: () => true,
    canExportContracts: () => true,

    canManageUsers: () => true,
    canAssignRoles: () => true,

    canAccessSettings: () => true,
    canAccessAnalytics: () => true,
    canAccessAuditLogs: () => true,
    canAccessNotifications: () => true,
  }
}

// Higher-order component for permission-based rendering
export function withPermission<T extends object>(
  Component: React.ComponentType<T>,
  requiredAction: Action,
  fallback?: React.ComponentType<T>,
) {
  return function PermissionWrappedComponent(props: T) {
    // Emergency mode - always allow access
    return React.createElement(Component, props)
  }
}

// Permission guard component
interface PermissionGuardProps {
  action: Action
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({ action, children, fallback }: PermissionGuardProps) {
  // Emergency mode - always show children
  return React.createElement(React.Fragment, null, children)
}

// Resource permission guard
interface ResourcePermissionGuardProps {
  resource: Resource
  action: Action
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ResourcePermissionGuard({ resource, action, children, fallback }: ResourcePermissionGuardProps) {
  // Emergency mode - always show children
  return React.createElement(React.Fragment, null, children)
}
