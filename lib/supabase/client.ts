import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Return null during SSR if environment variables are missing
  if (!supabaseUrl || !supabaseKey) {
    if (typeof window === 'undefined') {
      return null as any
    }
    throw new Error('Missing Supabase environment variables')
  }
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return null as any
  }
  
  // Create a simpler client without complex cookie handling
  const client = createBrowserClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
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
  
  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}