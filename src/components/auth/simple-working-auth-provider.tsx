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

export function SimpleWorkingAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<SimpleUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const supabase = createClient()

  const loadUserProfile = async (userId: string): Promise<SimpleUserProfile | null> => {
    try {
      console.log('🔧 Simple auth: Loading profile for user:', userId)
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, status')
        .eq('id', userId)
        .single()

      if (error) {
        console.warn('🔧 Simple auth: Profile not found:', error.message)
        return null
      }
      console.log('🔧 Simple auth: Profile loaded:', data)
      return data
    } catch (error) {
      console.warn('🔧 Simple auth: Error loading profile:', error)
      return null
    }
  }

  const initializeAuth = async () => {
    try {
      console.log('🔧 Simple auth: Initializing...')
      const { data: { session } } = await supabase.auth.getSession()
      
      console.log('🔧 Simple auth: Session check result:', session ? 'found' : 'not found')
      
      if (session?.user) {
        console.log('🔧 Simple auth: Setting user:', session.user.email)
        setUser(session.user)
        const userProfile = await loadUserProfile(session.user.id)
        setProfile(userProfile)
      } else {
        console.log('🔧 Simple auth: No session, clearing user state')
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error('🔧 Simple auth: Auth initialization error:', error)
      setUser(null)
      setProfile(null)
    } finally {
      console.log('🔧 Simple auth: Setting loading to false')
      setLoading(false)
    }
  }

  const handleAuthStateChange = async (event: string, session: Session | null) => {
    console.log('🔄 Simple auth: State changed:', event, session ? 'with session' : 'no session')
    if (session?.user) {
      console.log('🔄 Simple auth: Setting user from state change:', session.user.email)
      setUser(session.user)
      const userProfile = await loadUserProfile(session.user.id)
      setProfile(userProfile)
    } else {
      console.log('🔄 Simple auth: Clearing user state from state change')
      setUser(null)
      setProfile(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    console.log('🔧 Simple auth: useEffect started')
    setMounted(true)
    initializeAuth()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)
    
    // Safety timeout - force loading to false after 1 second
    const safetyTimeout = setTimeout(() => {
      console.log('⚠️ Simple auth: Safety timeout - forcing loading to false')
      setLoading(false)
    }, 1000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔧 Simple auth: SignIn called for:', email)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { 
        console.error('🔧 Simple auth: SignIn error:', error.message)
        return { error: error.message } 
      }
      console.log('🔧 Simple auth: SignIn successful for:', email)
      return {}
    } catch (error) { 
      console.error('🔧 Simple auth: SignIn exception:', error)
      return { error: 'Sign in failed' } 
    }
  }

  const signOut = async () => {
    try { 
      console.log('🔧 Simple auth: SignOut called')
      await supabase.auth.signOut() 
    } catch (error) { 
      console.error('🔧 Simple auth: Sign out error:', error) 
    }
  }

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

export const useSimpleWorkingAuth = () => {
  const context = useContext(SimpleAuthContext)
  if (!context) {
    throw new Error('useSimpleWorkingAuth must be used within a SimpleWorkingAuthProvider')
  }
  return context
} 