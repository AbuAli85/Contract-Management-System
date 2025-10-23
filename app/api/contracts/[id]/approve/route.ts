import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC, withRBAC } from '@/lib/rbac/guard';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * Contract Approval API Endpoint
 * 
 * Actions:
 * - approve: Approve contract (pending → approved)
 * - reject: Reject contract (pending → rejected)
 * - request_changes: Request changes (pending → draft)
 * - send_to_legal: Send to legal review
 * - send_to_hr: Send to HR review
 */

export const POST = withAnyRBAC(['contract:approve', 'contract:approve:all'], async (request: NextRequest, context: { params: { id: string } }) => {
  try {
    const supabase = await createClient();
    const contractId = context.params.id;
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, reason } = body;

    // Validate action
    const validActions = ['approve', 'reject', 'request_changes', 'send_to_legal', 'send_to_hr'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be one of: approve, reject, request_changes, send_to_legal, send_to_hr' },
        { status: 400 }
      );
    }

    // Validate reason for certain actions
    if (['reject', 'request_changes'].includes(action) && (!reason || reason.trim().length === 0)) {
      return NextResponse.json(
        { success: false, error: `Reason is required for action: ${action}` },
        { status: 400 }
      );
    }

    // Get contract to validate it exists and check current status
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('id, status, contract_number, title')
      .eq('id', contractId)
      .single();

    if (fetchError || !contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Prepare update based on action
    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    let successMessage = '';

    switch (action) {
      case 'approve':
        // Validate contract is in pending state
        if (contract.status !== 'pending') {
          return NextResponse.json(
            { success: false, error: `Cannot approve contract with status: ${contract.status}. Only pending contracts can be approved.` },
            { status: 400 }
          );
        }

        updateData = {
          ...updateData,
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          // Clear any previous rejection data
          rejected_by: null,
          rejected_at: null,
          rejection_reason: null,
        };
        successMessage = `Contract ${contract.contract_number || contract.id} has been approved successfully`;
        break;

      case 'reject':
        // Validate contract is in pending state
        if (contract.status !== 'pending') {
          return NextResponse.json(
            { success: false, error: `Cannot reject contract with status: ${contract.status}. Only pending contracts can be rejected.` },
            { status: 400 }
          );
        }

        updateData = {
          ...updateData,
          status: 'rejected',
          rejected_by: user.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
          // Clear any previous approval data
          approved_by: null,
          approved_at: null,
        };
        successMessage = `Contract ${contract.contract_number || contract.id} has been rejected`;
        break;

      case 'request_changes':
        updateData = {
          ...updateData,
          status: 'draft', // Send back to draft for edits
          changes_requested_by: user.id,
          changes_requested_at: new Date().toISOString(),
          changes_requested_reason: reason,
        };
        successMessage = `Changes requested for contract ${contract.contract_number || contract.id}`;
        break;

      case 'send_to_legal':
        updateData = {
          ...updateData,
          sent_to_legal_by: user.id,
          sent_to_legal_at: new Date().toISOString(),
        };
        successMessage = `Contract ${contract.contract_number || contract.id} sent to legal review`;
        break;

      case 'send_to_hr':
        updateData = {
          ...updateData,
          sent_to_hr_by: user.id,
          sent_to_hr_at: new Date().toISOString(),
        };
        successMessage = `Contract ${contract.contract_number || contract.id} sent to HR review`;
        break;
    }

    // Update contract
    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contractId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating contract:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update contract', details: updateError.message },
        { status: 500 }
      );
    }

    // TODO: Send notifications
    // - Notify contract creator about approval/rejection
    // - Notify relevant parties about status change
    // - Send email notifications

    console.log(`✅ Contract ${action} successful:`, {
      contractId,
      action,
      status: updateData.status,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: successMessage,
      contract: updatedContract,
      action,
    });

  } catch (error) {
    console.error('❌ Contract approval error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
});

// GET endpoint to check approval status
export const GET = withRBAC('contract:read:own', async (request: NextRequest, context: { params: { id: string } }) => {
  try {
    const supabase = await createClient();
    const contractId = context.params.id;

    const { data: contract, error } = await supabase
      .from('contracts')
      .select(`
        id,
        status,
        contract_number,
        approved_by,
        approved_at,
        rejected_by,
        rejected_at,
        rejection_reason,
        changes_requested_by,
        changes_requested_at,
        changes_requested_reason,
        submitted_for_review_at
      `)
      .eq('id', contractId)
      .single();

    if (error || !contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contract,
    });

  } catch (error) {
    console.error('Error fetching contract approval status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
});
