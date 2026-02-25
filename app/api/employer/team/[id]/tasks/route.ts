import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureEmployerEmployeeRecord } from '@/lib/utils/ensure-employee-record';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Get tasks for employee
async function getTasksHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    let { id } = await params; // employer_employee_id (may be prefixed with 'promoter_')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ AUTO-CONVERT: Ensure employer_employee record exists (auto-create for promoters)
    try {
      const { employerEmployeeId } = await ensureEmployerEmployeeRecord(
        id,
        user.id
      );
      id = employerEmployeeId; // Use the actual employer_employee ID
    } catch (error: any) {
      return NextResponse.json(
        {
          error: 'Failed to process employee record',
          details:
            error.message ||
            'Could not create or find employer_employee record',
          input_id: id,
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    // ✅ COMPANY SCOPE: Verify access and check company scope
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    const { data: teamMember } = await supabase
      .from('employer_employees')
      .select('employer_id, employee_id, company_id')
      .eq('id', id)
      .single();

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // ✅ COMPANY SCOPE: Verify team member belongs to active company
    // Allow if company_id is null (backwards compatibility) OR matches active company
    if (
      profile?.active_company_id &&
      teamMember.company_id &&
      teamMember.company_id !== profile.active_company_id
    ) {
      return NextResponse.json(
        { error: 'Team member does not belong to your active company' },
        { status: 403 }
      );
    }

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
      .eq('employer_employee_id', id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) {
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    // Get task comments count
    const taskIds = tasks?.map(t => t.id) || [];
    let commentsCount: Record<string, number> = {};

    if (taskIds.length > 0) {
      const { data: comments } = await supabase
        .from('task_comments')
        .select('task_id')
        .in('task_id', taskIds);

      commentsCount = (comments || []).reduce(
        (acc, comment) => {
          acc[comment.task_id] = (acc[comment.task_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }

    const tasksWithComments = (tasks || []).map(task => ({
      ...task,
      comments_count: commentsCount[task.id] || 0,
    }));

    return NextResponse.json({
      success: true,
      tasks: tasksWithComments,
      count: tasksWithComments.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create task
async function createTaskHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    let { id } = await params; // employer_employee_id (may be prefixed with 'promoter_')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ AUTO-CONVERT: Ensure employer_employee record exists (auto-create for promoters)
    try {
      const { employerEmployeeId } = await ensureEmployerEmployeeRecord(
        id,
        user.id
      );
      id = employerEmployeeId; // Use the actual employer_employee ID
    } catch (error: any) {
      return NextResponse.json(
        {
          error: 'Failed to process employee record',
          details:
            error.message ||
            'Could not create or find employer_employee record',
          input_id: id,
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      task_type,
      priority,
      due_date,
      estimated_hours,
      tags,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    // ✅ COMPANY SCOPE: Verify user is the employer and check company scope
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    const { data: teamMember } = await supabase
      .from('employer_employees')
      .select('employer_id, company_id')
      .eq('id', id)
      .single();

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // ✅ COMPANY SCOPE: Verify team member belongs to active company
    // Allow if company_id is null (backwards compatibility) OR matches active company
    if (
      userProfile?.active_company_id &&
      teamMember.company_id &&
      teamMember.company_id !== userProfile.active_company_id
    ) {
      return NextResponse.json(
        { error: 'Team member does not belong to your active company' },
        { status: 403 }
      );
    }

    if (teamMember.employer_id !== user.id) {
      if (userProfile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only employer can create tasks' },
          { status: 403 }
        );
      }
    }

    // Create task
    const { data: task, error: createError } = await supabase
      .from('employee_tasks')
      .insert({
        employer_employee_id: id,
        title,
        description,
        task_type: task_type || 'general',
        priority: priority || 'medium',
        status: 'pending',
        due_date,
        estimated_hours,
        tags: tags || [],
        assigned_by: user.id,
      })
      .select()
      .single();

    if (createError) {
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers directly - internal authorization is already implemented
export const GET = getTasksHandler;
export const POST = createTaskHandler;
