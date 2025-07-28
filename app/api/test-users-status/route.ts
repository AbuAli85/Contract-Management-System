import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Please log in' 
      }, { status: 401 })
    }

    console.log('🔍 Testing user status for user:', session.user.email)

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user profile'
      }, { status: 500 })
    }

    // Get total users count
    const { count: totalUsers, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Users count error:', countError)
      return NextResponse.json({
        success: false,
        error: 'Failed to get users count'
      }, { status: 500 })
    }

    // Get pending users (users with 'pending' status)
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (pendingError) {
      console.error('❌ Pending users fetch error:', pendingError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch pending users'
      }, { status: 500 })
    }

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentUsers, error: recentError } = await supabase
      .from('profiles')
      .select('*')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (recentError) {
      console.error('❌ Recent users fetch error:', recentError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch recent users'
      }, { status: 500 })
    }

    // Get users by role
    const { data: usersByRole, error: roleError } = await supabase
      .from('profiles')
      .select('role')

    if (roleError) {
      console.error('❌ Users by role fetch error:', roleError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users by role'
      }, { status: 500 })
    }

    // Count users by role (filter out null roles)
    const roleCounts = usersByRole?.reduce((acc: Record<string, number>, user: { role: string | null }) => {
      if (user.role) {
        acc[user.role] = (acc[user.role] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    const result = {
      success: true,
      data: {
        currentUser: {
          id: session.user.id,
          email: session.user.email,
          profile: profile
        },
        statistics: {
          totalUsers: totalUsers || 0,
          pendingUsers: pendingUsers?.length || 0,
          recentUsers: recentUsers?.length || 0,
          roleCounts: roleCounts
        },
        pendingUsers: pendingUsers?.slice(0, 10) || [], // Limit to 10 for performance
        recentUsers: recentUsers?.slice(0, 10) || [] // Limit to 10 for performance
      },
      message: 'User status test completed successfully'
    }

    console.log('✅ User status test result:', {
      totalUsers: result.data.statistics.totalUsers,
      pendingUsers: result.data.statistics.pendingUsers,
      recentUsers: result.data.statistics.recentUsers,
      roleCounts: result.data.statistics.roleCounts
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Test users status error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 