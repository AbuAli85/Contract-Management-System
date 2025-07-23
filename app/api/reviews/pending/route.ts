import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's reviewer roles
    const { data: userRoles } = await supabase
      .from('reviewer_roles')
      .select('role_type')
      .eq('user_id', user.id)
      .eq('is_active', true)

    const userRoleTypes = userRoles?.map(role => role.role_type) || []

    // Build query based on status
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
        promoter:promoters!contracts_promoter_id_fkey(name_en, name_ar)
      `)

    if (status === 'active') {
      // Get contracts that need review by current user
      query = query
        .eq('current_reviewer_id', user.id)
        .in('approval_status', ['legal_review', 'hr_review', 'final_approval', 'signature'])
    } else if (status === 'completed') {
      // Get contracts that have been reviewed by current user
      query = query
        .in('approval_status', ['active', 'draft'])
        .not('current_reviewer_id', 'is', null)
    } else {
      // Get all contracts for admin users
      if (!await hasAdminRole(user.id, supabase)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    const { data: contracts, error: contractsError } = await query

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError)
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
    }

    // Process contracts to add calculated fields
    const processedContracts = contracts?.map(contract => {
      const submittedDate = new Date(contract.submitted_for_review_at || contract.created_at)
      const now = new Date()
      const daysPending = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Determine priority based on days pending and contract type
      let priority: 'high' | 'medium' | 'normal' = 'normal'
      if (daysPending > 7) priority = 'high'
      else if (daysPending > 3) priority = 'medium'

      // Check if overdue (more than 5 days)
      const isOverdue = daysPending > 5

      return {
        ...contract,
        days_pending: daysPending,
        priority,
        is_overdue: isOverdue
      }
    }) || []

    // Sort by priority and days pending
    processedContracts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, normal: 1 }
      const aPriority = priorityOrder[a.priority] || 1
      const bPriority = priorityOrder[b.priority] || 1
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      return b.days_pending - a.days_pending
    })

    return NextResponse.json({
      success: true,
      reviews: processedContracts,
      count: processedContracts.length
    })

  } catch (error) {
    console.error('Error fetching pending reviews:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function hasAdminRole(userId: string, supabase: any): Promise<boolean> {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  return user?.role === 'admin'
} 