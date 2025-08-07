"use client"

import type React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, useEffect, createContext, useContext } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { ThemeProvider } from "@/components/theme-provider"
import { FormContextProvider } from "@/hooks/use-form-context"
import type { Session, User } from "@supabase/supabase-js"

const isDev = process.env.NODE_ENV === "development"
const refetchOnFocus = process.env.NODE_ENV === "production"

// Safe AuthContext that prevents infinite loops during build
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isProfileSynced: boolean
  supabase: ReturnType<typeof createBrowserClient> | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function SafeAuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isProfileSynced, setIsProfileSynced] = useState(true) // Default to true to prevent infinite loading
  const [supabase, setSupabase] = useState<ReturnType<typeof createBrowserClient> | null>(null)

  useEffect(() => {
    // Skip initialization during SSR/build time
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    console.log("🔐 SafeAuthContextProvider: Initializing with circuit breakers...")
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("🔐 SafeAuthContextProvider: Missing environment variables, using fallback")
        setLoading(false)
        setIsProfileSynced(true)
        return
      }

      const client = createBrowserClient(supabaseUrl, supabaseAnonKey)
      setSupabase(client)

      // Simple session check without complex auth service
      client.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error("🔐 SafeAuthContextProvider: Session error:", error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
        setLoading(false)
        setIsProfileSynced(true) // Always set to true to prevent loops
      })

      // Listen for auth state changes
      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (event, session) => {
          console.log("🔐 SafeAuthContextProvider: Auth state change:", event)
          setSession(session)
          setUser(session?.user ?? null)
          setIsProfileSynced(true) // Always set to true
        }
      )

      return () => {
        console.log("🔐 SafeAuthContextProvider: Cleaning up...")
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error("❌ SafeAuthContextProvider: Error:", error)
      setLoading(false)
      setIsProfileSynced(true)
    }
  }, [])

  const value = {
    user,
    session,
    loading,
    isProfileSynced,
    supabase,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useSupabase() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useSupabase must be used within AuthContextProvider")
  }
  return context
}

// Safe RBAC Provider that doesn't cause loops
const RBACContext = createContext<any>({
  permissions: {},
  roles: [],
  hasPermission: () => false,
  hasRole: () => false,
})

function SafeRBACProvider({ children }: { children: React.ReactNode }) {
  const value = {
    permissions: {},
    roles: [],
    hasPermission: () => false,
    hasRole: () => false,
  }

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>
}

export function useRBAC() {
  const context = useContext(RBACContext)
  if (context === undefined) {
    throw new Error("useRBAC must be used within an RBACProvider")
  }
  return context
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: refetchOnFocus,
            retry: (failureCount, error) => {
              if (failureCount >= 3) return false
              if ((error as any)?.status === 404) return false
              return true
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <SafeRBACProvider>
          <SafeAuthContextProvider>
            <FormContextProvider>
              {children}
            </FormContextProvider>
          </SafeAuthContextProvider>
        </SafeRBACProvider>
      </ThemeProvider>
      {/* Disabled for performance */}
      {/* {isDev && <ReactQueryDevtools initialIsOpen={false} />} */}
    </QueryClientProvider>
  )
}
