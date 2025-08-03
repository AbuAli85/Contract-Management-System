import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        userError: userError?.message 
      }, { status: 401 })
    }

    // Simple test queries
    const [
      promotersCount,
      partiesCount,
      contractsCount
    ] = await Promise.all([
      supabase.from('promoters').select('id', { count: 'exact' }),
      supabase.from('parties').select('id', { count: 'exact' }),
      supabase.from('contracts').select('id', { count: 'exact' })
    ])

    const testResults = {
      user: {
        id: user.id,
        email: user.email
      },
      database: {
        promoters: {
          count: promotersCount.count,
          error: promotersCount.error?.message
        },
        parties: {
          count: partiesCount.count,
          error: partiesCount.error?.message
        },
        contracts: {
          count: contractsCount.count,
          error: contractsCount.error?.message
        }
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(testResults)
  } catch (error) {
    console.error('Dashboard test error:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 