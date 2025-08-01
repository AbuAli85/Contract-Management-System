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

  console.log("🔐 RBACProvider: Initializing with user:", user?.email, "supabase:", !!supabase)

  // Load user roles from API or default to user role
  const loadUserRoles = useCallback(async () => {
    console.log("🔐 RBACProvider: Loading user roles...")
    
    if (!user) {
      console.log("🔐 RBACProvider: No user, setting empty roles")
      setUserRoles([])
      setIsLoading(false)
      return
    }

    try {
      // Method 1: Try direct Supabase client first (bypasses cookie issues)
      try {
        if (!supabase) {
          console.log("🔐 RBACProvider: No Supabase client available")
          throw new Error("Failed to get Supabase client from context")
        }

        console.log("🔐 RBACProvider: Checking users table...")
        // Check users table with better error handling
        try {
          const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single()

          if (!usersError && usersData?.role) {
            console.log("✅ RBACProvider: Role from users table:", usersData.role)
            setUserRoles([usersData.role as Role])
            setIsLoading(false)
            return
          } else if (usersError) {
            console.log("🔐 RBACProvider: Users table error:", usersError.message)
            
            // If user not found in users table, try to create them
            if (usersError.message.includes('No rows found') || usersError.message.includes('multiple (or no) rows returned')) {
              console.log("🔐 RBACProvider: User not found in users table, attempting to create...")
              
              try {
                const { data: newUser, error: createError } = await supabase
                  .from("users")
                  .insert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || 'User',
                    role: user.user_metadata?.role || 'user',
                    status: 'active',
                    email_verified: user.email_confirmed_at ? true : false,
                    created_at: user.created_at
                  })
                  .select("role")
                  .single()

                if (!createError && newUser?.role) {
                  console.log("✅ RBACProvider: Created user and got role:", newUser.role)
                  setUserRoles([newUser.role as Role])
                  setIsLoading(false)
                  return
                } else if (createError) {
                  console.log("🔐 RBACProvider: Failed to create user:", createError.message)
                }
              } catch (createError) {
                console.log("🔐 RBACProvider: User creation failed:", createError)
              }
            }
          }
        } catch (error) {
          console.log("🔐 RBACProvider: Users table query failed:", error)
        }

        console.log("🔐 RBACProvider: Checking profiles table...")
        // Check profiles table (if it exists)
        try {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

          if (!profilesError && profilesData?.role) {
            console.log("✅ RBACProvider: Role from profiles table:", profilesData.role)
            setUserRoles([profilesData.role as Role])
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.log("🔐 RBACProvider: Profiles table not available or no role found")
        }

        console.log("🔐 RBACProvider: No role found in tables, setting default user role")
        setUserRoles(["user"])
        setIsLoading(false)
        return
      } catch (directError) {
        console.log("🔐 RBACProvider: Direct Supabase query failed, trying API route...")
        // Fallback to API route
      }

      // Method 2: Fallback to API route
      console.log("🔐 RBACProvider: Trying API route...")
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
          console.log("✅ RBACProvider: Role from API:", data.role.value)
          setUserRoles([data.role.value as Role])
        } else {
          console.log("🔐 RBACProvider: No role from API, setting default user role")
          setUserRoles(["user"])
        }
      } else {
        console.error("❌ RBACProvider: API request failed:", response.status)
        setUserRoles(["user"])
      }
    } catch (error) {
      console.error("🔐 RBACProvider: Error loading roles:", error)
      setUserRoles(["user"])
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  // Refresh roles from server
  const refreshRoles = useCallback(async () => {
    console.log("🔐 RBACProvider: Refreshing roles...")
    setIsLoading(true)
    await loadUserRoles()
  }, [loadUserRoles])

  // Load roles when user changes
  useEffect(() => {
    console.log("🔐 RBACProvider: User changed, loading roles...")
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
