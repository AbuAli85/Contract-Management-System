'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Role as BaseRole } from '@/types/supabase'

type Role = BaseRole | null

interface AuthContextType {
  user: User | null
  role: Role // now includes null
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
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserRole(session.user.id)
      }
      setLoading(false)
    })

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadUserRole(session.user.id)
      } else {
        setRole(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) throw error
      const validRoles = ["admin", "manager", "user", "viewer"];
      setRole(validRoles.includes(data.role ?? "") ? (data.role as Role) : null);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error loading user role:', error.message)
      } else {
        console.error('Error loading user role:', error)
      }
      setRole(null)
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
      if (error instanceof Error) {
        console.error('Error enrolling MFA:', error.message)
      } else {
        console.error('Error enrolling MFA:', error)
      }
      throw error
    }
  }

  const verifyMFA = async (code: string) => {
    // The correct method for verifying MFA with Supabase may differ; adjust as needed
    // Here, we assume a verify function exists and returns a boolean
    // If not, you may need to implement this with the correct Supabase client method
    // For now, throw an error to avoid type issues
    throw new Error('MFA verification not implemented. Please implement according to Supabase docs.');
  }

  const unenrollMFA = async () => {
    const { error } = await supabase.auth.mfa.unenroll({
      factorId: 'totp'
    })
    if (error) throw error
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
