import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Public stats: Starting request...')
    
    const supabase = await createClient()
    
    console.log('🔍 Public stats: Fetching data without authentication...')

    // Simple queries without authentication
    const queries = [
      // Total contracts
      supabase.from('contracts').select('*', { count: 'exact', head: true }),
      
      // Total promoters
      supabase.from('promoters').select('*', { count: 'exact', head: true }),
      
      // Total parties
      supabase.from('parties').select('*', { count: 'exact', head: true })
    ]

    console.log('🔍 Public stats: Executing queries...')
    const results = await Promise.all(queries.map(async (query, index) => {
      try {
        const result = await query
        console.log(`🔍 Public stats: Query ${index} result:`, { count: result.count, error: result.error?.message })
        return result
      } catch (error) {
        console.error(`🔍 Public stats: Query ${index} failed:`, error)
        return { count: 0, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }))

    // Extract results
    const [
      contractsResult,
      promotersResult,
      partiesResult
    ] = results

    // Check for errors
    const errors = results.filter((r: any) => r.error).map((r: any) => r.error)
    if (errors.length > 0) {
      console.warn('🔍 Public stats: Some database errors:', errors)
    }

    // Build simple stats object
    const stats = {
      totalContracts: contractsResult.count || 0,
      totalPromoters: promotersResult.count || 0,
      totalParties: partiesResult.count || 0,
      debug: {
        queryErrors: errors,
        timestamp: new Date().toISOString()
      }
    }

    console.log('🔍 Public stats: Final stats:', stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('🔍 Public stats: Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch public statistics',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        timestamp: new Date().toISOString(),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    }, { status: 500 })
  }
} 