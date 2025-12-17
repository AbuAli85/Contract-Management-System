import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// GET - List tasks
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
    const employeeId = searchParams.get('employee_id');

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('employee_tasks')
      .select(`
        *,
        employer_employee:employer_employees!inner(
          id,
          employee_id,
          employer_id,
          job_title,
          company_id,
          employee:profiles!employer_employees_employee_id_fkey(
            id,
            name_en,
            name_ar
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    if (employeeId) {
      query = query.eq('employer_employee_id', employeeId);
    }

    // Company scoping for non-admins
    if (profile?.role !== 'admin' && profile?.active_company_id) {
      query = query.eq('employer_employee.company_id', profile.active_company_id);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tasks: tasks || [],
    });
  } catch (error) {
    console.error('Error in GET /api/hr/tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create task
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      employer_employee_id,
      title,
      description,
      task_type = 'general',
      priority = 'medium',
      due_date,
      estimated_hours,
    } = body;

    // Validate required fields
    if (!employer_employee_id || !title) {
      return NextResponse.json(
        { error: 'employer_employee_id and title are required' },
        { status: 400 }
      );
    }

    // Verify access
    const { data: employeeLink } = await supabase
      .from('employer_employees')
      .select('employer_id, company_id')
      .eq('id', employer_employee_id)
      .single();

    if (!employeeLink) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active_company_id')
      .eq('id', user.id)
      .single();

    const isEmployer = employeeLink.employer_id === user.id;
    const isAdmin = profile?.role === 'admin';
    const isHR = profile?.role === 'hr_manager' || profile?.role === 'manager';
    const isSameCompany = profile?.active_company_id === employeeLink.company_id;

    if (!isEmployer && !isAdmin && !(isHR && isSameCompany)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Create task
    const { data: task, error: createError } = await (supabaseAdmin.from('employee_tasks') as any)
      .insert({
        employer_employee_id,
        title,
        description: description || null,
        task_type,
        priority,
        status: 'pending',
        due_date: due_date || null,
        estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
        assigned_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating task:', createError);
      return NextResponse.json(
        { error: 'Failed to create task', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('Error in POST /api/hr/tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

