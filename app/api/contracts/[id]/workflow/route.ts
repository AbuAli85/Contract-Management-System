import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';
import { WorkflowService } from '@/lib/workflow/workflow-service';
import {
  upsertWorkItem,
  upsertInputFromWorkflowInstance,
} from '@/lib/work-engine';

export const dynamic = 'force-dynamic';

/**
 * POST /api/contracts/:id/workflow
 *
 * Fire a workflow transition on a contract.
 * Body: { trigger: string; comment?: string; companyId: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const body = await request.json();
    const { trigger, comment, companyId } = body as {
      trigger: string;
      comment?: string;
      companyId: string;
    };

    if (!trigger || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields: trigger, companyId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the user is authenticated and has a role in this company
    const { role, profileId } = await getCompanyRole(supabase, companyId);
    if (!role || !profileId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fire the transition
    const wf = new WorkflowService(supabase, companyId, profileId);
    const result = await wf.transition(
      'contract',
      contractId,
      trigger,
      comment ?? null
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Transition failed' },
        { status: 422 }
      );
    }

    // Best-effort: mirror workflow instance into universal work_items inbox
    try {
      const { data: instance } = await supabase
        .from('workflow_instances')
        .select('id, company_id, entity_type, entity_id, current_state, due_at, assigned_to')
        .eq('company_id', companyId)
        .eq('entity_type', 'contract')
        .eq('entity_id', contractId)
        .single();

      if (instance) {
        await upsertWorkItem(
          upsertInputFromWorkflowInstance(instance as any, {
            createdBy: profileId,
          })
        );
      }
    } catch {
      // Do not fail workflow transition on work_items sync issues
    }

    return NextResponse.json({
      success: true,
      fromState: result.fromState,
      toState: result.toState,
      eventId: result.eventId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/contracts/:id/workflow
 *
 * Returns the current workflow state and available transitions for a contract.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const supabase = await createClient();

    const { role } = await getCompanyRole(supabase);
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: instance } = await supabase
      .from('workflow_instances')
      .select('id, current_state, started_at, due_at, assigned_to')
      .eq('entity_type', 'contract')
      .eq('entity_id', contractId)
      .single();

    if (!instance) {
      return NextResponse.json({ instance: null, history: [], transitions: [] });
    }

    const { data: history } = await supabase
      .from('workflow_events')
      .select('id, from_state, to_state, trigger_name, triggered_by, comment, created_at')
      .eq('instance_id', instance.id)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      instance,
      history: history ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
