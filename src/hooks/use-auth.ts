import { useEffect, useState } from 'react'

// DISABLED: This hook conflicts with the AuthProvider and causes redirect loops
// Use the useAuth hook from src/components/auth/auth-provider.tsx instead
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // DISABLED: This creates duplicate auth listeners
    // Check active sessions and sets the user
    // supabase.auth.getSession().then(({ data: { session } }) => {
    //   setUser(session?.user ?? null)
    //   setLoading(false)
    // })

    // Listen for changes on auth state (logged in, signed out, etc.)
    // const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    //   setUser(session?.user ?? null)
    //   setLoading(false)
    // })

    // return () => subscription.unsubscribe()
    
    // Return empty state to prevent conflicts
    setLoading(false)
  }, [])

  return {
    user,
    loading,
    signIn: async (email: string, password: string) => {
      throw new Error('This useAuth hook is disabled. Use the one from auth-provider instead.')
    },
    signUp: async (email: string, password: string) => {
      throw new Error('This useAuth hook is disabled. Use the one from auth-provider instead.')
    },
    signOut: async () => {
      throw new Error('This useAuth hook is disabled. Use the one from auth-provider instead.')
    },
    resetPassword: async (email: string) => {
      throw new Error('This useAuth hook is disabled. Use the one from auth-provider instead.')
    }
  }
}
