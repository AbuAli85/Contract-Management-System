import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { upsertWorkItem, upsertInputFromTask } from '@/lib/work-engine';
import { logger } from '@/lib/logger';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/tasks - list tasks for the active company (or provided company_id)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const companyIdParam = searchParams.get('company_id');

    // Resolve company_id: prefer explicit query param, else use active_company_id
    let companyId = companyIdParam;
    if (!companyId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('active_company_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.active_company_id) {
        return NextResponse.json(
          {
            success: false,
            error: 'No active company set. Please select an active company first.',
          },
          { status: 400 }
        );
      }

      companyId = profile.active_company_id;
    }

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    const { data: tasks, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch tasks',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tasks: tasks || [],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - create a new task in the active company
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      due_date,
      assigned_to,
      related_contract_id,
    } = body || {};

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Task title is required' },
        { status: 400 }
      );
    }

    // Resolve company_id from profile.active_company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.active_company_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active company set. Please select an active company first.',
        },
        { status: 400 }
      );
    }

    const companyId = profile.active_company_id;

    const insertPayload: any = {
      company_id: companyId,
      title,
      description: description || null,
      status: status || 'todo',
      priority: priority || 'medium',
      due_date: due_date || null,
      assigned_to: assigned_to || null,
      related_contract_id: related_contract_id || null,
      created_by: user.id,
    };

    const { data: task, error: insertError } = await supabase
      .from('tasks')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create task',
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    // Best-effort: write initial task_event
    try {
      await supabase.from('task_events').insert({
        company_id: companyId,
        task_id: task.id,
        action: 'created',
        actor: user.id,
        metadata: {
          title,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date,
        },
      });
    } catch (error) {
      logger.error('Failed to insert initial task_event', { error, companyId, taskId: task.id }, 'api/tasks');
    }

    // Best-effort: mirror task into universal work_items inbox
    try {
      await upsertWorkItem(upsertInputFromTask(task as any, user.id));
    } catch (error) {
      logger.error('Failed to mirror task into work_items', { error, taskId: task.id }, 'api/tasks');
    }

    return NextResponse.json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

