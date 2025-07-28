import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/en/dashboard'

    console.log('🔧 Auth Callback: Received code:', !!code)

    if (code) {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        console.log('🔧 Auth Callback: Success, redirecting to:', next)
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.error('🔧 Auth Callback: Error exchanging code:', error)
      }
    }

    console.log('🔧 Auth Callback: No code or error, redirecting to login')
    return NextResponse.redirect(`${origin}/en/auth/login`)
  } catch (error) {
    console.error('🔧 Auth Callback: Unexpected error:', error)
    return NextResponse.redirect(`${request.nextUrl.origin}/en/auth/login`)
  }
} 