import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Return null during SSR if environment variables are missing
  if (!supabaseUrl || !supabaseKey) {
    if (typeof window === 'undefined') {
      // During SSR, return a mock client that doesn't throw
      return null as any
    }
    throw new Error('Missing Supabase environment variables')
  }
  
  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
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

// Remove the module-level client creation to avoid build-time issues
// export const supabase = createBrowserClient<Database>(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );