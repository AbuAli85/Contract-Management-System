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
      setLoading(false)
      setMounted(true)
      return
    }

    try {
      const client = createClient()
      if (client) {
        setSupabase(client)
      } else {
        console.warn('Failed to create Supabase client')
        setLoading(false)
        setMounted(true)
      }
    } catch (error) {
      console.error('Error creating Supabase client:', error)
      setSupabase(null)
      setLoading(false)
      setMounted(true)
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
      setMounted(true)
      return
    }

    try {
      // Get current session with error handling
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        setLoading(false)
        setMounted(true)
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
      setMounted(true)
    }
  }

  // Initialize auth when supabase client is ready
  useEffect(() => {
    if (supabase && !mounted) {
      initializeAuth()
    }
  }, [supabase, mounted])

  const handleAuthStateChange = async (event: string, newSession: Session | null) => {
    console.log('🔐 Auth state change:', event, newSession?.user?.email)
    
    if (event === 'SIGNED_IN' && newSession?.user) {
      setSession(newSession)
      setUser(newSession.user)
      
      // Create basic profile
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
      setProfileNotFound(false)
    } else if (event === 'SIGNED_OUT') {
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
      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)
      
      return () => {
        if (subscription) {
          subscription.unsubscribe()
        }
      }
    } catch (error) {
      console.error('Error setting up auth state change listener:', error)
    }
  }, [supabase])

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Sign in error:', error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        console.log('🔐 Sign in successful:', data.user.email)
        return { success: true }
      }

      return { success: false, error: 'Sign in failed' }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const signUp = async (email: string, password: string, fullName?: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' }
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
        console.error('Sign up error:', error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        console.log('🔐 Sign up successful:', data.user.email)
        return { success: true }
      }

      return { success: false, error: 'Sign up failed' }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const signOut = async () => {
    if (!supabase) return

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      } else {
        console.log('🔐 Sign out successful')
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const refreshProfile = async () => {
    if (!user) return

    try {
      const profile = await loadUserProfile(user.id)
      if (profile) {
        setProfile(profile)
        setProfileNotFound(false)
      } else {
        setProfileNotFound(true)
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  const forceRefreshRole = async () => {
    if (!user) return

    try {
      const roles = await loadUserRoles(user.id)
      setRoles(roles)
    } catch (error) {
      console.error('Error refreshing roles:', error)
    }
  }

  const signInWithProvider = async (provider: 'github' | 'google'): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' }
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('OAuth sign in error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('OAuth sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!supabase || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: updates
      })

      if (error) {
        console.error('Profile update error:', error)
        return { success: false, error: error.message }
      }

      // Update local profile state
      if (profile) {
        setProfile({ ...profile, ...updates })
      }

      return { success: true }
    } catch (error) {
      console.error('Profile update error:', error)
      return { success: false, error: 'An unexpected error occurred' }
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