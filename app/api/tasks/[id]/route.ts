import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// PATCH /api/tasks/[id] - update status / priority / due_date
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;
    const body = await request.json();
    const { status, priority, due_date } = body || {};

    if (!status && !priority && !due_date) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one of status, priority, or due_date must be provided',
        },
        { status: 400 }
      );
    }

    // Fetch the task first for company_id and current values (RLS ensures visibility)
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('id, company_id, status, priority, due_date, assigned_to')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const updatePayload: any = {};
    if (status) updatePayload.status = status;
    if (priority) updatePayload.priority = priority;
    if (due_date) updatePayload.due_date = due_date;

    const { data: updated, error: updateError } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update task',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Best-effort: create a task_event capturing the change
    try {
      const metadata: any = {
        previous_status: task.status,
        new_status: updated.status,
        previous_priority: task.priority,
        new_priority: updated.priority,
        previous_due_date: task.due_date,
        new_due_date: updated.due_date,
      };

      await supabase.from('task_events').insert({
        company_id: task.company_id,
        task_id: task.id,
        action: 'updated',
        actor: user.id,
        metadata,
      });
    } catch {
      // Ignore audit failures
    }

    return NextResponse.json({
      success: true,
      message: 'Task updated successfully',
      task: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

