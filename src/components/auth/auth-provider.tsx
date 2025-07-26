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
    if (!supabase) return null
    
    try {
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

  // Initialize authentication state
  const initializeAuth = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setProfileNotFound(false)
      
      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      // Always set loading to false immediately after session check
      setLoading(false)

      // If user exists, load profile data in background (non-blocking)
      if (currentSession?.user) {
        // Use setTimeout to ensure this runs after the current render cycle
        setTimeout(async () => {
          try {
            const [userProfile, userRoles] = await Promise.all([
              loadUserProfile(currentSession.user.id),
              loadUserRoles(currentSession.user.id)
            ])
            
            setProfile(userProfile)
            setRoles(userRoles)
            if (!userProfile) {
              setProfileNotFound(true)
            }
          } catch (error) {
            console.warn('Profile loading failed, continuing with basic auth')
            setProfile(null)
            setRoles([])
          }
        }, 100)
      } else {
        setProfile(null)
        setRoles([])
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      setProfile(null)
      setRoles([])
      setLoading(false)
    }
  }

  // Handle auth state changes
  const handleAuthStateChange = async (event: string, newSession: Session | null) => {
    setSession(newSession)
    setUser(newSession?.user ?? null)
    setProfileNotFound(false)
    setLoading(false) // Always set loading to false immediately
    
    if (newSession?.user) {
      // Load profile and roles in background (non-blocking)
      setTimeout(async () => {
        try {
          const [userProfile, userRoles] = await Promise.all([
            loadUserProfile(newSession.user.id),
            loadUserRoles(newSession.user.id)
          ])
          
          setProfile(userProfile)
          setRoles(userRoles)
          if (!userProfile) {
            setProfileNotFound(true)
          }
        } catch (error) {
          console.warn('Profile loading failed in auth state change')
          setProfile(null)
          setRoles([])
        }
      }, 100)
    } else {
      setProfile(null)
      setRoles([])
    }
  }

  useEffect(() => {
    setMounted(true)
    
    if (!supabase) {
      setLoading(false)
      return
    }

    // Initialize auth state
    initializeAuth()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    // Safety timeout - force loading to false after 3 seconds
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Safety timeout: forcing loading to false')
        setLoading(false)
      }
    }, 3000)

    // Cleanup function
    return () => {
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
    }
  }, [])

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: 'Authentication service not available' }
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
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
              setTimeout(() => reject(new Error('Profile check timeout')), 5000)
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
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) {
        console.error('OAuth sign in error:', error)
        return { error: error.message }
      }
      return {}
    } catch (error) {
      console.error('OAuth sign in error:', error)
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
        console.error('Sign up error:', error)
        return { error: error.message }
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
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      if (error) {
        console.error('Reset password error:', error)
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
        console.error('Update password error:', error)
        return { error: error.message }
      }
      return {}
    } catch (error) {
      console.error('Update password error:', error)
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
        console.error('Update profile error:', error)
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

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
