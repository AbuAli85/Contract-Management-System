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
          
          // Simplified cookie handling - just do direct lookup like middleware
          const cookie = await cookieStore.get(name)
          if (cookie?.value) {
            console.log('🔧 Server: Found cookie:', name)
            return cookie.value
          }
          
          // Fallback for auth token cookies - check both generic and project-specific names
          if (name.includes('auth-token')) {
            // If Supabase is looking for generic names, try project-specific
            if (name === 'sb-auth-token' || name === 'sb-auth-token.0') {
              const projectCookie = await cookieStore.get('sb-ekdjxzhujettocosgzql-auth-token.0')
              if (projectCookie?.value) {
                console.log('🔧 Server: Using project-specific auth token as fallback')
                return projectCookie.value
              }
            }
            
            if (name === 'sb-auth-token.1') {
              const projectCookie = await cookieStore.get('sb-ekdjxzhujettocosgzql-auth-token.1')
              if (projectCookie?.value) {
                console.log('🔧 Server: Using project-specific refresh token as fallback')
                return projectCookie.value
              }
            }
          }
          
          console.log('🔧 Server: No cookie found for:', name)
          return null
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            // Handle auth token cookies - set both generic and project-specific names
            if (name === 'sb-auth-token' || 
                name === 'sb-auth-token.0' ||
                name === 'sb-auth-token-code-verifier') {
              // Set both generic and project-specific names
              await cookieStore.set({ name: 'sb-auth-token.0', value, ...options })
              await cookieStore.set({ name: 'sb-ekdjxzhujettocosgzql-auth-token.0', value, ...options })
            } else if (name === 'sb-auth-token.1' ||
                       name === 'sb-auth-token-user') {
              // Set both generic and project-specific names
              await cookieStore.set({ name: 'sb-auth-token.1', value, ...options })
              await cookieStore.set({ name: 'sb-ekdjxzhujettocosgzql-auth-token.1', value, ...options })
            } else {
              // For other cookies, set normally
              await cookieStore.set({ name, value, ...options })
            }
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            // Remove both generic and project-specific auth token cookies
            if (name === 'sb-auth-token' || 
                name === 'sb-auth-token.0' ||
                name === 'sb-auth-token-code-verifier') {
              await cookieStore.set({ name: 'sb-auth-token.0', value: '', ...options })
              await cookieStore.set({ name: 'sb-ekdjxzhujettocosgzql-auth-token.0', value: '', ...options })
            } else if (name === 'sb-auth-token.1' ||
                       name === 'sb-auth-token-user') {
              await cookieStore.set({ name: 'sb-auth-token.1', value: '', ...options })
              await cookieStore.set({ name: 'sb-ekdjxzhujettocosgzql-auth-token.1', value: '', ...options })
            } else {
              // For other cookies, remove normally
              await cookieStore.set({ name, value: '', ...options })
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