import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can view user status' }, { status: 403 })
    }

    // Fetch all users to see their status
    const { data: allUsers, error } = await supabase
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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Also check auth.users table
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers()

    // Count users by status
    const statusCounts = allUsers?.reduce((acc, user) => {
      acc[user.status] = (acc[user.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({ 
      success: true,
      totalUsers: allUsers?.length || 0,
      statusCounts,
      allUsers: allUsers || [],
      authUsersCount: authUsers?.users?.length || 0,
      authUsers: authUsers?.users?.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        email_confirmed_at: u.email_confirmed_at
      })) || []
    })

  } catch (error) {
    console.error('Error in GET /api/test-users-status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 