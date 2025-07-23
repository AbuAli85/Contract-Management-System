import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const role = searchParams.get('role')
    const status = searchParams.get('status') || 'active'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's reviewer roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('reviewer_roles')
      .select('role_type')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 })
    }

    const userRoleTypes = userRoles?.map(role => role.role_type) || []

    // If no reviewer roles, return empty results
    if (userRoleTypes.length === 0) {
      return NextResponse.json({
        reviews: [],
        total: 0,
        pagination: {
          limit,
          offset,
          total: 0
        }
      })
    }

    // Build query for pending reviews
    let query = supabase
      .from('contracts')
      .select(`
        id,
        contract_number,
        job_title,
        contract_type,
        approval_status,
        submitted_for_review_at,
        current_reviewer_id,
        created_at,
        updated_at,
        first_party:parties!contracts_first_party_id_fkey(name_en, name_ar),
        second_party:parties!contracts_second_party_id_fkey(name_en, name_ar),
        promoter:promoters(name_en, name_ar)
      `, { count: 'exact' })

    // Filter by current reviewer
    query = query.eq('current_reviewer_id', user.id)

    // Filter by approval status based on user roles
    const statusFilter = []
    if (userRoleTypes.includes('legal_reviewer')) {
      statusFilter.push('legal_review')
    }
    if (userRoleTypes.includes('hr_reviewer')) {
      statusFilter.push('hr_review')
    }
    if (userRoleTypes.includes('final_approver')) {
      statusFilter.push('final_approval')
    }
    if (userRoleTypes.includes('signatory')) {
      statusFilter.push('signature')
    }

    if (statusFilter.length > 0) {
      query = query.in('approval_status', statusFilter)
    }

    // Filter by specific role if provided
    if (role && userRoleTypes.includes(role)) {
      const roleStatusMap: { [key: string]: string } = {
        'legal_reviewer': 'legal_review',
        'hr_reviewer': 'hr_review',
        'final_approver': 'final_approval',
        'signatory': 'signature'
      }
      query = query.eq('approval_status', roleStatusMap[role])
    }

    // Filter by status
    if (status === 'active') {
      query = query.not('approval_status', 'in', ['draft', 'rejected', 'active'])
    } else if (status === 'overdue') {
      // Get overdue contracts (submitted more than X days ago)
      const overdueDate = new Date()
      overdueDate.setDate(overdueDate.getDate() - 3) // 3 days overdue
      query = query.lt('submitted_for_review_at', overdueDate.toISOString())
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1)

    // Order by priority (overdue first, then by submission date)
    query = query.order('submitted_for_review_at', { ascending: true })

    const { data: reviews, error: reviewsError, count } = await query

    if (reviewsError) {
      console.error('Error fetching pending reviews:', reviewsError)
      return NextResponse.json({ error: 'Failed to fetch pending reviews' }, { status: 500 })
    }

    // Calculate days pending and priority for each review
    const enrichedReviews = reviews?.map(review => {
      const submittedDate = new Date(review.submitted_for_review_at || review.created_at)
      const now = new Date()
      const daysPending = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24))
      
      let priority = 'normal'
      if (daysPending > 5) priority = 'high'
      else if (daysPending > 3) priority = 'medium'

      return {
        ...review,
        days_pending: daysPending,
        priority,
        is_overdue: daysPending > 3
      }
    }) || []

    // Sort by priority (high first, then medium, then normal)
    enrichedReviews.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, normal: 1 }
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
    })

    return NextResponse.json({
      reviews: enrichedReviews,
      total: count || 0,
      pagination: {
        limit,
        offset,
        total: count || 0,
        has_more: (count || 0) > offset + limit
      },
      user_roles: userRoleTypes,
      filters: {
        role,
        status,
        applied_roles: userRoleTypes
      }
    })

  } catch (error) {
    console.error('Error in pending reviews API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 