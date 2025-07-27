import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiErrorHandler } from '@/lib/api-error-handler'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Server login API called')
    
    const { email, password } = await request.json()
    
    if (!email || !password) {
      const error = ApiErrorHandler.handleValidationError({ 
        message: 'Email and password are required' 
      })
      return NextResponse.json(
        ApiErrorHandler.formatErrorResponse(error),
        { status: error.status }
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
      const apiError = ApiErrorHandler.handleAuthError(error)
      return NextResponse.json(
        ApiErrorHandler.formatErrorResponse(apiError),
        { status: apiError.status }
      )
    }

    if (!data.user) {
      console.error('🔐 No user returned from sign in')
      const error = ApiErrorHandler.createError('Authentication failed', 'AUTH_FAILED', 400)
      return NextResponse.json(
        ApiErrorHandler.formatErrorResponse(error),
        { status: error.status }
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
        secure: true, // Always enforce HTTPS
        sameSite: 'strict', // Stricter same-site policy
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      
      response.cookies.set({
        name: 'sb-auth-token.1',
        value: data.session.refresh_token,
        path: '/',
        httpOnly: true,
        secure: true, // Always enforce HTTPS
        sameSite: 'strict', // Stricter same-site policy
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      
      console.log('🔐 Set auth cookies for middleware')
      console.log('🔐 Cookie details:', {
        token0Length: data.session.access_token.length,
        token1Length: data.session.refresh_token.length,
        token0Preview: data.session.access_token.substring(0, 20) + '...',
        token1Preview: data.session.refresh_token.substring(0, 20) + '...'
      })
    } else {
      console.log('🔐 No session data available')
    }

    return response

  } catch (error) {
    console.error('🔐 Server login API error:', error)
    const apiError = ApiErrorHandler.handleGenericError(error)
    return NextResponse.json(
      ApiErrorHandler.formatErrorResponse(apiError),
      { status: apiError.status }
    )
  }
} 