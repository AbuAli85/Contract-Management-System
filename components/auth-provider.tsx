"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { AuthService } from "@/lib/auth-service"
import type { User, Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  mounted: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signInWithProvider: (provider: 'github' | 'google') => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<{ success: boolean; error?: string }>
  isAuthenticated: () => boolean
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({
    user: null as User | null,
    session: null as Session | null,
    loading: true,
    mounted: false,
    error: null as string | null,
  })

  useEffect(() => {
    const authService = AuthService.getInstance()
    const unsubscribe = authService.subscribe(setState)
    
    return () => {
      unsubscribe()
    }
  }, [])

  const value: AuthContextType = {
    user: state.user,
    session: state.session,
    loading: state.loading,
    mounted: state.mounted,
    error: state.error,
    signIn: AuthService.getInstance().signIn.bind(AuthService.getInstance()),
    signInWithProvider: AuthService.getInstance().signInWithProvider.bind(AuthService.getInstance()),
    signOut: AuthService.getInstance().signOut.bind(AuthService.getInstance()),
    isAuthenticated: AuthService.getInstance().isAuthenticated.bind(AuthService.getInstance()),
    clearError: AuthService.getInstance().clearError.bind(AuthService.getInstance()),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 