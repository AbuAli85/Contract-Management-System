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
          
          // Try to get the exact cookie name first
          const cookie = await cookieStore.get(name)
          if (cookie?.value) {
            console.log('🔧 Server: Found exact cookie match:', name)
            return cookie.value
          }
          
          // Fallback: if Supabase is looking for -user cookies, try without -user
          if (name.includes('-user')) {
            const fallbackName = name.replace('-user', '')
            const fallbackCookie = await cookieStore.get(fallbackName)
            if (fallbackCookie?.value) {
              console.log('🔧 Server: Using fallback cookie:', fallbackName)
              return fallbackCookie.value
            }
          }
          
          // Fallback: if Supabase is looking for cookies without -user, try with -user
          if (!name.includes('-user') && name.includes('auth-token')) {
            const fallbackName = name.replace('auth-token', 'auth-token-user')
            const fallbackCookie = await cookieStore.get(fallbackName)
            if (fallbackCookie?.value) {
              console.log('🔧 Server: Using fallback cookie with -user:', fallbackName)
              return fallbackCookie.value
            }
          }
          
          console.log('🔧 Server: No cookie found for:', name)
          return null
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            console.log('🔧 Server: Setting cookie:', name, 'with value length:', value.length)
            
            // Set the exact cookie name that Supabase expects
            await cookieStore.set({ name, value, ...options })
            
            // Also set fallback cookies for compatibility
            if (name.includes('auth-token')) {
              if (name.includes('-user')) {
                // If setting -user cookie, also set without -user
                const fallbackName = name.replace('-user', '')
                await cookieStore.set({ name: fallbackName, value, ...options })
              } else {
                // If setting without -user, also set with -user
                const fallbackName = name.replace('auth-token', 'auth-token-user')
                await cookieStore.set({ name: fallbackName, value, ...options })
              }
            }
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            console.log('🔧 Server: Removing cookie:', name)
            
            // Remove the exact cookie name
            await cookieStore.set({ name, value: '', ...options })
            
            // Also remove fallback cookies
            if (name.includes('auth-token')) {
              if (name.includes('-user')) {
                // If removing -user cookie, also remove without -user
                const fallbackName = name.replace('-user', '')
                await cookieStore.set({ name: fallbackName, value: '', ...options })
              } else {
                // If removing without -user, also remove with -user
                const fallbackName = name.replace('auth-token', 'auth-token-user')
                await cookieStore.set({ name: fallbackName, value: '', ...options })
              }
            }
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