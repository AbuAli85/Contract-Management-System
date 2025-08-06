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

  private async syncUserProfile() {
    try {
      const response = await fetch('/api/users/sync', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to sync user profile.');
      }
      console.log('[AuthService] User profile synchronized successfully.');
    } catch (error) {
      console.error('[AuthService] Error syncing user profile:', error);
      // We can decide if we want to set an error state here
      // this.updateState({ error: 'Profile sync failed.' });
    }
  }

  // This method will be called by the provider
  async initialize(supabase: any) {
    if (this.state.mounted) return;

    this.updateState({ loading: true, mounted: true });

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      this.updateState({ user: session.user, session, loading: false });
      await this.syncUserProfile(); // Sync profile on initial load
    } else {
      this.updateState({ loading: false });
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        this.updateState({ user: session?.user ?? null, session });
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await this.syncUserProfile(); // Sync profile on sign-in or refresh
        }
      }
    );

    // Store the unsubscribe function
    this.listeners.push(() => authListener?.subscription.unsubscribe());
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
      
      // Check user status after successful authentication
      if (data.user) {
        try {
          // Check user status in both users and profiles tables
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("status, role")
            .eq("id", data.user.id)
            .single()
          
          if (!userError && userData) {
            console.log("🔐 Auth Service: User status check:", userData.status)
            
            if (userData.status === "pending") {
              console.log("🔐 Auth Service: User is pending approval")
              return { 
                success: false, 
                error: "Your account is pending approval. Please contact an administrator.",
                status: "pending"
              }
            }
            
            if (userData.status === "inactive") {
              console.log("🔐 Auth Service: User is inactive")
              return { 
                success: false, 
                error: "Your account has been deactivated. Please contact an administrator.",
                status: "inactive"
              }
            }
          } else {
            // Try profiles table as fallback
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("status, role")
              .eq("id", data.user.id)
              .single()
            
            if (!profileError && profileData) {
              console.log("🔐 Auth Service: Profile status check:", profileData.status)
              
              if (profileData.status === "pending") {
                console.log("🔐 Auth Service: Profile is pending approval")
                return { 
                  success: false, 
                  error: "Your account is pending approval. Please contact an administrator.",
                  status: "pending"
                }
              }
              
              if (profileData.status === "inactive") {
                console.log("🔐 Auth Service: Profile is inactive")
                return { 
                  success: false, 
                  error: "Your account has been deactivated. Please contact an administrator.",
                  status: "inactive"
                }
              }
            }
          }
        } catch (statusError) {
          console.error("🔐 Auth Service: Error checking user status:", statusError)
          // Continue with login if status check fails
        }
      }
      
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
