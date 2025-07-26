import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Fetch contract statistics
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id, status, created_at')

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch contract data' 
      }, { status: 500 })
    }

    // Fetch promoter statistics
    const { count: totalPromoters, error: promotersError } = await supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true })

    if (promotersError) {
      console.error('Error fetching promoters:', promotersError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch promoter data' 
      }, { status: 500 })
    }

    // Fetch party statistics
    const { count: totalParties, error: partiesError } = await supabase
      .from('parties')
      .select('*', { count: 'exact', head: true })

    if (partiesError) {
      console.error('Error fetching parties:', partiesError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch party data' 
      }, { status: 500 })
    }

    // Fetch pending user approvals
    const { data: pendingUsers, error: usersError } = await supabase
      .from('users')
      .select('id, status')
      .eq('status', 'pending')

    if (usersError) {
      console.error('Error fetching pending users:', usersError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch user data' 
      }, { status: 500 })
    }

    // Calculate statistics
    const totalContracts = contracts?.length || 0
    const activeContracts = contracts?.filter(c => c.status === 'active').length || 0
    const pendingContracts = contracts?.filter(c => c.status === 'pending').length || 0
    const pendingApprovals = pendingUsers?.length || 0

    // Calculate system health (simplified)
    const systemHealth = 98 // This could be calculated based on actual system metrics

    // Calculate recent activity (last 24 hours)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    
    const recentActivity = contracts?.filter(c => 
      c.created_at && new Date(c.created_at) > oneDayAgo
    ).length || 0

    const analytics = {
      totalContracts,
      activeContracts,
      pendingContracts,
      totalPromoters: totalPromoters || 0,
      totalParties: totalParties || 0,
      pendingApprovals,
      systemHealth,
      recentActivity
    }

    return NextResponse.json({
      success: true,
      data: analytics
    })

  } catch (error) {
    console.error('Dashboard analytics error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 