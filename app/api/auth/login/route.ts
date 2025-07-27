import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Server login API called')
    
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    console.log('🔐 Attempting server-side sign in...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('🔐 Server login error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      console.error('🔐 No user returned from sign in')
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 400 }
      )
    }

    console.log('🔐 Server login successful for user:', data.user.id)

    // Create response with success
    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    })

    // The cookies should be automatically set by the server-side Supabase client
    // But let's verify they exist
    const cookies = request.cookies.getAll()
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth-token') || 
      cookie.name.includes('sb-')
    )
    
    console.log('🔐 Auth cookies after login:', authCookies.map(c => c.name))

    return response

  } catch (error) {
    console.error('🔐 Server login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 