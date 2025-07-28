import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Test session direct API called')
    
    // Use the server client directly (same as middleware should use)
    const supabase = await createClient()

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    const testResult = {
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id || null,
      userEmail: user?.email || null,
      sessionError: sessionError?.message || null,
      userError: userError?.message || null,
      cookies: request.cookies.getAll().length,
      timestamp: new Date().toISOString()
    }

    console.log('🔧 Test session direct result:', testResult)

    return NextResponse.json({
      success: true,
      test: testResult
    })
  } catch (error) {
    console.error('❌ Test session direct API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 