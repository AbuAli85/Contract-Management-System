"use client"

import React, { createContext, useContext, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"
import { createClient } from "@/lib/supabase/client"

// Simple Auth Context
interface AuthContextType {
  user: any
  session: any
  loading: boolean
  supabase: any
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: false,
  supabase: null
})

export function useAuth() {
  return useContext(AuthContext)
}

export function useSupabase() {
  const { user, session, loading, supabase } = useContext(AuthContext)
  return { user, session, loading, supabase }
}

// Simple Auth Provider
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)

  // Initialize Supabase on client side only
  React.useEffect(() => {
    const initSupabase = async () => {
      try {
        const client = createClient()
        setSupabase(client)
        
        // Get initial session
        const { data: { session } } = await client.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        
        // Listen for auth changes
        const { data: { subscription } } = client.auth.onAuthStateChange(
          async (event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
          }
        )
        
        return () => subscription.unsubscribe()
      } catch (error) {
        console.error("Error initializing Supabase:", error)
      }
    }

    initSupabase()
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading, supabase }}>
      {children}
    </AuthContext.Provider>
  )
}

// RBAC Context
interface RBACContextType {
  userRole: string | null
  permissions: string[]
}

const RBACContext = createContext<RBACContextType>({
  userRole: null,
  permissions: []
})

export function useRBAC() {
  return useContext(RBACContext)
}

export function usePermissions() {
  return useContext(RBACContext).permissions
}

// RBAC Provider
function RBACProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])

  React.useEffect(() => {
    if (user) {
      const role = user.user_metadata?.role || 'user'
      setUserRole(role)
      
      const rolePermissions = {
        admin: ['read', 'write', 'delete', 'manage_users', 'manage_contracts'],
        manager: ['read', 'write', 'manage_contracts'],
        user: ['read', 'write']
      }
      setPermissions(rolePermissions[role as keyof typeof rolePermissions] || ['read'])
    } else {
      setUserRole(null)
      setPermissions([])
    }
  }, [user])

  return (
    <RBACContext.Provider value={{ userRole, permissions }}>
      {children}
    </RBACContext.Provider>
  )
}

// Main Providers Component
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <RBACProvider>
            {children}
          </RBACProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
