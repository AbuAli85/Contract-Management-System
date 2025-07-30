"use client"

import type React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, useEffect, createContext, useContext } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { AuthProvider } from "@/components/auth-provider"
import { RBACProvider } from "@/src/components/auth/rbac-provider"
import { ThemeProvider } from "@/components/theme-provider"
import type { Session, User } from "@supabase/supabase-js"

const isDev = process.env.NODE_ENV === "development"
const refetchOnFocus = process.env.NODE_ENV === "production"

// Auth context
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  supabase: ReturnType<typeof createBrowserClient> | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function AuthContextProvider({ children, initialSession }: { children: React.ReactNode; initialSession?: Session | null }) {
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [session, setSession] = useState<Session | null>(initialSession ?? null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<ReturnType<typeof createBrowserClient> | null>(null)

  useEffect(() => {
    // Create Supabase client with error handling
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Missing Supabase environment variables")
        setLoading(false)
        return
      }

      const client = createBrowserClient(supabaseUrl, supabaseAnonKey)
      setSupabase(client as ReturnType<typeof createBrowserClient>)

      // Get initial session
      const getInitialSession = async () => {
        try {
          const { data: { session } } = await client.auth.getSession()
          setSession(session)
          setUser(session?.user ?? null)
        } catch (error) {
          console.error("Error getting initial session:", error)
        } finally {
          setLoading(false)
        }
      }

      getInitialSession()

      // Listen for auth changes
      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      )

      return () => subscription.unsubscribe()
    } catch (error) {
      console.error("Error creating Supabase client:", error)
      setLoading(false)
    }
  }, [])

  const value = {
    user,
    session,
    loading,
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
  initialSession?: Session | null
}

function ProvidersContent({ children, initialSession }: ProvidersContentProps) {
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

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider initialSession={initialSession}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <RBACProvider>{children}</RBACProvider>
          </AuthProvider>
        </ThemeProvider>
      </AuthContextProvider>
      {/* {isDev && <ReactQueryDevtools initialIsOpen={false} />} */}
    </QueryClientProvider>
  )
}

interface ProvidersProps {
  children: React.ReactNode
  initialSession?: Session | null
}

export function Providers({ children, initialSession }: ProvidersProps) {
  return <ProvidersContent initialSession={initialSession}>{children}</ProvidersContent>
}
