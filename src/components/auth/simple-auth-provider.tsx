'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/custom'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  roles: string[]
  session: Session | null
  loading: boolean
  mounted: boolean
  profileNotFound: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  forceRefreshRole: () => Promise<void>
  signInWithProvider: (provider: 'github' | 'google') => Promise<{ success: boolean; error?: string }>
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
    if (typeof window === 'undefined') {
      return
    }

    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error('Error creating Supabase client:', error)
      setSupabase(null)
      setLoading(false)
    }
  }, [])

  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    // For now, return null to trigger fallback profile creation
    return null
  }

  const loadUserRoles = async (userId: string): Promise<string[]> => {
    // For now, just return default user role
    return ['user']
  }

  const initializeAuth = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        setLoading(false)
        return
      }

      if (session?.user) {
        setSession(session)
        setUser(session.user)
        
        // Create a basic profile from auth user data
        const basicProfile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          avatar_url: session.user.user_metadata?.avatar_url || null,
          created_at: session.user.created_at,
          role: 'user'
        }
        
        setProfile(basicProfile)
        setRoles(['user'])
        setProfileNotFound(false)
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthStateChange = async (event: string, newSession: Session | null) => {
    setSession(newSession)
    setUser(newSession?.user ?? null)
    setProfileNotFound(false)
    
    if (newSession?.user) {
      // Create a basic profile from auth user data
      const basicProfile: UserProfile = {
        id: newSession.user.id,
        email: newSession.user.email || '',
        full_name: newSession.user.user_metadata?.full_name || newSession.user.email?.split('@')[0] || 'User',
        avatar_url: newSession.user.user_metadata?.avatar_url || null,
        created_at: newSession.user.created_at,
        role: 'user'
      }
      
      setProfile(basicProfile)
      setRoles(['user'])
    } else {
      setProfile(null)
      setRoles([])
    }
    
    setLoading(false)
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    
    if (supabase) {
      initializeAuth()

      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)
      return () => subscription.unsubscribe()
    } else {
      // If no Supabase client, just set loading to false
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Auth timeout reached, setting loading to false')
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(timeout)
  }, [loading])

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client not available' }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data.user) {
        return { success: false, error: 'Authentication failed' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const signUp = async (email: string, password: string, fullName?: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client not available' }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) {
        console.error('🔐 SignUp: Error during sign up:', error)
        return { success: false, error: error.message }
      }

      if (!data.user) {
        console.error('🔐 SignUp: No user returned from sign up')
        return { success: false, error: 'Registration failed' }
      }

      return { success: true }
    } catch (error) {
      console.error('🔐 SignUp: Unexpected error during sign up:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const signOut = async () => {
    if (!supabase) {
      console.error('🔐 SignOut: Supabase client not available')
      return
    }

    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('🔐 SignOut: Error during sign out:', error)
      } else {
        console.log('🔐 SignOut: Successfully signed out')
      }
    } catch (error) {
      console.error('🔐 SignOut: Unexpected error during sign out:', error)
    }
  }

  const refreshProfile = async () => {
    if (!user) return

    try {
      const userProfile = await loadUserProfile(user.id)
      const userRoles = await loadUserRoles(user.id)
      
      setProfile(userProfile)
      setRoles(userRoles)
      
      if (!userProfile) {
        setProfileNotFound(true)
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  const forceRefreshRole = async () => {
    if (!user) return
    
    try {
      console.log('🔧 SimpleAuthProvider: Force refreshing roles for user:', user.id)
      const userRoles = await loadUserRoles(user.id)
      setRoles(userRoles)
      console.log('🔧 SimpleAuthProvider: Roles refreshed successfully:', userRoles)
    } catch (error) {
      console.error('🔧 SimpleAuthProvider: Error refreshing roles:', error)
    }
  }

  const signInWithProvider = async (provider: 'github' | 'google'): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      console.error('🔐 SignInWithProvider: Supabase client not available')
      return { success: false, error: 'Supabase client not available' }
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('🔐 SignInWithProvider: Error during OAuth sign in:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('🔐 SignInWithProvider: Unexpected error during OAuth sign in:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No user logged in' }
    }

    try {
      // For now, just update the local state
      // In a real implementation, you would update the database
      if (profile) {
        const updatedProfile = { ...profile, ...updates } as UserProfile
        setProfile(updatedProfile)
      }
      
      return { success: true }
    } catch (error) {
      console.error('🔐 UpdateProfile: Error updating profile:', error)
      return { success: false, error: 'Failed to update profile' }
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
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SimpleAuthProvider')
  }
  return context
} 