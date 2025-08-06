import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ensureUserProfile } from '@/lib/ensure-user-profile'

export async function POST(req: Request) {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    try {
      await ensureUserProfile(user)
    } catch (error) {
      // Log the error but don't block the user flow
      console.error(`[AuthCallback] Failed to ensure user profile, but continuing:`, error)
    }
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/dashboard', // Redirect to a protected route
    },
  })
}
