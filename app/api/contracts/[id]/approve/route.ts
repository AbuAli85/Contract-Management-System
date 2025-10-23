import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac';

// POST: Approve or reject a contract
export const POST = withAnyRBAC(
  ['contract:approve', 'contract:admin'], // Only admins can approve contracts
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const body = await request.json();
      const { contractId, action, reason } = body;

      if (!contractId || !action) {
        return NextResponse.json(
          { success: false, error: 'Contract ID and action are required' },
          { status: 400 }
        );
      }

      if (!['approve', 'reject'].includes(action)) {
        return NextResponse.json(
          { success: false, error: 'Action must be either "approve" or "reject"' },
          { status: 400 }
        );
      }

      // Get current user
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

      // Check if contract exists and is in pending status
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .eq('status', 'pending')
        .single();

      if (contractError || !contract) {
        return NextResponse.json(
          { success: false, error: 'Contract not found or not in pending status' },
          { status: 404 }
        );
      }

      // Prepare update data based on action
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (action === 'approve') {
        updateData.status = 'approved';
        updateData.approved_by = user.id;
        updateData.approved_at = new Date().toISOString();
        // Clear any previous rejection data
        updateData.rejection_reason = null;
        updateData.rejected_by = null;
        updateData.rejected_at = null;
      } else if (action === 'reject') {
        updateData.status = 'rejected';
        updateData.rejected_by = user.id;
        updateData.rejected_at = new Date().toISOString();
        updateData.rejection_reason = reason || 'No reason provided';
        // Clear any previous approval data
        updateData.approved_by = null;
        updateData.approved_at = null;
      }

      // Update the contract
      const { data: updatedContract, error: updateError } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contractId)
        .select()
        .single();

      if (updateError) {
        console.error('Contract approval error:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update contract status' },
          { status: 500 }
        );
      }

      // Log the action for audit trail
      await supabase
        .from('contract_audit_log')
        .insert({
          contract_id: contractId,
          action: action === 'approve' ? 'approved' : 'rejected',
          performed_by: user.id,
          details: action === 'reject' ? reason : 'Contract approved',
          timestamp: new Date().toISOString(),
        })
        .catch(err => {
          // Don't fail the main operation if audit logging fails
          console.warn('Failed to log contract action:', err);
        });

      return NextResponse.json({
        success: true,
        contract: updatedContract,
        message: `Contract ${action}d successfully`,
      });

    } catch (error) {
      console.error('Contract approval error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }
  }
);

// GET: Get contract approval details
export const GET = withAnyRBAC(
  ['contract:read', 'contract:admin'],
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const { searchParams } = new URL(request.url);
      const contractId = searchParams.get('contractId');

      if (!contractId) {
        return NextResponse.json(
          { success: false, error: 'Contract ID is required' },
          { status: 400 }
        );
      }

      // Get contract with approval details
      const { data: contract, error } = await supabase
        .from('contracts')
        .select(`
          *,
          approved_by_user:approved_by(id, email, full_name),
          rejected_by_user:rejected_by(id, email, full_name)
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
      console.error('Get contract approval error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }
  }
);
