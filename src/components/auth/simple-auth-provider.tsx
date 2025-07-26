'use client'

import { createContext, useEffect, useState, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Session, User } from '@supabase/supabase-js'

interface SimpleUserProfile {
  id: string
  email: string
  full_name?: string
  role: string
  status: string
}

interface SimpleAuthContextType {
  user: User | null
  profile: SimpleUserProfile | null
  loading: boolean
  mounted: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  hasRole: (role: string) => boolean
}

const SimpleAuthContext = createContext<SimpleAuthContextType>({
  user: null,
  profile: null,
  loading: true,
  mounted: false,
  signIn: async () => ({ error: 'Not implemented' }),
  signOut: async () => {},
  hasRole: () => false,
})

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<SimpleUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Create Supabase client
  const supabase = createClient()

  // Load user profile
  const loadUserProfile = async (userId: string): Promise<SimpleUserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, status')
        .eq('id', userId)
        .single()

      if (error) {
        console.warn('Profile not found:', error.message)
        return null
      }

      return data
    } catch (error) {
      console.warn('Error loading profile:', error)
      return null
    }
  }

  // Initialize authentication
  const initializeAuth = async () => {
    try {
      setLoading(true)
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        
        // Load profile in background
        const userProfile = await loadUserProfile(session.user.id)
        setProfile(userProfile)
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  // Handle auth state changes
  const handleAuthStateChange = async (event: string, session: Session | null) => {
    console.log('Auth state changed:', event, session?.user?.id)
    
    if (session?.user) {
      setUser(session.user)
      
      // Load profile in background
      const userProfile = await loadUserProfile(session.user.id)
      setProfile(userProfile)
    } else {
      setUser(null)
      setProfile(null)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    setMounted(true)
    
    // Initialize auth
    initializeAuth()

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    // Safety timeout - force loading to false after 5 seconds
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout, forcing completion')
        setLoading(false)
      }
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
    }
  }, [])

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        return { error: error.message }
      }

      if (data.user) {
        const userProfile = await loadUserProfile(data.user.id)
        
        if (userProfile?.status === 'pending') {
          await supabase.auth.signOut()
          return { error: 'Account pending approval' }
        }
        
        if (userProfile?.status === 'inactive') {
          await supabase.auth.signOut()
          return { error: 'Account deactivated' }
        }
      }

      return {}
    } catch (error) {
      return { error: 'Sign in failed' }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Check role
  const hasRole = (role: string): boolean => {
    return profile?.role === role
  }

  const value: SimpleAuthContextType = {
    user,
    profile,
    loading,
    mounted,
    signIn,
    signOut,
    hasRole,
  }

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  )
}

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext)
  if (!context) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider')
  }
  return context
} 