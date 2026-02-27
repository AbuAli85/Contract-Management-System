import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';
import { logger } from '@/lib/logger';
import { upsertWorkItem, upsertInputFromContractAction } from '@/lib/work-engine';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

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

    const contractId = params.id;

    // Load contract to get company_id and end_date
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, company_id, end_date')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (!contract.company_id) {
      return NextResponse.json(
        { success: false, error: 'Contract is missing company context' },
        { status: 400 }
      );
    }

    // Authorize using canonical company role helper (admin/manager)
    const { role } = await getCompanyRole(supabase, contract.company_id);
    if (!role || (role !== 'admin' && role !== 'manager')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (!contract.end_date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contract has no end date; cannot schedule renewal',
        },
        { status: 400 }
      );
    }

    // Compute renewal due_at = end_date - 30 days (safe date handling)
    const endDate = new Date(contract.end_date as unknown as string);
    if (Number.isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid contract end date; cannot schedule renewal',
        },
        { status: 400 }
      );
    }

    const dueAt = new Date(endDate.getTime());
    dueAt.setDate(dueAt.getDate() - 30);

    const { data: action, error: insertError } = await supabase
      .from('contract_actions')
      .insert({
        company_id: contract.company_id,
        contract_id: contract.id,
        action_type: 'renewal',
        due_at: dueAt.toISOString(),
        status: 'open',
        created_by: user.id,
      })
      .select('*')
      .single();

    if (insertError || !action) {
      logger.error(
        'Failed to create contract_action renewal',
        { error: insertError, contractId },
        'api/contracts/[id]/actions/renewal'
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create renewal action',
          details: insertError?.message,
        },
        { status: 500 }
      );
    }

    // Best-effort: mirror into work_items as a contract renewal work item
    try {
      await upsertWorkItem(upsertInputFromContractAction(action as any));
    } catch (error) {
      logger.error(
        'Failed to mirror contract_action into work_items',
        { error, actionId: action.id },
        'api/contracts/[id]/actions/renewal'
      );
    }

    return NextResponse.json({
      success: true,
      contract_action: action,
      message: 'Renewal action scheduled successfully',
    });
  } catch (error: any) {
    logger.error(
      'Unexpected error in POST /api/contracts/[id]/actions/renewal',
      { error },
      'api/contracts/[id]/actions/renewal'
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

