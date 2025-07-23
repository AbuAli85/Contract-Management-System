import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
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
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Fetch contract statistics
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*')

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError)
      return NextResponse.json({ error: 'Failed to fetch contract data' }, { status: 500 })
    }

    // Fetch promoter statistics
    const { data: promoters, error: promotersError } = await supabase
      .from('promoters')
      .select('*')

    if (promotersError) {
      console.error('Error fetching promoters:', promotersError)
      return NextResponse.json({ error: 'Failed to fetch promoter data' }, { status: 500 })
    }

    // Fetch party statistics
    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select('*')

    if (partiesError) {
      console.error('Error fetching parties:', partiesError)
      return NextResponse.json({ error: 'Failed to fetch party data' }, { status: 500 })
    }

    // Calculate contract statistics
    const totalContracts = contracts?.length || 0
    const pendingContracts = contracts?.filter(c => c.status === 'draft' || c.status === 'pending').length || 0
    const completedContracts = contracts?.filter(c => c.status === 'active' || c.status === 'generated').length || 0
    const failedContracts = contracts?.filter(c => c.status === 'failed' || c.status === 'rejected').length || 0

    // Calculate monthly statistics
    const contractsThisMonth = contracts?.filter(c => {
      const contractDate = new Date(c.created_at)
      return contractDate >= startOfMonth
    }).length || 0

    const contractsLastMonth = contracts?.filter(c => {
      const contractDate = new Date(c.created_at)
      return contractDate >= startOfLastMonth && contractDate <= endOfLastMonth
    }).length || 0

    // Calculate average processing time (simplified)
    const completedContractDates = contracts
      ?.filter(c => c.status === 'active' && c.created_at && c.generated_at)
      .map(c => {
        const created = new Date(c.created_at)
        const generated = new Date(c.generated_at)
        return (generated.getTime() - created.getTime()) / (1000 * 60 * 60) // hours
      }) || []

    const averageProcessingTime = completedContractDates.length > 0 
      ? completedContractDates.reduce((sum, time) => sum + time, 0) / completedContractDates.length
      : 0

    // Calculate success rate
    const successRate = totalContracts > 0 
      ? ((completedContracts / totalContracts) * 100)
      : 0

    // Calculate revenue (if contract_value is available)
    const totalRevenue = contracts
      ?.filter(c => c.contract_value && c.status === 'active')
      .reduce((sum, c) => sum + (c.contract_value || 0), 0) || 0

    const revenueThisMonth = contracts
      ?.filter(c => {
        const contractDate = new Date(c.created_at)
        return contractDate >= startOfMonth && c.contract_value && c.status === 'active'
      })
      .reduce((sum, c) => sum + (c.contract_value || 0), 0) || 0

    const revenueLastMonth = contracts
      ?.filter(c => {
        const contractDate = new Date(c.created_at)
        return contractDate >= startOfLastMonth && contractDate <= endOfLastMonth && c.contract_value && c.status === 'active'
      })
      .reduce((sum, c) => sum + (c.contract_value || 0), 0) || 0

    // Calculate growth percentage
    const growthPercentage = revenueLastMonth > 0 
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : 0

    // Calculate promoter statistics
    const activePromoters = promoters?.filter(p => p.status === 'active').length || 0
    const totalPromoters = promoters?.length || 0

    // Calculate party statistics
    const activeParties = parties?.filter(p => p.status === 'Active').length || 0
    const totalParties = parties?.length || 0

    // Prepare monthly trends data
    const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(now.getFullYear(), i, 1)
      const monthContracts = contracts?.filter(c => {
        const contractDate = new Date(c.created_at)
        return contractDate.getMonth() === i && contractDate.getFullYear() === now.getFullYear()
      }).length || 0
      
      const monthRevenue = contracts
        ?.filter(c => {
          const contractDate = new Date(c.created_at)
          return contractDate.getMonth() === i && contractDate.getFullYear() === now.getFullYear() && c.contract_value && c.status === 'active'
        })
        .reduce((sum, c) => sum + (c.contract_value || 0), 0) || 0

      return {
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        contracts: monthContracts,
        revenue: monthRevenue
      }
    })

    // Prepare status distribution
    const statusDistribution = [
      { name: 'Active', value: completedContracts },
      { name: 'Pending', value: pendingContracts },
      { name: 'Failed', value: failedContracts }
    ]

    // Prepare recent activity (last 10 contracts)
    const recentActivity = contracts
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        action: 'Contract Created',
        resource: c.contract_number || `Contract ${c.id.slice(0, 8)}`,
        timestamp: c.created_at,
        status: c.status
      })) || []

    // Calculate upcoming expirations (contracts expiring in next 30 days)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const upcomingExpirations = contracts?.filter(c => {
      if (!c.contract_end_date) return false
      const endDate = new Date(c.contract_end_date)
      return endDate <= thirtyDaysFromNow && endDate >= now && c.status === 'active'
    }).length || 0

    const analytics = {
      total_contracts: totalContracts,
      pending_contracts: pendingContracts,
      completed_contracts: completedContracts,
      failed_contracts: failedContracts,
      contracts_this_month: contractsThisMonth,
      contracts_last_month: contractsLastMonth,
      average_processing_time: Math.round(averageProcessingTime * 100) / 100, // Round to 2 decimal places
      success_rate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
      active_contracts: completedContracts,
      generated_contracts: completedContracts,
      draft_contracts: pendingContracts,
      expired_contracts: contracts?.filter(c => c.status === 'expired').length || 0,
      total_parties: totalParties,
      total_promoters: totalPromoters,
      active_promoters: activePromoters,
      active_parties: activeParties,
      revenue_this_month: revenueThisMonth,
      revenue_last_month: revenueLastMonth,
      total_revenue: totalRevenue,
      growth_percentage: Math.round(growthPercentage * 100) / 100, // Round to 2 decimal places
      upcoming_expirations: upcomingExpirations,
      monthly_trends: monthlyTrends,
      status_distribution: statusDistribution,
      recent_activity: recentActivity
    }

    return NextResponse.json({
      success: true,
      analytics
    })
  } catch (error) {
    console.error('Dashboard analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 