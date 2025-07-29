import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

// Enhanced error handling for client-side operations
export class SupabaseClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'SupabaseClientError'
  }
}

// Environment variable validation for client-side
const validateClientEnvironmentVariables = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const missingVars = []
  if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  
  if (missingVars.length > 0) {
    console.warn(`Missing Supabase environment variables: ${missingVars.join(', ')}`)
    return { supabaseUrl: null, supabaseKey: null }
  }
  
  return { supabaseUrl, supabaseKey }
}

// Create a safe storage implementation with better error handling and security
const createSafeStorage = () => {
  const safeStorage = {
    getItem: (key: string) => {
      try {
        if (typeof window === 'undefined') return null
        
        // Additional security check for sensitive keys
        if (key.includes('auth') || key.includes('token')) {
          const value = localStorage.getItem(key)
          if (value) {
            // Basic validation of stored auth data
            try {
              const parsed = JSON.parse(value)
              if (parsed && typeof parsed === 'object') {
                return value
              }
            } catch {
              // Invalid JSON, remove it
              localStorage.removeItem(key)
              return null
            }
          }
        }
        
        return localStorage.getItem(key)
      } catch (error) {
        console.warn('Storage getItem failed:', error)
        return null
      }
    },
    setItem: (key: string, value: string) => {
      try {
        if (typeof window === 'undefined') return
        
        // Validate auth data before storing
        if (key.includes('auth') || key.includes('token')) {
          try {
            const parsed = JSON.parse(value)
            if (!parsed || typeof parsed !== 'object') {
              console.warn('Invalid auth data format, not storing')
              return
            }
          } catch {
            console.warn('Invalid JSON format for auth data, not storing')
            return
          }
        }
        
        localStorage.setItem(key, value)
      } catch (error) {
        console.warn('Storage setItem failed:', error)
      }
    },
    removeItem: (key: string) => {
      try {
        if (typeof window === 'undefined') return
        localStorage.removeItem(key)
      } catch (error) {
        console.warn('Storage removeItem failed:', error)
      }
    },
    clear: () => {
      try {
        if (typeof window === 'undefined') return
        localStorage.clear()
      } catch (error) {
        console.warn('Storage clear failed:', error)
      }
    }
  }
  
  return safeStorage
}

// Create a mock Supabase client for SSR with better error handling
const createMockClient = () => {
  const mockClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ 
        data: null, 
        error: { message: 'SSR mode - auth not available', code: 'SSR_MODE' } 
      }),
      signUp: async () => ({ 
        data: null, 
        error: { message: 'SSR mode - auth not available', code: 'SSR_MODE' } 
      }),
      signOut: async () => ({ error: null }),
      signInWithOAuth: async () => ({ 
        data: null, 
        error: { message: 'SSR mode - auth not available', code: 'SSR_MODE' } 
      }),
      updateUser: async () => ({ 
        data: null, 
        error: { message: 'SSR mode - auth not available', code: 'SSR_MODE' } 
      }),
      refreshSession: async () => ({ 
        data: { session: null, user: null }, 
        error: { message: 'SSR mode - auth not available', code: 'SSR_MODE' } 
      })
    },
    from: () => ({
      select: () => ({ 
        eq: () => ({ 
          single: async () => ({ data: null, error: { message: 'SSR mode - database not available', code: 'SSR_MODE' } }) 
        }) 
      }),
      insert: () => ({ 
        select: () => ({ 
          single: async () => ({ data: null, error: { message: 'SSR mode - database not available', code: 'SSR_MODE' } }) 
        }) 
      }),
      update: () => ({ 
        eq: () => ({ 
          select: () => ({ 
            single: async () => ({ data: null, error: { message: 'SSR mode - database not available', code: 'SSR_MODE' } }) 
          }) 
        }) 
      }),
      delete: () => ({ 
        eq: async () => ({ data: null, error: { message: 'SSR mode - database not available', code: 'SSR_MODE' } }) 
      })
    }),
    // Add error handling utilities to mock client
    handleError: (error: any) => {
      console.warn('Mock client error:', error)
      return { data: null, error }
    }
  } as any
  
  return mockClient
}

