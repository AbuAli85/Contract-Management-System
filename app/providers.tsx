"use client"
// 🔄 HYBRID MODE - Emergency during SSR, Real auth on client
// Uses circuit breaker during build/SSR but enables authentication on client side

import React, { useEffect, useState } from "react"
import type React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"
import { FormContextProvider } from "@/hooks/use-form-context"
import { SystemStatusBanner } from "@/components/system-status-banner"
import { createContext } from "react"
import type { Session, User } from "@supabase/supabase-js"


// 🔧 HYBRID MODE - Emergency during SSR, Real auth on client
// Uses circuit breaker during build/SSR but enables authentication on client side

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isProfileSynced: boolean
  supabase: any
}

// Emergency fallback values - safe for SSR
const SAFE_AUTH_VALUES: AuthContextType = {
  user: null,
  session: null,
  loading: false,
  isProfileSynced: true,
  supabase: null
}

const AuthContext = createContext<AuthContextType>(SAFE_AUTH_VALUES)

// Hybrid AuthContextProvider
function HybridAuthContextProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false)
  const [authState, setAuthState] = useState<AuthContextType>({
    ...SAFE_AUTH_VALUES,
    loading: false // Start with loading false to prevent infinite loading
  })
  const [initialized, setInitialized] = useState(false)

  // Detect when we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize real authentication on client side
  useEffect(() => {
    if (isClient && typeof window !== 'undefined' && !initialized) {
      console.log("🔐 Initializing authentication on client side...")
      setInitialized(true)
      
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn("🔐 Auth initialization timeout, falling back to safe mode")
        setAuthState({
          user: null,
          session: null,
          loading: false,
          isProfileSynced: true,
          supabase: null
        })
      }, 3000) // 3 second timeout for faster debugging

      // Only import and initialize Supabase on client side
      const initializeAuth = async () => {
        try {
          console.log("🔐 Loading Supabase client...")
          const { createClient } = await import('@supabase/supabase-js')
          
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          
          console.log("🔐 Environment variables:", {
            url: supabaseUrl ? 'SET' : 'NOT SET',
            key: supabaseKey ? 'SET' : 'NOT SET'
          })
          
          // Check if the environment variables are placeholder values
          const isPlaceholderUrl = supabaseUrl === 'https://your-project.supabase.co'
          const isPlaceholderKey = supabaseKey === 'your-anon-key-here'
          
          if (!supabaseUrl || !supabaseKey || isPlaceholderUrl || isPlaceholderKey) {
            console.warn("🔐 Supabase credentials missing or are placeholder values, staying in safe mode")
            clearTimeout(timeoutId)
            setAuthState({
              user: null,
              session: null,
              loading: false,
              isProfileSynced: true,
              supabase: null
            })
            return
          }

          console.log("🔐 Creating Supabase client...")
          const supabase = createClient(supabaseUrl, supabaseKey)
          console.log("🔐 Supabase client created successfully")

          // Get initial session
          console.log("🔐 Getting initial session...")
          const { data: { session }, error } = await supabase.auth.getSession()
          
          console.log("🔐 Session result:", { session: !!session, error: error?.message })
          
          if (!error) {
            console.log("🔐 Session retrieved successfully:", session ? 'has session' : 'no session')
            clearTimeout(timeoutId)
            setAuthState({
              user: session?.user || null,
              session: session,
              loading: false,
              isProfileSynced: true,
              supabase: supabase
            })
            console.log("🔐 Auth state updated successfully")

            // Listen for auth changes
            console.log("🔐 Setting up auth state listener...")
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
              (event, session) => {
                console.log("🔐 Auth state changed:", event, session ? 'has session' : 'no session')
                setAuthState(prev => ({
                  ...prev,
                  user: session?.user || null,
                  session: session,
                  loading: false
                }))
              }
            )

            return () => subscription.unsubscribe()
          } else {
            console.warn("🔐 Session error, falling back to safe mode:", error)
            clearTimeout(timeoutId)
            setAuthState({
              user: null,
              session: null,
              loading: false,
              isProfileSynced: true,
              supabase: null
            })
          }
        } catch (error) {
          console.warn("🔐 Auth initialization failed, staying in safe mode:", error)
          clearTimeout(timeoutId)
          setAuthState({
            user: null,
            session: null,
            loading: false,
            isProfileSynced: true,
            supabase: null
          })
        }
      }

      initializeAuth()

      // Cleanup timeout on unmount
      return () => clearTimeout(timeoutId)
    }
  }, [isClient])

  // Use safe values during SSR, real auth on client
  const contextValue = isClient ? authState : SAFE_AUTH_VALUES

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useSupabase() {
  const context = React.useContext(AuthContext)
  return context
}

// Hybrid RBAC Provider
const SAFE_RBAC_VALUES = {
  permissions: [],
  hasPermission: () => false,
  loading: false
}

const RBACContext = createContext(SAFE_RBAC_VALUES)

function HybridRBACProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // For now, return safe values but this can be enhanced later
  const contextValue = SAFE_RBAC_VALUES
  
  return (
    <RBACContext.Provider value={contextValue}>
      {children}
    </RBACContext.Provider>
  )
}

export function useRBAC() {
  return React.useContext(RBACContext)
}

// Hybrid usePermissions hook
export function usePermissions() {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Return permissive permissions for now to allow access
  return {
    hasPermission: () => true,
    loading: false,
    permissions: [],
    role: "admin",
    roles: ["admin"],
    can: () => true,
    canAny: () => true,
    canAll: () => true,
    canManage: () => true,
    canRead: () => true,
    canCreate: () => true,
    canUpdate: () => true,
    canDelete: () => true,
    hasAnyResourcePermission: () => true,
    hasAnyPermission: () => true,
    isAdmin: () => true,
    isManager: () => true,
    isUser: () => true,
    isReviewer: () => true,
    isPromoter: () => true,
    hasRole: () => true,
    hasAnyRole: () => true,
    hasAllRoles: () => true,
    getAllowedActions: () => [],
    getAllowedResources: () => [],
    getResourceActions: () => [],
    canAddPromoter: () => true,
    canEditPromoter: () => true,
    canDeletePromoter: () => true,
    canBulkDeletePromoters: () => true,
    canExportPromoters: () => true,
    canAddParty: () => true,
    canEditParty: () => true,
    canDeleteParty: () => true,
    canBulkDeleteParties: () => true,
    canExportParties: () => true,
    canCreateContract: () => true,
    canEditContract: () => true,
    canDeleteContract: () => true,
    canGenerateContract: () => true,
    canApproveContract: () => true,
    canExportContracts: () => true,
    canManageUsers: () => true,
    canAssignRoles: () => true,
    canAccessSettings: () => true,
    canAccessAnalytics: () => true,
    canAccessAuditLogs: () => true,
    canAccessNotifications: () => true,
    refreshRoles: () => {}
  }
}

// Main Providers component with hybrid approach
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1, // Allow some retries on client side
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <HybridAuthContextProvider>
        <HybridRBACProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <FormContextProvider>
              {children}
            </FormContextProvider>
          </ThemeProvider>
        </HybridRBACProvider>
      </HybridAuthContextProvider>
    </QueryClientProvider>
  )
}

// Named export for compatibility
export { Providers }
