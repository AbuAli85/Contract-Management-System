import 'server-only'
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        async get(name: string) {
          console.log('🔧 Server: Supabase requesting cookie:', name)
          
          // Simple cookie lookup
          const cookie = await cookieStore.get(name)
          if (cookie?.value) {
            console.log('🔧 Server: Found cookie:', name)
            return cookie.value
          }
          
          console.log('🔧 Server: No cookie found for:', name)
          return null
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            console.log('🔧 Server: Setting cookie:', name, 'with value length:', value.length)
            
            // Set cookie with proper options
            await cookieStore.set({ name, value, ...options })
            console.log('🔧 Server: Cookie set successfully:', name)
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            console.log('🔧 Server: Removing cookie:', name)
            
            // Remove cookie by setting it to empty value
            await cookieStore.set({ name, value: '', ...options })
            console.log('🔧 Server: Cookie removed successfully:', name)
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Enhanced client with refresh token logic
export async function createClientWithRefresh() {
  const client = await createClient()
  
  // Add refresh token functionality
  const enhancedClient = {
    ...client,
    auth: {
      ...client.auth,
      // Enhanced refresh session with retry logic
      async refreshSession() {
        try {
          console.log('🔄 Server: Attempting to refresh session...')
          
          const { data, error } = await client.auth.refreshSession()
          
          if (error) {
            console.error('🔄 Server: Session refresh failed:', error)
            throw error
          }
          
          if (data.session) {
            console.log('🔄 Server: Session refreshed successfully')
            return { data, error: null }
          } else {
            console.log('🔄 Server: No session to refresh')
            return { data: { session: null, user: null }, error: null }
          }
        } catch (error) {
          console.error('🔄 Server: Session refresh error:', error)
          return { data: { session: null, user: null }, error }
        }
      },
      
      // Check if session is expired
      async isSessionExpired() {
        try {
          const { data: { session } } = await client.auth.getSession()
          
          if (!session) {
            return true
          }
          
          // Check if token expires in the next 5 minutes
          const expiresAt = session.expires_at
          if (!expiresAt) {
            return true
          }
          
          const now = Math.floor(Date.now() / 1000)
          const fiveMinutesFromNow = now + (5 * 60)
          
          return expiresAt < fiveMinutesFromNow
        } catch (error) {
          console.error('🔄 Server: Error checking session expiry:', error)
          return true
        }
      },
      
      // Auto-refresh session if needed
      async ensureValidSession() {
        try {
          const isExpired = await enhancedClient.auth.isSessionExpired()
          
          if (isExpired) {
            console.log('🔄 Server: Session expired, attempting refresh...')
            return await enhancedClient.auth.refreshSession()
          }
          
          // Session is still valid
          const { data: { session } } = await client.auth.getSession()
          return { data: { session, user: session?.user || null }, error: null }
        } catch (error) {
          console.error('🔄 Server: Error ensuring valid session:', error)
          return { data: { session: null, user: null }, error }
        }
      }
    }
  }
  
  return enhancedClient
}

// Helper function to refresh token with retry logic
export async function refreshTokenWithRetry(
  client: any,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<{ success: boolean; error?: any }> {
  let lastError: any = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Server: Token refresh attempt ${attempt}/${maxRetries}`)
      
      const { data, error } = await client.auth.refreshSession()
      
      if (error) {
        lastError = error
        console.error(`🔄 Server: Token refresh attempt ${attempt} failed:`, error)
        
        if (attempt < maxRetries) {
          console.log(`🔄 Server: Waiting ${delayMs}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          delayMs *= 2 // Exponential backoff
        }
        continue
      }
      
      if (data.session) {
        console.log('🔄 Server: Token refresh successful')
        return { success: true }
      } else {
        console.log('🔄 Server: No session to refresh')
        return { success: false, error: 'No session found' }
      }
    } catch (error) {
      lastError = error
      console.error(`🔄 Server: Token refresh attempt ${attempt} threw error:`, error)
      
      if (attempt < maxRetries) {
        console.log(`🔄 Server: Waiting ${delayMs}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
        delayMs *= 2 // Exponential backoff
      }
    }
  }
  
  console.error('🔄 Server: All token refresh attempts failed')
  return { success: false, error: lastError }
}

// Helper function to get a valid session with automatic refresh
export async function getValidSession(): Promise<{ session: any; user: any; error?: any }> {
  try {
    const client = await createClientWithRefresh()
    const { data, error } = await client.auth.ensureValidSession()
    
    return {
      session: data.session,
      user: data.user,
      error: error || null
    }
  } catch (error) {
    console.error('🔄 Server: Error getting valid session:', error)
    return {
      session: null,
      user: null,
      error
    }
  }
}

// Helper function to check if user is authenticated with valid session
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { session, error } = await getValidSession()
    return !error && !!session
  } catch (error) {
    console.error('🔄 Server: Error checking authentication:', error)
    return false
  }
}