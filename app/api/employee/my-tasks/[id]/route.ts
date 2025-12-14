import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get task with employer_employee verification
    const { data: task, error: taskError } = await supabase
      .from('employee_tasks')
      .select(
        `
        *,
        employer_employee:employer_employee_id (
          id,
          employee_id,
          employer_id
        ),
        assigned_by_user:assigned_by (
          id,
          full_name,
          email
        )
      `
      )
      .eq('id', id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify the user is the employee
    const employerEmployee = task.employer_employee as any;
    if (employerEmployee?.employee_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have access to this task' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Error in GET /api/employee/my-tasks/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update task status (employee can update status, completion notes, actual hours)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, completion_notes, actual_hours } = body;

    // First verify the task belongs to this employee
    const { data: task, error: taskError } = await supabase
      .from('employee_tasks')
      .select(
        `
        id,
        status,
        employer_employee:employer_employee_id (
          id,
          employee_id
        )
      `
      )
      .eq('id', id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const employerEmployee = task.employer_employee as any;
    if (employerEmployee?.employee_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have access to this task' },
        { status: 403 }
      );
    }

    // Build update object (only allowed fields)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      const allowedStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateData.status = status;
      
      // If completing the task, set completed_at
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (completion_notes !== undefined) {
      updateData.completion_notes = completion_notes;
    }

    if (actual_hours !== undefined) {
      updateData.actual_hours = actual_hours;
    }

    // Update the task
    const { data: updatedTask, error: updateError } = await supabase
      .from('employee_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json(
        { error: 'Failed to update task', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('Error in PATCH /api/employee/my-tasks/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

