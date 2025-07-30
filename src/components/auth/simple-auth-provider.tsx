"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"
import type { UserProfile } from "@/types/custom"

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  roles: string[]
  session: Session | null
  loading: boolean
  mounted: boolean
  profileNotFound: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  forceRefreshRole: () => Promise<void>
  signInWithProvider: (
    provider: "github" | "google",
  ) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [profileNotFound, setProfileNotFound] = useState(false)

  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    // Only create client on the client side
    if (typeof window === "undefined") {
      setLoading(false)
      setMounted(true)
      return
    }

    try {
      const client = createClient()
      setSupabase(client)
      console.log("🔐 Auth: Supabase client initialized successfully")
    } catch (error) {
      console.error("🔐 Auth: Error creating Supabase client:", error)
      // Even if createClient fails, we should still set mounted to true
      setSupabase(null)
      setLoading(false)
      setMounted(true)
    }
  }, [])

  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      // For now, return a basic profile
      return {
        id: userId,
        email: user?.email || "",
        full_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
        avatar_url: user?.user_metadata?.avatar_url || null,
        created_at: user?.created_at || new Date().toISOString(),
        role: "user",
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
      return null
    }
  }

  const loadUserRoles = async (userId: string): Promise<string[]> => {
    try {
      // Try to fetch roles from API
      const response = await fetch("/api/get-user-role", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.role?.value) {
          return [data.role.value]
        }
      }
      
      // Default to user role
      return ["user"]
    } catch (error) {
      console.error("Error loading user roles:", error)
      return ["user"]
    }
  }

  const initializeAuth = async () => {
    if (!supabase) {
      console.log("🔐 Auth: No Supabase client, skipping initialization")
      setLoading(false)
      setMounted(true)
      return
    }

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log("🔐 Auth: Initialization timeout reached")
      setLoading(false)
      setMounted(true)
    }, 3000) // Increased timeout to 3 seconds

    try {
      console.log("🔐 Auth: Starting initialization...")
      
      // Get current session with error handling
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("🔐 Auth: Error getting session:", error)
        setLoading(false)
        setMounted(true)
        return
      }

      if (session?.user) {
        console.log("🔐 Auth: Session found, user:", session.user.email)
        setSession(session)
        setUser(session.user)

        // Create a basic profile from auth user data
        const basicProfile: UserProfile = {
          id: session.user.id,
          email: session.user.email || "",
          full_name:
            session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          avatar_url: session.user.user_metadata?.avatar_url || null,
          created_at: session.user.created_at,
          role: "user",
        }

        setProfile(basicProfile)
        
        // Load roles
        const userRoles = await loadUserRoles(session.user.id)
        setRoles(userRoles)
        
        setProfileNotFound(false)
      } else {
        console.log("🔐 Auth: No session found")
        // No session found, ensure we're in a clean state
        setSession(null)
        setUser(null)
        setProfile(null)
        setRoles([])
        setProfileNotFound(false)
      }
    } catch (error) {
      console.error("🔐 Auth: Error initializing auth:", error)
      // Ensure we're in a clean state even on error
      setSession(null)
      setUser(null)
      setProfile(null)
      setRoles([])
      setProfileNotFound(false)
    } finally {
      clearTimeout(timeout)
      setLoading(false)
      setMounted(true)
      console.log("🔐 Auth: Initialization complete")
    }
  }

  // Initialize auth when supabase client is ready
  useEffect(() => {
    if (supabase && !mounted) {
      initializeAuth()
    }
  }, [supabase])

  // Log final state after auth initialization (only once)
  useEffect(() => {
    if (mounted && !loading) {
      console.log("🔐 Auth: Final state after initialization", {
        user: !!user,
        loading,
        mounted,
        userEmail: user?.email,
        roles,
      })
    }
  }, [mounted, loading, user, roles])

  const handleAuthStateChange = async (event: string, newSession: Session | null) => {
    try {
      console.log("🔐 Auth: State change event:", event)
      
      if (event === "SIGNED_IN" && newSession?.user) {
        setSession(newSession)
        setUser(newSession.user)

        // Create basic profile
        const basicProfile: UserProfile = {
          id: newSession.user.id,
          email: newSession.user.email || "",
          full_name:
            newSession.user.user_metadata?.full_name ||
            newSession.user.email?.split("@")[0] ||
            "User",
          avatar_url: newSession.user.user_metadata?.avatar_url || null,
          created_at: newSession.user.created_at,
          role: "user",
        }

        setProfile(basicProfile)
        
        // Load roles
        const userRoles = await loadUserRoles(newSession.user.id)
        setRoles(userRoles)
        
        setProfileNotFound(false)
      } else if (event === "SIGNED_OUT") {
        console.log("🔐 Auth: User signed out")
        setSession(null)
        setUser(null)
        setProfile(null)
        setRoles([])
        setProfileNotFound(false)
      }
    } catch (error) {
      console.error("🔐 Auth: Error handling auth state change:", error)
      // Ensure we're in a clean state on error
      setSession(null)
      setUser(null)
      setProfile(null)
      setRoles([])
      setProfileNotFound(false)
    }
  }

  // Set up auth state change listener
  useEffect(() => {
    if (!supabase) return

    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(handleAuthStateChange)

      return () => {
        if (subscription) {
          subscription.unsubscribe()
        }
      }
    } catch (error) {
      console.error("🔐 Auth: Error setting up auth state change listener:", error)
    }
  }, [supabase])

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: "Supabase client not initialized" }
    }

    try {
      console.log("🔐 Auth: Attempting sign in for:", email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("🔐 Auth: Sign in error:", error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        console.log("🔐 Auth: Sign in successful for:", data.user.email)
        return { success: true }
      }

      return { success: false, error: "Sign in failed" }
    } catch (error) {
      console.error("🔐 Auth: Sign in error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: "Supabase client not initialized" }
    }

    try {
      console.log("🔐 Auth: Attempting sign up for:", email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        console.error("🔐 Auth: Sign up error:", error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        console.log("🔐 Auth: Sign up successful for:", data.user.email)
        return { success: true }
      }

      return { success: false, error: "Sign up failed" }
    } catch (error) {
      console.error("🔐 Auth: Sign up error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const signOut = async () => {
    if (!supabase) return

    try {
      console.log("🔐 Auth: Attempting sign out")
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("🔐 Auth: Sign out error:", error)
      } else {
        console.log("🔐 Auth: Sign out successful")
      }
    } catch (error) {
      console.error("🔐 Auth: Sign out error:", error)
    }
  }

  const refreshProfile = async () => {
    if (!user) return

    try {
      console.log("🔐 Auth: Refreshing profile for:", user.email)
      
      const profile = await loadUserProfile(user.id)
      if (profile) {
        setProfile(profile)
      }
    } catch (error) {
      console.error("🔐 Auth: Error refreshing profile:", error)
    }
  }

  const forceRefreshRole = async () => {
    if (!user) return

    try {
      console.log("🔐 Auth: Force refreshing roles for:", user.email)
      
      const roles = await loadUserRoles(user.id)
      setRoles(roles)
    } catch (error) {
      console.error("🔐 Auth: Error refreshing roles:", error)
    }
  }

  const signInWithProvider = async (
    provider: "github" | "google",
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: "Supabase client not initialized" }
    }

    try {
      console.log("🔐 Auth: Attempting OAuth sign in with:", provider)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("🔐 Auth: OAuth sign in error:", error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("🔐 Auth: OAuth sign in error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const updateProfile = async (
    updates: Partial<UserProfile>,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase || !user) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      console.log("🔐 Auth: Updating profile for:", user.email)
      
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      })

      if (error) {
        console.error("🔐 Auth: Update profile error:", error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        // Update local profile state
        setProfile(prev => prev ? { ...prev, ...updates } : null)
        return { success: true }
      }

      return { success: false, error: "Update profile failed" }
    } catch (error) {
      console.error("🔐 Auth: Update profile error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    roles,
    session,
    loading,
    mounted,
    profileNotFound,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    forceRefreshRole,
    signInWithProvider,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within a SimpleAuthProvider")
  }
  return context
}

// Export for backward compatibility
export { SimpleAuthProvider as AuthProvider }
