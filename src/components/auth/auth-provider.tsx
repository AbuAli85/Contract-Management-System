'use client'

import { createContext, useEffect, useState, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: string
  status: string
  avatar_url?: string
  phone?: string
  department?: string
  position?: string
  permissions?: string[]
  email_verified?: boolean
  last_login?: string
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  session: Session | null
  user: Session['user'] | null
  profile: UserProfile | null
  roles: string[]
  loading: boolean
  mounted: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signInWithProvider: (provider: 'github' | 'google' | 'twitter') => Promise<{ error?: string }>
  signUp: (email: string, password: string, profile?: Partial<UserProfile>) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
  updatePassword: (password: string) => Promise<{ error?: string }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>
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
    if (!userId || !supabase) return null

    try {
      console.log(`🔄 Loading user profile for: ${userId}`)
      
      // Try to load from users table first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (!userError && userData) {
        console.log('✅ Profile loaded from users table:', userData)
        return userData as UserProfile
      }

      // Try profiles table as fallback
      console.log('🔄 Users table failed, trying profiles table...')
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!profileError && profileData) {
        console.log('✅ Profile loaded from profiles table:', profileData)
        return profileData as UserProfile
      }

      console.log('❌ No profile found for user:', userId)
      return null
    } catch (error) {
      console.error('❌ Error loading user profile:', error)
      return null
    }
  }

  // Load user roles and permissions
  const loadUserRoles = async (userId: string): Promise<string[]> => {
    if (!userId) return []

    try {
      const profile = await loadUserProfile(userId)
      if (profile?.role) {
        return [profile.role]
      }
      return []
    } catch (error) {
      console.error('❌ Error loading user roles:', error)
      return []
    }
  }

  // Initialize authentication state
  const initializeAuth = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (currentSession?.user) {
        const userProfile = await loadUserProfile(currentSession.user.id)
        const userRoles = await loadUserRoles(currentSession.user.id)
        
        setProfile(userProfile)
        setRoles(userRoles)
      }

      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: string, newSession: Session | null) => {
          console.log('🔄 Auth state changed:', event, newSession?.user?.id)
          
          setSession(newSession)
          setUser(newSession?.user ?? null)

          if (newSession?.user) {
            const userProfile = await loadUserProfile(newSession.user.id)
            const userRoles = await loadUserRoles(newSession.user.id)
            
            setProfile(userProfile)
            setRoles(userRoles)
          } else {
            setProfile(null)
            setRoles([])
          }
          
          setLoading(false)
        }
      )

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe()
      }

      setLoading(false)
      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('❌ Error initializing auth:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('🔧 AuthProvider: Initializing...')
    setMounted(true)
    initializeAuth()
  }, [])

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: 'Authentication service not available' }
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        console.error('❌ Sign in error:', error)
        return { error: error.message }
      }

      // Check if user is pending approval
      if (data.user) {
        const userProfile = await loadUserProfile(data.user.id)
        if (userProfile?.status === 'pending') {
          // Sign out the user immediately
          await supabase.auth.signOut()
          return { error: 'Your account is pending approval. Please wait for an administrator to approve your account.' }
        }
        
        if (userProfile?.status === 'inactive') {
          // Sign out the user immediately
          await supabase.auth.signOut()
          return { error: 'Your account has been deactivated. Please contact an administrator.' }
        }
      }

      return {}
    } catch (error) {
      console.error('❌ Sign in error:', error)
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
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) {
        console.error('❌ OAuth sign in error:', error)
        return { error: error.message }
      }
      return {}
    } catch (error) {
      console.error('❌ OAuth sign in error:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const signUp = async (email: string, password: string, profile?: Partial<UserProfile>) => {
    if (!supabase) {
      return { error: 'Authentication service not available' }
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: profile
        }
      })
      if (error) {
        console.error('❌ Sign up error:', error)
        return { error: error.message }
      }
      return {}
    } catch (error) {
      console.error('❌ Sign up error:', error)
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
      console.error('❌ Sign out error:', error)
    }
  }

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: 'Authentication service not available' }
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      if (error) {
        console.error('❌ Reset password error:', error)
        return { error: error.message }
      }
      return {}
    } catch (error) {
      console.error('❌ Reset password error:', error)
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
        console.error('❌ Update password error:', error)
        return { error: error.message }
      }
      return {}
    } catch (error) {
      console.error('❌ Update password error:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!supabase) {
      return { error: 'Authentication service not available' }
    }
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates
      })
      if (error) {
        console.error('❌ Update profile error:', error)
        return { error: error.message }
      }
      return {}
    } catch (error) {
      console.error('❌ Update profile error:', error)
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
        console.error('❌ Refresh session error:', error)
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
      console.error('❌ Refresh session error:', error)
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
      console.error('❌ Force refresh role error:', error)
    }
  }

  const value: AuthContextType = {
    session,
    user,
    profile,
    roles,
    loading,
    mounted,
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
