import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getCompanyRole } from '@/lib/auth/get-company-role';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function buildLink(item: any): string | null {
  const entityType: string | undefined = item.entity_type;
  const workType: string | undefined = item.work_type;
  const source: string | undefined = item.source;
  const metadata: any = item.metadata ?? {};

  // Contract-related approvals and workflow items
  if (workType === 'approval' && entityType === 'contract') {
    const workflowEntityType: string | undefined = metadata?.workflow_entity_type;
    const workflowEntityId: string | undefined = metadata?.workflow_entity_id;

    if (workflowEntityType === 'contract' && workflowEntityId) {
      return `/contracts/${workflowEntityId}`;
    }

    return `/contracts/${item.entity_id}`;
  }

  if (entityType === 'contract' || source === 'contracts') {
    const workflowEntityType: string | undefined = metadata?.workflow_entity_type;
    const workflowEntityId: string | undefined = metadata?.workflow_entity_id;
    if (workflowEntityType === 'contract' && workflowEntityId) {
      return `/contracts/${workflowEntityId}`;
    }
    return `/contracts/${item.entity_id}`;
  }

  // Generic tasks (HR tasks dashboard)
  if (entityType === 'task' || workType === 'task' || source === 'tasks') {
    return '/hr/tasks';
  }

  // Contract actions (e.g. renewals)
  if (entityType === 'contract_action') {
    const contractId: string | undefined = metadata?.contract_id;
    if (contractId) {
      return `/contracts/${contractId}?tab=actions&actionId=${item.id}`;
    }
  }

  // Leave requests (HR leave management)
  if (entityType === 'leave_request') {
    return '/hr/leave-requests';
  }

  // Attendance correction / HR attendance requests
  if (entityType === 'attendance_request') {
    return '/hr/attendance';
  }

  // Workflow approvals where metadata points to a contract
  // Fallback: unknown destination
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const statusParam = searchParams.get('status') || undefined; // CSV of statuses
    const assigneeFilter = (searchParams.get('assignee') || 'me') as
      | 'me'
      | 'unassigned'
      | 'all';
    const workType = searchParams.get('work_type') || undefined;
    const source = searchParams.get('source') || undefined;
    const overdueParam = searchParams.get('overdue');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = Math.min(Math.max(parseInt(limitParam || '25', 10) || 25, 1), 100);
    const offset = Math.max(parseInt(offsetParam || '0', 10) || 0, 0);

    // Resolve company and membership using canonical helper
    const { role, companyId } = await getCompanyRole(supabase);

    // No active company selected
    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active company set. Please select an active company first.',
        },
        { status: 400 }
      );
    }

    // User has no role/membership for this company
    if (!role) {
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have access to this company inbox.',
        },
        { status: 403 }
      );
    }

    let query = supabase
      .from('work_items')
      .select('*', { count: 'estimated' })
      .eq('company_id', companyId);

    // Status filter (CSV)
    let statuses: string[] | undefined;
    if (statusParam && statusParam !== 'all') {
      statuses = statusParam
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }

    if (workType && workType !== 'all') {
      query = query.eq('work_type', workType);
    }

    if (source && source !== 'all') {
      query = query.eq('source', source);
    }

    // Overdue filter: due_at before now, defaulting to open/pending unless
    // user explicitly requested done/cancelled in the status filter.
    const isOverdue =
      overdueParam === 'true' ||
      overdueParam === '1' ||
      overdueParam === 'yes';
    if (isOverdue) {
      const nowIso = new Date().toISOString();
      query = query.lt('due_at', nowIso);

      if (!statuses || statuses.length === 0) {
        statuses = ['open', 'pending'];
      }
    }

    if (statuses && statuses.length > 0) {
      query = query.in('status', statuses);
    }

    // Sorting: priority asc, sla_due_at asc NULLS LAST, due_at asc NULLS LAST, created_at desc
    query = query
      .order('priority', { ascending: true, nullsFirst: false })
      .order('sla_due_at', { ascending: true, nullsFirst: false })
      .order('due_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch inbox items', { error, companyId }, 'api/inbox');
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch inbox items',
          details: error.message,
        },
        { status: 500 }
      );
    }

    const rawItems = data || [];

    // Apply assignee filter in application layer
    const filteredByAssignee = rawItems.filter(item => {
      const assigneeId = (item as any).assignee_id ?? null;

      if (assigneeFilter === 'me') {
        return assigneeId === user.id;
      }
      if (assigneeFilter === 'unassigned') {
        return !assigneeId;
      }
      return true; // 'all'
    });

    const items = filteredByAssignee.map(item => {
      const assigneeId = (item as any).assignee_id ?? null;

      return {
        id: item.id,
        work_type: item.work_type,
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        status: item.status,
        title: (item as any).title ?? null,
        due_at: (item as any).due_at ?? null,
        assignee_id: assigneeId,
        sla_due_at: (item as any).sla_due_at ?? null,
        priority: (item as any).priority ?? null,
        source: (item as any).source ?? null,
        link: buildLink(item),
      };
    });

    return NextResponse.json({
      success: true,
      items,
      total: items.length,
      total_estimate: typeof count === 'number' ? count : items.length,
      limit,
      offset,
    });
  } catch (error: any) {
    logger.error('Unexpected error in GET /api/inbox', { error }, 'api/inbox');
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

