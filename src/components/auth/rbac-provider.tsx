"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useAuth } from "@/lib/auth-service"
import { useSupabase } from "@/app/providers"

type Role = "admin" | "user" | "manager" | "reviewer" | "promoter"

interface RBACContextType {
  userRoles: Role[]
  isLoading: boolean
  hasRole: (role: Role) => boolean
  hasAnyRole: (roles: Role[]) => boolean
  hasAllRoles: (roles: Role[]) => boolean
  refreshRoles: () => Promise<void>
}

const RBACContext = createContext<RBACContextType | undefined>(undefined)

export const useRBAC = () => {
  const context = useContext(RBACContext)
  if (!context) {
    throw new Error("useRBAC must be used within an RBACProvider")
  }
  return context
}

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { supabase } = useSupabase()
  const [userRoles, setUserRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      // Method 1: Try direct Supabase client first
      if (!supabase) {
        console.log("🔐 RBACProvider: No Supabase client available")
        throw new Error("Failed to get Supabase client from context")
      }

      console.log("🔐 RBACProvider: Checking users table...")
      
      // First try to find user by email (this handles admin user with fixed UUID)
      let { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("role")
        .eq("email", user.email || '')
        .single()

      if (!usersError && usersData?.role) {
        console.log("✅ RBACProvider: Found user by email, role:", usersData.role)
        setUserRoles([usersData.role as Role])
        setIsLoading(false)
        return
      }

      // If not found by email, try by auth ID (for regular users)
      if (usersError) {
        console.log("🔐 RBACProvider: User not found by email, trying auth ID...")
        const { data: authIdUser, error: authIdError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()
        
        if (!authIdError && authIdUser?.role) {
          console.log("✅ RBACProvider: Found user by auth ID, role:", authIdUser.role)
          setUserRoles([authIdUser.role as Role])
          setIsLoading(false)
          return
        }
      }

      // If user not found, try to create them (but only if they don't already exist)
      if (usersError && (usersError.message.includes('No rows found') || usersError.message.includes('multiple (or no) rows returned'))) {
        console.log("🔐 RBACProvider: User not found in users table, attempting to create...")
        
        // Special handling for admin user with fixed UUID
        if (user.email === 'luxsess2001@gmail.com') {
          console.log("🔐 RBACProvider: Admin user detected, using fixed UUID...")
          try {
            const { data: newUser, error: createError } = await supabase
              .from("users")
              .upsert({
                id: '550e8400-e29b-41d4-a716-446655440000', // Fixed UUID for admin
                email: user.email,
                full_name: 'Admin User',
                role: 'admin',
                status: 'active',
                created_at: user.created_at
              }, {
                onConflict: 'email', // Use email as conflict key to avoid 409 errors
                ignoreDuplicates: false
              })
              .select("role")
              .single()

            if (!createError && newUser?.role) {
              console.log("✅ RBACProvider: Created/updated admin user and got role:", newUser.role)
              setUserRoles([newUser.role as Role])
              setIsLoading(false)
              return
            }
          } catch (createError) {
            console.log("🔐 RBACProvider: Admin user creation failed:", createError)
          }
        } else {
          // Regular user creation
          try {
            const { data: newUser, error: createError } = await supabase
              .from("users")
              .upsert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || 'User',
                role: user.user_metadata?.role || 'user',
                status: 'active',
                created_at: user.created_at
              }, {
                onConflict: 'email', // Use email as conflict key to avoid 409 errors
                ignoreDuplicates: false
              })
              .select("role")
              .single()

            if (!createError && newUser?.role) {
              console.log("✅ RBACProvider: Created/updated user and got role:", newUser.role)
              setUserRoles([newUser.role as Role])
              setIsLoading(false)
              return
            }
          } catch (createError) {
            console.log("🔐 RBACProvider: User creation failed:", createError)
          }
        }
      }

      // Check profiles table as fallback
      console.log("🔐 RBACProvider: Checking profiles table...")
      try {
        // First, try to ensure the user profile exists
        try {
          await supabase.rpc('ensure_user_profile', { user_id: user.id })
          console.log("✅ RBACProvider: Ensured user profile exists")
        } catch (error) {
          console.log("⚠️ RBACProvider: Could not ensure user profile:", error)
        }
        
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)

        if (!profilesError && profilesData && profilesData.length > 0 && profilesData[0]?.role) {
          console.log("✅ RBACProvider: Role from profiles table:", profilesData[0].role)
          setUserRoles([profilesData[0].role as Role])
          setIsLoading(false)
          return
        } else {
          console.log("🔐 RBACProvider: No role found in profiles table or table empty")
        }
      } catch (error) {
        console.log("🔐 RBACProvider: Profiles table error:", error)
        // Try alternative approach - use the API route
        try {
          const response = await fetch('/api/get-user-role', {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          })
          if (response.ok) {
            const roleData = await response.json()
            const role = roleData.role?.value ?? roleData.role
            if (role) {
              console.log("✅ RBACProvider: Role from API route:", role)
              setUserRoles([role as Role])
              setIsLoading(false)
              return
            }
          }
        } catch (apiError) {
          console.log("🔐 RBACProvider: API route also failed:", apiError)
        }
      }

      // Fallback for admin user
      if (user.email === 'luxsess2001@gmail.com') {
        console.log("🔐 RBACProvider: Using default admin role for luxsess2001@gmail.com")
        setUserRoles(['admin' as Role])
        setIsLoading(false)
        return
      }

      console.log("🔐 RBACProvider: No role found in tables, setting default user role")
      setUserRoles(["user"])
      setIsLoading(false)
      
    } catch (error) {
      console.error("🔐 RBACProvider: Error loading roles:", error)
      
      // Final fallback for admin user
      if (user.email === 'luxsess2001@gmail.com') {
        console.log("🔐 RBACProvider: Final fallback to admin role for luxsess2001@gmail.com")
        setUserRoles(['admin' as Role])
      } else {
        setUserRoles(["user"])
      }
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
