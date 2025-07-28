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
          
          // Simple cookie lookup
          const cookie = await cookieStore.get(name)
          if (cookie?.value) {
            console.log('🔧 Server: Found cookie:', name)
            return cookie.value
          }
          
          console.log('🔧 Server: No cookie found for:', name)
          return null
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            console.log('🔧 Server: Setting cookie:', name, 'with value length:', value.length)
            
            // Set cookie with proper options
            await cookieStore.set({ name, value, ...options })
            console.log('🔧 Server: Cookie set successfully:', name)
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            console.log('🔧 Server: Removing cookie:', name)
            
            // Remove cookie by setting it to empty value
            await cookieStore.set({ name, value: '', ...options })
            console.log('🔧 Server: Cookie removed successfully:', name)
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