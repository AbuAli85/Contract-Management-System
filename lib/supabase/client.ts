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
  
  const client = createBrowserClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') {
          return null
        }
        
        const cookie = document.cookie
          .split('; ')
          .find(row => row.startsWith(name + '='))
        
        return cookie ? cookie.split('=')[1] : null
      },
      set(name: string, value: string, options: any) {
        if (typeof document === 'undefined') {
          return
        }
        
        let cookieString = `${name}=${value}; path=/`
        
        // Add secure and sameSite for production
        const isProduction = window.location.hostname !== 'localhost'
        if (isProduction) {
          cookieString += '; secure; samesite=lax'
          
          // For custom domains, we might need to set the domain
          const hostname = window.location.hostname
          if (hostname === 'portal.thesmartpro.io') {
            cookieString += '; domain=.thesmartpro.io'
          }
        }
        
        // Add other options if provided
        if (options.maxAge) {
          cookieString += `; max-age=${options.maxAge}`
        }
        
        if (options.domain && !isProduction) {
          cookieString += `; domain=${options.domain}`
        }
        
        document.cookie = cookieString
      },
      remove(name: string, options: any) {
        if (typeof document === 'undefined') {
          return
        }
        
        const isProduction = window.location.hostname !== 'localhost'
        let cookieString = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        
        if (isProduction) {
          cookieString += '; secure; samesite=lax'
          
          // For custom domains, we might need to set the domain
          const hostname = window.location.hostname
          if (hostname === 'portal.thesmartpro.io') {
            cookieString += '; domain=.thesmartpro.io'
          }
        }
        
        if (options.domain && !isProduction) {
          cookieString += `; domain=${options.domain}`
        }
        
        document.cookie = cookieString
      }
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