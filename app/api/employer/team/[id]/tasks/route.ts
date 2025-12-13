import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

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
    const { id } = await params; // employer_employee_id
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

    // Verify access
    const { data: teamMember } = await supabase
      .from('employer_employees')
      .select('employer_id, employee_id')
      .eq('id', id)
      .single();

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
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
      console.error('Error fetching tasks:', tasksError);
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

      commentsCount = (comments || []).reduce((acc, comment) => {
        acc[comment.task_id] = (acc[comment.task_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
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
    console.error('Error in GET /api/employer/team/[id]/tasks:', error);
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
    const { id } = await params; // employer_employee_id
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Verify user is the employer
    const { data: teamMember } = await supabase
      .from('employer_employees')
      .select('employer_id')
      .eq('id', id)
      .single();

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    if (teamMember.employer_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
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
    console.error('Error in POST /api/employer/team/[id]/tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export with RBAC protection
export const GET = withAnyRBAC(
  ['employer:read:own', 'employee:read:own'],
  getTasksHandler
);

export const POST = withRBAC('employer:manage:own', createTaskHandler);

