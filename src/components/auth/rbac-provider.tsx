"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAuth } from "./simple-auth-provider"

// Define the Role type
export type Role = "admin" | "manager" | "user"

// RBAC Context Type
interface RBACContextType {
  userRoles: Role[]
  isLoading: boolean
  refreshRoles: () => Promise<void>
  updateRoleDirectly: (role: Role) => void
}

const RBACContext = createContext<RBACContextType | undefined>(undefined)

// RBAC Provider Component
export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, roles: authRoles } = useAuth()
  const [userRoles, setUserRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load user roles from profile or default to user role
  const loadUserRoles = useCallback(async () => {
    if (!user) {
      console.log("🔐 RBAC: No user, clearing roles")
      setUserRoles([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      console.log("🔐 RBAC: Loading roles for user:", user.email)

      // Try to get roles from auth provider first
      if (authRoles && authRoles.length > 0) {
        console.log("🔐 RBAC: Using roles from auth provider:", authRoles)
        setUserRoles(authRoles as Role[])
        setIsLoading(false)
        return
      }

      // Try to get roles from profile
      if (profile?.role) {
        console.log("🔐 RBAC: Using role from profile:", profile.role)
        setUserRoles([profile.role as Role])
        setIsLoading(false)
        return
      }

      // Fallback: fetch roles from API
      console.log("🔐 RBAC: Fetching roles from API...")
      const response = await fetch("/api/get-user-role", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.role?.value) {
          console.log("🔐 RBAC: Role from API:", data.role.value)
          setUserRoles([data.role.value as Role])
        } else {
          console.log("🔐 RBAC: No role from API, using default")
          setUserRoles(["user"])
        }
      } else {
        console.log("🔐 RBAC: API failed, using default role")
        setUserRoles(["user"])
      }
    } catch (error) {
      console.error("🔐 RBAC: Error loading user roles:", error)
      setUserRoles(["user"])
    } finally {
      setIsLoading(false)
    }
  }, [user, profile, authRoles])

  // Refresh roles from server
  const refreshRoles = useCallback(async () => {
    console.log("🔐 RBAC: Refreshing roles...")
    await loadUserRoles()
  }, [loadUserRoles])

  // Update role directly (for immediate updates)
  const updateRoleDirectly = useCallback((role: Role) => {
    console.log("🔐 RBAC: Updating role directly to:", role)
    setUserRoles([role])
  }, [])

  // Load roles when user changes
  useEffect(() => {
    loadUserRoles()
  }, [loadUserRoles])

  const value: RBACContextType = {
    userRoles,
    isLoading,
    refreshRoles,
    updateRoleDirectly,
  }

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>
}

// Hook to use RBAC context
export function useRBAC() {
  const context = useContext(RBACContext)
  if (context === undefined) {
    throw new Error("useRBAC must be used within a RBACProvider")
  }
  return context
}
