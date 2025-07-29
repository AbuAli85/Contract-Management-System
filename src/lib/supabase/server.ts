import { Database } from '@/types/supabase'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await cookieStore.get(name)
          return cookie?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          await cookieStore.set({ name, value, ...options })
        },
        async remove(name: string, options: CookieOptions) {
          await cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Enhanced client with refresh token support
export const createClientWithRefresh = async () => {
  const supabase = await createClient()
  
  // Add refresh token functionality
  const enhancedClient = {
    ...supabase,
    auth: {
      ...supabase.auth,
      refreshSession: async (refreshToken?: string) => {
        try {
          if (refreshToken) {
            return await supabase.auth.refreshSession({ refresh_token: refreshToken })
          }
          return await supabase.auth.refreshSession()
        } catch (error) {
          console.error('Session refresh failed:', error)
          throw error
        }
      },
      getValidSession: async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error || !session) {
            return { session: null, error }
          }
          
          // Check if session is expired
          if (isSessionExpired(session)) {
            console.log('Session expired, attempting refresh...')
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) {
              return { session: null, error: refreshError }
            }
            return { session: refreshData.session, error: null }
          }
          
          return { session, error: null }
        } catch (error) {
          console.error('Error getting valid session:', error)
          return { session: null, error }
        }
      }
    }
  }
  
  return enhancedClient
}

// Helper function to check if session is expired
export const isSessionExpired = (session: any): boolean => {
  if (!session?.expires_at) return true
  
  const expiresAt = new Date(session.expires_at).getTime()
  const now = Date.now()
  const buffer = 5 * 60 * 1000 // 5 minutes buffer
  
  return now >= (expiresAt - buffer)
}

// Refresh session with retry logic
export const refreshSession = async (refreshToken: string, maxRetries = 3) => {
  const supabase = await createClient()
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempting session refresh (attempt ${attempt}/${maxRetries})`)
      
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      })

      if (error) {
        console.error(`🔄 Session refresh attempt ${attempt} failed:`, error)
        if (attempt === maxRetries) {
          return { data: { session: null }, error }
        }
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        continue
      }

      console.log('🔄 Session refreshed successfully')
      return { data, error: null }
    } catch (error) {
      console.error(`🔄 Session refresh attempt ${attempt} threw error:`, error)
      if (attempt === maxRetries) {
        return { data: { session: null }, error }
      }
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  return { data: { session: null }, error: new Error('Max retries exceeded') }
}

// Ensure valid session with automatic refresh
export const ensureValidSession = async () => {
  const supabase = await createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      return { session: null, error }
    }
    
    if (!session) {
      return { session: null, error: null }
    }
    
    // Check if session needs refresh
    if (isSessionExpired(session)) {
      console.log('Session expired, attempting refresh...')
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('Session refresh failed:', refreshError)
        return { session: null, error: refreshError }
      }
      
      return { session: refreshData.session, error: null }
    }
    
    return { session, error: null }
  } catch (error) {
    console.error('Error ensuring valid session:', error)
    return { session: null, error }
  }
}

// Refresh token with retry and exponential backoff
export const refreshTokenWithRetry = async (refreshToken: string, maxRetries = 3) => {
  return await refreshSession(refreshToken, maxRetries)
}

// Get valid session or attempt refresh
export const getValidSession = async () => {
  return await ensureValidSession()
}

// Check if user is authenticated with valid session
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { session, error } = await ensureValidSession()
    return !error && !!session?.user
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

// Get current user with session validation
export const getCurrentUser = async () => {
  try {
    const { session, error } = await ensureValidSession()
    
    if (error || !session?.user) {
      return { user: null, error }
    }
    
    return { user: session.user, error: null }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { user: null, error }
  }
}
