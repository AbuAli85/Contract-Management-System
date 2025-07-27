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
      return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
    }
    
    console.log('🔐 User signed out successfully')
    
    // Create response
    const response = NextResponse.json({ success: true })
    
    // Clear all auth cookies with proper settings
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      expires: new Date(0)
    }
    
    // Clear generic auth cookies
    response.cookies.set('sb-auth-token.0', '', cookieOptions)
    response.cookies.set('sb-auth-token.1', '', cookieOptions)
    
    // Clear project-specific auth cookies
    response.cookies.set('sb-ekdjxzhujettocosgzql-auth-token.0', '', cookieOptions)
    response.cookies.set('sb-ekdjxzhujettocosgzql-auth-token.1', '', cookieOptions)
    
    // Clear any other auth-related cookies
    response.cookies.set('sb-auth-token', '', cookieOptions)
    response.cookies.set('sb-ekdjxzhujettocosgzql-auth-token', '', cookieOptions)
    
    console.log('🔐 Auth cookies cleared')
    
    return response
  } catch (error) {
    console.error('🔐 Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  // Redirect GET requests to POST
  return NextResponse.redirect(new URL('/api/auth/logout', 'http://localhost:3000'), 307)
} 