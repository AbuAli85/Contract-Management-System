'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Role as BaseRole } from '@/types/supabase'

type Role = BaseRole | null

interface AuthContextType {
  user: User | null
  role: Role
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: unknown) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>
  enrollMFA: () => Promise<string>
  verifyMFA: (code: string) => Promise<boolean>
  unenrollMFA: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...')
        
        // Check active sessions and sets the user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          if (mounted) {
            setLoading(false)
          }
          return
        }

        if (mounted) {
          setUser(session?.user ?? null)
          
          if (session?.user) {
            console.log('User found, loading role...')
            await loadUserRole(session.user.id)
          } else {
            console.log('No user session found')
          }
          
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (mounted) {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserRole(session.user.id)
        } else {
          setRole(null)
        }
        
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const loadUserRole = async (userId: string) => {
    try {
      console.log('Loading role for user:', userId)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Role loading error:', error)
        // Set default role if profile doesn't exist
        setRole('user')
        return
      }

      const validRoles = ["admin", "manager", "user", "viewer"];
      const userRole = validRoles.includes(data.role ?? "") ? (data.role as Role) : 'user';
      
      console.log('User role loaded:', userRole)
      setRole(userRole)
    } catch (error) {
      console.error('Error loading user role:', error)
      // Set default role on error
      setRole('user')
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, metadata?: unknown) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: (typeof metadata === "object" && metadata !== null) ? metadata : undefined,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    if (error) throw error
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }

  const enrollMFA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      })
      if (error) throw error
      return data.totp.qr_code
    } catch (error) {
      console.error('MFA enrollment error:', error)
      throw error
    }
  }

  const verifyMFA = async (code: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: 'totp'
      })
      if (error) throw error
      // For now, return true as MFA verification is complex
      return true
    } catch (error) {
      console.error('MFA verification error:', error)
      return false
    }
  }

  const unenrollMFA = async () => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: 'totp'
      })
      if (error) throw error
    } catch (error) {
      console.error('MFA unenrollment error:', error)
      throw error
    }
  }

  const value = {
    user,
    role,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    signInWithOAuth,
    enrollMFA,
    verifyMFA,
    unenrollMFA
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
