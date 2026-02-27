import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function buildLink(item: any): string {
  const entityType: string | undefined = item.entity_type;
  const workType: string | undefined = item.work_type;

  // Contract-related approvals and workflow items
  if (entityType === 'contract' || workType === 'contract_approval' || workType === 'approval') {
    return `/contracts/${item.entity_id}`;
  }

  // Generic tasks (HR tasks dashboard)
  if (entityType === 'task' || workType === 'task') {
    return '/hr/tasks';
  }

  // Leave requests
  if (entityType === 'leave_request' || workType === 'leave_approval') {
    return '/employer/team?tab=leave';
  }

  // Attendance / other HR requests (best-effort mapping)
  if (entityType === 'attendance_request' || workType === 'attendance_approval') {
    return '/employer/team?tab=attendance';
  }

  // Fallback: home/dashboard
  return '/';
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

    const status = searchParams.get('status') || undefined;
    const assigneeFilter = (searchParams.get('assignee') || 'me') as
      | 'me'
      | 'unassigned'
      | 'all';
    const workType = searchParams.get('work_type') || undefined;
    const timeframe = searchParams.get('timeframe') || undefined; // 'overdue' | 'today' | 'week'
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = Math.min(Math.max(parseInt(limitParam || '25', 10) || 25, 1), 100);
    const offset = Math.max(parseInt(offsetParam || '0', 10) || 0, 0);

    // Resolve active company from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.active_company_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active company set. Please select an active company first.',
        },
        { status: 400 }
      );
    }

    const companyId = profile.active_company_id;

    let query = supabase.from('work_items').select('*').eq('company_id', companyId);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (workType && workType !== 'all') {
      query = query.eq('work_type', workType);
    }

    // Timeframe filter on due_at
    if (timeframe) {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      const weekEnd = new Date(todayEnd);
      weekEnd.setDate(weekEnd.getDate() + 7);

      if (timeframe === 'overdue') {
        // due_at before today
        query = query.lt('due_at', todayStart.toISOString());
      } else if (timeframe === 'today') {
        query = query
          .gte('due_at', todayStart.toISOString())
          .lte('due_at', todayEnd.toISOString());
      } else if (timeframe === 'week') {
        query = query
          .gte('due_at', todayStart.toISOString())
          .lte('due_at', weekEnd.toISOString());
      }
    }

    query = query.order('due_at', { ascending: true, nullsFirst: false }).range(
      offset,
      offset + limit - 1
    );

    const { data, error } = await query;

    if (error) {
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
        link: buildLink(item),
      };
    });

    return NextResponse.json({
      success: true,
      items,
      total: items.length,
      limit,
      offset,
    });
  } catch (error: any) {
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

