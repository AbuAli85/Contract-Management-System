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

    const { action, comments, next_reviewer_id } = body

    // Validate action
    if (!['approved', 'rejected', 'requested_changes'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

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

    // Check if user is the current reviewer
    if (contract.current_reviewer_id !== user.id) {
      return NextResponse.json({ error: 'You are not the current reviewer for this contract' }, { status: 403 })
    }

    // Check if user has the appropriate role for the current stage
    const currentStage = contract.approval_status
    const requiredRole = getRequiredRoleForStage(currentStage)
    
    if (!await hasReviewerRole(user.id, requiredRole, supabase)) {
      return NextResponse.json({ 
        error: `You don't have the required role (${requiredRole}) for this stage` 
      }, { status: 403 })
    }

    let newStatus: string
    let nextReviewerId: string | null = null

    // Determine next status based on current stage and action
    if (action === 'rejected') {
      newStatus = 'rejected'
    } else if (action === 'requested_changes') {
      newStatus = 'draft'
    } else {
      // Action is 'approved'
      const { status, nextReviewer } = await getNextStage(currentStage, contractId, supabase)
      newStatus = status
      nextReviewerId = nextReviewer
    }

    // Update contract status
    const updateData: any = {
      approval_status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (newStatus === 'rejected') {
      updateData.rejected_at = new Date().toISOString()
      updateData.rejection_reason = comments
      updateData.current_reviewer_id = null
    } else if (newStatus === 'draft') {
      updateData.current_reviewer_id = null
    } else {
      updateData.current_reviewer_id = nextReviewerId
      if (newStatus === 'active') {
        updateData.approved_at = new Date().toISOString()
      }
    }

    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contractId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating contract status:', updateError)
      return NextResponse.json({ error: 'Failed to update contract status' }, { status: 500 })
    }

    // Create approval record
    const { error: approvalError } = await supabase
      .from('contract_approvals')
      .insert({
        contract_id: contractId,
        reviewer_id: user.id,
        review_stage: currentStage,
        action: action,
        comments: comments
      })

    if (approvalError) {
      console.error('Error creating approval record:', approvalError)
      // Don't fail the request if approval record creation fails
    }

    // Send notifications
    if (newStatus === 'rejected') {
      await sendRejectionNotification(contract.created_by, contractId, comments, supabase)
    } else if (newStatus === 'draft') {
      await sendChangesRequestedNotification(contract.created_by, contractId, comments, supabase)
    } else if (nextReviewerId) {
      await sendReviewNotification(nextReviewerId, contractId, newStatus, supabase)
    } else if (newStatus === 'active') {
      await sendApprovalCompleteNotification(contract.created_by, contractId, supabase)
    }

    return NextResponse.json({
      success: true,
      contract: updatedContract,
      message: `Contract ${action} successfully`,
      new_status: newStatus,
      next_reviewer_id: nextReviewerId
    })

  } catch (error) {
    console.error('Error approving contract:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to get required role for a stage
function getRequiredRoleForStage(stage: string): string {
  switch (stage) {
    case 'legal_review':
      return 'legal_reviewer'
    case 'hr_review':
      return 'hr_reviewer'
    case 'final_approval':
      return 'final_approver'
    case 'signature':
      return 'signatory'
    default:
      throw new Error(`Unknown stage: ${stage}`)
  }
}

// Helper function to check if user has a specific reviewer role
async function hasReviewerRole(userId: string, roleType: string, supabase: any): Promise<boolean> {
  const { data: role } = await supabase
    .from('reviewer_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role_type', roleType)
    .eq('is_active', true)
    .single()
  
  return !!role
}

// Helper function to determine next stage
async function getNextStage(currentStage: string, contractId: string, supabase: any): Promise<{ status: string, nextReviewer: string | null }> {
  switch (currentStage) {
    case 'legal_review':
      // Check if parallel reviews are enabled
      const { data: workflowConfig } = await supabase
        .from('workflow_config')
        .select('config_data')
        .eq('config_name', 'default_routing_rules')
        .eq('is_active', true)
        .single()

      const routingRules = workflowConfig?.config_data || { parallel_reviews: true }
      
      if (routingRules.parallel_reviews) {
        // Check if HR review is already completed
        const { data: hrApproval } = await supabase
          .from('contract_approvals')
          .select('id')
          .eq('contract_id', contractId)
          .eq('review_stage', 'hr_review')
          .eq('action', 'approved')
          .single()

        if (hrApproval) {
          // Both legal and HR are approved, move to final approval
          const { data: finalApprover } = await supabase
            .from('reviewer_roles')
            .select('user_id')
            .eq('role_type', 'final_approver')
            .eq('is_active', true)
            .limit(1)
            .single()

          return {
            status: 'final_approval',
            nextReviewer: finalApprover?.user_id || null
          }
        } else {
          // Legal approved, but HR not yet approved - stay in current stage
          return {
            status: 'legal_review',
            nextReviewer: null
          }
        }
      } else {
        // Sequential reviews - move to HR review
        const { data: hrReviewer } = await supabase
          .from('reviewer_roles')
          .select('user_id')
          .eq('role_type', 'hr_reviewer')
          .eq('is_active', true)
          .limit(1)
          .single()

        return {
          status: 'hr_review',
          nextReviewer: hrReviewer?.user_id || null
        }
      }

    case 'hr_review':
      // Check if legal review is already completed
      const { data: legalApproval } = await supabase
        .from('contract_approvals')
        .select('id')
        .eq('contract_id', contractId)
        .eq('review_stage', 'legal_review')
        .eq('action', 'approved')
        .single()

      if (legalApproval) {
        // Both legal and HR are approved, move to final approval
        const { data: finalApprover } = await supabase
          .from('reviewer_roles')
          .select('user_id')
          .eq('role_type', 'final_approver')
          .eq('is_active', true)
          .limit(1)
          .single()

        return {
          status: 'final_approval',
          nextReviewer: finalApprover?.user_id || null
        }
      } else {
        // HR approved, but legal not yet approved - stay in current stage
        return {
          status: 'hr_review',
          nextReviewer: null
        }
      }

    case 'final_approval':
      // Move to signature stage
      const { data: signatory } = await supabase
        .from('reviewer_roles')
        .select('user_id')
        .eq('role_type', 'signatory')
        .eq('is_active', true)
        .limit(1)
        .single()

      return {
        status: 'signature',
        nextReviewer: signatory?.user_id || null
      }

    case 'signature':
      // Contract is fully approved
      return {
        status: 'active',
        nextReviewer: null
      }

    default:
      throw new Error(`Unknown stage: ${currentStage}`)
  }
}

// Helper function to send rejection notification
async function sendRejectionNotification(
  creatorId: string, 
  contractId: string, 
  reason: string, 
  supabase: any
) {
  try {
    const { data: creator } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', creatorId)
      .single()

    const { data: contract } = await supabase
      .from('contracts')
      .select('contract_number')
      .eq('id', contractId)
      .single()

    if (creator && contract) {
      console.log(`Sending rejection notification to ${creator.email} for contract ${contract.contract_number}`)
      
      // Send Slack notification
      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `❌ Contract rejected: ${contract.contract_number}`,
            reason: reason,
            creator: creator.full_name || creator.email
          })
        })
      }
    }
  } catch (error) {
    console.error('Error sending rejection notification:', error)
  }
}

