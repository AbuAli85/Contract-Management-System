import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, ...options }) => {
                cookieStore.set(name, value, options as { path?: string; domain?: string; maxAge?: number; secure?: boolean; httpOnly?: boolean; sameSite?: 'strict' | 'lax' | 'none' })
              })
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Try to get session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
    }
    
    // If no session, try to get user directly
    let user = session?.user
    if (!user) {
      const { data: { user: userData }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Auth error:', userError)
        return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
      }
      
      user = userData || undefined
    }
    
    if (!user) {
      console.log('No user found in session or auth')
      return NextResponse.json({ error: 'Unauthorized - No user session' }, { status: 401 })
    }

    console.log('User authenticated for promoters:', user.email)

    // Fetch promoters from the database
    const { data: promoters, error } = await supabase
      .from('promoters')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching promoters:', error)
      return NextResponse.json({ error: 'Failed to fetch promoters' }, { status: 500 })
    }

    console.log(`Fetched ${promoters?.length || 0} promoters`)
    return NextResponse.json(promoters || [])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 