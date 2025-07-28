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
  
  // Check if we're in a browser environment before creating the client
  if (typeof window === 'undefined') {
    console.log('🔧 Client: SSR detected, returning null for cookie operations')
    return null as any
  }
  
  return createBrowserClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        console.log('🔧 Client: Supabase requesting cookie:', name)
        
        // Ensure we're in a browser environment
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          console.log('🔧 Client: Not in browser environment, returning null')
          return null
        }
        
        // Simple cookie lookup
        const cookie = document.cookie
          .split('; ')
          .find(row => row.startsWith(name + '='))
        
        if (cookie) {
          console.log('🔧 Client: Found cookie:', name)
          return cookie.split('=')[1]
        }
        
        console.log('🔧 Client: No cookie found for:', name)
        return null
      },
      set(name: string, value: string, options: any) {
        // Ensure we're in a browser environment
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          console.log('🔧 Client: Not in browser environment, skipping cookie set')
          return
        }
        
        console.log('🔧 Client: Setting cookie:', name, 'with value length:', value.length)
        
        // Set cookie with proper options
        let cookieString = `${name}=${value}; path=/`
        
        if (options.maxAge) {
          cookieString += `; max-age=${options.maxAge}`
        }
        
        if (options.secure) {
          cookieString += '; secure'
        }
        
        if (options.sameSite) {
          cookieString += `; samesite=${options.sameSite}`
        }
        
        if (options.httpOnly) {
          cookieString += '; httpOnly'
        }
        
        document.cookie = cookieString
        console.log('🔧 Client: Cookie set successfully:', name)
      },
      remove(name: string, options: any) {
        // Ensure we're in a browser environment
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          console.log('🔧 Client: Not in browser environment, skipping cookie remove')
          return
        }
        
        console.log('🔧 Client: Removing cookie:', name)
        
        // Remove cookie by setting it to expire in the past
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        console.log('🔧 Client: Cookie removed successfully:', name)
      }
    }
  })
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