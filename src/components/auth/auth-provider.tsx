'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/custom'

interface AuthContextType {
  session: Session | null
  user: Session['user'] | null
  profile: UserProfile | null
  roles: string[]
  loading: boolean
  mounted: boolean
  profileNotFound: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, profile?: any) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<{ success: boolean; error?: string }>
  signInWithProvider: (provider: 'github' | 'google' | 'twitter') => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: any) => Promise<{ success: boolean; error?: string }>
  refreshSession: () => Promise<void>
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  hasPermission: (permission: string) => boolean
  forceRefreshRole: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<Session['user'] | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [profileNotFound, setProfileNotFound] = useState(false)

  // Use refs to track subscriptions for cleanup
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const profileSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  // Create Supabase client safely for SSR
  const getSupabase = useCallback(() => {
    try {
      return createClient()
    } catch (error) {
      // Return null during SSR if environment variables are missing
      if (typeof window === 'undefined') {
        return null
      }
      throw error
    }
  }, [])

  const supabase = getSupabase()

  // Load user profile from database
  const loadUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    console.log('👤 Loading user profile for:', userId)
    if (!supabase) {
      console.error('❌ No supabase client for profile loading')
      return null
    }
    
    try {
      console.log('👤 Querying users table...')
      // Try to load from users table first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role, status, created_at')
        .eq('id', userId)
        .single()

      if (userData && !userError) {
        console.log('Profile loaded from users table:', userData)
        return userData as UserProfile
      }

      // Fallback to profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .eq('id', userId)
        .single()

      if (profileData && !profileError) {
        console.log('Profile loaded from profiles table:', profileData)
        return profileData as UserProfile
      }

      console.warn('No profile found for user:', userId)
      return null
    } catch (error) {
      console.error('Error loading user profile:', error)
      return null
    }
  }, [supabase])

  // Load user roles and permissions
  const loadUserRoles = useCallback(async (userId: string): Promise<string[]> => {
    if (!supabase) return []
    
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (userData?.role) {
        return [userData.role]
      }

      return []
    } catch (error) {
      console.error('Error loading user roles:', error)
      return []
    }
  }, [supabase])

  // Refresh session with retry logic
  const refreshSessionWithRetry = useCallback(async (maxRetries = 3): Promise<boolean> => {
    if (!supabase || !session?.refresh_token) {
      return false
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempting session refresh (attempt ${attempt}/${maxRetries})`)
        
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: session.refresh_token
        })

        if (error) {
          console.error(`🔄 Session refresh attempt ${attempt} failed:`, error)
          if (attempt === maxRetries) {
            // Final attempt failed, clear session
            setSession(null)
            setUser(null)
            setProfile(null)
            setRoles([])
            return false
          }
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
          continue
        }

        if (data.session) {
          console.log('🔄 Session refreshed successfully')
          setSession(data.session)
          setUser(data.session.user)
          return true
        }

        return false
      } catch (error) {
        console.error(`🔄 Session refresh attempt ${attempt} threw error:`, error)
        if (attempt === maxRetries) {
          return false
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }

    return false
  }, [supabase, session?.refresh_token])

  // Setup automatic session refresh
  const setupSessionRefresh = useCallback(() => {
    if (!session?.expires_at) return

    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }

    const expiresAt = new Date(session.expires_at).getTime()
    const now = Date.now()
    const timeUntilExpiry = expiresAt - now

    // Refresh 5 minutes before expiry
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60000) // At least 1 minute

    console.log(`🔄 Setting up session refresh in ${Math.round(refreshTime / 1000)} seconds`)

    refreshTimerRef.current = setTimeout(async () => {
      console.log('🔄 Auto-refreshing session...')
      const success = await refreshSessionWithRetry()
      if (success) {
        setupSessionRefresh() // Setup next refresh
      }
    }, refreshTime)
  }, [session?.expires_at, refreshSessionWithRetry])

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    console.log('🔧 AuthProvider: Initializing auth...')
    
    if (!supabase) {
      console.log('❌ No supabase client, setting loading to false')
      setLoading(false)
      return
    }

    if (isInitializedRef.current) {
      console.log('🔧 AuthProvider: Already initialized, skipping')
      return
    }

    try {
      console.log('🔧 AuthProvider: Getting session...')
      
      // First, try to get the current session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('🔧 AuthProvider: Session error:', sessionError)
        setSession(null)
        setUser(null)
        setProfile(null)
        setRoles([])
        setLoading(false)
        return
      }
      
      console.log('🔧 AuthProvider: Session result:', currentSession ? 'found' : 'not found')
      
      if (currentSession?.user) {
        console.log('🔧 AuthProvider: User found:', currentSession.user.email)
        setSession(currentSession)
        setUser(currentSession.user)
        
        // Load profile data immediately for better UX
        try {
          const userProfile = await loadUserProfile(currentSession.user.id)
          const userRoles = await loadUserRoles(currentSession.user.id)
          
          setProfile(userProfile)
          setRoles(userRoles)
          
          if (!userProfile) {
            setProfileNotFound(true)
          }
          
          console.log('🔧 AuthProvider: Profile data loaded:', { profile: !!userProfile, roles: userRoles })
        } catch (error) {
          console.warn('🔧 AuthProvider: Profile loading failed, continuing with basic auth:', error)
          setProfile(null)
          setRoles([])
        }

        // Setup automatic session refresh
        setupSessionRefresh()
      } else {
        console.log('🔧 AuthProvider: No session found, clearing state')
        setSession(null)
        setUser(null)
        setProfile(null)
        setRoles([])
      }
      
      isInitializedRef.current = true
      console.log('🔧 AuthProvider: Setting loading to false')
      setLoading(false)
      
    } catch (error) {
      console.error('🔧 AuthProvider: Auth initialization error:', error)
      setSession(null)
      setUser(null)
      setProfile(null)
      setRoles([])
      setLoading(false)
    }
  }, [supabase, loadUserProfile, loadUserRoles, setupSessionRefresh])

  // Handle auth state changes
  const handleAuthStateChange = useCallback(async (event: string, newSession: Session | null) => {
    console.log('🔄 AuthProvider: Auth state changed:', event, newSession?.user?.id)
    
    setSession(newSession)
    setUser(newSession?.user ?? null)
    setProfileNotFound(false)
    
    if (newSession?.user) {
      console.log('🔄 AuthProvider: User session established:', newSession.user.email)
      
      // Load profile and roles immediately
      try {
        const userProfile = await loadUserProfile(newSession.user.id)
        const userRoles = await loadUserRoles(newSession.user.id)
        
        setProfile(userProfile)
        setRoles(userRoles)
        
        if (!userProfile) {
          setProfileNotFound(true)
        }
        
        console.log('🔄 AuthProvider: Profile data updated:', { profile: !!userProfile, roles: userRoles })
      } catch (error) {
        console.warn('🔄 AuthProvider: Profile loading failed in auth state change:', error)
        setProfile(null)
        setRoles([])
      }

      // Setup automatic session refresh for new session
      setupSessionRefresh()
    } else {
      console.log('🔄 AuthProvider: Session cleared')
      setProfile(null)
      setRoles([])
      
      // Clear refresh timer when session is cleared
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }
    
    setLoading(false) // Always set loading to false
  }, [loadUserProfile, loadUserRoles, setupSessionRefresh])

  useEffect(() => {
    console.log('🔧 AuthProvider useEffect started')
    
    if (!supabase) {
      console.log('❌ No supabase client available')
      setLoading(false)
      setMounted(true)
      return
    }

    // Set mounted to true immediately
    setMounted(true)

    // Initialize auth
    initializeAuth()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)
    
    // Store subscription reference for cleanup
    authSubscriptionRef.current = subscription

    // Cleanup function - properly unsubscribe from all subscriptions
    return () => {
      console.log('🔧 AuthProvider: Cleaning up subscriptions...')
      
      // Clear refresh timer
      if (refreshTimerRef.current) {
        console.log('🔧 AuthProvider: Clearing refresh timer')
        clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      
      // Unsubscribe from auth state changes
      if (authSubscriptionRef.current) {
        console.log('🔧 AuthProvider: Unsubscribing from auth state changes')
        authSubscriptionRef.current.unsubscribe()
        authSubscriptionRef.current = null
      }
      
      // Unsubscribe from profile changes if exists
      if (profileSubscriptionRef.current) {
        console.log('🔧 AuthProvider: Unsubscribing from profile changes')
        profileSubscriptionRef.current.unsubscribe()
        profileSubscriptionRef.current = null
      }
      
      // Reset initialization flag
      isInitializedRef.current = false
      
      console.log('🔧 AuthProvider: Cleanup completed')
    }
  }, [supabase, initializeAuth, handleAuthStateChange])

  // Expose auth state for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__AUTH_STATE__ = {
        user,
        session,
        profile,
        roles,
        loading,
        mounted,
        profileNotFound
      }
    }
  }, [user, session, profile, roles, loading, mounted, profileNotFound])

  // Auth methods
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase?.auth.signInWithPassword({ email, password }) || {}
      return { success: !error, error: error?.message }
    } catch (error) {
      return { success: false, error: 'Sign in failed' }
    }
  }

  const signUp = async (email: string, password: string, profile?: any) => {
    try {
      const { error } = await supabase?.auth.signUp({ email, password }) || {}
      return { success: !error, error: error?.message }
    } catch (error) {
      return { success: false, error: 'Sign up failed' }
    }
  }

  const signOut = async () => {
    try {
      // Clear refresh timer before signing out
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      
      const { error } = await supabase?.auth.signOut() || {}
      return { success: !error, error: error?.message }
    } catch (error) {
      return { success: false, error: 'Sign out failed' }
    }
  }

  const signInWithProvider = async (provider: 'github' | 'google' | 'twitter') => {
    try {
      const { error } = await supabase?.auth.signInWithOAuth({ provider }) || {}
      return { success: !error, error: error?.message }
    } catch (error) {
      return { success: false, error: 'Provider sign in failed' }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase?.auth.resetPasswordForEmail(email) || {}
      return { success: !error, error: error?.message }
    } catch (error) {
      return { success: false, error: 'Password reset failed' }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase?.auth.updateUser({ password }) || {}
      return { success: !error, error: error?.message }
    } catch (error) {
      return { success: false, error: 'Password update failed' }
    }
  }

  const updateProfile = async (updates: any) => {
    try {
      const { error } = await supabase?.auth.updateUser(updates) || {}
      return { success: !error, error: error?.message }
    } catch (error) {
      return { success: false, error: 'Profile update failed' }
    }
  }

  const refreshSession = async () => {
    try {
      const success = await refreshSessionWithRetry()
      if (success) {
        setupSessionRefresh() // Setup next refresh
      }
    } catch (error) {
      console.error('Session refresh failed:', error)
    }
  }

  const forceRefreshRole = async () => {
    if (user) {
      const userRoles = await loadUserRoles(user.id)
      setRoles(userRoles)
    }
  }

  const hasRole = (role: string) => roles.includes(role)
  const hasAnyRole = (rolesToCheck: string[]) => rolesToCheck.some(role => roles.includes(role))
  const hasPermission = (permission: string) => {
    // Implement permission checking logic here
    return roles.some(role => role === 'admin' || role === 'super_admin')
  }

  const contextValue: AuthContextType = {
    user,
    session,
    profile,
    roles,
    loading,
    mounted,
    profileNotFound,
    signIn,
    signUp,
    signOut,
    signInWithProvider,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshSession,
    forceRefreshRole,
    hasRole,
    hasAnyRole,
    hasPermission
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
