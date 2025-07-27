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
          // Handle project-specific cookie names directly
          if (name.includes('auth-token')) {
            // For project-specific names, return the cookie directly
            if (name === 'sb-ekdjxzhujettocosgzql-auth-token' || 
                name === 'sb-ekdjxzhujettocosgzql-auth-token.0' ||
                name === 'sb-ekdjxzhujettocosgzql-auth-token-code-verifier') {
              const cookie = await cookieStore.get('sb-ekdjxzhujettocosgzql-auth-token.0')
              return cookie?.value
            }
            
            if (name === 'sb-ekdjxzhujettocosgzql-auth-token.1' ||
                name === 'sb-ekdjxzhujettocosgzql-auth-token-user') {
              const cookie = await cookieStore.get('sb-ekdjxzhujettocosgzql-auth-token.1')
              return cookie?.value
            }
            
            // For other auth token names, return null
            return null
          }
          
          // For other cookies, try exact match
          const cookie = await cookieStore.get(name)
          return cookie?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            // Handle project-specific cookie names directly
            let actualName = name
            if (name === 'sb-auth-token' || 
                name === 'sb-auth-token.0' ||
                name === 'sb-auth-token-code-verifier') {
              actualName = 'sb-ekdjxzhujettocosgzql-auth-token.0'
            } else if (name === 'sb-auth-token.1' ||
                       name === 'sb-auth-token-user') {
              actualName = 'sb-ekdjxzhujettocosgzql-auth-token.1'
            }
            
            // Don't truncate cookies - let Supabase handle the size naturally
            // Truncation was causing Base64-URL parsing errors
            await cookieStore.set({ name: actualName, value, ...options })
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            // Map generic cookie names to project-specific names
            let actualName = name
            if (name === 'sb-auth-token' || 
                name === 'sb-auth-token.0' ||
                name === 'sb-auth-token-code-verifier') {
              actualName = 'sb-ekdjxzhujettocosgzql-auth-token.0'
            } else if (name === 'sb-auth-token.1' ||
                       name === 'sb-auth-token-user') {
              actualName = 'sb-ekdjxzhujettocosgzql-auth-token.1'
            }
            
            await cookieStore.set({ name: actualName, value: '', ...options })
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