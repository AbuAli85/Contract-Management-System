import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuthErrorHandler } from '@/lib/auth-error-handler'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Server login API called')
    
    const { email, password } = await request.json()
    
    if (!email || !password) {
      const error = AuthErrorHandler.createError('Email and password are required', 'VALIDATION_ERROR')
      return NextResponse.json(error, { status: 400 })
    }

    const supabase = await createClient()
    
    console.log('🔐 Attempting server-side sign in...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('🔐 Server login error:', error)
      const apiError = AuthErrorHandler.handleAuthError(error)
      return NextResponse.json(apiError, { status: 400 })
    }

    if (!data.user) {
      console.error('🔐 No user returned from sign in')
      const error = AuthErrorHandler.createError('Authentication failed', 'AUTH_FAILED')
      return NextResponse.json(error, { status: 400 })
    }

    console.log('🔐 Server login successful for user:', data.user.id)

    // Debug: Log session details
    if (data.session) {
      console.log('🔐 Session details:', {
        accessTokenLength: data.session.access_token?.length || 0,
        refreshTokenLength: data.session.refresh_token?.length || 0,
        accessTokenPreview: data.session.access_token?.substring(0, 50) + '...',
        refreshTokenPreview: data.session.refresh_token?.substring(0, 50) + '...',
        expiresAt: data.session.expires_at,
        tokenType: data.session.token_type
      })
    }

    // Create response with success
    const response = NextResponse.json(AuthErrorHandler.createSuccess({
      user: {
        id: data.user.id,
        email: data.user.email
      }
    }, 'Login successful'))

    // Check if we have session data
    if (data.session) {
      console.log('🔐 Session data available, setting cookies...')
      
      // Define secure cookie options
      const cookieOptions = {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || process.env.FORCE_HTTPS === 'true',
        sameSite: 'lax' as const, // Changed from 'strict' to 'lax' for better compatibility
        maxAge: 60 * 60 * 24 * 7 // 7 days
      }
      
      // Set the generic auth token cookies that middleware expects
      response.cookies.set({
        name: 'sb-auth-token.0',
        value: data.session.access_token,
        ...cookieOptions
      })
      
      response.cookies.set({
        name: 'sb-auth-token.1',
        value: data.session.refresh_token,
        ...cookieOptions
      })
      
      // Also set project-specific cookies for compatibility
      response.cookies.set({
        name: 'sb-ekdjxzhujettocosgzql-auth-token.0',
        value: data.session.access_token,
        ...cookieOptions
      })
      
      response.cookies.set({
        name: 'sb-ekdjxzhujettocosgzql-auth-token.1',
        value: data.session.refresh_token,
        ...cookieOptions
      })
      
      console.log('🔐 Set auth cookies for middleware')
      console.log('🔐 Cookie details:', {
        token0Length: data.session.access_token.length,
        token1Length: data.session.refresh_token.length,
        token0Preview: data.session.access_token.substring(0, 20) + '...',
        token1Preview: data.session.refresh_token.substring(0, 20) + '...'
      })
      
      // Debug: Log the actual cookie headers being set
      console.log('🔐 Cookie headers being set:', {
        'sb-auth-token.0': `path=/; httpOnly; maxAge=${60 * 60 * 24 * 7}`,
        'sb-auth-token.1': `path=/; httpOnly; maxAge=${60 * 60 * 24 * 7}`,
        'sb-ekdjxzhujettocosgzql-auth-token.0': `path=/; httpOnly; maxAge=${60 * 60 * 24 * 7}`,
        'sb-ekdjxzhujettocosgzql-auth-token.1': `path=/; httpOnly; maxAge=${60 * 60 * 24 * 7}`
      })
    } else {
      console.log('🔐 No session data available')
    }

    return response

  } catch (error) {
    console.error('🔐 Server login API error:', error)
    const apiError = AuthErrorHandler.handleGenericError(error)
    return NextResponse.json(apiError, { status: 500 })
  }
} 