import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Sign out the user
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
    }
    
    // Clear any session cookies
    const response = NextResponse.json({ success: true })
    
    // Clear auth cookies
    response.cookies.delete('sb-auth-token')
    response.cookies.delete('sb-ekdjxzhujettocosgzql-auth-token')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  // Redirect GET requests to POST
  return NextResponse.redirect(new URL('/api/auth/logout', 'http://localhost:3000'), 307)
} 