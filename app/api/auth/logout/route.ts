import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    console.log('🔐 Logout API called')
    
    const supabase = await createClient()
    
    // Sign out the user
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('🔐 Logout error:', error)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to logout' 
      }, { status: 500 })
    }
    
    console.log('🔐 User signed out successfully')
    
    // Create response
    const response = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully'
    })
    
    // Define secure cookie clearing options
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || process.env.FORCE_HTTPS === 'true',
      sameSite: 'strict' as const,
      expires: new Date(0)
    }
    
    // Clear all auth cookies that were set during login
    const cookiesToClear = [
      'sb-auth-token.0',
      'sb-auth-token.1',
      'sb-ekdjxzhujettocosgzql-auth-token.0',
      'sb-ekdjxzhujettocosgzql-auth-token.1',
      'sb-auth-token',
      'sb-ekdjxzhujettocosgzql-auth-token'
    ]
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', cookieOptions)
    })
    
    console.log('🔐 Auth cookies cleared:', cookiesToClear)
    
    return response
  } catch (error) {
    console.error('🔐 Logout error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET() {
  // Redirect GET requests to POST
  return NextResponse.redirect(new URL('/api/auth/logout', 'http://localhost:3000'), 307)
} 