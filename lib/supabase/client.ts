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
  
  return createBrowserClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        // Handle both generic and project-specific cookie names
        if (name.includes('auth-token')) {
          // Check for generic cookie names first (set by login API)
          if (name === 'sb-auth-token' || 
              name === 'sb-auth-token.0' ||
              name === 'sb-auth-token-code-verifier') {
            const cookie = document.cookie
              .split('; ')
              .find(row => row.startsWith('sb-auth-token.0='))
            if (cookie) {
              console.log('🔧 Client: Using generic auth token cookie')
              return cookie.split('=')[1]
            }
          }
          
          if (name === 'sb-auth-token.1' ||
              name === 'sb-auth-token-user') {
            const cookie = document.cookie
              .split('; ')
              .find(row => row.startsWith('sb-auth-token.1='))
            if (cookie) {
              console.log('🔧 Client: Using generic refresh token cookie')
              return cookie.split('=')[1]
            }
          }
          
          // Fallback to project-specific names
          if (name === 'sb-ekdjxzhujettocosgzql-auth-token' || 
              name === 'sb-ekdjxzhujettocosgzql-auth-token.0' ||
              name === 'sb-ekdjxzhujettocosgzql-auth-token-code-verifier') {
            const cookie = document.cookie
              .split('; ')
              .find(row => row.startsWith('sb-ekdjxzhujettocosgzql-auth-token.0='))
            if (cookie) {
              console.log('🔧 Client: Using project-specific auth token cookie')
              return cookie.split('=')[1]
            }
          }
          
          if (name === 'sb-ekdjxzhujettocosgzql-auth-token.1' ||
              name === 'sb-ekdjxzhujettocosgzql-auth-token-user') {
            const cookie = document.cookie
              .split('; ')
              .find(row => row.startsWith('sb-ekdjxzhujettocosgzql-auth-token.1='))
            if (cookie) {
              console.log('🔧 Client: Using project-specific refresh token cookie')
              return cookie.split('=')[1]
            }
          }
        }
        
        // For other cookies, return null (let Supabase handle them)
        return null
      },
      set(name: string, value: string, options: any) {
        // Set both generic and project-specific cookies for compatibility
        if (name === 'sb-auth-token' || 
            name === 'sb-auth-token.0' ||
            name === 'sb-auth-token-code-verifier') {
          document.cookie = `sb-auth-token.0=${value}; path=/; max-age=${options.maxAge || 604800}`
          document.cookie = `sb-ekdjxzhujettocosgzql-auth-token.0=${value}; path=/; max-age=${options.maxAge || 604800}`
        } else if (name === 'sb-auth-token.1' ||
                   name === 'sb-auth-token-user') {
          document.cookie = `sb-auth-token.1=${value}; path=/; max-age=${options.maxAge || 604800}`
          document.cookie = `sb-ekdjxzhujettocosgzql-auth-token.1=${value}; path=/; max-age=${options.maxAge || 604800}`
        }
      },
      remove(name: string, options: any) {
        // Remove both generic and project-specific cookies
        if (name === 'sb-auth-token' || 
            name === 'sb-auth-token.0' ||
            name === 'sb-auth-token-code-verifier') {
          document.cookie = 'sb-auth-token.0=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          document.cookie = 'sb-ekdjxzhujettocosgzql-auth-token.0=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        } else if (name === 'sb-auth-token.1' ||
                   name === 'sb-auth-token-user') {
          document.cookie = 'sb-auth-token.1=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          document.cookie = 'sb-ekdjxzhujettocosgzql-auth-token.1=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
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