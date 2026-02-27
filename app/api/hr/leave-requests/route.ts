import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { getCompanyRole } from '@/lib/auth/get-company-role';
import { WorkflowService } from '@/lib/workflow/workflow-service';
import {
  upsertWorkItem,
  upsertInputFromWorkflowInstance,
  resolveApprovalAssignee,
} from '@/lib/work-engine';
import { logger } from '@/lib/logger';

const LeaveRequestSchema = z.object({
  employee_id: z.number(),
  leave_type: z.enum([
    'annual',
    'sick',
    'personal',
    'maternity',
    'paternity',
    'unpaid',
    'other',
  ]),
  start_date: z.string(),
  end_date: z.string(),
  reason: z.string().optional(),
});

const LeaveQuerySchema = z.object({
  employee_id: z.string().optional(),
  status: z.string().optional(),
  leave_type: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.string().default('1'),
  limit: z.string().default('10'),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { companyId, role } = await getCompanyRole(supabase);
    if (!companyId) {
      return NextResponse.json(
        { error: 'No active company selected' },
        { status: 400 }
      );
    }
    if (!role) {
      return NextResponse.json(
        { error: 'No company role found for current user' },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);

    const queryParams = {
      employee_id: searchParams.get('employee_id'),
      status: searchParams.get('status'),
      leave_type: searchParams.get('leave_type'),
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    };

    const parsed = LeaveQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const page = parseInt(parsed.data.page);
    const limit = parseInt(parsed.data.limit);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('hr.leave_requests')
      .select(
        `
        id, employee_id, leave_type, start_date, end_date, total_days,
        reason, approval_status, approved_by, approved_at, rejection_reason,
        created_at, updated_at,
        employees!inner(full_name, employee_code, job_title),
        approver:hr.employees!approved_by(full_name, employee_code)
      `
      )
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (parsed.data.employee_id) {
      query = query.eq('employee_id', parsed.data.employee_id);
    }

    if (parsed.data.status) {
      query = query.eq('approval_status', parsed.data.status);
    }

    if (parsed.data.leave_type) {
      query = query.eq('leave_type', parsed.data.leave_type);
    }

    if (parsed.data.start_date) {
      query = query.gte('start_date', parsed.data.start_date);
    }

    if (parsed.data.end_date) {
      query = query.lte('end_date', parsed.data.end_date);
    }

    // Get total count for pagination
    const { count } = await query
      .select('*', { count: 'exact', head: true });

    // Get paginated results
    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch leave requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const parsed = LeaveRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      companyId,
      role,
      profileId,
    } = await getCompanyRole(supabase);
    if (!companyId) {
      return NextResponse.json(
        { error: 'No active company selected' },
        { status: 400 }
      );
    }
    if (!role) {
      return NextResponse.json(
        { error: 'No company role found for current user' },
        { status: 403 }
      );
    }

    const { employee_id, leave_type, start_date, end_date, reason } =
      parsed.data;

    // Calculate total days
    const start = new Date(start_date);
    const end = new Date(end_date);
    const timeDiff = end.getTime() - start.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates

    if (totalDays <= 0) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check for overlapping leave requests for this employee within the same company
    const { data: overlappingRequests } = await supabase
      .from('hr.leave_requests')
      .select('id, start_date, end_date, approval_status')
      .eq('employee_id', employee_id)
      .eq('company_id', companyId)
      .in('approval_status', ['pending', 'approved'])
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`);

    if (overlappingRequests && overlappingRequests.length > 0) {
      return NextResponse.json(
        { error: 'You have overlapping leave requests for this period' },
        { status: 400 }
      );
    }

    // Determine requester employee for sanity check (if HR submits on behalf, allow but enforce company)
    const { data: employee } = await supabase
      .from('hr.employees')
      .select('id, company_id, user_id')
      .eq('id', employee_id)
      .maybeSingle();

    if (!employee || employee.company_id !== companyId) {
      return NextResponse.json(
        { error: 'Employee does not belong to the active company' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('hr.leave_requests')
      .insert({
        employee_id,
        leave_type,
        start_date,
        end_date,
        total_days: totalDays,
        reason,
        company_id: companyId,
        approval_stage: 'pending_manager',
      } as any)
      .select(
        `
        id, employee_id, leave_type, start_date, end_date, total_days,
        reason, approval_status, created_at, updated_at
      `
      )
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to create leave request' },
        { status: 500 }
      );
    }

    // Start workflow instance and mirror into work_items (best-effort)
    try {
      const wf = new WorkflowService(supabase, companyId, (await supabase.auth.getUser()).data.user!.id);
      // Start leave workflow as draft->submitted
      const startResult = await wf.startLeaveRequest(String(data.id));
      if (!startResult.success) {
        logger.error(
          'Failed to start leave workflow',
          { error: startResult.error, companyId, leaveRequestId: data.id },
          'api/hr/leave-requests'
        );
      } else {
        // Fetch latest workflow instance
        const instance = await wf.getInstance('leave_request', String(data.id));
        if (instance) {
          // Resolve initial assignee (line manager or HR fallback)
          const assigneeId = await resolveApprovalAssignee(supabase as any, {
            companyId,
            entityType: 'leave_request',
            entityId: String(data.id),
            currentState: instance.currentState,
            requestedBy: employee.user_id ?? null,
          });

          await upsertWorkItem(
            upsertInputFromWorkflowInstance(instance as any, {
              createdBy: profileId ?? undefined,
              ...(instance.assignedTo ? {} : { assigneeId }),
            } as any)
          );
        }
      }
    } catch (wfError) {
      logger.error(
        'Failed to mirror leave_request into work_items',
        { error: wfError, companyId, leaveRequestId: data.id },
        'api/hr/leave-requests'
      );
    }

    return NextResponse.json(
      {
        message: 'Leave request submitted successfully',
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
