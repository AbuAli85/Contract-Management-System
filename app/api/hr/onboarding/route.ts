/**
 * HR Onboarding / Offboarding Workflow API
 *
 * GET  /api/hr/onboarding?type=onboarding|offboarding  — list active workflows
 * POST /api/hr/onboarding                               — start a new workflow
 * PATCH /api/hr/onboarding                              — update a step status
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRBAC } from '@/lib/rbac/guard';

const ONBOARDING_STEPS = [
  { key: 'offer_letter', label: 'Offer Letter Sent', order: 1 },
  { key: 'contract_signed', label: 'Contract Signed', order: 2 },
  { key: 'id_documents', label: 'ID Documents Collected', order: 3 },
  { key: 'work_permit', label: 'Work Permit Applied', order: 4 },
  { key: 'system_access', label: 'System Access Provisioned', order: 5 },
  { key: 'equipment', label: 'Equipment Assigned', order: 6 },
  { key: 'orientation', label: 'Orientation Completed', order: 7 },
  { key: 'probation_start', label: 'Probation Period Started', order: 8 },
];

const OFFBOARDING_STEPS = [
  { key: 'resignation_accepted', label: 'Resignation Accepted', order: 1 },
  { key: 'handover_plan', label: 'Handover Plan Created', order: 2 },
  { key: 'equipment_returned', label: 'Equipment Returned', order: 3 },
  { key: 'system_access_revoked', label: 'System Access Revoked', order: 4 },
  { key: 'final_settlement', label: 'Final Settlement Calculated', order: 5 },
  { key: 'exit_interview', label: 'Exit Interview Completed', order: 6 },
  { key: 'clearance_certificate', label: 'Clearance Certificate Issued', order: 7 },
];

export const GET = withRBAC('hr:read:own', async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'onboarding';
    const employeeId = searchParams.get('employee_id');

    let query = supabase
      .from('hr_workflows')
      .select('*, profiles:employee_id(full_name, email)')
      .eq('workflow_type', type)
      .order('created_at', { ascending: false });

    if (employeeId) query = query.eq('employee_id', employeeId);

    const { data, error } = await query;
    if (error) {
      // Table may not exist yet — return template steps
      return NextResponse.json({
        workflows: [],
        template_steps: type === 'onboarding' ? ONBOARDING_STEPS : OFFBOARDING_STEPS,
      });
    }

    return NextResponse.json({
      workflows: data ?? [],
      template_steps: type === 'onboarding' ? ONBOARDING_STEPS : OFFBOARDING_STEPS,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
});

export const POST = withRBAC('hr:write:own', async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { employee_id, employee_name, workflow_type, start_date, notes } = body;

    if (!employee_id || !workflow_type) {
      return NextResponse.json(
        { error: 'employee_id and workflow_type are required' },
        { status: 400 }
      );
    }

    const steps = workflow_type === 'onboarding' ? ONBOARDING_STEPS : OFFBOARDING_STEPS;
    const initialSteps = steps.map(step => ({
      ...step,
      status: 'pending',
      completed_at: null,
      completed_by: null,
      notes: null,
    }));

    const { data, error } = await supabase
      .from('hr_workflows')
      .insert({
        employee_id,
        employee_name,
        workflow_type,
        status: 'in_progress',
        steps: initialSteps,
        start_date: start_date ?? new Date().toISOString(),
        notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ workflow: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create workflow' },
      { status: 500 }
    );
  }
});

export const PATCH = withRBAC('hr:write:own', async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { workflow_id, step_key, status, notes: stepNotes } = body;

    if (!workflow_id || !step_key || !status) {
      return NextResponse.json(
        { error: 'workflow_id, step_key, and status are required' },
        { status: 400 }
      );
    }

    // Get current workflow
    const { data: workflow, error: fetchError } = await supabase
      .from('hr_workflows')
      .select('steps, status')
      .eq('id', workflow_id)
      .single();

    if (fetchError) throw fetchError;

    // Update the specific step
    const updatedSteps = (workflow.steps as Array<{
      key: string;
      status: string;
      completed_at: string | null;
      completed_by: string | null;
      notes: string | null;
    }>).map(step => {
      if (step.key === step_key) {
        return {
          ...step,
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : step.completed_at,
          completed_by: status === 'completed' ? user.id : step.completed_by,
          notes: stepNotes ?? step.notes,
        };
      }
      return step;
    });

    // Check if all steps are completed
    const allCompleted = updatedSteps.every(s => s.status === 'completed');

    const { data, error } = await supabase
      .from('hr_workflows')
      .update({
        steps: updatedSteps,
        status: allCompleted ? 'completed' : 'in_progress',
        completed_at: allCompleted ? new Date().toISOString() : null,
      })
      .eq('id', workflow_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ workflow: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update workflow step' },
      { status: 500 }
    );
  }
});
