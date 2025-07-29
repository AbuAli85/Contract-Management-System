import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

// Create a safe storage implementation
const createSafeStorage = () => {
  if (typeof window === 'undefined') {
    // Return a mock storage for SSR
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    }
  }
  
  try {
    // Try to use localStorage
    return localStorage
  } catch (error) {
    // Fallback to sessionStorage if localStorage is not available
    try {
      return sessionStorage
    } catch (fallbackError) {
      // Return a mock storage if neither is available
      console.warn('No storage available, using mock storage')
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
      }
    }
  }
}

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Return a mock client during SSR if environment variables are missing
  if (!supabaseUrl || !supabaseKey) {
    if (typeof window === 'undefined') {
      // Return a mock client for SSR
      return {
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signInWithPassword: async () => ({ data: null, error: { message: 'Environment variables not configured' } }),
          signUp: async () => ({ data: null, error: { message: 'Environment variables not configured' } }),
          signOut: async () => ({ error: null }),
          signInWithOAuth: async () => ({ data: null, error: { message: 'Environment variables not configured' } })
        }
      } as any
    }
    console.warn('Missing Supabase environment variables - using mock client')
    return null as any
  }
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return null as any
  }
  
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
}

// Safe client for SSR - returns null if environment variables are missing
export const createSafeClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return null
  }
  
  return createBrowserClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      storage: createSafeStorage(),
      storageKey: 'sb-auth-token'
    }
  })
}