import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('🔐 Check session API called')
    
    const supabase = await createClient()
    
    // Try getUser() first for better security
    console.log('🔐 Trying getUser() for secure authentication...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('🔐 User check error:', userError.message)
    } else if (user) {
      console.log('🔐 User found via getUser():', user.id)
      return NextResponse.json({
        success: true,
        hasSession: true,
        user: {
          id: user.id,
          email: user.email
        }
      })
    }
    
    // Fallback to getSession() if getUser() fails
    console.log('🔐 getUser() failed, trying getSession()...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔐 Session result:', session ? 'found' : 'not found')
    console.log('🔐 Session error:', sessionError ? sessionError.message : 'none')
    
    if (sessionError) {
      console.log('🔐 Session error:', sessionError.message)
      return NextResponse.json({ 
        success: false, 
        hasSession: false, 
        error: sessionError.message 
      })
    }
    
    if (session) {
      console.log('🔐 Session found via getSession():', session.user.id)
      return NextResponse.json({
        success: true,
        hasSession: true,
        user: {
          id: session.user.id,
          email: session.user.email
        }
      })
    }
    
    console.log('🔐 No session found')
    return NextResponse.json({ 
      success: false, 
      hasSession: false, 
      error: 'No session found' 
    })
    
  } catch (error) {
    console.error('🔐 Check session API error:', error)
    return NextResponse.json({ 
      success: false, 
      hasSession: false, 
      error: 'Internal server error' 
    })
  }
} 