import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

export const createClient = () => {
  console.log('🔧 Client: createClient called')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('🔧 Client: Environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    isBrowser: typeof window !== 'undefined'
  })
  
  // Return null during SSR if environment variables are missing
  if (!supabaseUrl || !supabaseKey) {
    if (typeof window === 'undefined') {
      // During SSR, return a mock client that doesn't throw
      console.log('🔧 Client: Missing env vars during SSR, returning null')
      return null as any
    }
    console.log('🔧 Client: Missing environment variables in browser')
    throw new Error('Missing Supabase environment variables')
  }
  
  // Check if we're in a browser environment before creating the client
  if (typeof window === 'undefined') {
    console.log('🔧 Client: SSR detected, returning null for cookie operations')
    return null as any
  }
  
  console.log('🔧 Client: Creating Supabase browser client')
  
  const client = createBrowserClient<Database>(supabaseUrl, supabaseKey, {
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
          const value = cookie.split('=')[1]
          console.log('🔧 Client: Found cookie:', name, 'value length:', value?.length || 0)
          return value
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
  
  console.log('🔧 Client: Supabase client created successfully')
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

// Remove the module-level client creation to avoid build-time issues
// export const supabase = createBrowserClient<Database>(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );