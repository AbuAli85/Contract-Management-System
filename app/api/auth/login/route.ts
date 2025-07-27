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

    // Check if we have session data
    if (data.session) {
      console.log('🔐 Session data available, setting cookies...')
      
      // Set the generic auth token cookies that middleware expects
      response.cookies.set({
        name: 'sb-auth-token.0',
        value: data.session.access_token,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      
      response.cookies.set({
        name: 'sb-auth-token.1',
        value: data.session.refresh_token,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      
      console.log('🔐 Set auth cookies for middleware')
    } else {
      console.log('🔐 No session data available')
    }

    return response

  } catch (error) {
    console.error('🔐 Server login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 