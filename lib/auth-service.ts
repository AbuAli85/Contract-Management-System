import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  mounted: boolean
  profile: any | null
  roles: string[]
  profileNotFound: boolean
}

export class AuthService {
  private static instance: AuthService
  private supabaseClient: any
  private authState: AuthState = {
    user: null,
    session: null,
    loading: true,
    mounted: false,
    profile: null,
    roles: [],
    profileNotFound: false
  }
  private listeners: Set<(state: AuthState) => void> = new Set()

  private constructor() {
    // Only create client in browser environment
    if (typeof window !== 'undefined') {
      this.supabaseClient = createClient()
    } else {
      console.log('🔧 AuthService: SSR detected, skipping client creation')
      this.supabaseClient = null
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener)
    // Immediately call with current state
    listener(this.authState)
    
    return () => {
      this.listeners.delete(listener)
    }
  }

  // Notify all listeners of state changes
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.authState))
  }

  // Update auth state
  private updateState(updates: Partial<AuthState>) {
    this.authState = { ...this.authState, ...updates }
    this.notifyListeners()
  }

  // Initialize authentication
  async initializeAuth(): Promise<void> {
    console.log('🔧 AuthService: Initializing auth...')
    
    if (!this.supabaseClient) {
      console.log('❌ AuthService: No supabase client, setting loading to false')
      this.updateState({ loading: false, mounted: true })
      return
    }

    try {
      // Debug: Check what cookies are available
      if (typeof window !== 'undefined') {
        const cookies = document.cookie.split(';').map(c => c.trim())
        const authCookies = cookies.filter(c => c.includes('auth-token') || c.includes('sb-'))
        console.log('🔧 AuthService: Available auth cookies:', authCookies)
      }

      console.log('🔧 AuthService: Getting session...')
      const { data: { session: currentSession } } = await this.supabaseClient.auth.getSession()
      
      console.log('🔧 AuthService: Session result:', currentSession ? 'found' : 'not found')
      
      this.updateState({ 
        session: currentSession, 
        user: currentSession?.user ?? null,
        loading: false,
        mounted: true
      })

      // If no session found, try to refresh the session
      if (!currentSession) {
        console.log('🔧 AuthService: No session found, attempting to refresh...')
        try {
          const { data: { session: refreshedSession }, error: refreshError } = await this.supabaseClient.auth.refreshSession()
          
          if (refreshError) {
            console.log('🔧 AuthService: Session refresh failed:', refreshError.message)
            
            // Try manual session check as fallback
            console.log('🔧 AuthService: Trying manual session check...')
            try {
              const response = await fetch('/api/auth/check-session')
              const data = await response.json()
              console.log('🔧 AuthService: Manual session check result:', data)
              
              if (data.success && data.hasSession && data.user) {
                console.log('🔧 AuthService: Manual session check found user, updating state...')
                // Create a mock session object
                const mockSession = {
                  user: data.user,
                  access_token: 'manual-check',
                  refresh_token: 'manual-check',
                  expires_in: 3600,
                  token_type: 'bearer'
                }
                this.updateState({
                  session: mockSession as any,
                  user: data.user
                })
              }
            } catch (manualError) {
              console.log('🔧 AuthService: Manual session check failed:', manualError)
            }
          } else if (refreshedSession) {
            console.log('🔧 AuthService: Session refreshed successfully')
            this.updateState({
              session: refreshedSession,
              user: refreshedSession.user
            })
          }
        } catch (refreshError) {
          console.log('🔧 AuthService: Session refresh error:', refreshError)
        }
      }

      // Load profile data in background if user exists
      const userId = currentSession?.user?.id
      if (userId) {
        console.log('🔧 AuthService: Loading profile data in background...')
        
        // Load profile and roles concurrently without arbitrary delays
        Promise.all([
          this.loadUserProfile(userId),
          this.loadUserRoles(userId)
        ]).then(([userProfile, userRoles]) => {
          this.updateState({
            profile: userProfile,
            roles: userRoles,
            profileNotFound: !userProfile
          })
          
          console.log('🔧 AuthService: Profile data loaded:', { profile: !!userProfile, roles: userRoles })
        }).catch((error) => {
          console.warn('AuthService: Profile loading failed, continuing with basic auth:', error)
          this.updateState({
            profile: null,
            roles: []
          })
        })
      } else {
        this.updateState({
          profile: null,
          roles: []
        })
      }
    } catch (error) {
      console.error('AuthService: Auth initialization error:', error)
      this.updateState({
        profile: null,
        roles: [],
        loading: false
      })
    }
  }

  // Load user profile
  private async loadUserProfile(userId: string): Promise<any> {
    try {
      const { data: profile, error } = await this.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('AuthService: Error loading profile:', error)
        return null
      }

      return profile
    } catch (error) {
      console.error('AuthService: Profile loading error:', error)
      return null
    }
  }

  // Load user roles
  private async loadUserRoles(userId: string): Promise<string[]> {
    try {
      const { data: roles, error } = await this.supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)

      if (error) {
        console.error('AuthService: Error loading roles:', error)
        return []
      }

      return roles.map((r: { role: string }) => r.role)
    } catch (error) {
      console.error('AuthService: Roles loading error:', error)
      return []
    }
  }

  // Sign in
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 AuthService: Signing in...')
      const { data, error } = await this.supabaseClient.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('AuthService: Sign in error:', error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        this.updateState({
          user: data.user,
          session: data.session
        })
        console.log('🔧 AuthService: Sign in successful')
        return { success: true }
      }

      return { success: false, error: 'No user returned from sign in' }
    } catch (error) {
      console.error('AuthService: Sign in error:', error)
      return { success: false, error: 'Internal error during sign in' }
    }
  }

  // Sign up
  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 AuthService: Signing up...')
      const { data, error } = await this.supabaseClient.auth.signUp({
        email,
        password
      })

      if (error) {
        console.error('AuthService: Sign up error:', error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        this.updateState({
          user: data.user,
          session: data.session
        })
        console.log('🔧 AuthService: Sign up successful')
        return { success: true }
      }

      return { success: false, error: 'No user returned from sign up' }
    } catch (error) {
      console.error('AuthService: Sign up error:', error)
      return { success: false, error: 'Internal error during sign up' }
    }
  }

  // Sign out
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 AuthService: Signing out...')
      const { error } = await this.supabaseClient.auth.signOut()

      if (error) {
        console.error('AuthService: Sign out error:', error)
        return { success: false, error: error.message }
      }

      this.updateState({
        user: null,
        session: null,
        profile: null,
        roles: []
      })
      console.log('🔧 AuthService: Sign out successful')
      return { success: true }
    } catch (error) {
      console.error('AuthService: Sign out error:', error)
      return { success: false, error: 'Internal error during sign out' }
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 AuthService: Resetting password...')
      const { error } = await this.supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        console.error('AuthService: Reset password error:', error)
        return { success: false, error: error.message }
      }

      console.log('🔧 AuthService: Reset password email sent')
      return { success: true }
    } catch (error) {
      console.error('AuthService: Reset password error:', error)
      return { success: false, error: 'Internal error during password reset' }
    }
  }

  // Update password
  async updatePassword(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 AuthService: Updating password...')
      const { error } = await this.supabaseClient.auth.updateUser({ password })

      if (error) {
        console.error('AuthService: Update password error:', error)
        return { success: false, error: error.message }
      }

      console.log('🔧 AuthService: Password updated successfully')
      return { success: true }
    } catch (error) {
      console.error('AuthService: Update password error:', error)
      return { success: false, error: 'Internal error during password update' }
    }
  }

  // Update profile
  async updateProfile(updates: any): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 AuthService: Updating profile...')
      const { error } = await this.supabaseClient.auth.updateUser({
        data: updates
      })

      if (error) {
        console.error('AuthService: Update profile error:', error)
        return { success: false, error: error.message }
      }

      console.log('🔧 AuthService: Profile updated successfully')
      return { success: true }
    } catch (error) {
      console.error('AuthService: Update profile error:', error)
      return { success: false, error: 'Internal error during profile update' }
    }
  }

  // Sign in with provider
  async signInWithProvider(provider: 'github' | 'google' | 'twitter'): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 AuthService: Signing in with provider:', provider)
      const { error } = await this.supabaseClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('AuthService: OAuth sign in error:', error)
        return { success: false, error: error.message }
      }

      console.log('🔧 AuthService: OAuth sign in initiated')
      return { success: true }
    } catch (error) {
      console.error('AuthService: OAuth sign in error:', error)
      return { success: false, error: 'Internal error during OAuth sign in' }
    }
  }

  // Refresh session
  async refreshSession(): Promise<void> {
    try {
      console.log('🔧 AuthService: Refreshing session...')
      const { data: { session: newSession }, error } = await this.supabaseClient.auth.refreshSession()
      
      if (error) {
        console.error('AuthService: Refresh session error:', error)
        return
      }
      
      if (newSession) {
        this.updateState({
          session: newSession,
          user: newSession.user
        })
        console.log('🔧 AuthService: Session refreshed successfully')
      }
    } catch (error) {
      console.error('AuthService: Refresh session error:', error)
    }
  }

  // Force refresh role
  async forceRefreshRole(): Promise<void> {
    try {
      console.log('🔧 AuthService: Force refreshing role...')
      if (!this.authState.user) {
        console.log('🔧 AuthService: No user to refresh role for')
        return
      }

      const userProfile = await this.loadUserProfile(this.authState.user.id)
      const userRoles = await this.loadUserRoles(this.authState.user.id)
      
      this.updateState({
        profile: userProfile,
        roles: userRoles
      })
      
      console.log('🔧 AuthService: Role refreshed successfully')
    } catch (error) {
      console.error('AuthService: Force refresh role error:', error)
    }
  }

  // Check if user has permission
  hasPermission(permission: string): boolean {
    if (!this.authState.profile?.permissions) return false
    return this.authState.profile.permissions.includes(permission)
  }

  // Get current auth state
  getAuthState(): AuthState {
    return this.authState
  }

  // Check if user has role
  hasRole(role: string): boolean {
    return this.authState.roles.includes(role)
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.authState.roles.includes(role))
  }
}

// Export singleton instance
export const authService = AuthService.getInstance() 