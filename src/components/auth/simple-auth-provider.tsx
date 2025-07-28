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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false) // Start with loading false
  const [mounted, setMounted] = useState(true) // Start with mounted true
  const [profileNotFound, setProfileNotFound] = useState(false)

  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    // Only create client on the client side
    if (typeof window === 'undefined') {
      console.log('🔧 SimpleAuthProvider: SSR detected, skipping client creation')
      return
    }

    try {
      console.log('🔧 SimpleAuthProvider: Creating Supabase client on client side')
      const client = createClient()
      console.log('🔧 SimpleAuthProvider: Client created:', !!client)
      setSupabase(client)
      console.log('🔧 SimpleAuthProvider: Supabase client created successfully')
    } catch (error) {
      console.error('🔧 SimpleAuthProvider: Error creating Supabase client:', error)
      setSupabase(null)
      setLoading(false) // Set loading to false if client creation fails
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
    console.log('🔧 SimpleAuthProvider: initializeAuth called')
    
    if (!supabase) {
      console.log('🔧 SimpleAuthProvider: No Supabase client available - setting loading to false')
      setLoading(false)
      return
    }

    try {
      console.log('🔧 SimpleAuthProvider: Initializing auth...')
      
      // Get current session with error handling
      let currentSession = null
      let sessionError = null
      
      try {
        console.log('🔧 SimpleAuthProvider: Attempting to get session from Supabase...')
        const result = await supabase.auth.getSession()
        currentSession = result.data.session
        sessionError = result.error
        console.log('🔧 SimpleAuthProvider: Session result:', {
          hasSession: !!currentSession,
          hasUser: !!currentSession?.user,
          userEmail: currentSession?.user?.email,
          error: sessionError?.message
        })
      } catch (error) {
        console.error('🔧 SimpleAuthProvider: Error getting session:', error)
        sessionError = error as any
      }
      
      if (sessionError) {
        console.log('🔧 SimpleAuthProvider: Session error:', sessionError.message)
      }
      
      if (currentSession?.user) {
        console.log('🔧 SimpleAuthProvider: Session found:', currentSession.user.email)
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
        
        console.log('🔧 SimpleAuthProvider: Session loaded successfully')
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
      console.log('🔧 SimpleAuthProvider: Setting loading to false')
      setLoading(false)
    }
  }

  const handleAuthStateChange = async (event: string, newSession: Session | null) => {
    console.log('🔄 SimpleAuthProvider: Auth state changed:', event, newSession?.user?.id)
    
    setSession(newSession)
    setUser(newSession?.user ?? null)
    setProfileNotFound(false)
    
    if (newSession?.user) {
      console.log('🔄 SimpleAuthProvider: User session established:', newSession.user.email)
      
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
      
      console.log('🔄 SimpleAuthProvider: Profile data updated')
    } else {
      console.log('🔄 SimpleAuthProvider: Session cleared')
      setProfile(null)
      setRoles([])
    }
    
    setLoading(false) // Always set loading to false
  }

  useEffect(() => {
    console.log('🔧 SimpleAuthProvider: useEffect triggered, supabase:', !!supabase, 'isClient:', typeof window !== 'undefined')
    setMounted(true)
    console.log('🔧 SimpleAuthProvider: Mounted set to true')
    
    // Only initialize auth on the client side
    if (typeof window === 'undefined') {
      console.log('🔧 SimpleAuthProvider: SSR detected, skipping auth initialization')
      return
    }
    
    if (supabase) {
      // Initialize auth when supabase client is available
      console.log('🔧 SimpleAuthProvider: Starting auth initialization')
      initializeAuth()

      console.log('🔧 SimpleAuthProvider: Setting up auth state change listener')
      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)
      return () => subscription.unsubscribe()
    } else {
      console.log('🔧 SimpleAuthProvider: No Supabase client yet, waiting...')
    }
  }, [supabase])

  // Add a separate effect to track when supabase becomes available
  useEffect(() => {
    console.log('🔧 SimpleAuthProvider: Supabase state changed:', !!supabase)
  }, [supabase])

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('🔧 SimpleAuthProvider: Loading timeout reached, setting loading to false')
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
      console.log('🔐 SignIn: Attempting to sign in with email:', email)
      
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
      console.log('🔐 SignUp: Attempting to sign up with email:', email)
      
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

      console.log('🔐 SignUp: Successfully signed up user:', data.user.id)
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
      console.log('🔐 SignOut: Attempting to sign out')
      
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
      console.log('🔐 SignInWithProvider: Attempting to sign in with provider:', provider)
      
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

      console.log('🔐 SignInWithProvider: OAuth sign in initiated successfully')
      return { success: true }
    } catch (error) {
      console.error('🔐 SignInWithProvider: Unexpected error during OAuth sign in:', error)
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
    signInWithProvider
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