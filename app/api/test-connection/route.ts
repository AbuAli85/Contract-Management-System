import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Testing Supabase connection...')
    
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase client not available'
      }, { status: 500 })
    }

    // Test basic connection
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session test failed:', sessionError)
      return NextResponse.json({
        success: false,
        error: 'Session test failed',
        details: sessionError.message
      }, { status: 500 })
    }

    // Test database connection by querying users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (usersError) {
      console.error('❌ Database test failed:', usersError)
      return NextResponse.json({
        success: false,
        error: 'Database test failed',
        details: usersError.message
      }, { status: 500 })
    }

    console.log('✅ Connection test successful')
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      data: {
        hasSession: !!sessionData.session,
        userCount: usersData?.length || 0,
        environment: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }
    })

  } catch (error) {
    console.error('❌ Connection test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 