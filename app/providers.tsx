"use client"

import type React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, createContext, useContext, useEffect } from "react"

// Simple AuthProvider to bypass import issues
const AuthContext = createContext<any>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setLoading(false)
  }, [])

  const value = {
    user,
    loading,
    mounted,
    setUser,
    signIn: async (email: string, password: string) => {
      // This is a placeholder - the actual sign in is handled by the server API
      return { success: true }
    },
    signInWithProvider: async (provider: string) => {
      // This is a placeholder - the actual OAuth sign in is handled by the server API
      return { error: null }
    },
    signOut: async () => {
      setUser(null)
      return { success: true }
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

const isDev = process.env.NODE_ENV === "development"
const refetchOnFocus = process.env.NODE_ENV === "production"

function ProvidersContent({ children }: { children: React.ReactNode }) {
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
      <SimpleAuthProvider>
        {children}
      </SimpleAuthProvider>
      {/* {isDev && <ReactQueryDevtools initialIsOpen={false} />} */}
    </QueryClientProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return <ProvidersContent>{children}</ProvidersContent>
}
