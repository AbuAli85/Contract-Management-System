'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService, type AuthState } from '@/lib/auth-service'

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<{ success: boolean; error?: string }>
  signInWithProvider: (provider: 'github' | 'google' | 'twitter') => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: any) => Promise<{ success: boolean; error?: string }>
  refreshSession: () => Promise<void>
  forceRefreshRole: () => Promise<void>
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
<<<<<<< Updated upstream
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    mounted: false,
    profile: null,
    roles: [],
    profileNotFound: false
  })
=======
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

  // Initialize authentication state - FIXED VERSION
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
        console.log('🔧 AuthProvider: No session found, clearing state')
        setSession(null)
        setUser(null)
        setProfile(null)
        setRoles([])
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
>>>>>>> Stashed changes

  useEffect(() => {
    console.log('🔧 AuthProvider useEffect started')
    
    // Subscribe to auth service state changes
    const unsubscribe = authService.subscribe((state) => {
      console.log('🔧 AuthProvider: State updated:', {
        user: !!state.user,
        session: !!state.session,
        loading: state.loading,
        mounted: state.mounted
      })
      setAuthState(state)
    })

    // Initialize auth
    console.log('🔧 AuthProvider: Calling initializeAuth...')
    authService.initializeAuth()

    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [])

  // Expose auth state for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__AUTH_STATE__ = authState
    }
  }, [authState])

  const contextValue: AuthContextType = {
    ...authState,
    signIn: authService.signIn.bind(authService),
    signUp: authService.signUp.bind(authService),
    signOut: authService.signOut.bind(authService),
    signInWithProvider: authService.signInWithProvider.bind(authService),
    resetPassword: authService.resetPassword.bind(authService),
    updatePassword: authService.updatePassword.bind(authService),
    updateProfile: authService.updateProfile.bind(authService),
    refreshSession: authService.refreshSession.bind(authService),
    forceRefreshRole: authService.forceRefreshRole.bind(authService),
    hasRole: authService.hasRole.bind(authService),
    hasAnyRole: authService.hasAnyRole.bind(authService),
    hasPermission: authService.hasPermission.bind(authService)
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
