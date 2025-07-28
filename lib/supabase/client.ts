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
        
        // Handle auth token cookies
        if (name.includes('auth-token')) {
          // Check for the exact cookie name Supabase is requesting
          const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith(name + '='))
          
          if (cookie) {
            console.log('🔧 Client: Found exact cookie match:', name)
            return cookie.split('=')[1]
          }
          
          // Fallback: if Supabase is looking for -user cookies, try without -user
          if (name.includes('-user')) {
            const fallbackName = name.replace('-user', '')
            const fallbackCookie = document.cookie
              .split('; ')
              .find(row => row.startsWith(fallbackName + '='))
            
            if (fallbackCookie) {
              console.log('🔧 Client: Using fallback cookie:', fallbackName)
              return fallbackCookie.split('=')[1]
            }
          }
          
          // Fallback: if Supabase is looking for cookies without -user, try with -user
          if (!name.includes('-user') && name.includes('auth-token')) {
            const fallbackName = name.replace('auth-token', 'auth-token-user')
            const fallbackCookie = document.cookie
              .split('; ')
              .find(row => row.startsWith(fallbackName + '='))
            
            if (fallbackCookie) {
              console.log('🔧 Client: Using fallback cookie with -user:', fallbackName)
              return fallbackCookie.split('=')[1]
            }
          }
          
          console.log('🔧 Client: No matching cookie found for:', name)
        }
        
        // For other cookies, return null (let Supabase handle them)
        return null
      },
      set(name: string, value: string, options: any) {
        // Ensure we're in a browser environment
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          console.log('🔧 Client: Not in browser environment, skipping cookie set')
          return
        }
        
        console.log('🔧 Client: Setting cookie:', name, 'with value length:', value.length)
        
        // Set the exact cookie name that Supabase expects
        document.cookie = `${name}=${value}; path=/; max-age=${options.maxAge || 604800}; ${options.secure ? 'secure; ' : ''}${options.sameSite ? `sameSite=${options.sameSite}; ` : ''}`
        
        // Also set fallback cookies for compatibility
        if (name.includes('auth-token')) {
          if (name.includes('-user')) {
            // If setting -user cookie, also set without -user
            const fallbackName = name.replace('-user', '')
            document.cookie = `${fallbackName}=${value}; path=/; max-age=${options.maxAge || 604800}; ${options.secure ? 'secure; ' : ''}${options.sameSite ? `sameSite=${options.sameSite}; ` : ''}`
          } else {
            // If setting without -user, also set with -user
            const fallbackName = name.replace('auth-token', 'auth-token-user')
            document.cookie = `${fallbackName}=${value}; path=/; max-age=${options.maxAge || 604800}; ${options.secure ? 'secure; ' : ''}${options.sameSite ? `sameSite=${options.sameSite}; ` : ''}`
          }
        }
      },
      remove(name: string, options: any) {
        // Ensure we're in a browser environment
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          console.log('🔧 Client: Not in browser environment, skipping cookie remove')
          return
        }
        
        console.log('🔧 Client: Removing cookie:', name)
        
        // Remove the exact cookie name
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        
        // Also remove fallback cookies
        if (name.includes('auth-token')) {
          if (name.includes('-user')) {
            // If removing -user cookie, also remove without -user
            const fallbackName = name.replace('-user', '')
            document.cookie = `${fallbackName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
          } else {
            // If removing without -user, also remove with -user
            const fallbackName = name.replace('auth-token', 'auth-token-user')
            document.cookie = `${fallbackName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
          }
        }
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