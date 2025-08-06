"use client"

import type React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, useEffect, createContext, useContext } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { AuthProvider } from "@/components/auth-provider"
import { RBACProvider } from "@/src/components/auth/rbac-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { FormContextProvider } from "@/hooks/use-form-context"
import { Toaster } from "@/components/ui/toaster"
import type { Session, User } from "@supabase/supabase-js"

// 🔥 TEMPORARY TEST - Import global icons (DISABLED FOR DEBUGGING)
// import "@/lib/global-icons"

const isDev = process.env.NODE_ENV === "development"
const refetchOnFocus = process.env.NODE_ENV === "production"

import { AuthService } from "@/lib/auth-service"

// ...existing code...
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isProfileSynced: boolean
  supabase: ReturnType<typeof createBrowserClient> | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isProfileSynced, setIsProfileSynced] = useState(false)
  const [supabase, setSupabase] = useState<ReturnType<typeof createBrowserClient> | null>(null)

  useEffect(() => {
    console.log("🔐 AuthContextProvider: Initializing...")
    
    // Create Supabase client with error handling
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      console.log("🔐 AuthContextProvider: Environment variables:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        url: supabaseUrl?.substring(0, 20) + "..."
      })

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("❌ AuthContextProvider: Missing Supabase environment variables")
        setLoading(false)
        return
      }

      console.log("🔐 AuthContextProvider: Creating Supabase client...")
      const client = createBrowserClient(supabaseUrl, supabaseAnonKey)
      setSupabase(client as ReturnType<typeof createBrowserClient>)
      console.log("✅ AuthContextProvider: Supabase client created successfully")

      // Initialize the AuthService singleton
      const authService = AuthService.getInstance()
      authService.initialize(client)

      // Subscribe to the AuthService for all state updates
      const unsubscribe = authService.subscribe(state => {
        setUser(state.user)
        setSession(state.session)
        setLoading(state.loading)
        setIsProfileSynced(state.isProfileSynced)
      })

      return () => {
        console.log("🔐 AuthContextProvider: Cleaning up auth listener...")
        unsubscribe()
      }
    } catch (error) {
      console.error("❌ AuthContextProvider: Error creating Supabase client:", error)
      setLoading(false)
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
  if (!context) {
    throw new Error("useSupabase must be used within AuthContextProvider")
  }
  return context
}

interface ProvidersContentProps {
  children: React.ReactNode
}

function ProvidersContent({ children }: ProvidersContentProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: refetchOnFocus, // Only in prod
          },
        },
      }),
  )

  // Ensure proper initialization order
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Small delay to ensure all providers are properly initialized
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing application...</p>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <FormContextProvider>
            <AuthProvider>
              <RBACProvider>{children}</RBACProvider>
            </AuthProvider>
          </FormContextProvider>
        </ThemeProvider>
      </AuthContextProvider>
      <Toaster />
      {/* {isDev && <ReactQueryDevtools initialIsOpen={false} />} */}
    </QueryClientProvider>
  )
}

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return <ProvidersContent>{children}</ProvidersContent>
}
