'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService, type AuthState } from '@/lib/auth-service'

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<{ success: boolean; error?: string }>
  signInWithProvider: (provider: 'github' | 'google' | 'twitter') => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: any) => Promise<{ success: boolean; error?: string }>
  refreshSession: () => Promise<void>
  forceRefreshRole: () => Promise<void>
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    mounted: false,
    profile: null,
    roles: [],
    profileNotFound: false
  })

  useEffect(() => {
    console.log('🔧 AuthProvider useEffect started')
    
    // Subscribe to auth service state changes
    const unsubscribe = authService.subscribe((state) => {
      console.log('🔧 AuthProvider: State updated:', {
        user: !!state.user,
        session: !!state.session,
        loading: state.loading,
        mounted: state.mounted
      })
      setAuthState(state)
    })

    // Initialize auth
    console.log('🔧 AuthProvider: Calling initializeAuth...')
    authService.initializeAuth()

    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [])

  // Expose auth state for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__AUTH_STATE__ = authState
    }
  }, [authState])

  const contextValue: AuthContextType = {
    ...authState,
    signIn: authService.signIn.bind(authService),
    signUp: authService.signUp.bind(authService),
    signOut: authService.signOut.bind(authService),
    signInWithProvider: authService.signInWithProvider.bind(authService),
    resetPassword: authService.resetPassword.bind(authService),
    updatePassword: authService.updatePassword.bind(authService),
    updateProfile: authService.updateProfile.bind(authService),
    refreshSession: authService.refreshSession.bind(authService),
    forceRefreshRole: authService.forceRefreshRole.bind(authService),
    hasRole: authService.hasRole.bind(authService),
    hasAnyRole: authService.hasAnyRole.bind(authService),
    hasPermission: authService.hasPermission.bind(authService)
  }

  return (
    <AuthContext.Provider value={contextValue}>
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
