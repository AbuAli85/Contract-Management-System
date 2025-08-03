import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Dashboard stats: Starting request...')
    
    const supabase = await createClient()
    
    // Get current user with better error handling
    console.log('🔍 Dashboard stats: Getting user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('🔍 Dashboard stats: User error:', userError)
      return NextResponse.json({ 
        error: 'Authentication error', 
        details: userError.message 
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('🔍 Dashboard stats: No user found')
      return NextResponse.json({ 
        error: 'User not authenticated' 
      }, { status: 401 })
    }

    console.log('🔍 Dashboard stats: User authenticated, fetching data...')

    // Simplified queries with better error handling
    const queries = [
      // Total contracts
      supabase.from('contracts').select('*', { count: 'exact', head: true }),
      
      // Total promoters
      supabase.from('promoters').select('*', { count: 'exact', head: true }),
      
      // Total parties
      supabase.from('parties').select('*', { count: 'exact', head: true }),
      
      // Active promoters
      supabase.from('promoters').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      
      // Pending contracts
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      
      // Recent contracts (last 7 days)
      supabase.from('contracts').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]

    console.log('🔍 Dashboard stats: Executing queries...')
    const results = await Promise.all(queries.map(async (query, index) => {
      try {
        const result = await query
        console.log(`🔍 Dashboard stats: Query ${index} result:`, { count: result.count, error: result.error?.message })
        return result
      } catch (error) {
        console.error(`🔍 Dashboard stats: Query ${index} failed:`, error)
        return { count: 0, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }))

    // Extract results
    const [
      contractsResult,
      promotersResult,
      partiesResult,
      activePromotersResult,
      pendingContractsResult,
      recentContractsResult
    ] = results

    // Check for errors
    const errors = results.filter((r: any) => r.error).map((r: any) => r.error)
    if (errors.length > 0) {
      console.error('🔍 Dashboard stats: Database errors:', errors)
      return NextResponse.json({ 
        error: 'Database query errors', 
        details: errors 
      }, { status: 500 })
    }

    // Build stats object
    const stats = {
      // Core metrics
      totalContracts: contractsResult.count || 0,
      activeContracts: 0, // Will be calculated from status
      pendingContracts: pendingContractsResult.count || 0,
      completedContracts: 0, // Will be calculated from status
      totalPromoters: promotersResult.count || 0,
      activePromoters: activePromotersResult.count || 0,
      totalParties: partiesResult.count || 0,
      pendingApprovals: pendingContractsResult.count || 0,
      recentActivity: recentContractsResult.count || 0,
      
      // Document expiry alerts (simplified)
      expiringDocuments: 0,
      expiringIds: 0,
      expiringPassports: 0,
      
      // Status breakdown
      contractsByStatus: { active: 0, pending: pendingContractsResult.count || 0, completed: 0, cancelled: 0 },
      
      // Monthly trends
      monthlyData: [],
      
      // Health metrics
      systemHealth: 98,
      
      // Growth metrics
      contractGrowth: 0,
      promoterGrowth: 0,
      
      // Performance indicators
      avgProcessingTime: '0',
      completionRate: 0
    }

    console.log('🔍 Dashboard stats: Final stats:', stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('🔍 Dashboard stats: Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
