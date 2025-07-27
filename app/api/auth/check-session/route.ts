import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 Check session API called')
    
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (sessionError) {
      console.error('🔐 Session check error:', sessionError)
      return NextResponse.json({ 
        success: false, 
        hasSession: false,
        error: sessionError.message 
      })
    }
    
    if (userError) {
      console.error('🔐 User check error:', userError)
      return NextResponse.json({ 
        success: false, 
        hasSession: false,
        error: userError.message 
      })
    }
    
    const hasValidSession = !!session && !!user
    
    console.log('🔐 Session check result:', {
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