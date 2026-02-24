import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Get all tasks for the current employee
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    // Find all employer_employee records for this employee
    const { data: employeeRecords } = await supabase
      .from('employer_employees')
      .select('id')
      .eq('employee_id', user.id)
      .eq('employment_status', 'active');

    if (!employeeRecords || employeeRecords.length === 0) {
      return NextResponse.json({
        success: true,
        tasks: [],
        count: 0,
        message: 'No active employment found',
      });
    }

    const employerEmployeeIds = employeeRecords.map(r => r.id);

    let query = supabase
      .from('employee_tasks')
      .select(
        `
        *,
        assigned_by_user:assigned_by (
          id,
          full_name,
          email
        )
      `
      )
      .in('employer_employee_id', employerEmployeeIds)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tasks: tasks || [],
      count: (tasks || []).length,
    });
  } catch (error) {
    console.error('Error in GET /api/employee/my-tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
