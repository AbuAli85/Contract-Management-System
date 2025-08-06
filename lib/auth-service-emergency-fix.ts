"use client"

import { User, Session, AuthError } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import React from "react"
import { useSupabase } from "@/app/providers"

// Centralized auth state management with defensive programming
interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  mounted: boolean
  error: string | null
  isProfileSynced: boolean
}

type AuthListener = (state: AuthState) => void

export class AuthService {
  private static instance: AuthService | null = null
  private state: AuthState = {
    user: null,
    session: null,
    loading: true,
    mounted: false,
    error: null,
    isProfileSynced: false,
  }
  private listeners: AuthListener[] = []
  private refreshTimer: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  // Subscribe to auth state changes
  subscribe(listener: AuthListener): () => void {
    this.listeners.push(listener)
    // Immediately call with current state
    listener(this.state)
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // Update auth state and notify listeners
  private updateState(updates: Partial<AuthState>): void {
    this.state = { ...this.state, ...updates }
    this.notifyListeners()
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state)
      } catch (error) {
        console.error('Auth listener error:', error)
      }
    })
  }

  // Get current state
  getState(): AuthState {
    return { ...this.state }
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
    console.log('[AuthService] Starting user profile sync...');
    this.updateState({ isProfileSynced: false }); // Set to false before starting
    
    try {
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to sync user profile.');
      }
      
      console.log('[AuthService] User profile synchronized successfully.');
      this.updateState({ isProfileSynced: true }); // Set to true on success
      
    } catch (error) {
      console.error('[AuthService] Error syncing user profile:', error);
      // Don't block the app if profile sync fails
      // Set to true anyway to allow the user to proceed
      console.log('[AuthService] Setting isProfileSynced to true despite error to allow app to function');
      this.updateState({ isProfileSynced: true, error: null });
    }
  }

  // This method will be called by the provider
  async initialize(supabase: any) {
    if (this.state.mounted) {
      console.log('[AuthService] Already initialized, skipping...');
      return;
    }

    console.log('[AuthService] Initializing...');
    this.updateState({ loading: true, mounted: true });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('[AuthService] Found existing session, updating state...');
        this.updateState({ user: session.user, session, loading: false });
        await this.syncUserProfile(); // Sync profile on initial load
      } else {
        console.log('[AuthService] No existing session found');
        this.updateState({ loading: false, isProfileSynced: true }); // No user, no sync needed
      }

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event: string, session: Session | null) => {
          console.log('[AuthService] Auth state changed:', event, session ? 'has session' : 'no session');
          
          this.updateState({ user: session?.user ?? null, session });
          
          if (event === 'SIGNED_IN') {
            console.log('[AuthService] User signed in, syncing profile...');
            await this.syncUserProfile(); // Sync profile on sign-in
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('[AuthService] Token refreshed, checking if profile sync needed...');
            // Only sync if not already synced
            if (!this.state.isProfileSynced) {
              await this.syncUserProfile();
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('[AuthService] User signed out, resetting profile sync state');
            this.updateState({ isProfileSynced: false }); // Reset on sign-out
          }
        }
      );

      // Store the unsubscribe function
      this.listeners.push(() => authListener?.subscription.unsubscribe());
      
    } catch (error) {
      console.error('[AuthService] Error during initialization:', error);
      this.updateState({ loading: false, error: 'Failed to initialize auth service' });
    }
  }
}

// Emergency fix for useAuth hook with defensive programming
export function useAuth() {
  const { user, session, loading, isProfileSynced, supabase } = useSupabase()
  const [state, setState] = React.useState<AuthState>({
    user: user || null,
    session: session,
    loading: loading,
    mounted: true,
    isProfileSynced: isProfileSynced,
    error: null,
  })

  // Emergency circuit breaker to prevent infinite loops
  const [emergencyMode, setEmergencyMode] = React.useState(false)

  React.useEffect(() => {
    // Check for emergency mode conditions
    const emergencyChecks = [
      typeof window === 'undefined',
      !supabase,
      emergencyMode
    ]

    if (emergencyChecks.some(Boolean)) {
      console.warn('🚨 Auth Emergency Mode Active - returning safe defaults')
      setEmergencyMode(true)
      return
    }

    const authService = AuthService.getInstance();
    const unsubscribe = authService.subscribe((newState) => {
      try {
        setState(newState);
      } catch (error) {
        console.error('Auth state update error:', error)
        setEmergencyMode(true)
      }
    });
    return () => unsubscribe();
  }, [supabase, emergencyMode]);

  React.useEffect(() => {
    if (emergencyMode) return

    try {
      setState(prevState => ({
        ...prevState,
        user: user || null,
        session: session,
        loading: loading,
        isProfileSynced: isProfileSynced,
      }))
    } catch (error) {
      console.error('Auth state sync error:', error)
      setEmergencyMode(true)
    }
  }, [user, session, loading, isProfileSynced, emergencyMode])

  // Emergency safe functions with null checks
  const signIn = async (email: string, password: string) => {
    if (!supabase || emergencyMode) {
      console.error("🔐 Auth Service: Emergency mode active or no Supabase client")
      return { 
        success: false, 
        error: "Authentication service unavailable" 
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
      
      // Check user status after successful authentication with safety checks
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

  const signInWithProvider = async (provider: string) => {
    if (!supabase || emergencyMode) {
      return { 
        success: false, 
        error: "Authentication service unavailable" 
      }
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
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
    if (!supabase || emergencyMode) {
      console.error("🔐 Auth Service: Emergency mode active or no Supabase client")
      return { 
        success: false, 
        error: "Authentication service unavailable" 
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
    if (!supabase || emergencyMode) {
      return { 
        success: false, 
        error: "Authentication service unavailable" 
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

  const isAuthenticated = () => !!(state.user && state.session)

  const clearError = () => setState(prev => ({ ...prev, error: null }))

  // Emergency mode returns safe defaults
  if (emergencyMode) {
    return {
      user: null,
      session: null,
      loading: false,
      mounted: true,
      isProfileSynced: true,
      error: null,
      signIn: async () => ({ success: false, error: 'Emergency mode active' }),
      signUp: async () => ({ success: false, error: 'Emergency mode active' }),
      signInWithProvider: async () => ({ success: false, error: 'Emergency mode active' }),
      signOut: async () => ({ success: true }),
      isAuthenticated: () => false,
      clearError: () => {},
    }
  }

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    mounted: state.mounted,
    isProfileSynced: state.isProfileSynced,
    error: state.error,
    signIn,
    signUp,
    signInWithProvider,
    signOut,
    isAuthenticated,
    clearError,
  }
}
