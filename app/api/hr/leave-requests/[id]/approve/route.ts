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

const ApprovalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const leaveRequestId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(leaveRequestId)) {
      return NextResponse.json(
        { error: 'Invalid leave request ID' },
        { status: 400 }
      );
    }

    const parsed = ApprovalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { action, rejection_reason } = parsed.data;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, role: companyRole, profileId } = await getCompanyRole(
      supabase
    );
    if (!companyId) {
      return NextResponse.json(
        { error: 'No active company selected' },
        { status: 400 }
      );
    }
    if (!companyRole) {
      return NextResponse.json(
        { error: 'No company role found for current user' },
        { status: 403 }
      );
    }

    const { data: hrProfile } = await supabase
      .from('hr.user_profiles')
      .select('employee_id, role')
      .eq('user_id', user.id)
      .single();

    if (!hrProfile || !hrProfile.employee_id) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to approve in HR context
    if (!['hr_admin', 'hr_staff', 'manager'].includes(hrProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get the leave request scoped by company
    const { data: leaveRequest, error: fetchError } = await supabase
      .from('hr.leave_requests')
      .select(
        `
        id, employee_id, leave_type, start_date, end_date, total_days,
        reason, approval_status, approval_stage, company_id, created_at,
        employees!inner(full_name, employee_code)
      `
      )
      .eq('id', leaveRequestId)
      .eq('company_id', companyId)
      .single();

    if (fetchError || !leaveRequest) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }

    // Stage-based approval logic
    const nowIso = new Date().toISOString();
    const updateData: any = {};
    let triggerName: string | null = null;

    // Stage 1: manager approves -> pending_hr
    if (leaveRequest.approval_stage === 'pending_manager') {
      if (hrProfile.role !== 'manager') {
        return NextResponse.json(
          { error: 'Only managers can perform the first-stage approval' },
          { status: 403 }
        );
      }

      // Verify manager relationship
      const { data: isManagerOf } = await (supabase as any).rpc(
        'hr.is_manager_of',
        {
          uid: user.id,
          emp_id: leaveRequest.employee_id,
        }
      );

      if (!isManagerOf) {
        return NextResponse.json(
          {
            error: 'You can only approve leave requests for your team members',
          },
          { status: 403 }
        );
      }

      if (action === 'approve') {
        updateData.approval_stage = 'pending_hr';
        updateData.manager_approved_at = nowIso;
        updateData.manager_approved_by = user.id;
        // Keep overall approval_status as pending
        updateData.approval_status = 'pending';
      } else {
        // Manager rejection is terminal
        updateData.approval_stage = 'rejected';
        updateData.approval_status = 'rejected';
        updateData.rejected_at = nowIso;
        updateData.rejected_by = user.id;
        if (rejection_reason) {
          updateData.rejection_reason = rejection_reason;
        }
        triggerName = 'reject';
      }
    } else if (leaveRequest.approval_stage === 'pending_hr') {
      // Stage 2: HR approves/rejects
      if (!['hr_admin', 'hr_staff'].includes(hrProfile.role)) {
        return NextResponse.json(
          { error: 'Only HR staff can perform second-stage approval' },
          { status: 403 }
        );
      }

      if (action === 'approve') {
        updateData.approval_stage = 'approved';
        updateData.approval_status = 'approved';
        updateData.hr_approved_at = nowIso;
        updateData.hr_approved_by = user.id;
        triggerName = 'approve';
      } else {
        updateData.approval_stage = 'rejected';
        updateData.approval_status = 'rejected';
        updateData.rejected_at = nowIso;
        updateData.rejected_by = user.id;
        if (rejection_reason) {
          updateData.rejection_reason = rejection_reason;
        }
        triggerName = 'reject';
      }
    } else {
      return NextResponse.json(
        { error: 'Leave request has already been fully processed' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('hr.leave_requests')
      .update(updateData)
      .eq('id', leaveRequestId)
      .eq('company_id', companyId)
      .select(
        `
        id, employee_id, leave_type, start_date, end_date, total_days,
        reason, approval_status, approval_stage, approved_by, approved_at,
        manager_approved_at, manager_approved_by,
        hr_approved_at, hr_approved_by,
        rejected_at, rejected_by, rejection_reason,
        created_at, updated_at,
        employees!inner(full_name, employee_code),
        approver:hr.employees!approved_by(full_name, employee_code)
      `
      )
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to update leave request' },
        { status: 500 }
      );
    }

    // Drive workflow transition and mirror into work_items
    try {
      const wf = new WorkflowService(supabase, companyId, user.id);
      if (triggerName) {
        const wfResult = await wf.transition(
          'leave_request',
          String(leaveRequest.id),
          triggerName,
          rejection_reason
        );
        if (!wfResult.success) {
          logger.error(
            'Failed to transition leave_request workflow',
            { error: wfResult.error, companyId, leaveRequestId },
            'api/hr/leave-requests/[id]/approve'
          );
        }
      }

      const instance = await wf.getInstance(
        'leave_request',
        String(leaveRequest.id)
      );
      if (instance) {
        let assigneeId: string | null = null;
        if (data.approval_stage === 'pending_hr') {
          // Reassign to HR for second stage
          assigneeId = await resolveApprovalAssignee(supabase as any, {
            companyId,
            entityType: 'leave_request',
            entityId: String(leaveRequest.id),
            currentState: instance.currentState,
            requestedBy: leaveRequest.employee_id ? null : null,
          });
        }

        await upsertWorkItem(
          upsertInputFromWorkflowInstance(instance as any, {
            createdBy: profileId ?? undefined,
            ...(instance.assignedTo ? {} : { assigneeId }),
          } as any)
        );
      }
    } catch (wfError) {
      logger.error(
        'Failed to mirror leave_request approval into work_items',
        { error: wfError, companyId, leaveRequestId },
        'api/hr/leave-requests/[id]/approve'
      );
    }

    // Create notification for the employee
    await supabase.from('hr.notifications').insert({
      employee_id: leaveRequest.employee_id,
      type: 'leave_approval',
      title: `Leave Request ${
        action === 'approve' ? 'Approved' : 'Rejected'
      }`,
      message: `Your leave request for ${leaveRequest.total_days} days (${leaveRequest.start_date} to ${leaveRequest.end_date}) has been ${
        action === 'approve' ? 'approved' : 'rejected'
      }.${
        rejection_reason ? ` Reason: ${rejection_reason}` : ''
      }`,
      priority: 'medium',
    });

    return NextResponse.json({
      message: `Leave request ${
        action === 'approve' ? 'approved' : 'rejected'
      } successfully`,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
