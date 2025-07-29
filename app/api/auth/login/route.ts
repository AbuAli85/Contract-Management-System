import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AuthErrorHandler } from '@/lib/auth-error-handler'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

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

    // Let Supabase handle cookie management automatically
    // The createClient() function will handle setting the appropriate cookies
    console.log('🔐 Login completed, cookies should be set by Supabase')

    return response

  } catch (error) {
    console.error('🔐 Server login API error:', error)
    const apiError = AuthErrorHandler.handleGenericError(error)
    return NextResponse.json(apiError, { status: 500 })
  }
} 