import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Testing user approval system...')
    
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase client not available'
      }, { status: 500 })
    }

    // Test 1: Check if we can fetch pending users directly
    console.log('📋 Testing pending users fetch...')
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        department,
        position,
        phone,
        created_at,
        email_verified
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (pendingError) {
      console.error('❌ Error fetching pending users:', pendingError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch pending users',
        details: pendingError.message
      }, { status: 500 })
    }

    console.log('✅ Successfully fetched pending users:', pendingUsers?.length || 0)

    // Test 2: Check admin users
    console.log('👑 Testing admin users fetch...')
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .eq('role', 'admin')
      .eq('status', 'active')

    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError)
    } else {
      console.log('✅ Found admin users:', adminUsers?.length || 0)
    }

    // Test 3: Check total user counts
    console.log('📊 Testing user statistics...')
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('status, role')

    if (allUsersError) {
      console.error('❌ Error fetching all users:', allUsersError)
    } else {
      const stats = {
        total: allUsers?.length || 0,
        pending: allUsers?.filter(u => u.status === 'pending').length || 0,
        active: allUsers?.filter(u => u.status === 'active').length || 0,
        inactive: allUsers?.filter(u => u.status === 'inactive').length || 0,
        admins: allUsers?.filter(u => u.role === 'admin').length || 0,
        users: allUsers?.filter(u => u.role === 'user').length || 0,
        managers: allUsers?.filter(u => u.role === 'manager').length || 0
      }
      console.log('✅ User statistics:', stats)
    }

    return NextResponse.json({
      success: true,
      message: 'User approval system test successful',
      data: {
        pendingUsers: pendingUsers || [],
        pendingCount: pendingUsers?.length || 0,
        adminUsers: adminUsers || [],
        adminCount: adminUsers?.length || 0,
        totalUsers: allUsers?.length || 0
      }
    })

  } catch (error) {
    console.error('❌ User approval system test error:', error)
    return NextResponse.json({
      success: false,
      error: 'User approval system test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 