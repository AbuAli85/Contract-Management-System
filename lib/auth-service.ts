// 🔄 HYBRID AUTH SERVICE - Safe during SSR, functional on client
import { useSupabase } from "@/app/providers"
import { useEffect, useState } from "react"

export function useAuth() {
  const { user, session, loading, supabase } = useSupabase()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Return safe values during SSR, real auth on client
  if (!isClient) {
    return {
      user: null,
      session: null,
      loading: false,
      mounted: false,
      signIn: () => Promise.resolve({ user: null, session: null }),
      signOut: () => Promise.resolve(),
      signUp: () => Promise.resolve({ user: null, session: null })
    }
  }

  return {
    user,
    session,
    loading,
    mounted: isClient,
    signIn: async (email: string, password: string) => {
      if (!supabase) return { user: null, session: null }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      return data
    },
    signOut: async () => {
      if (!supabase) return
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    signUp: async (email: string, password: string, metadata?: any) => {
      if (!supabase) return { user: null, session: null }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })
      if (error) throw error
      return data
    }
  }
}

export const authService = {
  signIn: async (email: string, password: string) => {
    if (typeof window === 'undefined') {
      return { user: null, session: null }
    }
    
    const { createClient } = await import('@supabase/supabase-js')
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials not configured")
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  signOut: async () => {
    if (typeof window === 'undefined') return
    
    const { createClient } = await import('@supabase/supabase-js')
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  signUp: async (email: string, password: string, metadata?: any) => {
    if (typeof window === 'undefined') {
      return { user: null, session: null }
    }
    
    const { createClient } = await import('@supabase/supabase-js')
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials not configured")
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    if (error) throw error
    return data
  },

  getCurrentUser: async () => {
    if (typeof window === 'undefined') return null
    
    const { createClient } = await import('@supabase/supabase-js')
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  getSession: async () => {
    if (typeof window === 'undefined') return null
    
    const { createClient } = await import('@supabase/supabase-js')
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  }
}