// Helper function to send changes requested notification
async function sendChangesRequestedNotification(
  creatorId: string, 
  contractId: string, 
  changes: string, 
  supabase: any
) {
  try {
    const { data: creator } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', creatorId)
      .single()

    const { data: contract } = await supabase
      .from('contracts')
      .select('contract_number')
      .eq('id', contractId)
      .single()

    if (creator && contract) {
      console.log(`Sending changes requested notification to ${creator.email} for contract ${contract.contract_number}`)
      
      // Send Slack notification
      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `📝 Changes requested: ${contract.contract_number}`,
            changes: changes,
            creator: creator.full_name || creator.email
          })
        })
      }
    }
  } catch (error) {
    console.error('Error sending changes requested notification:', error)
  }
}

// Helper function to send review notification
async function sendReviewNotification(
  reviewerId: string, 
  contractId: string, 
  reviewStage: string, 
  supabase: any
) {
  try {
    const { data: reviewer } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', reviewerId)
      .single()

    const { data: contract } = await supabase
      .from('contracts')
      .select('contract_number, job_title')
      .eq('id', contractId)
      .single()

    if (reviewer && contract) {
      console.log(`Sending notification to ${reviewer.email} for contract ${contract.contract_number}`)
      
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
  }
}

// Helper function to send approval complete notification
async function sendApprovalCompleteNotification(
  creatorId: string, 
  contractId: string, 
  supabase: any
) {
  try {
    const { data: creator } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', creatorId)
      .single()

    const { data: contract } = await supabase
      .from('contracts')
      .select('contract_number')
      .eq('id', contractId)
      .single()

    if (creator && contract) {
      console.log(`Sending approval complete notification to ${creator.email} for contract ${contract.contract_number}`)
      
      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `✅ Contract approved: ${contract.contract_number}`,
            creator: creator.full_name || creator.email
          })
        })
      }
    }
  } catch (error) {
    console.error('Error sending approval complete notification:', error)
  }
} 