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
    // Initialize with null client - will be created when needed
    this.supabaseClient = null
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  // Lazy initialization of the Supabase client
  private ensureClient() {
    if (!this.supabaseClient && typeof window !== 'undefined') {
      console.log('🔧 AuthService: Creating Supabase client...')
      this.supabaseClient = createClient()
    }
    return this.supabaseClient
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
    
    const client = this.ensureClient()
    if (!client) {
      console.log('❌ AuthService: No supabase client available, setting loading to false')
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

      console.log('🔧 AuthService: Getting user...')
      const { data: { user }, error } = await client.auth.getUser()
      
      console.log('🔧 AuthService: User result:', user ? 'found' : 'not found', error ? `error: ${error.message}` : '')
      
      if (user && !error) {
        console.log('🔧 AuthService: Valid user found, restoring...')
        
        // Get session for additional session data if needed
        const { data: { session } } = await client.auth.getSession()
        
        this.updateState({ 
          session: session, 
          user: user,
          loading: false,
          mounted: true
        })
        
        // Load user profile and roles if user exists
        await this.loadUserProfile(user.id)
        await this.loadUserRoles(user.id)
      } else {
        console.log('🔧 AuthService: No valid user found, requiring login')
        this.updateState({ 
          session: null, 
          user: null,
          loading: false,
          mounted: true
        })
      }
    } catch (error) {
      console.error('🔧 AuthService: Error during initialization:', error)
      this.updateState({ 
        session: null, 
        user: null,
        loading: false,
        mounted: true
      })
    }
  }

  // Load user profile
  private async loadUserProfile(userId: string): Promise<any> {
    try {
      const client = this.ensureClient()
      if (!client) return null

      const { data: profile, error } = await client
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
      const client = this.ensureClient()
      if (!client) return []

      const { data: roles, error } = await client
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
      const client = this.ensureClient()
      if (!client) {
        return { success: false, error: 'No Supabase client available' }
      }

      const { data, error } = await client.auth.signInWithPassword({
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
      const client = this.ensureClient()
      if (!client) {
        return { success: false, error: 'No Supabase client available' }
      }

      const { data, error } = await client.auth.signUp({
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
      
      // Clear local state immediately
      this.updateState({
        user: null,
        session: null,
        profile: null,
        roles: [],
        profileNotFound: false
      })
      
      // Use centralized logout API to ensure proper cookie clearing
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Ensure cookies are sent
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        console.error('🔧 AuthService: Logout API error:', data.error)
        // Even if API fails, we've cleared local state
        return { success: true, error: data.error || 'Failed to logout on server' }
      }

      // Clear any remaining client-side storage
      if (typeof window !== 'undefined') {
        try {
          // Clear localStorage
          localStorage.removeItem('supabase.auth.token')
          localStorage.removeItem('supabase.auth.refreshToken')
          localStorage.removeItem('sb-auth-token')
          localStorage.removeItem('sb-ekdjxzhujettocosgzql-auth-token')
          
          // Clear sessionStorage
          sessionStorage.clear()
          
          // Clear any other potential auth storage
          Object.keys(localStorage).forEach(key => {
            if (key.includes('auth') || key.includes('supabase') || key.includes('sb-')) {
              localStorage.removeItem(key)
            }
          })
        } catch (storageError) {
          console.warn('🔧 AuthService: Error clearing storage:', storageError)
        }
      }
      
      console.log('🔧 AuthService: Sign out successful')
      return { success: true }
    } catch (error) {
      console.error('AuthService: Sign out error:', error)
      // Even if there's an error, clear local state
      this.updateState({
        user: null,
        session: null,
        profile: null,
        roles: [],
        profileNotFound: false
      })
      return { success: true, error: 'Internal error during sign out' }
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 AuthService: Resetting password...')
      const client = this.ensureClient()
      if (!client) {
        return { success: false, error: 'No Supabase client available' }
      }

      const { error } = await client.auth.resetPasswordForEmail(email, {
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
      const client = this.ensureClient()
      if (!client) {
        return { success: false, error: 'No Supabase client available' }
      }

      const { error } = await client.auth.updateUser({ password })

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
      const client = this.ensureClient()
      if (!client) {
        return { success: false, error: 'No Supabase client available' }
      }

      const { error } = await client.auth.updateUser({
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
      const client = this.ensureClient()
      if (!client) {
        return { success: false, error: 'No Supabase client available' }
      }

      const { error } = await client.auth.signInWithOAuth({
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
      const client = this.ensureClient()
      if (!client) {
        console.log('🔧 AuthService: No client available for session refresh')
        return
      }

      const { data: { session: newSession }, error } = await client.auth.refreshSession()
      
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