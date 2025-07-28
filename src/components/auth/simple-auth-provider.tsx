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

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<Session['user'] | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [profileNotFound, setProfileNotFound] = useState(false)

  // Create Supabase client
  const supabase = createClient()

  // Load user profile from database
  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!supabase) return null
    
    try {
      // Try to load from users table first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role, status, created_at, full_name, avatar_url')
        .eq('id', userId)
        .single()

      if (userData && !userError) {
        return userData as UserProfile
      }

      // Fallback to profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role, created_at, full_name, avatar_url')
        .eq('id', userId)
        .single()

      if (profileData && !profileError) {
        return profileData as UserProfile
      }

      return null
    } catch (error) {
      console.error('Error loading user profile:', error)
      return null
    }
  }

  // Load user roles
  const loadUserRoles = async (userId: string): Promise<string[]> => {
    if (!supabase) return []
    
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      return userData?.role ? [userData.role] : []
    } catch (error) {
      console.error('Error loading user roles:', error)
      return []
    }
  }

  // Initialize authentication
  const initializeAuth = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      // Get session from Supabase client
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (currentSession?.user) {
        // Use client session
        setSession(currentSession)
        setUser(currentSession.user)
        
        // Load profile and roles
        const userProfile = await loadUserProfile(currentSession.user.id)
        const userRoles = await loadUserRoles(currentSession.user.id)
        
        setProfile(userProfile)
        setRoles(userRoles)
        
        if (!userProfile) {
          setProfileNotFound(true)
        }
      } else {
        // No session found, user is not authenticated
        setSession(null)
        setUser(null)
        setProfile(null)
        setRoles([])
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle auth state changes
  const handleAuthStateChange = async (event: string, newSession: Session | null) => {
    setSession(newSession)
    setUser(newSession?.user ?? null)
    setProfileNotFound(false)
    
    if (newSession?.user) {
      const userProfile = await loadUserProfile(newSession.user.id)
      const userRoles = await loadUserRoles(newSession.user.id)
      
      setProfile(userProfile)
      setRoles(userRoles)
      
      if (!userProfile) {
        setProfileNotFound(true)
      }
    } else {
      setProfile(null)
      setRoles([])
    }
    
    setLoading(false)
  }

  useEffect(() => {
    setMounted(true)
    initializeAuth()

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)
      
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [])

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
      await supabase?.auth.refreshSession()
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
    // Simple permission check based on roles
    if (hasRole('admin')) return true
    if (hasRole('manager') && ['read', 'write'].includes(permission)) return true
    return hasRole('user') && permission === 'read'
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
    signUp,
    signOut,
    signInWithProvider,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshSession,
    hasRole,
    hasAnyRole,
    hasPermission,
    forceRefreshRole
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
    throw new Error('useAuth must be used within a SimpleAuthProvider')
  }
  return context
} 