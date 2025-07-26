import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    const supabase = await createClient()
    
    console.log('🧪 Testing database connection...')
    
    // Test 1: Basic connection
    const connectionStart = Date.now()
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    const connectionTime = Date.now() - connectionStart
    
    if (connectionError) {
      return NextResponse.json({ 
        success: false,
        error: 'Database connection failed',
        details: connectionError,
        connectionTime
      }, { status: 500 })
    }
    
    // Test 2: Simple query
    const queryStart = Date.now()
    const { data: userCount, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
    
    const queryTime = Date.now() - queryStart
    
    // Test 3: Profile query
    const profileStart = Date.now()
    const { data: profileCount, error: profileError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
    
    const profileTime = Date.now() - profileStart
    
    const totalTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: 'Database connection test completed',
      results: {
        connectionTime: `${connectionTime}ms`,
        queryTime: `${queryTime}ms`,
        profileTime: `${profileTime}ms`,
        totalTime: `${totalTime}ms`,
        userCount: userCount?.length || 0,
        profileCount: profileCount?.length || 0
      },
      performance: {
        connection: connectionTime < 1000 ? 'Good' : connectionTime < 3000 ? 'Slow' : 'Very Slow',
        query: queryTime < 1000 ? 'Good' : queryTime < 3000 ? 'Slow' : 'Very Slow',
        profile: profileTime < 1000 ? 'Good' : profileTime < 3000 ? 'Slow' : 'Very Slow',
        overall: totalTime < 2000 ? 'Good' : totalTime < 5000 ? 'Slow' : 'Very Slow'
      }
    })
    
  } catch (error) {
    console.error('Error in database connection test:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Database connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 