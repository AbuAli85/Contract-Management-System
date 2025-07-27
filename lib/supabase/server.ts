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
          
          // Handle auth token cookies - check both generic and project-specific names
          if (name.includes('auth-token')) {
            // Check for generic cookie names first (set by login API)
            if (name === 'sb-auth-token' || 
                name === 'sb-auth-token.0' ||
                name === 'sb-auth-token-code-verifier') {
              const genericCookie = await cookieStore.get('sb-auth-token.0')
              if (genericCookie?.value) {
                console.log('🔧 Server: Using generic auth token cookie')
                return genericCookie.value
              }
              
              // Fallback to project-specific name
              const projectCookie = await cookieStore.get('sb-ekdjxzhujettocosgzql-auth-token.0')
              if (projectCookie?.value) {
                console.log('🔧 Server: Using project-specific auth token cookie')
                return projectCookie.value
              }
              console.log('🔧 Server: No auth token cookie found')
              return null
            }
            
            if (name === 'sb-auth-token.1' ||
                name === 'sb-auth-token-user') {
              const genericCookie = await cookieStore.get('sb-auth-token.1')
              if (genericCookie?.value) {
                console.log('🔧 Server: Using generic refresh token cookie')
                return genericCookie.value
              }
              
              // Fallback to project-specific name
              const projectCookie = await cookieStore.get('sb-ekdjxzhujettocosgzql-auth-token.1')
              if (projectCookie?.value) {
                console.log('🔧 Server: Using project-specific refresh token cookie')
                return projectCookie.value
              }
              console.log('🔧 Server: No refresh token cookie found')
              return null
            }
            
            // Handle direct project-specific cookie requests
            if (name === 'sb-ekdjxzhujettocosgzql-auth-token' || 
                name === 'sb-ekdjxzhujettocosgzql-auth-token.0' ||
                name === 'sb-ekdjxzhujettocosgzql-auth-token-code-verifier') {
              const projectCookie = await cookieStore.get('sb-ekdjxzhujettocosgzql-auth-token.0')
              if (projectCookie?.value) {
                console.log('🔧 Server: Using project-specific auth token cookie (direct)')
                return projectCookie.value
              }
              console.log('🔧 Server: No project-specific auth token cookie found')
              return null
            }
            
            if (name === 'sb-ekdjxzhujettocosgzql-auth-token.1' ||
                name === 'sb-ekdjxzhujettocosgzql-auth-token-user') {
              const projectCookie = await cookieStore.get('sb-ekdjxzhujettocosgzql-auth-token.1')
              if (projectCookie?.value) {
                console.log('🔧 Server: Using project-specific refresh token cookie (direct)')
                return projectCookie.value
              }
              console.log('🔧 Server: No project-specific refresh token cookie found')
              return null
            }
            
            // Handle code-verifier and user cookie variants with indices
            if (name.startsWith('sb-ekdjxzhujettocosgzql-auth-token-code-verifier.')) {
              // For code-verifier variants, return the main auth token
              const projectCookie = await cookieStore.get('sb-ekdjxzhujettocosgzql-auth-token.0')
              if (projectCookie?.value) {
                console.log('🔧 Server: Using project-specific auth token for code-verifier variant:', name)
                return projectCookie.value
              }
              console.log('🔧 Server: No auth token found for code-verifier variant:', name)
              return null
            }
            
            if (name.startsWith('sb-ekdjxzhujettocosgzql-auth-token-user.')) {
              // For user variants, return the refresh token
              const projectCookie = await cookieStore.get('sb-ekdjxzhujettocosgzql-auth-token.1')
              if (projectCookie?.value) {
                console.log('🔧 Server: Using project-specific refresh token for user variant:', name)
                return projectCookie.value
              }
              console.log('🔧 Server: No refresh token found for user variant:', name)
              return null
            }
            
            // Handle other project-specific cookie indices (2, 3, 4, etc.)
            if (name.startsWith('sb-ekdjxzhujettocosgzql-auth-token.')) {
              const projectCookie = await cookieStore.get(name)
              if (projectCookie?.value) {
                console.log('🔧 Server: Using project-specific cookie:', name)
                return projectCookie.value
              }
              console.log('🔧 Server: No project-specific cookie found:', name)
              return null
            }
            
            // For other auth token names, return null
            console.log('🔧 Server: Unknown auth token name:', name)
            return null
          }
          
          // For other cookies, try exact match
          const cookie = await cookieStore.get(name)
          return cookie?.value
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