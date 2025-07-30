import 'server-only'
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// Environment variable validation
const validateEnvironmentVariables = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const missingVars = []
  if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!serviceRoleKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY')

  if (missingVars.length > 0) {
    console.warn(`Missing Supabase environment variables: ${missingVars.join(', ')}. Using mock client for development.`)
    return { supabaseUrl: null, supabaseAnonKey: null, serviceRoleKey: null }
  }

  return { supabaseUrl, supabaseAnonKey, serviceRoleKey }
}

// Create a mock server client for development
const createMockServerClient = () => {
  console.log('🔧 Server: Creating mock server client')
  
  const mockClient = {
    auth: {
      getSession: async () => {
        // For mock client, we'll return a mock session if available
        // This simulates a logged-in user for development
        const mockSession = {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: {
            id: 'mock-user-id',
            email: 'luxsess2001@gmail.com',
            user_metadata: {
              full_name: 'luxsess2001',
              avatar_url: null
            },
            app_metadata: {
              provider: 'email',
              providers: ['email']
            },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
        
        return { 
          data: { session: mockSession }, 
          error: null 
        }
      },
      
      getUser: async () => {
        // Return the same mock user as getSession
        const mockUser = {
          id: 'mock-user-id',
          email: 'luxsess2001@gmail.com',
          user_metadata: {
            full_name: 'luxsess2001',
            avatar_url: null
          },
          app_metadata: {
            provider: 'email',
            providers: ['email']
          },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        return { 
          data: { user: mockUser }, 
          error: null 
        }
      },
      
      onAuthStateChange: () => ({ 
        data: { 
          subscription: { 
            unsubscribe: () => {} 
          } 
        } 
      }),
      
      signInWithPassword: async () => ({ 
        data: null, 
        error: { message: 'Server-side auth not available in mock mode', code: 'SERVER_MOCK_MODE' } 
      }),
      
      signUp: async () => ({ 
        data: null, 
        error: { message: 'Server-side auth not available in mock mode', code: 'SERVER_MOCK_MODE' } 
      }),
      
      signOut: async () => ({ error: null }),
      
      signInWithOAuth: async () => ({ 
        data: null, 
        error: { message: 'OAuth not available in server mock mode', code: 'OAUTH_NOT_AVAILABLE' } 
      }),
      
      updateUser: async () => ({ 
        data: null, 
        error: { message: 'Server-side auth not available in mock mode', code: 'SERVER_MOCK_MODE' } 
      }),
      
      refreshSession: async () => ({ 
        data: { session: null, user: null }, 
        error: { message: 'Server-side auth not available in mock mode', code: 'SERVER_MOCK_MODE' } 
      })
    },
    
    from: (table: string) => ({
      select: (columns: string = '*') => ({ 
        eq: (column: string, value: any) => ({ 
          single: async () => ({ 
            data: null, 
            error: { message: 'Database not available in server mock mode', code: 'DB_NOT_AVAILABLE' } 
          }) 
        }) 
      }),
      insert: (data: any) => ({ 
        select: (columns: string = '*') => ({ 
          single: async () => ({ 
            data: null, 
            error: { message: 'Database not available in server mock mode', code: 'DB_NOT_AVAILABLE' } 
          }) 
        }) 
      }),
      update: (data: any) => ({ 
        eq: (column: string, value: any) => ({ 
          select: (columns: string = '*') => ({ 
            single: async () => ({ 
              data: null, 
              error: { message: 'Database not available in server mock mode', code: 'DB_NOT_AVAILABLE' } 
            }) 
          }) 
        }) 
      }),
      delete: () => ({ 
        eq: async (column: string, value: any) => ({ 
          data: null, 
          error: { message: 'Database not available in server mock mode', code: 'DB_NOT_AVAILABLE' } 
        }) 
      })
    }),
    
    // Add error handling utilities to mock client
    handleError: (error: any) => {
      console.warn('Mock server client error:', error)
      return { data: null, error }
    }
  } as any
  
  return mockClient
}

// Enhanced error handling for Supabase operations
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'SupabaseError'
  }
}

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequests: 100, // requests per window
  windowMs: 15 * 60 * 1000, // 15 minutes
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
}

// Connection pool configuration for high-traffic applications
const CONNECTION_POOL_CONFIG = {
  maxConnections: 20,
  idleTimeout: 30000, // 30 seconds
  connectionTimeout: 10000, // 10 seconds
}

