"use client"

import { User, Session, AuthError } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import React from "react"
import { useSupabase } from "@/app/providers"

// Centralized auth state management
interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  mounted: boolean
  error: string | null
}

type AuthListener = (state: AuthState) => void

export class AuthService {
  private static instance: AuthService
  private state: AuthState = {
    user: null,
    session: null,
    loading: true,
    mounted: false,
    error: null,
  }
  private listeners: AuthListener[] = []
  private refreshTimer: NodeJS.Timeout | null = null

  private constructor() {
    // AuthService is now just a state manager
    // The actual Supabase client comes from the context
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  private updateState(updates: Partial<AuthState>) {
    this.state = { ...this.state, ...updates }
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state))
  }

  subscribe(listener: AuthListener): () => void {
    this.listeners.push(listener)
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  getState(): AuthState {
    return { ...this.state }
  }

  // Get current user
  getUser(): User | null {
    return this.state.user
  }

  // Get current session
  getSession(): Session | null {
    return this.state.session
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.state.user && !!this.state.session
  }

  // Get loading state
  isLoading(): boolean {
    return this.state.loading
  }

  // Get mounted state
  isMounted(): boolean {
    return this.state.mounted
  }

  // Get error state
  getError(): string | null {
    return this.state.error
  }

  // Clear error
  clearError(): void {
    this.updateState({ error: null })
  }

  // Destroy instance (for cleanup)
  destroy(): void {
    this.clearTokenRefresh()
    this.listeners = []
    AuthService.instance = null as any
  }

  // Clear token refresh timer
  private clearTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }
}

// React hook for using AuthService with Supabase auth helpers
export function useAuth() {
  const { user, session, loading, supabase } = useSupabase()
  const [state, setState] = React.useState<AuthState>({
    user: user || null,
    session: session,
    loading: loading,
    mounted: true,
    error: null,
  })

  React.useEffect(() => {
    setState({
      user: user || null,
      session: session,
      loading: loading,
      mounted: true,
      error: null,
    })
  }, [user, session, loading])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      console.error("🔐 Auth Service: No Supabase client available")
      return { 
        success: false, 
        error: "Supabase client not available" 
      }
    }

    try {
      console.log("🔐 Auth Service: Attempting sign in for:", email)
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        console.error("🔐 Auth Service: Sign in error:", error.message)
        throw error
      }
      
      console.log("🔐 Auth Service: Sign in successful for:", data.user?.email)
      return { success: true }
    } catch (error) {
      console.error("🔐 Auth Service: Sign in failed:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Sign in failed" 
      }
    }
  }

  const signInWithProvider = async (provider: 'github' | 'google') => {
    if (!supabase) {
      return { 
        success: false, 
        error: "Supabase client not available" 
      }
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      })
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "OAuth sign in failed" 
      }
    }
  }

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    if (!supabase) {
      console.error("🔐 Auth Service: No Supabase client available")
      return { 
        success: false, 
        error: "Supabase client not available" 
      }
    }

    try {
      console.log("🔐 Auth Service: Attempting sign up for:", email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error("🔐 Auth Service: Sign up error:", error.message)
        throw error
      }
      
      console.log("🔐 Auth Service: Sign up successful for:", data.user?.email)
      return { success: true, data }
    } catch (error) {
      console.error("🔐 Auth Service: Sign up failed:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Sign up failed" 
      }
    }
  }

  const signOut = async () => {
    if (!supabase) {
      return { 
        success: false, 
        error: "Supabase client not available" 
      }
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Sign out failed" 
      }
    }
  }

  const isAuthenticated = () => !!state.user && !!state.session

  const clearError = () => setState(prev => ({ ...prev, error: null }))

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    mounted: state.mounted,
    error: state.error,
    signIn,
    signUp,
    signInWithProvider,
    signOut,
    isAuthenticated,
    clearError,
  }
}
