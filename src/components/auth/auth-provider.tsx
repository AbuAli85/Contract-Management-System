'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
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
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signInWithProvider: (provider: 'github' | 'google' | 'twitter') => Promise<{ error?: string }>
  signUp: (email: string, password: string, profile?: any) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
  updatePassword: (password: string) => Promise<{ error?: string }>
  updateProfile: (updates: any) => Promise<{ error?: string }>
  refreshSession: () => Promise<void>
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
  forceRefreshRole: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  roles: [],
  loading: true,
  mounted: false,
  profileNotFound: false,
  signIn: async () => ({ error: 'Not implemented' }),
  signInWithProvider: async () => ({ error: 'Not implemented' }),
  signUp: async () => ({ error: 'Not implemented' }),
  signOut: async () => {},
  resetPassword: async () => ({ error: 'Not implemented' }),
  updatePassword: async () => ({ error: 'Not implemented' }),
  updateProfile: async () => ({ error: 'Not implemented' }),
  refreshSession: async () => {},
  hasRole: () => false,
  hasPermission: () => false,
  forceRefreshRole: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<Session['user'] | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [profileNotFound, setProfileNotFound] = useState(false)

  // Create Supabase client safely for SSR
  const getSupabase = () => {
    try {
      return createClient()
    } catch (error) {
      // Return null during SSR if environment variables are missing
      if (typeof window === 'undefined') {
        return null
      }
      throw error
    }
  }

  const supabase = getSupabase()

  // Load user profile from database
  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
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
  }

  // Load user roles and permissions
  const loadUserRoles = async (userId: string): Promise<string[]> => {
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
  }

  // Initialize authentication state - FIXED VERSION WITH SESSION REFRESH
  const initializeAuth = async () => {
    console.log('🔧 AuthProvider: Initializing auth...')
    
    if (!supabase) {
      console.log('❌ No supabase client, setting loading to false')
      setLoading(false)
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
      } else {
        console.log('🔧 AuthProvider: No session found, attempting server-side refresh...')
        
        // Try to refresh session from server
        try {
          const response = await fetch('/api/auth/refresh-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          const refreshData = await response.json()
          console.log('🔧 AuthProvider: Server refresh result:', refreshData)
          
          if (refreshData.success && refreshData.hasSession) {
            console.log('🔧 AuthProvider: Session refreshed from server')
            
            // Get the refreshed session from client
            const { data: { session: refreshedSession } } = await supabase.auth.getSession()
            
            if (refreshedSession?.user) {
              setSession(refreshedSession)
              setUser(refreshedSession.user)
              
              // Load profile data
              try {
                const userProfile = await loadUserProfile(refreshedSession.user.id)
                const userRoles = await loadUserRoles(refreshedSession.user.id)
                
                setProfile(userProfile)
                setRoles(userRoles)
                
                if (!userProfile) {
                  setProfileNotFound(true)
                }
                
                console.log('🔧 AuthProvider: Profile data loaded after refresh:', { profile: !!userProfile, roles: userRoles })
              } catch (error) {
                console.warn('🔧 AuthProvider: Profile loading failed after refresh:', error)
                setProfile(null)
                setRoles([])
              }
            }
          } else {
            console.log('🔧 AuthProvider: No session available after refresh attempt')
            setSession(null)
            setUser(null)
            setProfile(null)
            setRoles([])
          }
        } catch (refreshError) {
          console.warn('🔧 AuthProvider: Server refresh failed:', refreshError)
          setSession(null)
          setUser(null)
          setProfile(null)
          setRoles([])
        }
      }
      
      // CRITICAL: Set loading to false immediately
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
  }

  // Handle auth state changes - FIXED VERSION
  const handleAuthStateChange = async (event: string, newSession: Session | null) => {
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
    } else {
      console.log('🔄 AuthProvider: Session cleared')
      setProfile(null)
      setRoles([])
    }
    
    setLoading(false) // Always set loading to false
  }

  useEffect(() => {
    console.log('🔧 AuthProvider useEffect started')
    setMounted(true)
    
    if (!supabase) {
      console.log('❌ No supabase client in useEffect')
      setLoading(false)
      return
    }

    // Initialize auth state
    console.log('🔧 Calling initializeAuth...')
    initializeAuth()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    // CRITICAL: Force loading to false after 3 seconds maximum (increased to allow for redirects)
    const safetyTimeout = setTimeout(() => {
      console.log('⚠️ Safety timeout triggered - forcing loading to false')
      setLoading(false)
    }, 3000)

    // Cleanup function
    return () => {
      console.log('🔧 AuthProvider cleanup')
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
    }
  }, [])

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    console.log('🔐 SignIn called with email:', email)
    if (!supabase) {
      console.error('❌ No supabase client available')
      return { error: 'Authentication service not available' }
    }
    try {
      console.log('🔐 Attempting sign in with Supabase...')
      
      // Add timeout to prevent hanging
      const signInPromise = supabase.auth.signInWithPassword({ email, password })
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timeout')), 10000)
      )
      
      const { data, error } = await Promise.race([signInPromise, timeoutPromise])
      console.log('🔐 Sign in result:', { success: !error, user: data?.user?.id })
      
      if (error) {
        console.error('Sign in error:', error)
        return { error: error.message }
      }

      // Check if user is pending approval (with timeout protection)
      if (data.user) {
        try {
          const userProfile = await Promise.race([
            loadUserProfile(data.user.id),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Profile check timeout')), 3000)
            )
          ])
          
          if (userProfile?.status === 'pending') {
            await supabase.auth.signOut()
            return { error: 'Your account is pending approval. Please wait for an administrator to approve your account.' }
          }
          
          if (userProfile?.status === 'inactive') {
            await supabase.auth.signOut()
            return { error: 'Your account has been deactivated. Please contact an administrator.' }
          }
        } catch (profileError) {
          console.warn('Profile check failed during sign in, continuing:', profileError)
          // Continue with sign in even if profile check fails
        }
      }

      return {}
    } catch (error) {
      console.error('Sign in error:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const signInWithProvider = async (provider: 'github' | 'google' | 'twitter') => {
    if (!supabase) {
      return { error: 'Authentication service not available' }
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/en/auth/callback`
        }
      })
      
      if (error) {
        return { error: error.message }
      }
      
      return {}
    } catch (error) {
      console.error('OAuth sign in error:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const signUp = async (email: string, password: string, profile?: any) => {
    if (!supabase) {
      return { error: 'Authentication service not available' }
    }
    try {
      console.log('📝 SignUp called with email:', email, 'profile:', profile)
      
      // First, create the user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: profile
        }
      })
      
      if (error) {
        console.error('Sign up error:', error)
        return { error: error.message }
      }
      
      if (data.user) {
        console.log('✅ Auth user created:', data.user.id)
        
        // Create user profile in the users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email,
            full_name: profile?.full_name || '',
            role: profile?.role || 'user',
            status: profile?.status || 'pending',
            email_verified: false
          })
        
        if (profileError) {
          console.error('❌ Profile creation error:', profileError)
          // Don't fail the signup if profile creation fails, but log it
          // The user can still be created manually by admin
        } else {
          console.log('✅ User profile created in database')
        }
      }
      
      return {}
    } catch (error) {
      console.error('Sign up error:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const signOut = async () => {
    if (!supabase) {
      return
    }
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: 'Authentication service not available' }
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/en/auth/reset-password`
      })
      
      if (error) {
        return { error: error.message }
      }
      
      return {}
    } catch (error) {
      console.error('Reset password error:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const updatePassword = async (password: string) => {
    if (!supabase) {
      return { error: 'Authentication service not available' }
    }
    try {
      const { error } = await supabase.auth.updateUser({ password })
      
      if (error) {
        return { error: error.message }
      }
      
      return {}
    } catch (error) {
      console.error('Update password error:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const updateProfile = async (updates: any) => {
    if (!supabase) {
      return { error: 'Authentication service not available' }
    }
    try {
      const { error } = await supabase.auth.updateUser(updates)
      
      if (error) {
        return { error: error.message }
      }
      
      return {}
    } catch (error) {
      console.error('Update profile error:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const refreshSession = async () => {
    if (!supabase) {
      return
    }
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Refresh session error:', error)
        return
      }
      
      setSession(newSession)
      setUser(newSession?.user ?? null)
      
      if (newSession?.user) {
        const userProfile = await loadUserProfile(newSession.user.id)
        const userRoles = await loadUserRoles(newSession.user.id)
        
        setProfile(userProfile)
        setRoles(userRoles)
      }
    } catch (error) {
      console.error('Refresh session error:', error)
    }
  }

  const hasRole = (role: string): boolean => {
    return roles.includes(role)
  }

  const hasPermission = (permission: string): boolean => {
    if (!profile?.permissions) return false
    return profile.permissions.includes(permission)
  }

  const forceRefreshRole = async () => {
    if (!supabase || !user) {
      return
    }
    try {
      const userProfile = await loadUserProfile(user.id)
      const userRoles = await loadUserRoles(user.id)
      
      setProfile(userProfile)
      setRoles(userRoles)
    } catch (error) {
      console.error('Force refresh role error:', error)
    }
  }

  const value: AuthContextType = {
    session,
    user,
    profile,
    roles,
    loading,
    mounted,
    profileNotFound,
    signIn,
    signInWithProvider,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshSession,
    hasRole,
    hasPermission,
    forceRefreshRole
  }

  if (profileNotFound && !loading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded shadow">
          <h2 className="text-2xl font-bold text-center text-red-600 mb-4">Account Not Provisioned</h2>
          <p className="text-gray-700 text-center mb-4">
            Your account exists in authentication but is missing in the user database.<br />
            Please contact support or an administrator to resolve this issue.
          </p>
          <pre className="bg-gray-100 p-2 rounded text-xs text-gray-500 overflow-x-auto">
            User ID: {user.id}
          </pre>
        </div>
      </div>
    )
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
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
