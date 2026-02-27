import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getCompanyRole } from '@/lib/auth/get-company-role';

export const dynamic = 'force-dynamic';

export async function PATCH(
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

    const workItemId = params.id;

    // Resolve canonical company context
    const { companyId, role } = await getCompanyRole(supabase);

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active company set. Please select an active company first.',
        },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have access to this company inbox.',
        },
        { status: 403 }
      );
    }

    // Load work_item to determine source entity
    const { data: workItem, error: loadError } = await supabase
      .from('work_items' as any)
      .select(
        'id, company_id, entity_type, entity_id, work_type, source, status'
      )
      .eq('id', workItemId)
      .eq('company_id', companyId)
      .single();

    if (loadError || !workItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Work item not found',
        },
        { status: 404 }
      );
    }

    const entityType: string = (workItem as any).entity_type;
    const workType: string | undefined = (workItem as any).work_type;
    const source: string | undefined = (workItem as any).source;
    const entityId: string = (workItem as any).entity_id;

    const isTaskItem =
      entityType === 'task' || workType === 'task' || source === 'tasks';
    const isContractRenewalItem =
      workType === 'contract_renewal' && entityType === 'contract_action';

    // For approval-type items, prefer dedicated approve/reject endpoints
    if (workType === 'approval') {
      return NextResponse.json(
        {
          success: false,
          error:
            'This item is managed by a workflow. Please use the appropriate approve / reject endpoint.',
        },
        { status: 409 }
      );
    }

    // If this is a task-backed work item, update the source task first
    if (isTaskItem) {
      const nowIso = new Date().toISOString();

      const { data: updatedTask, error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'done', updated_at: nowIso })
        .eq('id', entityId)
        .eq('company_id', companyId)
        .select('id, company_id')
        .maybeSingle();

      if (taskError) {
        logger.error(
          'Failed to mark task as done while completing work_item',
          { error: taskError, workItemId, entityId, companyId },
          '/api/inbox/[id]/complete'
        );
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to complete underlying task',
            details: taskError.message,
          },
          { status: 500 }
        );
      }

      if (!updatedTask) {
        return NextResponse.json(
          {
            success: false,
            error: 'Underlying task not found for this work item',
          },
          { status: 409 }
        );
      }

      // Best-effort: write a task_events audit entry
      try {
        await supabase.from('task_events').insert({
          company_id: companyId,
          task_id: entityId,
          action: 'completed_from_inbox',
          actor: user.id,
          metadata: {
            work_item_id: workItemId,
            previous_status: (workItem as any).status,
            new_status: 'done',
          },
        });
      } catch (eventError) {
        logger.error(
          'Failed to insert task_events row for inbox completion',
          { error: eventError, workItemId, entityId, companyId },
          '/api/inbox/[id]/complete'
        );
      }
    }

    // If this is a contract renewal (contract_action), update source then work_item
    if (isContractRenewalItem) {
      const { data: updatedAction, error: actionError } = await supabase
        .from('contract_actions')
        .update({ status: 'done' })
        .eq('id', entityId)
        .eq('company_id', companyId)
        .select('id')
        .maybeSingle();

      if (actionError) {
        logger.error(
          'Failed to mark contract_action as done while completing work_item',
          { error: actionError, workItemId, entityId, companyId },
          '/api/inbox/[id]/complete'
        );
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to complete underlying contract action',
            details: actionError.message,
          },
          { status: 500 }
        );
      }

      if (!updatedAction) {
        return NextResponse.json(
          {
            success: false,
            error: 'Underlying contract action not found for this work item',
          },
          { status: 409 }
        );
      }
    }

    // Allow complete only for known-backed types (task or contract_renewal)
    if (!isTaskItem && !isContractRenewalItem) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This work item cannot be completed from Inbox because it has no safe backing entity sync.',
        },
        { status: 409 }
      );
    }

    // Mark the work_item as done
    const { error: updateError } = await supabase
      .from('work_items' as any)
      .update({ status: 'done' })
      .eq('id', workItemId)
      .eq('company_id', companyId);

    if (updateError) {
      logger.error(
        'Failed to complete work_item',
        { error: updateError, workItemId, companyId },
        '/api/inbox/[id]/complete'
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to complete work item',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Work item marked as done',
    });
  } catch (error: any) {
    logger.error(
      'Unexpected error in PATCH /api/inbox/[id]/complete',
      { error },
      '/api/inbox/[id]/complete'
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

