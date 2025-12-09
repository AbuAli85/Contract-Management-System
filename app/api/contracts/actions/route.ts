import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Contract actions endpoint
export const POST = async (request: NextRequest) => {
  try {
    console.log('🔍 Contract actions API called');

    const supabase = await createClient();
    console.log('🔍 Supabase client created');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log('🔍 Auth check:', { user: user?.id, authError });

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('🔍 Request body:', body);

    const { contractId, action, reason } = body;

    if (!contractId || !action) {
      console.log('❌ Missing required fields:', { contractId, action });
      return NextResponse.json(
        { success: false, error: 'Contract ID and action are required' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = [
      'approve',
      'reject',
      'request_changes',
      'send_to_legal',
      'send_to_hr',
    ];
    if (!validActions.includes(action)) {
      console.log('❌ Invalid action:', action);
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching contract:', contractId);

    // Get the contract first to check permissions
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    console.log('🔍 Contract fetch result:', {
      contract: contract?.id,
      contractError,
    });

    if (contractError || !contract) {
      console.log('❌ Contract not found:', contractError);
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this contract
    const isAdmin = user.user_metadata?.role === 'admin';
    const isOwner =
      contract.first_party_id === user.id ||
      contract.second_party_id === user.id ||
      contract.client_id === user.id ||
      contract.employer_id === user.id;

    console.log('🔍 Permission check:', { isAdmin, isOwner, userId: user.id });

    if (!isAdmin && !isOwner) {
      console.log('❌ Insufficient permissions');
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Update contract based on action
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    console.log('🔍 Preparing update data for action:', action);

    switch (action) {
      case 'approve':
        updateData.status = 'active';
        updateData.approval_status = 'active';
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user.id;
        break;
      case 'reject':
        updateData.status = 'rejected';
        updateData.approval_status = 'rejected';
        updateData.rejected_at = new Date().toISOString();
        updateData.rejected_by = user.id;
        if (reason) updateData.rejection_reason = reason;
        break;
      case 'request_changes':
        updateData.status = 'draft';
        updateData.approval_status = 'pending';
        updateData.changes_requested_at = new Date().toISOString();
        updateData.changes_requested_by = user.id;
        if (reason) updateData.changes_requested_reason = reason;
        break;
      case 'send_to_legal':
        updateData.approval_status = 'legal_review';
        updateData.sent_to_legal_at = new Date().toISOString();
        updateData.sent_to_legal_by = user.id;
        break;
      case 'send_to_hr':
        updateData.approval_status = 'hr_review';
        updateData.sent_to_hr_at = new Date().toISOString();
        updateData.sent_to_hr_by = user.id;
        break;
    }

    console.log('🔍 Update data:', updateData);

    // Update the contract
    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contractId)
      .select()
      .single();

    console.log('🔍 Update result:', {
      updatedContract: updatedContract?.id,
      updateError,
    });

    if (updateError) {
      console.error('❌ Error updating contract:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update contract',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ Contract updated successfully');

    // Log the action (optional - skip if table doesn't exist)
    try {
      await supabase.from('contract_activity_logs').insert({
        contract_id: contractId,
        user_id: user.id,
        action: action,
        details: {
          reason: reason,
          previous_status: contract.status,
          new_status: updateData.status,
          timestamp: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      });
      console.log('✅ Activity logged successfully');
    } catch (logError) {
      console.warn(
        'Failed to log contract action (table may not exist):',
        logError
      );
    }

    return NextResponse.json({
      success: true,
      contract: updatedContract,
      message: `Contract ${action}d successfully`,
    });
  } catch (error) {
    console.error('❌ Error in contract action API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

// Bulk actions
export const PUT = async (request: NextRequest) => {
  try {
    console.log('🔍 Bulk contract actions API called');

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contractIds, action, reason } = body;

    if (
      !contractIds ||
      !Array.isArray(contractIds) ||
      contractIds.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: 'Contract IDs are required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = [
      'approve',
      'reject',
      'request_changes',
      'send_to_legal',
      'send_to_hr',
    ];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Check if user has permission to update these contracts
    const isAdmin = user.user_metadata?.role === 'admin';

    if (!isAdmin) {
      // For non-admin users, check if they own all contracts
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('id, first_party_id, second_party_id, client_id, employer_id')
        .in('id', contractIds);

      if (contractsError || !contracts) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch contracts' },
          { status: 500 }
        );
      }

      const unauthorizedContracts = contracts.filter(
        contract =>
          contract.first_party_id !== user.id &&
          contract.second_party_id !== user.id &&
          contract.client_id !== user.id &&
          contract.employer_id !== user.id
      );

      if (unauthorizedContracts.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Insufficient permissions for some contracts',
          },
          { status: 403 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    switch (action) {
      case 'approve':
        updateData.status = 'active';
        updateData.approval_status = 'active';
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user.id;
        break;
      case 'reject':
        updateData.status = 'rejected';
        updateData.approval_status = 'rejected';
        updateData.rejected_at = new Date().toISOString();
        updateData.rejected_by = user.id;
        if (reason) updateData.rejection_reason = reason;
        break;
      case 'request_changes':
        updateData.status = 'draft';
        updateData.approval_status = 'pending';
        updateData.changes_requested_at = new Date().toISOString();
        updateData.changes_requested_by = user.id;
        if (reason) updateData.changes_requested_reason = reason;
        break;
      case 'send_to_legal':
        updateData.approval_status = 'legal_review';
        updateData.sent_to_legal_at = new Date().toISOString();
        updateData.sent_to_legal_by = user.id;
        break;
      case 'send_to_hr':
        updateData.approval_status = 'hr_review';
        updateData.sent_to_hr_at = new Date().toISOString();
        updateData.sent_to_hr_by = user.id;
        break;
    }

    // Update all contracts
    const { data: updatedContracts, error: updateError } = await supabase
      .from('contracts')
      .update(updateData)
      .in('id', contractIds)
      .select();

    if (updateError) {
      console.error('Error updating contracts:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update contracts' },
        { status: 500 }
      );
    }

    // Log the bulk action (optional - skip if table doesn't exist)
    try {
      const logEntries = contractIds.map(contractId => ({
        contract_id: contractId,
        user_id: user.id,
        action: `bulk_${action}`,
        details: {
          reason: reason,
          bulk_action: true,
          total_contracts: contractIds.length,
          timestamp: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      }));

      await supabase.from('contract_activity_logs').insert(logEntries);
    } catch (logError) {
      console.warn(
        'Failed to log bulk contract action (table may not exist):',
        logError
      );
    }

    return NextResponse.json({
      success: true,
      contracts: updatedContracts,
      message: `${contractIds.length} contracts ${action}d successfully`,
    });
  } catch (error) {
    console.error('Error in bulk contract action API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
};
