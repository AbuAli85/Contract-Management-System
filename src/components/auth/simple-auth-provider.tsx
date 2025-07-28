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
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(true)
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
    // This avoids database dependency issues
    return null
  }

  const loadUserRoles = async (userId: string): Promise<string[]> => {
    // For now, just return default user role
    // This avoids database dependency issues
    return ['user']
  }

  const initializeAuth = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      // Get current session with error handling
      let currentSession = null
      let sessionError = null
      
      try {
        const result = await supabase.auth.getSession()
        currentSession = result.data.session
        sessionError = result.error
      } catch (error) {
        console.error('Error getting session:', error)
        sessionError = error as any
      }
      
      if (sessionError) {
        console.log('🔧 SimpleAuthProvider: Session error:', sessionError.message)
      }
      
      if (currentSession?.user) {
        setSession(currentSession)
        setUser(currentSession.user)
        
        // Create a basic profile from auth user data
        const basicProfile: UserProfile = {
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          role: 'user',
          full_name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || 'User',
          avatar_url: currentSession.user.user_metadata?.avatar_url,
          created_at: currentSession.user.created_at || new Date().toISOString()
        }
        setProfile(basicProfile)
        setRoles(['user'])
        
      } else {
        console.log('🔧 SimpleAuthProvider: No session found - attempting to refresh session')
        
        // Try to refresh the session
        try {
          let refreshedSession = null
          let refreshError = null
          
          console.log('🔧 SimpleAuthProvider: Attempting to refresh session...')
          try {
            const result = await supabase.auth.refreshSession()
            refreshedSession = result.data.session
            refreshError = result.error
            console.log('🔧 SimpleAuthProvider: Session refresh result:', {
              hasSession: !!refreshedSession,
              hasUser: !!refreshedSession?.user,
              userEmail: refreshedSession?.user?.email,
              error: refreshError?.message
            })
          } catch (error) {
            console.error('🔧 SimpleAuthProvider: Error refreshing session:', error)
            refreshError = error as any
          }
          
          if (refreshError) {
            console.log('🔧 SimpleAuthProvider: Session refresh failed:', refreshError.message)
          }
          
          if (refreshedSession?.user) {
            console.log('🔧 SimpleAuthProvider: Session refreshed successfully:', refreshedSession.user.email)
            setSession(refreshedSession)
            setUser(refreshedSession.user)
            
            // Create a basic profile from auth user data
            const basicProfile: UserProfile = {
              id: refreshedSession.user.id,
              email: refreshedSession.user.email || '',
              role: 'user',
              full_name: refreshedSession.user.user_metadata?.full_name || refreshedSession.user.email?.split('@')[0] || 'User',
              avatar_url: refreshedSession.user.user_metadata?.avatar_url,
              created_at: refreshedSession.user.created_at || new Date().toISOString()
            }
            setProfile(basicProfile)
            setRoles(['user'])
          } else {
            console.log('🔧 SimpleAuthProvider: Session refresh failed - user not authenticated')
            setSession(null)
            setUser(null)
            setProfile(null)
            setRoles([])
            setProfileNotFound(false)
          }
        } catch (error) {
          console.error('🔧 SimpleAuthProvider: Session refresh error:', error)
          setSession(null)
          setUser(null)
          setProfile(null)
          setRoles([])
          setProfileNotFound(false)
        }
      }
    } catch (error) {
      console.error('🔧 SimpleAuthProvider: Auth initialization error:', error)
      setSession(null)
      setUser(null)
      setProfile(null)
      setRoles([])
      setProfileNotFound(false)
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
        role: 'user',
        full_name: newSession.user.user_metadata?.full_name || newSession.user.email?.split('@')[0] || 'User',
        avatar_url: newSession.user.user_metadata?.avatar_url,
        created_at: newSession.user.created_at || new Date().toISOString()
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
    }
  }, [supabase])

  useEffect(() => {
  }, [supabase])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 10000)

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
        console.error('🔐 SignIn: Error during sign in:', error)
        return { success: false, error: error.message }
      }

      if (!data.user) {
        console.error('🔐 SignIn: No user returned from sign in')
        return { success: false, error: 'Authentication failed' }
      }

      // Wait for the auth state to be updated
      // The handleAuthStateChange will be called automatically
      // but we need to ensure the state is properly set
      setUser(data.user)
      setSession(data.session)
      
      // Create a basic profile from auth user data
      const basicProfile: UserProfile = {
        id: data.user.id,
        email: data.user.email || '',
        full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
        avatar_url: data.user.user_metadata?.avatar_url || null,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
        role: 'user'
      }
      
      setProfile(basicProfile)
      setRoles(['user'])
      setProfileNotFound(false)

      console.log('🔐 SignIn: Successfully signed in user:', data.user.id)
      return { success: true }
    } catch (error) {
      console.error('🔐 SignIn: Unexpected error during sign in:', error)
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