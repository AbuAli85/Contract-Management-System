"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-service"
import { createClient } from "@/lib/supabase/client"

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

      // Method 1: Try direct Supabase client first (bypasses cookie issues)
      try {
        console.log("🔐 RBAC: Trying direct Supabase client...")
        const supabase = createClient()
        
        if (!supabase) {
          throw new Error("Failed to create Supabase client")
        }
        
        // Check users table
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        if (!usersError && usersData?.role) {
          console.log("✅ Role from direct Supabase client:", usersData.role)
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
          console.log("✅ Role from profiles table:", profilesData.role)
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
          console.log("✅ Role from app_users table:", appUsersData.role)
          setUserRoles([appUsersData.role as Role])
          setIsLoading(false)
          return
        }

        console.log("⚠️ No role found in database, using default")
        setUserRoles(["user"])
        setIsLoading(false)
        return
      } catch (directError) {
        console.log("🔐 RBAC: Direct Supabase client failed, trying API...")
      }

      // Method 2: Fallback to API route
      console.log("🔐 RBAC: Fetching roles from API...")
      
      // Debug: Check if we're in browser and log cookies
      if (typeof window !== "undefined") {
        console.log("🔍 Available cookies:", document.cookie)
      }
      
      const response = await fetch("/api/get-user-role", {
        method: "GET",
        credentials: "include", // Include HttpOnly cookies
        mode: "cors", // Ensure CORS rules allow cookies
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      console.log("🔐 RBAC: Response status:", response.status, response.ok)

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
