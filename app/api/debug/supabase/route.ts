import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Test basic connection by querying a simple table
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
    
    const connectionStatus = {
      canConnect: !error,
      error: error?.message || null,
      hasData: !!data,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      supabase: connectionStatus
    })
  } catch (error) {
    console.error('Supabase connection error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test Supabase connection'
    }, { status: 500 })
  }
} 