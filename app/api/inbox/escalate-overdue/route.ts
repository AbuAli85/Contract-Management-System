import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';
import { logger } from '@/lib/logger';
import { resolveApprovalAssignee } from '@/lib/work-engine';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
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

    const { role, companyId } = await getCompanyRole(supabase);

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active company set. Please select an active company first.',
        },
        { status: 400 }
      );
    }

    // Admin-only endpoint
    if (role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin role required to escalate overdue items.' },
        { status: 403 }
      );
    }

    const nowIso = new Date().toISOString();

    // Fetch candidate work_items (no JSON filter here; filter escalated in app)
    const { data, error } = await supabase
      .from('work_items' as any)
      .select('*')
      .eq('company_id', companyId)
      .in('status', ['open', 'pending'])
      .lt('sla_due_at', nowIso)
      .limit(500);

    if (error) {
      logger.error(
        'Failed to query overdue work_items for escalation',
        { error, companyId },
        'api/inbox/escalate-overdue'
      );
      return NextResponse.json(
        { success: false, error: 'Failed to query overdue items.' },
        { status: 500 }
      );
    }

    const rawItems = data || [];
    const candidates = rawItems.filter(item => {
      const metadata = (item as any).metadata ?? {};
      return metadata.escalated !== true;
    });

    let escalatedCount = 0;

    for (const item of candidates) {
      try {
        const metadata = ((item as any).metadata ?? {}) as Record<string, any>;
        const entityType: string = item.entity_type;
        const entityId: string = item.entity_id;
        const currentState: string = metadata.current_state ?? '';

        // Use resolveApprovalAssignee to choose a new assignee when applicable
        const resolvedAssignee =
          entityType &&
          (await resolveApprovalAssignee(supabase as any, {
            companyId,
            entityType,
            entityId,
            currentState,
            requestedBy: null,
          }));

        // If we couldn't resolve a better assignee, skip escalation for this item
        if (!resolvedAssignee) {
          continue;
        }

        metadata.escalated = true;
        metadata.escalated_at = new Date().toISOString();
        metadata.escalated_by = user.id;

        const { error: updateError } = await supabase
          .from('work_items' as any)
          .update({
            assignee_id: resolvedAssignee,
            metadata,
          })
          .eq('id', item.id)
          .eq('company_id', companyId);

        if (updateError) {
          logger.error(
            'Failed to update escalated work_item',
            { error: updateError, workItemId: item.id, companyId },
            'api/inbox/escalate-overdue'
          );
          continue;
        }

        escalatedCount += 1;
      } catch (err) {
        logger.error(
          'Unexpected error while escalating work_item',
          { error: err, workItemId: item.id, companyId },
          'api/inbox/escalate-overdue'
        );
      }
    }

    return NextResponse.json({
      success: true,
      total_candidates: rawItems.length,
      considered: candidates.length,
      escalated: escalatedCount,
    });
  } catch (error: any) {
    logger.error(
      'Unexpected error in POST /api/inbox/escalate-overdue',
      { error },
      'api/inbox/escalate-overdue'
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