// Enhanced client creation with better error handling and security
export const createClient = () => {
  const { supabaseUrl, supabaseKey } = validateClientEnvironmentVariables()
  
  // Return mock client during SSR
  if (typeof window === 'undefined') {
    console.log('🔧 Client: SSR mode detected, using mock client')
    return createMockClient()
  }
  
  // Return mock client if environment variables are missing
  if (!supabaseUrl || !supabaseKey) {
    console.warn('🔧 Client: Missing Supabase environment variables - using mock client')
    return createMockClient()
  }
  
  try {
    // Create a client with enhanced security and error handling
    const client = createBrowserClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: createSafeStorage(),
        storageKey: 'sb-auth-token',
        flowType: 'pkce',
        debug: process.env.NODE_ENV === 'development',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          'X-Client-Info': 'contract-management-system/1.0',
          'X-Request-ID': generateClientRequestId(),
        },
      },
    })
    
    // Add error handling wrapper
    const enhancedClient = {
      ...client,
      // Enhanced error handling for all operations
      handleError: (error: any, operation: string) => {
        console.error(`❌ Client ${operation} error:`, error)
        
        if (error && typeof error === 'object' && 'code' in error) {
          const supabaseError = error as any
          
          if (supabaseError.code === 'PGRST301') {
            return new SupabaseClientError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429)
          }
          
          if (supabaseError.code === 'PGRST302') {
            return new SupabaseClientError('Connection timeout', 'CONNECTION_TIMEOUT', 408)
          }
          
          if (supabaseError.code === 'SSR_MODE') {
            return new SupabaseClientError('Operation not available in SSR mode', 'SSR_MODE', 503)
          }
        }
        
        return new SupabaseClientError(
          `${operation} failed`,
          'OPERATION_FAILED',
          500,
          error instanceof Error ? error.message : 'Unknown error'
        )
      },
      
      // Enhanced auth methods with error handling
      auth: {
        ...client.auth,
        signInWithPassword: async (credentials: any) => {
          try {
            return await client.auth.signInWithPassword(credentials)
          } catch (error) {
            throw enhancedClient.handleError(error, 'signInWithPassword')
          }
        },
        
        signUp: async (credentials: any) => {
          try {
            return await client.auth.signUp(credentials)
          } catch (error) {
            throw enhancedClient.handleError(error, 'signUp')
          }
        },
        
        signOut: async () => {
          try {
            return await client.auth.signOut()
          } catch (error) {
            throw enhancedClient.handleError(error, 'signOut')
          }
        },
        
        refreshSession: async () => {
          try {
            return await client.auth.refreshSession()
          } catch (error) {
            throw enhancedClient.handleError(error, 'refreshSession')
          }
        },
        
        getSession: async () => {
          try {
            return await client.auth.getSession()
          } catch (error) {
            throw enhancedClient.handleError(error, 'getSession')
          }
        },
        
        onAuthStateChange: (callback: any) => {
          try {
            return client.auth.onAuthStateChange(callback)
          } catch (error) {
            console.error('❌ Client onAuthStateChange error:', error)
            return { data: { subscription: { unsubscribe: () => {} } } }
          }
        }
      },
      
      // Enhanced database methods with error handling
      from: (table: string) => {
        const tableClient = client.from(table)
        
        return {
          ...tableClient,
          select: (columns?: string) => {
            const selectClient = tableClient.select(columns)
            
            return {
              ...selectClient,
              eq: (column: string, value: any) => {
                const eqClient = selectClient.eq(column, value)
                
                return {
                  ...eqClient,
                  single: async () => {
                    try {
                      return await eqClient.single()
                    } catch (error) {
                      throw enhancedClient.handleError(error, `select from ${table}`)
                    }
                  },
                  maybeSingle: async () => {
                    try {
                      return await eqClient.maybeSingle()
                    } catch (error) {
                      throw enhancedClient.handleError(error, `select from ${table}`)
                    }
                  }
                }
              },
              order: (column: string, options?: any) => {
                const orderClient = selectClient.order(column, options)
                
                return {
                  ...orderClient,
                  limit: (count: number) => {
                    const limitClient = orderClient.limit(count)
                    
                    return {
                      ...limitClient,
                      async execute() {
                        try {
                          return await limitClient.execute()
                        } catch (error) {
                          throw enhancedClient.handleError(error, `select from ${table}`)
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          
          insert: (data: any) => {
            const insertClient = tableClient.insert(data)
            
            return {
              ...insertClient,
              select: (columns?: string) => {
                const selectClient = insertClient.select(columns)
                
                return {
                  ...selectClient,
                  single: async () => {
                    try {
                      return await selectClient.single()
                    } catch (error) {
                      throw enhancedClient.handleError(error, `insert into ${table}`)
                    }
                  }
                }
              }
            }
          },
          
          update: (data: any) => {
            const updateClient = tableClient.update(data)
            
            return {
              ...updateClient,
              eq: (column: string, value: any) => {
                const eqClient = updateClient.eq(column, value)
                
                return {
                  ...eqClient,
                  select: (columns?: string) => {
                    const selectClient = eqClient.select(columns)
                    
                    return {
                      ...selectClient,
                      single: async () => {
                        try {
                          return await selectClient.single()
                        } catch (error) {
                          throw enhancedClient.handleError(error, `update ${table}`)
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          
          delete: () => {
            const deleteClient = tableClient.delete()
            
            return {
              ...deleteClient,
              eq: async (column: string, value: any) => {
                try {
                  return await deleteClient.eq(column, value)
                } catch (error) {
                  throw enhancedClient.handleError(error, `delete from ${table}`)
                }
              }
            }
          }
        }
      }
    }
    
    return enhancedClient
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error)
    return createMockClient()
  }
}

// Generate unique request ID for client-side tracking
function generateClientRequestId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Safe client for SSR - returns mock client if environment variables are missing
export const createSafeClient = () => {
  const { supabaseUrl, supabaseKey } = validateClientEnvironmentVariables()
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('🔧 Safe Client: Missing environment variables, using mock client')
    return createMockClient()
  }
  
  try {
    return createBrowserClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        storage: createSafeStorage(),
        storageKey: 'sb-auth-token',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'X-Client-Info': 'contract-management-system/1.0',
          'X-Request-ID': generateClientRequestId(),
        },
      },
    })
  } catch (error) {
    console.error('❌ Error creating safe Supabase client:', error)
    return createMockClient()
  }
}

// Utility function for client-side operations with error handling
export async function executeClientOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ data: T | null; error: any }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error) {
    console.error(`❌ Client ${operationName} failed:`, error)
    
    if (error instanceof SupabaseClientError) {
      return { data: null, error }
    }
    
    return { 
      data: null, 
      error: new SupabaseClientError(
        `${operationName} failed`,
        'OPERATION_FAILED',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }
}