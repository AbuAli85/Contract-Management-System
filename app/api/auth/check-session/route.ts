import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 Check session API called')
    
    // Debug: Check what cookies are available
    const cookieStore = await cookies()
    const authToken0 = cookieStore.get('sb-auth-token.0')
    const authToken1 = cookieStore.get('sb-auth-token.1')
    
    console.log('🔐 Available cookies:', {
      hasToken0: !!authToken0,
      hasToken1: !!authToken1,
      token0Length: authToken0?.value?.length || 0,
      token1Length: authToken1?.value?.length || 0
    })
    
    const supabase = await createClient()
    
    // First try to get session (more reliable for newly set cookies)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('🔐 Session check error:', sessionError)
      return NextResponse.json({ 
        success: false, 
        hasSession: false,
        error: sessionError.message 
      })
    }
    
    // If we have a session, we have a user
    if (session && session.user) {
      console.log('🔐 Session check result:', {
        hasSession: true,
        userId: session.user.id,
        userEmail: session.user.email
      })
      
      return NextResponse.json({
        success: true,
        hasSession: true,
        user: {
          id: session.user.id,
          email: session.user.email
        }
      })
    }
    
    // Fallback: try getUser() if getSession() didn't work
    console.log('🔐 Session not found, trying getUser()...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('🔐 User check error:', userError)
      return NextResponse.json({ 
        success: false, 
        hasSession: false,
        error: userError.message 
      })
    }
    
    const hasValidSession = !!user
    
    console.log('🔐 User check result:', {
      hasSession: hasValidSession,
      userId: user?.id || null,
      userEmail: user?.email || null
    })
    
    return NextResponse.json({
      success: true,
      hasSession: hasValidSession,
      user: user ? {
        id: user.id,
        email: user.email
      } : null
    })
    
  } catch (error) {
    console.error('🔐 Check session API error:', error)
    return NextResponse.json({ 
      success: false, 
      hasSession: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 