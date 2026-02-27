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

const AttendanceRequestSchema = z.object({
  employee_id: z.number(),
  attendance_date: z.string(), // ISO date (YYYY-MM-DD)
  original_check_in: z.string().optional(),
  original_check_out: z.string().optional(),
  requested_check_in: z.string().optional(),
  requested_check_out: z.string().optional(),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const parsed = AttendanceRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      employee_id,
      attendance_date,
      original_check_in,
      original_check_out,
      requested_check_in,
      requested_check_out,
      reason,
    } = parsed.data;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const {
      companyId,
      role: companyRole,
      profileId,
    } = await getCompanyRole(supabase);

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

    // Load employee and enforce tenant ownership
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

    // Self-only: non-admin, non-manager may only submit for their own employee_id
    const { data: hrProfile } = await supabase
      .from('hr.user_profiles')
      .select('employee_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    const isCompanyAdminOrManager =
      companyRole === 'admin' || companyRole === 'manager';

    if (!isCompanyAdminOrManager) {
      if (!hrProfile?.employee_id || hrProfile.employee_id !== employee_id) {
        return NextResponse.json(
          {
            error:
              'You can only submit attendance correction requests for your own record',
          },
          { status: 403 }
        );
      }
    }

    const insertPayload: any = {
      company_id: companyId,
      employee_id,
      attendance_date,
      status: 'pending',
      approval_stage: 'pending_manager',
      reason,
      created_by: user.id,
    };

    if (original_check_in) {
      insertPayload.original_check_in = original_check_in;
    }
    if (original_check_out) {
      insertPayload.original_check_out = original_check_out;
    }
    if (requested_check_in) {
      insertPayload.requested_check_in = requested_check_in;
    }
    if (requested_check_out) {
      insertPayload.requested_check_out = requested_check_out;
    }

    const { data, error } = await supabase
      .from('hr.attendance_requests')
      .insert(insertPayload)
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

    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to create attendance request' },
        { status: 500 }
      );
    }

    // Start workflow instance and mirror into work_items (best-effort)
    try {
      const wf = new WorkflowService(supabase, companyId, user.id);

      const startResult = await wf.startAttendanceRequest(
        String(data.workflow_entity_id)
      );
      if (!startResult.success) {
        logger.error(
          'Failed to start attendance_request workflow',
          { error: startResult.error, companyId, attendanceRequestId: data.id },
          'api/hr/attendance-requests'
        );
      } else {
        const instance = await wf.getInstance(
          'attendance_request',
          String(data.workflow_entity_id)
        );

        if (instance) {
          // Resolve initial assignee (line manager or HR fallback)
          const assigneeId = await resolveApprovalAssignee(supabase as any, {
            companyId,
            entityType: 'attendance_request',
            entityId: String(data.workflow_entity_id),
            currentState: instance.currentState,
            requestedBy: employee.user_id ?? null,
          });

          // Persist initial assignee in workflow_instances for determinism
          if (assigneeId) {
            try {
              await supabase
                .from('workflow_instances')
                .update({ assigned_to: assigneeId })
                .eq('company_id', companyId)
                .eq('entity_type', 'attendance_request')
                .eq('entity_id', data.workflow_entity_id);
            } catch (assignErr) {
              logger.error(
                'Failed to persist initial attendance assignee in workflow_instances',
                { error: assignErr, companyId, attendanceRequestId: data.id },
                'api/hr/attendance-requests'
              );
            }
          }

          const baseInput = upsertInputFromWorkflowInstance(instance as any, {
            createdBy: profileId ?? undefined,
            ...(instance.assignedTo ? {} : { assigneeId }),
          } as any);

          const enrichedInput = {
            ...baseInput,
            title: 'Attendance correction (manager stage)',
            metadata: {
              ...(baseInput.metadata ?? {}),
              approval_stage: data.approval_stage,
            },
          };

          await upsertWorkItem(enrichedInput as any);
        }
      }
    } catch (wfError) {
      logger.error(
        'Failed to mirror attendance_request into work_items',
        { error: wfError, companyId, attendanceRequestId: data.id },
        'api/hr/attendance-requests'
      );
    }

    return NextResponse.json(
      {
        message: 'Attendance correction request submitted successfully',
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

