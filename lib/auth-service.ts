"use client"

import { User, Session, AuthError } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import React from "react"
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react"

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
  const session = useSession()
  const supabase = useSupabaseClient()
  const [state, setState] = React.useState<AuthState>({
    user: session?.user || null,
    session: session,
    loading: !session,
    mounted: true,
    error: null,
  })

  React.useEffect(() => {
    if (session) {
      setState({
        user: session.user,
        session: session,
        loading: false,
        mounted: true,
        error: null,
      })
    } else {
      setState({
        user: null,
        session: null,
        loading: false,
        mounted: true,
        error: null,
      })
    }
  }, [session])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Sign in failed" 
      }
    }
  }

  const signInWithProvider = async (provider: 'github' | 'google') => {
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

  const signOut = async () => {
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
    signInWithProvider,
    signOut,
    isAuthenticated,
    clearError,
  }
}
