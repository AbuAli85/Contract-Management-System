import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

/**
 * POST /api/offboarding/initiate
 *
 * Initiate offboarding process for an employee
 * Creates offboarding checklist and initializes all offboarding tasks
 */
export const POST = withAnyRBAC(
  ['company:manage:all', 'admin:all'],
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const {
        employer_employee_id,
        last_working_date,
        offboarding_type, // 'resignation', 'termination', 'end_of_contract', 'retirement'
        reason,
      } = body;

      if (!employer_employee_id || !last_working_date || !offboarding_type) {
        return NextResponse.json(
          {
            error:
              'Missing required fields: employer_employee_id, last_working_date, offboarding_type',
          },
          { status: 400 }
        );
      }

      // Get employee details
      const { data: employee } = await supabase
        .from('employer_employees')
        .select(
          `
          id,
          employee_id,
          employer_id,
          company_id,
          job_title,
          department,
          employee:profiles!employer_employees_employee_id_fkey(
            id,
            email,
            full_name
          )
        `
        )
        .eq('id', employer_employee_id)
        .single();

      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      // Create offboarding checklist with default tasks
      const defaultTasks = [
        {
          task_name: 'Exit Interview',
          task_description: 'Schedule and conduct exit interview',
          task_category: 'interview',
          is_mandatory: true,
        },
        {
          task_name: 'Return Company Equipment',
          task_description: 'Collect and return all company equipment',
          task_category: 'equipment',
          is_mandatory: true,
        },
        {
          task_name: 'Return Access Cards',
          task_description: 'Return access cards and keys',
          task_category: 'access',
          is_mandatory: true,
        },
        {
          task_name: 'Revoke System Access',
          task_description: 'Revoke all system and application access',
          task_category: 'access',
          is_mandatory: true,
        },
        {
          task_name: 'Return Documents',
          task_description: 'Return all company documents',
          task_category: 'document',
          is_mandatory: true,
        },
        {
          task_name: 'Final Settlement',
          task_description: 'Process final financial settlement',
          task_category: 'settlement',
          is_mandatory: true,
        },
        {
          task_name: 'Experience Certificate',
          task_description: 'Generate and issue experience certificate',
          task_category: 'document',
          is_mandatory: false,
        },
      ];

      const { data: checklist, error: checklistError } = await supabase
        .from('offboarding_checklists')
        .insert({
          employer_employee_id,
          company_id: employee.company_id,
          checklist_items: defaultTasks.map((task, index) => ({
            task: task.task_name,
            completed: false,
            due_date: last_working_date,
            assigned_to: null,
          })),
          status: 'pending',
          target_completion_date: last_working_date,
          created_by: user.id,
        })
        .select()
        .single();

      if (checklistError || !checklist) {
        return NextResponse.json(
          {
            error: 'Failed to create offboarding checklist',
            details: checklistError?.message,
          },
          { status: 500 }
        );
      }

      // Create individual tasks
      const taskInserts = defaultTasks.map((task, index) => ({
        offboarding_checklist_id: checklist.id,
        task_name: task.task_name,
        task_description: task.task_description,
        task_category: task.task_category,
        is_mandatory: task.is_mandatory,
        status: 'pending',
        due_date: last_working_date,
        assigned_by: user.id,
      }));

      const { error: tasksError } = await supabase
        .from('offboarding_tasks')
        .insert(taskInserts);

      if (tasksError) {
        // Continue anyway, tasks can be added later
      }

      // Create exit interview record
      const { data: exitInterview } = await supabase
        .from('exit_interviews')
        .insert({
          employer_employee_id,
          employee_id: employee.employee_id,
          company_id: employee.company_id,
          interview_date: last_working_date,
          resignation_reason: reason,
          status: 'scheduled',
          created_by: user.id,
        })
        .select()
        .single();

      // Create document return tracking
      const { data: documentReturn } = await supabase
        .from('document_return_tracking')
        .insert({
          employer_employee_id,
          company_id: employee.company_id,
          documents_to_return: [
            {
              document_type: 'access_card',
              document_name: 'Access Card',
              returned: false,
            },
            {
              document_type: 'laptop',
              document_name: 'Company Laptop',
              returned: false,
            },
            {
              document_type: 'phone',
              document_name: 'Company Phone',
              returned: false,
            },
            {
              document_type: 'other',
              document_name: 'Other Equipment',
              returned: false,
            },
          ],
          status: 'pending',
          requested_date: new Date().toISOString().split('T')[0],
          deadline_date: last_working_date,
          created_by: user.id,
        })
        .select()
        .single();

      // Update employee status
      await supabase
        .from('employer_employees')
        .update({
          employment_status: 'terminated',
          termination_date: last_working_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', employer_employee_id);

      return NextResponse.json(
        {
          success: true,
          offboarding: {
            checklist,
            exitInterview,
            documentReturn,
          },
          message: 'Offboarding process initiated successfully',
        },
        { status: 201 }
      );
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
