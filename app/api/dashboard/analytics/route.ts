import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Cache analytics data for 5 minutes to reduce database load
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
let analyticsCache: any = null
let cacheTimestamp: number = 0

export async function GET() {
  try {
    // Check if we have valid cached data
    const now = Date.now()
    if (analyticsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('📊 Returning cached analytics data')
      return NextResponse.json({
        success: true,
        analytics: analyticsCache,
        cached: true
      })
    }

    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, ...options }) => {
                cookieStore.set(name, value, options as { path?: string; domain?: string; maxAge?: number; secure?: boolean; httpOnly?: boolean; sameSite?: 'strict' | 'lax' | 'none' })
              })
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current date and calculate date ranges
    const currentDate = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const startOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    const endOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)

    // Use optimized queries with specific column selection and limits
    console.log('📊 Fetching analytics data...')

    // Fetch all data in parallel for better performance
    const [contractsResult, promotersResult, partiesResult] = await Promise.all([
      supabase
        .from('contracts')
        .select('id, status, created_at, contract_value, contract_end_date, generated_at')
        .order('created_at', { ascending: false })
        .limit(1000), // Limit to prevent excessive data loading
      
      supabase
        .from('promoters')
        .select('id, status')
        .limit(1000),
      
      supabase
        .from('parties')
        .select('id, status')
        .limit(1000)
    ])

    if (contractsResult.error) {
      console.error('Error fetching contracts:', contractsResult.error)
      return NextResponse.json({ error: 'Failed to fetch contract data' }, { status: 500 })
    }

    if (promotersResult.error) {
      console.error('Error fetching promoters:', promotersResult.error)
      return NextResponse.json({ error: 'Failed to fetch promoter data' }, { status: 500 })
    }

    if (partiesResult.error) {
      console.error('Error fetching parties:', partiesResult.error)
      return NextResponse.json({ error: 'Failed to fetch party data' }, { status: 500 })
    }

    const contracts = contractsResult.data || []
    const promoters = promotersResult.data || []
    const parties = partiesResult.data || []

    // Calculate statistics efficiently
    const totalContracts = contracts.length
    const pendingContracts = contracts.filter(c => c.status === 'draft' || c.status === 'pending').length
    const completedContracts = contracts.filter(c => c.status === 'active' || c.status === 'generated').length
    const failedContracts = contracts.filter(c => c.status === 'failed' || c.status === 'rejected').length

    // Calculate monthly statistics
    const contractsThisMonth = contracts.filter(c => {
      const contractDate = new Date(c.created_at)
      return contractDate >= startOfMonth
    }).length

    const contractsLastMonth = contracts.filter(c => {
      const contractDate = new Date(c.created_at)
      return contractDate >= startOfLastMonth && contractDate <= endOfLastMonth
    }).length

    // Calculate average processing time (simplified)
    const completedContractDates = contracts
      .filter(c => c.status === 'active' && c.created_at && c.generated_at)
      .map(c => {
        const created = new Date(c.created_at)
        const generated = new Date(c.generated_at)
        return (generated.getTime() - created.getTime()) / (1000 * 60 * 60) // hours
      })

    const averageProcessingTime = completedContractDates.length > 0 
      ? completedContractDates.reduce((sum, time) => sum + time, 0) / completedContractDates.length
      : 0

    // Calculate success rate
    const successRate = totalContracts > 0 
      ? ((completedContracts / totalContracts) * 100)
      : 0

    // Calculate revenue (if contract_value is available)
    const totalRevenue = contracts
      .filter(c => c.contract_value && c.status === 'active')
      .reduce((sum, c) => sum + (c.contract_value || 0), 0)

    const revenueThisMonth = contracts
      .filter(c => {
        const contractDate = new Date(c.created_at)
        return contractDate >= startOfMonth && c.contract_value && c.status === 'active'
      })
      .reduce((sum, c) => sum + (c.contract_value || 0), 0)

    const revenueLastMonth = contracts
      .filter(c => {
        const contractDate = new Date(c.created_at)
        return contractDate >= startOfLastMonth && contractDate <= endOfLastMonth && c.contract_value && c.status === 'active'
      })
      .reduce((sum, c) => sum + (c.contract_value || 0), 0)

    // Calculate growth percentage
    const growthPercentage = revenueLastMonth > 0 
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : 0

    // Calculate promoter statistics
    const activePromoters = promoters.filter(p => p.status === 'active').length
    const totalPromoters = promoters.length

    // Calculate party statistics
    const activeParties = parties.filter(p => p.status === 'Active').length
    const totalParties = parties.length

    // Prepare monthly trends data (simplified for performance)
    const monthlyTrends = Array.from({ length: 6 }, (_, i) => { // Reduced from 12 to 6 months
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthContracts = contracts.filter(c => {
        const contractDate = new Date(c.created_at)
        return contractDate.getMonth() === month.getMonth() && contractDate.getFullYear() === month.getFullYear()
      }).length
      
      const monthRevenue = contracts
        .filter(c => {
          const contractDate = new Date(c.created_at)
          return contractDate.getMonth() === month.getMonth() && contractDate.getFullYear() === month.getFullYear() && c.contract_value && c.status === 'active'
        })
        .reduce((sum, c) => sum + (c.contract_value || 0), 0)

      return {
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        contracts: monthContracts,
        revenue: monthRevenue
      }
    }).reverse()

    // Prepare status distribution
    const statusDistribution = [
      { name: 'Active', value: completedContracts },
      { name: 'Pending', value: pendingContracts },
      { name: 'Failed', value: failedContracts }
    ]

    // Prepare recent activity (last 5 contracts for better performance)
    const recentActivity = contracts
      .slice(0, 5) // Reduced from 10 to 5
      .map(c => ({
        id: c.id,
        action: 'Contract Created',
        resource: `Contract ${c.id.slice(0, 8)}`,
        timestamp: c.created_at,
        status: c.status
      }))

    // Calculate upcoming expirations (contracts expiring in next 30 days)
    const thirtyDaysFromNow = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    const upcomingExpirations = contracts.filter(c => {
      if (!c.contract_end_date) return false
      const endDate = new Date(c.contract_end_date)
      return endDate <= thirtyDaysFromNow && endDate >= currentDate && c.status === 'active'
    }).length

    const analytics = {
      total_contracts: totalContracts,
      pending_contracts: pendingContracts,
      completed_contracts: completedContracts,
      failed_contracts: failedContracts,
      contracts_this_month: contractsThisMonth,
      contracts_last_month: contractsLastMonth,
      average_processing_time: Math.round(averageProcessingTime * 100) / 100,
      success_rate: Math.round(successRate * 100) / 100,
      active_contracts: completedContracts,
      generated_contracts: completedContracts,
      draft_contracts: pendingContracts,
      expired_contracts: contracts.filter(c => c.status === 'expired').length,
      total_parties: totalParties,
      total_promoters: totalPromoters,
      active_promoters: activePromoters,
      active_parties: activeParties,
      revenue_this_month: revenueThisMonth,
      revenue_last_month: revenueLastMonth,
      total_revenue: totalRevenue,
      growth_percentage: Math.round(growthPercentage * 100) / 100,
      upcoming_expirations: upcomingExpirations,
      monthly_trends: monthlyTrends,
      status_distribution: statusDistribution,
      recent_activity: recentActivity
    }

    // Cache the results
    analyticsCache = analytics
    cacheTimestamp = now

    console.log('📊 Analytics data fetched and cached successfully')

    return NextResponse.json({
      success: true,
      analytics,
      cached: false
    })
  } catch (error) {
    console.error('Dashboard analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 