"use client"

import { createClient } from "@/lib/supabase/client"
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
  private supabase: ReturnType<typeof createClient> | null = null

  private constructor() {
    this.initializeAuth()
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

  // Initialize authentication with proper error handling
  private async initializeAuth(): Promise<void> {
    console.log("🔧 AuthService: Initializing auth...")

    try {
      this.supabase = createClient()
      
      if (!this.supabase) {
        throw new Error("Failed to create Supabase client")
      }
      
      // Set up auth state change listener
      const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("🔧 AuthService: Auth state changed:", event, session?.user?.email)
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            this.updateState({
              user: session?.user || null,
              session: session,
              loading: false,
              mounted: true,
              error: null,
            })
            
            // Set up automatic token refresh
            this.setupTokenRefresh(session)
          } else if (event === 'SIGNED_OUT') {
            this.updateState({
              user: null,
              session: null,
              loading: false,
              mounted: true,
              error: null,
            })
            
            // Clear refresh timer
            this.clearTokenRefresh()
          }
        }
      )

      // Get initial session
      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (error) {
        console.error("🔧 AuthService: Error getting session:", error)
        this.updateState({
          loading: false,
          mounted: true,
          error: error.message,
        })
        return
      }

      this.updateState({
        user: session?.user || null,
        session: session,
        loading: false,
        mounted: true,
        error: null,
      })

      // Set up token refresh if session exists
      if (session) {
        this.setupTokenRefresh(session)
      }

      // Cleanup subscription on unmount
      subscription.unsubscribe()
      this.clearTokenRefresh()
    } catch (error) {
      console.error("🔧 AuthService: Initialization error:", error)
      this.updateState({
        loading: false,
        mounted: true,
        error: error instanceof Error ? error.message : "Authentication initialization failed",
      })
    }
  }

  // Set up automatic token refresh
  private setupTokenRefresh(session: Session | null) {
    if (!session?.expires_at) return

    const expiresAt = new Date(session.expires_at * 1000)
    const now = new Date()
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    
    // Refresh 5 minutes before expiry
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 0)
    
    this.clearTokenRefresh()
    
    this.refreshTimer = setTimeout(async () => {
      try {
        console.log("🔧 AuthService: Refreshing token...")
        const { data, error } = await this.supabase?.auth.refreshSession() || {}
        
        if (error) {
          console.error("🔧 AuthService: Token refresh failed:", error)
          this.updateState({ error: "Session expired. Please log in again." })
        } else if (data?.session) {
          console.log("🔧 AuthService: Token refreshed successfully")
          this.setupTokenRefresh(data.session)
        }
      } catch (error) {
        console.error("🔧 AuthService: Token refresh error:", error)
        this.updateState({ error: "Session refresh failed. Please log in again." })
      }
    }, refreshTime)
  }

  // Clear token refresh timer
  private clearTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.supabase) {
        throw new Error("Supabase client not initialized")
      }

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("🔧 AuthService: Sign in error:", error)
        return { success: false, error: error.message }
      }

      if (data?.session) {
        console.log("🔧 AuthService: Sign in successful")
        return { success: true }
      }

      return { success: false, error: "Sign in failed" }
    } catch (error) {
      console.error("🔧 AuthService: Sign in exception:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }
    }
  }

  // Sign in with OAuth provider
  async signInWithProvider(provider: 'github' | 'google'): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.supabase) {
        throw new Error("Supabase client not initialized")
      }

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("🔧 AuthService: OAuth sign in error:", error)
        return { success: false, error: error.message }
      }

      console.log("🔧 AuthService: OAuth sign in initiated")
      return { success: true }
    } catch (error) {
      console.error("🔧 AuthService: OAuth sign in exception:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "OAuth sign in failed" 
      }
    }
  }

  // Sign out
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.supabase) {
        throw new Error("Supabase client not initialized")
      }

      const { error } = await this.supabase.auth.signOut()

      if (error) {
        console.error("🔧 AuthService: Sign out error:", error)
        return { success: false, error: error.message }
      }

      console.log("🔧 AuthService: Sign out successful")
      this.clearTokenRefresh()
      return { success: true }
    } catch (error) {
      console.error("🔧 AuthService: Sign out exception:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Sign out failed" 
      }
    }
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
