import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"
import { devLog } from "@/lib/dev-log"

// Singleton pattern to prevent multiple instances
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

// Lazy initialization function to avoid build-time errors
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return null during SSR if environment variables are missing
    if (typeof window === 'undefined') {
      return null
    }
    throw new Error(
      "Supabase URL or Anon Key is missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    )
  }

  // Only configure cookies if we're in a browser environment
  const cookieConfig = typeof window !== 'undefined' ? {
    cookies: {
      getAll() {
        return document.cookie.split(';').map(cookie => {
          const [name, value] = cookie.trim().split('=')
          return { name, value }
        })
      },
      setAll(cookiesToSet: Array<{ name: string; value: string }>) {
        cookiesToSet.forEach(({ name, value }) => {
          try {
            document.cookie = `${name}=${value}; path=/; max-age=31536000; secure=false; samesite=lax`
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        })
      },
    },
  } : {}

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    ...cookieConfig,
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-auth-token',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js/2.x',
      },
    },
  })
}

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient()
  }
  return supabaseInstance
})()

// Utility function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  if (!supabase) {
    return false
  }
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session?.user
  } catch (error) {
    devLog("Error checking authentication status:", error)
    return false
  }
}

// Utility function to get current user
export const getCurrentUser = async () => {
  if (!supabase) {
    return null
  }
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      devLog("Error getting current user:", error)
      return null
    }
    return user
  } catch (error) {
    devLog("Error getting current user:", error)
    return null
  }
}

// Utility function to handle realtime connection errors
export const handleRealtimeError = (error: Error | unknown, tableName: string) => {
  const message = error instanceof Error ? error.message : String(error)
  
  // Check for specific error types
  if (message.includes("JWT") || message.includes("auth") || message.includes("permission")) {
    devLog(`Authentication error for ${tableName}:`, message)
    return "AUTH_ERROR"
  }
  
  if (message.includes("timeout") || message.includes("TIMED_OUT")) {
    devLog(`Timeout error for ${tableName}:`, message)
    return "TIMEOUT_ERROR"
  }
  
  if (message.includes("network") || message.includes("connection")) {
    devLog(`Network error for ${tableName}:`, message)
    return "NETWORK_ERROR"
  }
  
  devLog(`Unknown error for ${tableName}:`, message)
  return "UNKNOWN_ERROR"
}

// Utility function to safely create a realtime channel
export const createRealtimeChannel = (tableName: string, callback: (payload: unknown) => void) => {
  if (!supabase) {
    return null
  }
  try {
    return supabase
      .channel(`public-${tableName}-realtime`)
      .on("postgres_changes", { event: "*", schema: "public", table: tableName }, callback)
  } catch (error) {
    devLog(`Error creating realtime channel for ${tableName}:`, error)
    return null
  }
}

// Utility function to safely subscribe to a channel
export const subscribeToChannel = (channel: ReturnType<typeof supabase.channel> | null, onStatusChange?: (status: string, error?: Error) => void) => {
  if (!channel) return null
  
  try {
    return channel.subscribe((status: string, error?: Error) => {
      if (onStatusChange) {
        onStatusChange(status, error)
      }
    })
  } catch (error) {
    devLog("Error subscribing to channel:", error)
    return null
  }
}
