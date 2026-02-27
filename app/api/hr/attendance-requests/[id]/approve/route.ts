import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCompanyRole } from '@/lib/auth/get-company-role';
import { WorkflowService } from '@/lib/workflow/workflow-service';
import {
  resolveApprovalAssignee,
  upsertInputFromWorkflowInstance,
  upsertWorkItem,
} from '@/lib/work-engine';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

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
    const requestId = params.id;
    const body = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { error: 'Invalid attendance request ID' },
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

    const { companyId, role: companyRole } = await getCompanyRole(supabase);
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

    // Manager-only approval for attendance corrections
    if (!['manager', 'admin'].includes(companyRole)) {
      return NextResponse.json(
        { error: 'Only company managers or admins can approve attendance requests' },
        { status: 403 }
      );
    }

    // Fetch the request scoped by company
    const { data: attendanceRequest, error: fetchError } = await supabase
      .from('hr.attendance_requests')
      .select(
        `
        id,
        workflow_entity_id,
        company_id,
        employee_id,
        attendance_date,
        status,
        approval_stage,
        created_at
      `
      )
      .eq('id', requestId)
      .eq('company_id', companyId)
      .single();

    if (fetchError || !attendanceRequest) {
      return NextResponse.json(
        { error: 'Attendance request not found' },
        { status: 404 }
      );
    }

    if (attendanceRequest.approval_stage !== 'pending_manager') {
      return NextResponse.json(
        { error: 'Attendance request has already been processed' },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const updateData: any = {};
    let triggerName: string | null = null;

    if (action === 'approve') {
      updateData.status = 'approved';
      updateData.approval_stage = 'approved';
      triggerName = 'approve';
    } else {
      updateData.status = 'rejected';
      updateData.approval_stage = 'rejected';
      if (rejection_reason) {
        updateData.reason = rejection_reason;
      }
      triggerName = 'reject';
    }

    updateData.updated_at = nowIso;

    const { data: updatedRequest, error } = await supabase
      .from('hr.attendance_requests')
      .update(updateData)
      .eq('id', requestId)
      .eq('company_id', companyId)
      .select(
        `
        id,
        workflow_entity_id,
        company_id,
        employee_id,
        attendance_date,
        status,
        approval_stage,
        created_at
      `
      )
      .single();

    if (error || !updatedRequest) {
      return NextResponse.json(
        { error: 'Failed to update attendance request' },
        { status: 500 }
      );
    }

    // Drive workflow transition and mirror into work_items
    try {
      const wf = new WorkflowService(supabase, companyId, user.id);

      if (triggerName) {
        const wfResult = await wf.transition(
          'attendance_request',
          String(attendanceRequest.workflow_entity_id),
          triggerName,
          rejection_reason
        );
        if (!wfResult.success) {
          logger.error(
            'Failed to transition attendance_request workflow',
            { error: wfResult.error, companyId, attendanceRequestId: requestId },
            'api/hr/attendance-requests/[id]/approve'
          );
        }
      }

      const instance = await wf.getInstance(
        'attendance_request',
        String(attendanceRequest.workflow_entity_id)
      );

      if (instance) {
        // Determine final assignee (for audit/tracking); in terminal state we generally
        // keep the assignee as the approver.
        const assigneeId =
          instance.assignedTo && typeof instance.assignedTo === 'string'
            ? instance.assignedTo
            : user.id;

        // Mirror to work_items; terminal states map to done/cancelled via mapper
        const baseInput = upsertInputFromWorkflowInstance(instance as any, {
          createdBy: null,
          assigneeId,
        } as any);

        const enrichedInput = {
          ...baseInput,
          title:
            updatedRequest.status === 'approved'
              ? 'Attendance correction approved'
              : 'Attendance correction rejected',
          metadata: {
            ...(baseInput.metadata ?? {}),
            approval_stage: updatedRequest.approval_stage,
          },
        };

        await upsertWorkItem(enrichedInput as any);
      }
    } catch (wfError) {
      logger.error(
        'Failed to mirror attendance_request approval into work_items',
        { error: wfError, companyId, attendanceRequestId: requestId },
        'api/hr/attendance-requests/[id]/approve'
      );
    }

    return NextResponse.json(
      {
        message:
          action === 'approve'
            ? 'Attendance request approved'
            : 'Attendance request rejected',
        data: updatedRequest,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

