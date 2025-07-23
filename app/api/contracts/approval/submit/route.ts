import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { contractId: string } }
) {
  try {
    const supabase = await createClient()
    const { contractId } = params
    const body = await request.json()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (contractError || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Check if user can submit this contract for review
    if (contract.created_by !== user.id && !await hasAdminRole(user.id, supabase)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if contract is in draft status
    if (contract.approval_status !== 'draft') {
      return NextResponse.json({ 
        error: 'Contract must be in draft status to submit for review',
        current_status: contract.approval_status 
      }, { status: 400 })
    }

    // Get workflow configuration
    const { data: workflowConfig } = await supabase
      .from('workflow_config')
      .select('config_data')
      .eq('config_name', 'default_routing_rules')
      .eq('is_active', true)
      .single()

    const routingRules = workflowConfig?.config_data || {
      parallel_reviews: true,
      auto_assign_reviewers: true,
      require_both_legal_hr: true
    }

    // Get next reviewer (legal reviewer first)
    const { data: legalReviewer } = await supabase
      .from('reviewer_roles')
      .select('user_id')
      .eq('role_type', 'legal_reviewer')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!legalReviewer) {
      return NextResponse.json({ 
        error: 'No legal reviewer assigned. Please contact administrator.' 
      }, { status: 400 })
    }

    // Update contract status to legal review
    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update({
        approval_status: 'legal_review',
        current_reviewer_id: legalReviewer.user_id,
        submitted_for_review_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating contract status:', updateError)
      return NextResponse.json({ error: 'Failed to submit contract for review' }, { status: 500 })
    }

    // Create approval record
    const { error: approvalError } = await supabase
      .from('contract_approvals')
      .insert({
        contract_id: contractId,
        reviewer_id: legalReviewer.user_id,
        review_stage: 'legal_review',
        action: 'submitted_for_review',
        comments: body.notes || 'Contract submitted for legal review'
      })

    if (approvalError) {
      console.error('Error creating approval record:', approvalError)
      // Don't fail the request if approval record creation fails
    }

    // Send notification to legal reviewer
    await sendReviewNotification(legalReviewer.user_id, contractId, 'legal_review', supabase)

    return NextResponse.json({
      success: true,
      contract: updatedContract,
      message: 'Contract submitted for legal review successfully',
      next_reviewer_id: legalReviewer.user_id
    })

  } catch (error) {
    console.error('Error submitting contract for approval:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to check if user has admin role
async function hasAdminRole(userId: string, supabase: any): Promise<boolean> {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  return user?.role === 'admin'
}

// Helper function to send review notifications
async function sendReviewNotification(
  reviewerId: string, 
  contractId: string, 
  reviewStage: string, 
  supabase: any
) {
  try {
    // Get reviewer details
    const { data: reviewer } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', reviewerId)
      .single()

    // Get contract details
    const { data: contract } = await supabase
      .from('contracts')
      .select('contract_number, job_title')
      .eq('id', contractId)
      .single()

    if (reviewer && contract) {
      // Send email notification (implement your email service here)
      console.log(`Sending notification to ${reviewer.email} for contract ${contract.contract_number}`)
      
      // Send Slack notification if configured
      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🔍 New contract review required: ${contract.contract_number} (${contract.job_title})`,
            reviewer: reviewer.full_name || reviewer.email,
            stage: reviewStage,
            contract_id: contractId
          })
        })
      }
    }
  } catch (error) {
    console.error('Error sending notification:', error)
    // Don't fail the main request if notification fails
  }
} 