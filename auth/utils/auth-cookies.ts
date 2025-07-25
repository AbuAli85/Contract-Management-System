import { createClient } from '@/lib/supabase/client'

// Cookie management utilities for authentication
export const authCookies = {
  // Get auth token from cookies
  getAuthToken: (): string | null => {
    if (typeof document === 'undefined') return null
    
    const cookies = document.cookie.split(';')
    const authCookie = cookies.find(cookie => 
      cookie.trim().startsWith('sb-auth-token=')
    )
    
    if (authCookie) {
      return authCookie.split('=')[1]
    }
    
    return null
  },

  // Set auth token in cookies
  setAuthToken: (token: string, expiresIn: number = 7): void => {
    if (typeof document === 'undefined') return
    
    const expires = new Date()
    expires.setDate(expires.getDate() + expiresIn)
    
    document.cookie = `sb-auth-token=${token}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`
  },

  // Remove auth token from cookies
  removeAuthToken: (): void => {
    if (typeof document === 'undefined') return
    
    document.cookie = 'sb-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  },

  // Check if user is authenticated via cookies
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      return !!session
    } catch (error) {
      console.error('Error checking authentication:', error)
      return false
    }
  },

  // Get user session from cookies
  getSession: async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      return session
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }
}

// Session refresh utilities
export const sessionUtils = {
  // Refresh the current session
  refreshSession: async () => {
    try {
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Error refreshing session:', error)
        return null
      }
      
      return session
    } catch (error) {
      console.error('Error refreshing session:', error)
      return null
    }
  },

  // Check if session is expired
  isSessionExpired: (session: any): boolean => {
    if (!session?.expires_at) return true
    
    const expiresAt = new Date(session.expires_at * 1000)
    const now = new Date()
    
    return now >= expiresAt
  },

  // Get time until session expires (in minutes)
  getTimeUntilExpiry: (session: any): number => {
    if (!session?.expires_at) return 0
    
    const expiresAt = new Date(session.expires_at * 1000)
    const now = new Date()
    
    return Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60)))
  }
}

// Role and permission utilities
export const roleUtils = {
  // Check if user has specific role
  hasRole: (userRoles: string[], requiredRole: string): boolean => {
    return userRoles.includes(requiredRole)
  },

  // Check if user has any of the required roles
  hasAnyRole: (userRoles: string[], requiredRoles: string[]): boolean => {
    return requiredRoles.some(role => userRoles.includes(role))
  },

  // Check if user has all required roles
  hasAllRoles: (userRoles: string[], requiredRoles: string[]): boolean => {
    return requiredRoles.every(role => userRoles.includes(role))
  },

  // Check if user has specific permission
  hasPermission: (userPermissions: string[], requiredPermission: string): boolean => {
    return userPermissions.includes(requiredPermission)
  },

  // Check if user has any of the required permissions
  hasAnyPermission: (userPermissions: string[], requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => userPermissions.includes(permission))
  },

  // Check if user has all required permissions
  hasAllPermissions: (userPermissions: string[], requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(permission => userPermissions.includes(permission))
  }
} 