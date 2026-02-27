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

    // Check if user has permission to approve in HR context (hr.user_profiles role)
    if (!['hr_admin', 'hr_staff', 'manager'].includes(hrProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient HR permissions' },
        { status: 403 }
      );
    }

    // Get the leave request scoped by company
    const { data: leaveRequest, error: fetchError } = await supabase
      .from('hr.leave_requests')
      .select(
        `
        id, workflow_entity_id, employee_id, leave_type, start_date, end_date, total_days,
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

    // Stage 1: manager approves -> pending_hr (requires tenant manager role + HR manager role)
    if (leaveRequest.approval_stage === 'pending_manager') {
      if (
        hrProfile.role !== 'manager' ||
        !['manager', 'admin'].includes(companyRole)
      ) {
        return NextResponse.json(
          {
            error:
              'Only company managers with HR manager role can perform the first-stage approval',
          },
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
        // Drive workflow state to pending_hr
        triggerName = 'manager_approve';
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
      // Stage 2: HR approves/rejects (requires company admin + HR admin/staff)
      if (
        !['hr_admin', 'hr_staff'].includes(hrProfile.role) ||
        companyRole !== 'admin'
      ) {
        return NextResponse.json(
          { error: 'Only company admins with HR staff/admin role can approve at stage 2' },
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

    const { data: updatedLeave, error } = await supabase
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

    if (error || !updatedLeave) {
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
          String(leaveRequest.workflow_entity_id),
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
        String(leaveRequest.workflow_entity_id)
      );
      if (instance) {
        let assigneeId: string | null = null;
        if (updatedLeave.approval_stage === 'pending_hr') {
          // Determine requester auth uid for manager-based routing
          let requesterUserId: string | null = null;
          try {
            const { data: requester } = await supabase
              .from('hr.user_profiles')
              .select('user_id')
              .eq('employee_id', leaveRequest.employee_id)
              .maybeSingle();
            if (requester?.user_id) {
              requesterUserId = requester.user_id as string;
            }
          } catch {
            requesterUserId = null;
          }

          // Reassign to HR for second stage (or appropriate HR approver)
          assigneeId = await resolveApprovalAssignee(supabase as any, {
            companyId,
            entityType: 'leave_request',
            entityId: String(leaveRequest.workflow_entity_id),
            currentState: instance.currentState,
            requestedBy: requesterUserId,
          });
        }

        // Persist assignee into workflow_instances when moving to pending_hr.
        // Use auth UID directly (matches assignee_id domain in work_items).
        if (updatedLeave.approval_stage === 'pending_hr' && assigneeId) {
          try {
            await supabase
              .from('workflow_instances')
              .update({ assigned_to: assigneeId })
              .eq('company_id', companyId)
              .eq('entity_type', 'leave_request')
              .eq('entity_id', leaveRequest.workflow_entity_id);
          } catch (assignErr) {
            logger.error(
              'Failed to persist HR assignee in workflow_instances',
              { error: assignErr, companyId, leaveRequestId },
              'api/hr/leave-requests/[id]/approve'
            );
          }
        }

        const baseInput = upsertInputFromWorkflowInstance(instance as any, {
          createdBy: profileId ?? undefined,
          ...(instance.assignedTo ? {} : { assigneeId }),
        } as any);

        // Enrich metadata with approval_stage and optionally adjust title
        const enrichedInput = {
          ...baseInput,
          title:
            updatedLeave.approval_stage === 'pending_hr'
              ? 'Leave approval (HR stage)'
              : updatedLeave.approval_stage === 'pending_manager'
                ? 'Leave approval (manager stage)'
                : baseInput.title,
          metadata: {
            ...(baseInput.metadata ?? {}),
            approval_stage: updatedLeave.approval_stage,
          },
        };

        await upsertWorkItem(enrichedInput as any);
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