export async function createClient() {
  try {
    const { supabaseUrl, supabaseAnonKey } = validateEnvironmentVariables()
    
    // Return mock client if environment variables are missing
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('🔧 Server: Missing environment variables - using mock server client')
      return createMockServerClient()
    }
    
    const cookieStore = await cookies()

    return createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          async get(name: string) {
            try {
              console.log('🔧 Server: Supabase requesting cookie:', name)
              
              const cookie = await cookieStore.get(name)
              if (cookie?.value) {
                console.log('🔧 Server: Found cookie:', name)
                return cookie.value
              }
              
              console.log('🔧 Server: No cookie found for:', name)
              return null
            } catch (error) {
              console.error('🔧 Server: Error getting cookie:', name, error)
              return null
            }
          },
          async set(name: string, value: string, options: CookieOptions) {
            try {
              console.log('🔧 Server: Setting cookie:', name, 'with value length:', value.length)
              
              await cookieStore.set({ name, value, ...options })
              console.log('🔧 Server: Cookie set successfully:', name)
            } catch (error) {
              console.error('🔧 Server: Error setting cookie:', name, error)
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          async remove(name: string, options: CookieOptions) {
            try {
              console.log('🔧 Server: Removing cookie:', name)
              
              await cookieStore.set({ name, value: '', ...options })
              console.log('🔧 Server: Cookie removed successfully:', name)
            } catch (error) {
              console.error('🔧 Server: Error removing cookie:', name, error)
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
        // Global configuration for better performance and error handling
        global: {
          headers: {
            'X-Client-Info': 'contract-management-system/1.0',
            'X-Request-ID': generateRequestId(),
          },
        },
        // Realtime configuration with error handling
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
        // Auth configuration with enhanced security
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      }
    )
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    throw new SupabaseError(
      'Failed to initialize Supabase client',
      'CLIENT_INITIALIZATION_ERROR',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}

// Generate unique request ID for tracking
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Enhanced client with refresh token logic and better error handling
export async function createClientWithRefresh() {
  const client = await createClient()
  
  // Add refresh token functionality with enhanced error handling
  const enhancedClient = {
    ...client,
    auth: {
      ...client.auth,
      // Enhanced refresh session with retry logic and better error handling
      async refreshSession() {
        try {
          console.log('🔄 Server: Attempting to refresh session...')
          
          const { data, error } = await client.auth.refreshSession()
          
          if (error) {
            console.error('🔄 Server: Session refresh failed:', error)
            throw new SupabaseError(
              'Session refresh failed',
              'SESSION_REFRESH_ERROR',
              401,
              error.message
            )
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
          if (error instanceof SupabaseError) {
            throw error
          }
          throw new SupabaseError(
            'Session refresh failed',
            'SESSION_REFRESH_ERROR',
            401,
            error instanceof Error ? error.message : 'Unknown error'
          )
        }
      },
      
      // Check if session is expired with better error handling
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
      
      // Auto-refresh session if needed with enhanced error handling
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
          if (error instanceof SupabaseError) {
            throw error
          }
          throw new SupabaseError(
            'Failed to ensure valid session',
            'SESSION_VALIDATION_ERROR',
            401,
            error instanceof Error ? error.message : 'Unknown error'
          )
        }
      }
    }
  }
  
  return enhancedClient
}

// Helper function to refresh token with retry logic and exponential backoff
export async function refreshTokenWithRetry(
  client: any,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<{ success: boolean; error?: any }> {
  let lastError: any = null
  let delayMs = initialDelayMs
  
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

// Helper function to get a valid session with automatic refresh and error handling
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
      error: error instanceof Error ? error.message : 'Unknown error'
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

// Utility function for database operations with error handling
export async function executeWithErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ data: T | null; error: any }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error) {
    console.error(`❌ ${operationName} failed:`, error)
    
    // Handle specific Supabase errors
    if (error && typeof error === 'object' && 'code' in error) {
      const supabaseError = error as any
      
      if (supabaseError.code === 'PGRST301') {
        return { 
          data: null, 
          error: new SupabaseError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429) 
        }
      }
      
      if (supabaseError.code === 'PGRST302') {
        return { 
          data: null, 
          error: new SupabaseError('Connection timeout', 'CONNECTION_TIMEOUT', 408) 
        }
      }
    }
    
    return { 
      data: null, 
      error: new SupabaseError(
        `${operationName} failed`,
        'OPERATION_FAILED',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }
}

// Export rate limiting configuration for use in middleware
export { RATE_LIMIT_CONFIG, CONNECTION_POOL_CONFIG }