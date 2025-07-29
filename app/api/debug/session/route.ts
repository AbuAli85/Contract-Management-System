import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Debug session API called')
    const supabase = await createClient()

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    const debugInfo = {
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id || null,
      userEmail: user?.email || null,
      sessionError: sessionError?.message || null,
      userError: userError?.message || null,
      cookies: request.cookies.getAll().length,
      url: request.url,
      timestamp: new Date().toISOString()
    }

    console.log('🔧 Debug session result:', debugInfo)

    return NextResponse.json({
      success: true,
      debug: debugInfo
    })
  } catch (error) {
    console.error('❌ Debug session API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 