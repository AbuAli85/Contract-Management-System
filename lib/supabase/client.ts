"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

// Singleton pattern to prevent multiple instances
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

// Lazy initialization function to avoid build-time errors
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase URL or Anon Key is missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    )
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return document.cookie.split(";").map((cookie) => {
          const trimmedCookie = cookie.trim()
          const firstEqualsIndex = trimmedCookie.indexOf("=")
          if (firstEqualsIndex === -1) {
            return { name: trimmedCookie, value: "" }
          }
          const name = trimmedCookie.substring(0, firstEqualsIndex)
          const value = trimmedCookie.substring(firstEqualsIndex + 1)
          return { name, value }
        })
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
  })
}

export const createClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient()
  }
  return supabaseInstance
}

export const supabase = createClient()
