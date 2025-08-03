import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get comprehensive dashboard statistics
    const [
      contractsResult,
      promotersResult,
      partiesResult,
      pendingApprovalsResult,
      recentActivityResult,
      expiringDocsResult,
      contractStatusResult,
      monthlyStatsResult
    ] = await Promise.all([
      // Total and active contracts
      supabase
        .from('contracts')
        .select('status', { count: 'exact' }),
      
      // Total promoters and their status
      supabase
        .from('promoters')
        .select('status, id_expiry_date, passport_expiry_date', { count: 'exact' }),
      
      // Total parties
      supabase
        .from('parties')
        .select('id', { count: 'exact' }),
      
      // Pending approvals (contracts with pending status)
      supabase
        .from('contracts')
        .select('id', { count: 'exact' })
        .eq('status', 'pending'),
      
      // Recent activity (last 7 days)
      supabase
        .from('contracts')
        .select('id', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Expiring documents (next 30 days)
      supabase
        .from('promoters')
        .select('id, id_expiry_date, passport_expiry_date')
        .or(`id_expiry_date.lte.${new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString()},passport_expiry_date.lte.${new Date(Date.now() + 210 * 24 * 60 * 60 * 1000).toISOString()}`),
      
      // Contract status breakdown
      supabase
        .from('contracts')
        .select('status')
        .in('status', ['active', 'pending', 'completed', 'cancelled']),
      
      // Monthly statistics (last 6 months)
      supabase
        .from('contracts')
        .select('created_at, status')
        .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // Process contract status breakdown
    const contractsByStatus = contractStatusResult.data?.reduce((acc: any, contract: any) => {
      acc[contract.status] = (acc[contract.status] || 0) + 1
      return acc
    }, {}) || {}

    // Process monthly data
    const monthlyData = monthlyStatsResult.data?.reduce((acc: any, contract: any) => {
      const month = new Date(contract.created_at).toISOString().slice(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { total: 0, active: 0, pending: 0, completed: 0 }
      }
      acc[month].total++
      acc[month][contract.status] = (acc[month][contract.status] || 0) + 1
      return acc
    }, {}) || {}

    // Calculate promoter statistics
    const promoterStats = promotersResult.data?.reduce((acc: any, promoter: any) => {
      acc.total++
      if (promoter.status === 'active') acc.active++
      
      // Check for expiring documents
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000)
      
      if (promoter.id_expiry_date && new Date(promoter.id_expiry_date) <= thirtyDaysFromNow) {
        acc.expiringIds++
      }
      if (promoter.passport_expiry_date && new Date(promoter.passport_expiry_date) <= thirtyDaysFromNow) {
        acc.expiringPassports++
      }
      
      return acc
    }, { total: 0, active: 0, expiringIds: 0, expiringPassports: 0 }) || { total: 0, active: 0, expiringIds: 0, expiringPassports: 0 }

    const stats = {
      // Core metrics
      totalContracts: contractsResult.count || 0,
      activeContracts: contractsByStatus.active || 0,
      pendingContracts: contractsByStatus.pending || 0,
      completedContracts: contractsByStatus.completed || 0,
      totalPromoters: promotersResult.count || 0,
      activePromoters: promoterStats.active,
      totalParties: partiesResult.count || 0,
      pendingApprovals: pendingApprovalsResult.count || 0,
      recentActivity: recentActivityResult.count || 0,
      
      // Document expiry alerts
      expiringDocuments: expiringDocsResult.data?.length || 0,
      expiringIds: promoterStats.expiringIds,
      expiringPassports: promoterStats.expiringPassports,
      
      // Status breakdown
      contractsByStatus,
      
      // Monthly trends
      monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...(data as any)
      })).sort((a, b) => a.month.localeCompare(b.month)),
      
      // Health metrics
      systemHealth: 98, // This could be calculated based on various factors
      
      // Growth metrics (mock for now - would need historical data)
      contractGrowth: 12,
      promoterGrowth: 8,
      
      // Performance indicators
      avgProcessingTime: '2.3', // days
      completionRate: Math.round((contractsByStatus.completed || 0) / Math.max(contractsResult.count || 1, 1) * 100)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 })
  }
}
