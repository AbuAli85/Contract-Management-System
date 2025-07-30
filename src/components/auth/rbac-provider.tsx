"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-service"
import { useSupabase } from "@/app/providers"

// Define the Role type
type Role = "admin" | "user" | "manager" | "reviewer" | "promoter"

// Define the RBAC context type
interface RBACContextType {
  userRoles: Role[]
  isLoading: boolean
  hasRole: (role: Role) => boolean
  hasAnyRole: (roles: Role[]) => boolean
  hasAllRoles: (roles: Role[]) => boolean
  refreshRoles: () => Promise<void>
}

// Create the RBAC context
const RBACContext = createContext<RBACContextType | undefined>(undefined)

// Custom hook to use RBAC context
export const useRBAC = () => {
  const context = useContext(RBACContext)
  if (context === undefined) {
    throw new Error("useRBAC must be used within a RBACProvider")
  }
  return context
}

// RBAC Provider Component
export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { supabase } = useSupabase()
  const [userRoles, setUserRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load user roles from API or default to user role
  const loadUserRoles = useCallback(async () => {
    if (!user) {
      setUserRoles([])
      setIsLoading(false)
      return
    }

    try {
      // Method 1: Try direct Supabase client first (bypasses cookie issues)
      try {
        if (!supabase) {
          throw new Error("Failed to get Supabase client from context")
        }

        // Check users table
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        if (!usersError && usersData?.role) {
          setUserRoles([usersData.role as Role])
          setIsLoading(false)
          return
        }

        // Check profiles table
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (!profilesError && profilesData?.role) {
          setUserRoles([profilesData.role as Role])
          setIsLoading(false)
          return
        }

        // Check app_users table
        const { data: appUsersData, error: appUsersError } = await supabase
          .from("app_users")
          .select("role")
          .eq("id", user.id)
          .single()

        if (!appUsersError && appUsersData?.role) {
          setUserRoles([appUsersData.role as Role])
          setIsLoading(false)
          return
        }

        setUserRoles(["user"])
        setIsLoading(false)
        return
      } catch (directError) {
        // Fallback to API route
      }

      // Method 2: Fallback to API route
      const response = await fetch("/api/get-user-role", {
        method: "GET",
        credentials: "include",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.role?.value) {
          setUserRoles([data.role.value as Role])
        } else {
          setUserRoles(["user"])
        }
      } else {
        console.error("❌ RBAC: API request failed:", response.status)
        setUserRoles(["user"])
      }
    } catch (error) {
      console.error("🔐 RBAC: Error loading roles:", error)
      setUserRoles(["user"])
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  // Refresh roles from server
  const refreshRoles = useCallback(async () => {
    setIsLoading(true)
    await loadUserRoles()
  }, [loadUserRoles])

  // Load roles when user changes
  useEffect(() => {
    loadUserRoles()
  }, [loadUserRoles])

  // Helper functions
  const hasRole = useCallback((role: Role) => userRoles.includes(role), [userRoles])

  const hasAnyRole = useCallback((roles: Role[]) => roles.some(role => userRoles.includes(role)), [userRoles])

  const hasAllRoles = useCallback((roles: Role[]) => roles.every(role => userRoles.includes(role)), [userRoles])

  const contextValue: RBACContextType = {
    userRoles,
    isLoading,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    refreshRoles,
  }

  return <RBACContext.Provider value={contextValue}>{children}</RBACContext.Provider>
}
