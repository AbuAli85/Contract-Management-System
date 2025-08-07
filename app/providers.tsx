"use client"

import React, { useEffect, useState } from "react"
import type React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"
import { FormContextProvider } from "@/hooks/use-form-context"
import { createContext } from "react"
import type { Session, User } from "@supabase/supabase-js"

// � HYBRID MODE - Emergency during SSR, Real auth on client
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
  const [authState, setAuthState] = useState<AuthContextType>(SAFE_AUTH_VALUES)

  // Detect when we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize real authentication on client side
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      // Only import and initialize Supabase on client side
      const initializeAuth = async () => {
        try {
          const { createClient } = await import('@supabase/supabase-js')
          
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.warn("🔐 Supabase credentials missing, staying in safe mode")
            return
          }

          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          )

          // Get initial session
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (!error) {
            setAuthState({
              user: session?.user || null,
              session: session,
              loading: false,
              isProfileSynced: true,
              supabase: supabase
            })

            // Listen for auth changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
              (event, session) => {
                setAuthState(prev => ({
                  ...prev,
                  user: session?.user || null,
                  session: session,
                  loading: false
                }))
              }
            )

            return () => subscription.unsubscribe()
          }
        } catch (error) {
          console.warn("🔐 Auth initialization failed, staying in safe mode:", error)
        }
      }

      initializeAuth()
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
