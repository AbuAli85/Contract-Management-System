import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

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
      return NextResponse.json({ error: 'Only admins can view user activity logs' }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const action = searchParams.get('action')
    const resourceType = searchParams.get('resourceType')
    const userId = searchParams.get('userId')

    // Build query
    let query = supabase
      .from('user_activity_log')
      .select(`
        id,
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at,
        users!user_activity_log_user_id_fkey(
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (action) {
      query = query.eq('action', action)
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: activities, error } = await query

    if (error) {
      console.error('Error fetching user activities:', error)
      return NextResponse.json({ error: 'Failed to fetch user activities' }, { status: 500 })
    }

    // Transform data to include user information
    const transformedActivities = activities?.map(activity => ({
      id: activity.id,
      user_id: activity.user_id,
      user_email: activity.users?.email || 'Unknown',
      user_name: activity.users?.full_name || 'Unknown User',
      action: activity.action,
      resource_type: activity.resource_type,
      resource_id: activity.resource_id,
      details: activity.details,
      ip_address: activity.ip_address,
      user_agent: activity.user_agent,
      created_at: activity.created_at
    })) || []

    return NextResponse.json({ 
      success: true,
      activities: transformedActivities,
      total: transformedActivities.length,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error in GET /api/users/activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 