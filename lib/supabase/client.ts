"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

// Utility function to parse cookies safely
function parseCookieString(cookieString: string): Array<{ name: string; value: string }> {
  return cookieString.split(";").map((cookie) => {
    const trimmedCookie = cookie.trim()
    const firstEqualsIndex = trimmedCookie.indexOf("=")
    if (firstEqualsIndex === -1) {
      return { name: trimmedCookie, value: "" }
    }
    const name = trimmedCookie.substring(0, firstEqualsIndex)
    const value = trimmedCookie.substring(firstEqualsIndex + 1)
    return { name, value }
  })
}

// Singleton pattern to prevent multiple instances
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

// Lazy initialization function to avoid build-time errors
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase URL or Anon Key is missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    )
  }

  // Only configure cookies if we're in a browser environment
  const cookieConfig =
    typeof window !== "undefined"
      ? {
          cookies: {
            getAll() {
              return parseCookieString(document.cookie)
            },
            setAll(cookiesToSet: Array<{ name: string; value: string }>) {
              cookiesToSet.forEach(({ name, value }) => {
                try {
                  document.cookie = `${name}=${value}; path=/; max-age=31536000; secure=false; samesite=lax`
                } catch (error) {
                  console.error("Error setting cookie:", error)
                }
              })
            },
          },
        }
      : {}

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
      storageKey: "sb-auth-token",
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      flowType: "pkce",
    },
    global: {
      headers: {
        "X-Client-Info": "supabase-js/2.x",
      },
    },
  })
}

export const createClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient()
  }
  return supabaseInstance
}

// Export the singleton instance
export const supabase = createClient()
