import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employerId = searchParams.get('employer_id') || user.id;

    // Get user's active company
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    // Fetch all employees for the employer
    let employeesQuery = (supabaseAdmin.from('employer_employees') as any)
      .select(`
        id,
        employee_id,
        job_title,
        department,
        employment_status,
        employee:employee_id (
          id,
          name_en,
          name_ar,
          email
        )
      `);

    // Filter by employer
    if (userProfile?.role !== 'admin') {
      employeesQuery = employeesQuery.eq('employer_id', employerId);
    } else if (employerId) {
      employeesQuery = employeesQuery.eq('employer_id', employerId);
    }

    const { data: employees, error: employeesError } = await employeesQuery;

    if (employeesError) {
      console.error('Error fetching employees:', employeesError);
      return NextResponse.json(
        { error: 'Failed to fetch employees', details: employeesError.message },
        { status: 500 }
      );
    }

    // For each employee, fetch their assignments, tasks, and targets
    const employeesWithData = await Promise.all(
      (employees || []).map(async (employee: any) => {
        const employerEmployeeId = employee.id;

        // Fetch assignments
        const { data: assignments } = await (
          supabaseAdmin.from('client_assignments') as any
        )
          .select(
            `
            id,
            client_party_id,
            job_title,
            department,
            work_location,
            start_date,
            end_date,
            status,
            client:client_party_id (
              id,
              name_en,
              name_ar
            )
          `
          )
          .eq('employer_employee_id', employerEmployeeId)
          .eq('status', 'active');

        // Fetch tasks
        const { data: tasks } = await (
          supabaseAdmin.from('employee_tasks') as any
        )
          .select(
            `
            id,
            title,
            status,
            priority,
            due_date
          `
          )
          .eq('employer_employee_id', employerEmployeeId)
          .order('due_date', { ascending: true });

        // Fetch targets
        const { data: targets } = await (
          supabaseAdmin.from('employee_targets') as any
        )
          .select(
            `
            id,
            title,
            target_value,
            current_value,
            progress_percentage,
            status,
            end_date
          `
          )
          .eq('employer_employee_id', employerEmployeeId)
          .eq('status', 'active')
          .order('end_date', { ascending: true });

        // Calculate stats
        const stats = {
          activeAssignments: assignments?.length || 0,
          completedTasks:
            tasks?.filter((t: any) => t.status === 'completed').length || 0,
          totalTasks: tasks?.length || 0,
          activeTargets: targets?.length || 0,
          targetsProgress:
            targets && targets.length > 0
              ? Math.round(
                  targets.reduce(
                    (sum: number, t: any) => sum + (t.progress_percentage || 0),
                    0
                  ) / targets.length
                )
              : 0,
        };

        return {
          employee,
          assignments: assignments || [],
          tasks: tasks || [],
          targets: targets || [],
          stats,
        };
      })
    );

    return NextResponse.json({
      success: true,
      employees: employeesWithData,
      count: employeesWithData.length,
    });
  } catch (error) {
    console.error('Error in GET /api/hr/employer-employees/alignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
