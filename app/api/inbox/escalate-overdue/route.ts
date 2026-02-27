import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';
import { logger } from '@/lib/logger';
import { auditLogger } from '@/lib/security/audit-logger';
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

    const now = new Date();
    const nowIso = now.toISOString();

    // Fetch candidate work_items (no JSON filter here; filter escalated in app)
    const { data, error } = await supabase
      .from('work_items' as any)
      .select('*')
      .eq('company_id', companyId)
      .in('status', ['open', 'pending'])
      .lt('sla_due_at', nowIso)
      .eq('escalated', false)
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
    const candidates = rawItems;

    let escalatedCount = 0;
    // Audit log for the escalation batch (best-effort)
    try {
      await auditLogger.logDataChange({
        event_type: 'work_items.escalate_overdue',
        user_id: user.id,
        resource_type: 'company',
        resource_id: companyId,
        metadata: {
          total_candidates: rawItems.length,
          considered: candidates.length,
          escalated: escalatedCount,
          at: nowIso,
        },
      });
    } catch {
    }


    // Process in small concurrent batches to avoid N=500 sequential updates
    const concurrency = 10;
    for (let i = 0; i < candidates.length; i += concurrency) {
      const batch = candidates.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async (item: any) => {
          try {
            const metadata = ((item as any).metadata ?? {}) as Record<string, any>;
            const entityType: string = item.entity_type;
            const entityId: string = item.entity_id;
            const workType: string | undefined = (item as any).work_type;
            const source: string | undefined = (item as any).source;
            const currentAssignee: string | null =
              ((item as any).assignee_id as string | null) ?? null;
            const currentState: string = metadata.current_state ?? '';

            let resolvedAssignee: string | null = null;

            const isTaskItem =
              entityType === 'task' || workType === 'task' || source === 'tasks';

            if (isTaskItem) {
              // Always resolve a company admin for task escalation (reassign deterministically).
              const { data: admins, error: adminError } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('company_id', companyId)
                .eq('is_active', true)
                .eq('role', 'admin')
                .order('user_id', { ascending: true });

              if (adminError) {
                logger.error(
                  'Failed to resolve admin assignee for task escalation',
                  { error: adminError, companyId, workItemId: item.id },
                  'api/inbox/escalate-overdue'
                );
                return;
              }

              if (!admins || admins.length === 0) {
                logger.error(
                  'No admin found for company; skipping task escalation to avoid no-op',
                  { companyId, workItemId: item.id },
                  'api/inbox/escalate-overdue'
                );
                return;
              }

              const adminAssignee = admins[0].user_id as string;
              resolvedAssignee = adminAssignee;

              if (currentAssignee && currentAssignee !== adminAssignee) {
                metadata.escalated_from = currentAssignee;
              }
            } else if (entityType) {
              // For non-task items (approvals, etc.), reuse centralized approver resolution.
              resolvedAssignee = await resolveApprovalAssignee(supabase as any, {
                companyId,
                entityType,
                entityId,
                currentState,
                requestedBy: null,
              });
            }

            if (!resolvedAssignee) {
              return;
            }

            metadata.escalated = true;
            metadata.escalated_at = new Date().toISOString();
            metadata.escalated_by = user.id;

            const { error: updateError } = await supabase
              .from('work_items' as any)
              .update({
                assignee_id: resolvedAssignee,
                escalated: true,
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
              return;
            }

            escalatedCount += 1;
          } catch (err) {
            logger.error(
              'Unexpected error while escalating work_item',
              { error: err, workItemId: item.id, companyId },
              'api/inbox/escalate-overdue'
            );
          }
        })
      );
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

