import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

// Create a safe storage implementation with better error handling
const createSafeStorage = () => {
  // Always return a safe storage implementation
  const safeStorage = {
    getItem: (key: string) => {
      try {
        if (typeof window === 'undefined') return null
        return localStorage.getItem(key)
      } catch (error) {
        console.warn('Storage getItem failed:', error)
        return null
      }
    },
    setItem: (key: string, value: string) => {
      try {
        if (typeof window === 'undefined') return
        localStorage.setItem(key, value)
      } catch (error) {
        console.warn('Storage setItem failed:', error)
      }
    },
    removeItem: (key: string) => {
      try {
        if (typeof window === 'undefined') return
        localStorage.removeItem(key)
      } catch (error) {
        console.warn('Storage removeItem failed:', error)
      }
    },
    clear: () => {
      try {
        if (typeof window === 'undefined') return
        localStorage.clear()
      } catch (error) {
        console.warn('Storage clear failed:', error)
      }
    }
  }
  
  return safeStorage
}

// Create a mock Supabase client for SSR
const createMockClient = () => {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'SSR mode - auth not available' } }),
      signUp: async () => ({ data: null, error: { message: 'SSR mode - auth not available' } }),
      signOut: async () => ({ error: null }),
      signInWithOAuth: async () => ({ data: null, error: { message: 'SSR mode - auth not available' } }),
      updateUser: async () => ({ data: null, error: { message: 'SSR mode - auth not available' } })
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
      delete: () => ({ eq: async () => ({ data: null, error: null }) })
    })
  } as any
}

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Return mock client during SSR
  if (typeof window === 'undefined') {
    return createMockClient()
  }
  
  // Return mock client if environment variables are missing
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase environment variables - using mock client')
    return createMockClient()
  }
  
  try {
    // Create a client with safe storage configuration
    const client = createBrowserClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: createSafeStorage(),
        storageKey: 'sb-auth-token'
      }
    })
    
    return client
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    return createMockClient()
  }
}

// Safe client for SSR - returns mock client if environment variables are missing
export const createSafeClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return createMockClient()
  }
  
  try {
    return createBrowserClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        storage: createSafeStorage(),
        storageKey: 'sb-auth-token'
      }
    })
  } catch (error) {
    console.error('Error creating safe Supabase client:', error)
    return createMockClient()
  }
}