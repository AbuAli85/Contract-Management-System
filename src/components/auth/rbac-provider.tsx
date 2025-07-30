"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-service"

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
  const { user } = useAuth()
  const [userRoles, setUserRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load user roles from API or default to user role
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

      // Fetch roles from API
      console.log("🔐 RBAC: Fetching roles from API...")
      const response = await fetch("/api/get-user-role", {
        method: "GET",
        credentials: "include", // Include HttpOnly cookies
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
  }, [user])

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
