import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WebhookService } from '@/lib/webhook-service';
import { withRBAC } from '@/lib/rbac/guard';

export const POST = withRBAC(
  'contract:approve:all',
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const body = await request.json();
      const { contractId, action, comments } = body;

      if (!contractId || !action) {
        return NextResponse.json(
          {
            error: 'Contract ID and action are required',
          },
          { status: 400 }
        );
      }

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get contract details
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (contractError || !contract) {
        return NextResponse.json(
          { error: 'Contract not found' },
          { status: 404 }
        );
      }

      // Check if user is the current reviewer
      if (
        contract.current_reviewer_id &&
        contract.current_reviewer_id !== user.id &&
        !(await hasAdminRole(user.id, supabase))
      ) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Validate action
      const validActions = ['approved', 'rejected', 'requested_changes'];
      if (!validActions.includes(action)) {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      // Determine next status based on current status and action
      const nextStatus = determineNextStatus(
        contract.approval_status || 'draft',
        action
      );

      // Get next reviewer if needed
      let nextReviewerId = null;
      if (nextStatus && nextStatus !== 'active' && nextStatus !== 'draft') {
        nextReviewerId = await getNextReviewer(nextStatus, supabase);
      }

      // Update contract status
      const updateData: any = {
        approval_status: nextStatus,
        updated_at: new Date().toISOString(),
      };

      if (nextReviewerId) {
        updateData.current_reviewer_id = nextReviewerId;
      }

      if (action === 'approved' && nextStatus === 'active') {
        updateData.approved_at = new Date().toISOString();
      } else if (action === 'rejected') {
        updateData.rejected_at = new Date().toISOString();
        updateData.rejection_reason = comments;
      }

      const { data: updatedContract, error: updateError } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contractId)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating contract status:', updateError);
        return NextResponse.json(
          { error: 'Failed to update contract status' },
          { status: 500 }
        );
      }

      // If contract is now active (fully approved), trigger PDF generation and email sending
      if (action === 'approved' && nextStatus === 'active') {
        try {
          // Fetch full contract details for webhook
          const { data: fullContract } = await supabase
            .from('contracts')
            .select('*')
            .eq('id', contractId)
            .single();
          // Trigger PDF generation and email via webhook
          await WebhookService.processContract(fullContract);
          // Log notification for follow-up
          await supabase.from('notifications').insert({
            user_id: contract.created_by,
            type: 'contract_pdf_processing',
            title: 'Contract PDF and Email Processing',
            message:
              'PDF generation and email sending to client and employer has started.',
            data: { contract_id: contractId },
          });
        } catch (err) {
          console.error('Error triggering PDF/email webhook:', err);
          // Optionally, log a notification for failure
          await supabase.from('notifications').insert({
            user_id: contract.created_by,
            type: 'contract_pdf_error',
            title: 'Contract PDF/Email Error',
            message:
              'There was an error starting PDF generation or email sending.',
            data: {
              contract_id: contractId,
              error: err instanceof Error ? err.message : String(err),
            },
          });
        }
      }

      // Create approval record
      const { error: approvalError } = await supabase
        .from('contract_approvals')
        .insert({
          contract_id: contractId,
          reviewer_id: user.id,
          status: contract.approval_status || 'unknown',
          comments: comments || null,
          created_at: new Date().toISOString(),
        });

      if (approvalError) {
        console.error('Error creating approval record:', approvalError);
        return NextResponse.json(
          { error: 'Failed to create approval record' },
          { status: 500 }
        );
      }

      // Send notification to next reviewer if applicable
      if (nextReviewerId && nextReviewerId !== user.id) {
        await sendReviewNotification(
          nextReviewerId,
          contractId,
          nextStatus,
          supabase
        );
      }

      // Create audit log
      await createAuditLog(
        user.id,
        `contract_${action}`,
        'contracts',
        contractId,
        {
          previous_status: contract.approval_status,
          new_status: nextStatus,
          action,
          comments,
          next_reviewer_id: nextReviewerId,
        },
        supabase
      );

      return NextResponse.json({
        success: true,
        message: `Contract ${action} successfully`,
        data: {
          contract_id: contractId,
          new_status: nextStatus,
          next_reviewer_id: nextReviewerId,
        },
      });
    } catch (error) {
      console.error('Error approving contract:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);

function determineNextStatus(currentStatus: string, action: string): string {
  if (action === 'rejected') {
    return 'draft';
  }

  if (action === 'requested_changes') {
    return 'draft';
  }

  switch (currentStatus) {
    case 'legal_review':
      return action === 'approved' ? 'hr_review' : 'draft';
    case 'hr_review':
      return action === 'approved' ? 'final_approval' : 'draft';
    case 'final_approval':
      return action === 'approved' ? 'signature' : 'draft';
    case 'signature':
      return action === 'approved' ? 'active' : 'draft';
    default:
      return 'draft';
  }
}

async function getNextReviewer(
  status: string,
  supabase: any
): Promise<string | null> {
  let roleType = '';

  switch (status) {
    case 'hr_review':
      roleType = 'hr_reviewer';
      break;
    case 'final_approval':
      roleType = 'final_approver';
      break;
    case 'signature':
      roleType = 'signatory';
      break;
    default:
      return null;
  }

  const { data: reviewer } = await supabase
    .from('reviewer_roles')
    .select('user_id')
    .eq('role_type', roleType)
    .eq('is_active', true)
    .limit(1)
    .single();

  return reviewer?.user_id || null;
}

async function hasAdminRole(userId: string, supabase: any): Promise<boolean> {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  return user?.role === 'admin';
}

async function sendReviewNotification(
  reviewerId: string,
  contractId: string,
  reviewStage: string,
  supabase: any
) {
  try {
    await supabase.from('notifications').insert({
      user_id: reviewerId,
      type: 'contract_review_required',
      title: 'New Contract Review Required',
      message: `A contract has been submitted for ${reviewStage.replace('_', ' ')} review`,
      data: { contract_id: contractId, review_stage: reviewStage },
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

async function createAuditLog(
  userId: string,
  action: string,
  tableName: string,
  recordId: string,
  details: any,
  supabase: any
) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId,
      new_values: details,
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}
