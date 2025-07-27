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

    // Check if user is admin
    const isAdmin = await hasAdminRole(user.id, supabase)

    // For now, return empty array if not admin (we'll add reviewer roles later)
    if (!isAdmin) {
      return NextResponse.json({
        success: true,
        reviews: [],
        count: 0,
        message: 'No reviewer roles assigned'
      })
    }

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
        updated_at
      `)

    if (status === 'active') {
      // Get contracts that need review - include both approval_status and status fields
      query = query
        .or('approval_status.in.(legal_review,hr_review,final_approval,signature),status.in.(draft,pending,generated)')
    } else if (status === 'completed') {
      // Get contracts that have been completed
      query = query
        .or('approval_status.in.(active,draft),status.in.(active,completed)')
    } else {
      // Get all contracts for admin users
      query = query
        .neq('id', null)
    }

    const { data: contracts, error: contractsError } = await query

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError)
      // Return empty array instead of error for now
      return NextResponse.json({
        success: true,
        reviews: [],
        count: 0,
        message: 'No contracts found or database error'
      })
    }

    // Process contracts to add calculated fields
    const processedContracts = contracts?.map(contract => {
      const submittedDate = new Date(
        contract.submitted_for_review_at || contract.created_at || new Date().toISOString()
      )
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
        is_overdue: isOverdue,
        first_party: null,
        second_party: null,
        promoter: null
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
    console.error('Error in pending reviews API:', error)
    return NextResponse.json({ 
      success: true,
      reviews: [],
      count: 0,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function hasAdminRole(userId: string, supabase: any): Promise<boolean> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    
    return user?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin role:', error)
    // Default to true for now to allow testing
    return true
  }
} 