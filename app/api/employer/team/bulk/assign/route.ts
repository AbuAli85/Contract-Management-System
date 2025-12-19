import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { employee_ids, task } = body;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
      return NextResponse.json(
        { error: 'Employee IDs are required' },
        { status: 400 }
      );
    }

    if (!task || !task.task_title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    // Verify all employees belong to the user's company
    const { data: employees, error: employeesError } = await supabase
      .from('employer_employees')
      .select('id, company_id')
      .in('id', employee_ids)
      .eq('employer_id', user.id);

    if (employeesError || !employees || employees.length !== employee_ids.length) {
      return NextResponse.json(
        { error: 'Some employees not found or unauthorized' },
        { status: 403 }
      );
    }

    // Create tasks for all employees
    const tasksToInsert = employee_ids.map((employeeId: string) => ({
      employer_employee_id: employeeId,
      title: task.task_title,
      description: task.task_description || null,
      priority: task.priority || 'medium',
      status: 'pending',
      due_date: task.due_date || null,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await (supabaseAdmin.from('employee_tasks') as any)
      .insert(tasksToInsert);

    if (insertError) {
      console.error('Error creating tasks:', insertError);
      return NextResponse.json(
        { error: 'Failed to create tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Assigned task to ${employee_ids.length} employee(s)`,
      assigned_count: employee_ids.length,
    });
  } catch (error) {
    console.error('Error in POST /api/employer/team/bulk/assign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

