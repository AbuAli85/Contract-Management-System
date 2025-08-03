import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user but don't fail if not authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
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
      user: user ? {
        id: user.id,
        email: user.email
      } : null,
      authentication: {
        authenticated: !!user,
        error: userError?.message || null
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
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        timestamp: new Date().toISOString(),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    }, { status: 500 })
  }
} 