import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Testing database connectivity...')
    
    const supabase = await createClient()
    
    // Test basic connection
    const { data, error } = await supabase
      .from('contracts')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('🔍 Database connection error:', error)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: error.message
      }, { status: 500 })
    }
    
    // Test if we can get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      hasSession: !!session,
      userEmail: session?.user?.email || null,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('🔍 Test API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 