import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

/**
 * ⚠️ WARNING: MOCK DATA IMPLEMENTATION
 *
 * This endpoint currently returns MOCK DATA because the `promoter_tasks` table
 * does not exist in the database schema.
 *
 * TODO before production:
 * 1. Create `promoter_tasks` table in Supabase
 * 2. Add proper RLS policies for the table
 * 3. Replace mock data with real Supabase queries
 * 4. Add RBAC guards using withRBAC() for all endpoints
 * 5. Add proper validation schemas with Zod
 * 6. Implement audit logging for task operations
 *
 * UI features that depend on this endpoint will NOT persist data until fixed.
 */

// Mock tasks data since promoter_tasks table doesn't exist
const mockTasks = [
  {
    id: '1',
    promoter_id: 'promoter-1',
    title: 'Complete onboarding training',
    description: 'Finish all required training modules',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
    priority: 'high',
    assigned_to: 'promoter-1',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    promoter_id: 'promoter-1',
    title: 'Submit weekly report',
    description: 'Submit performance report for the week',
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    priority: 'medium',
    assigned_to: 'promoter-1',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    promoter_id: 'promoter-1',
    title: 'Attend team meeting',
    description: 'Weekly team sync meeting',
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    priority: 'low',
    assigned_to: 'promoter-1',
    created_at: new Date().toISOString(),
  },
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promoter_id } = await params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const due = searchParams.get('due');

    // Filter mock data
    let tasks = mockTasks.filter(task => task.promoter_id === promoter_id);

    if (status) tasks = tasks.filter(task => task.status === status);
    if (priority) tasks = tasks.filter(task => task.priority === priority);
    if (due)
      tasks = tasks.filter(task => new Date(task.due_date) <= new Date(due));

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching promoter tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promoter tasks' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promoter_id } = await params;
    const body = await req.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    // Create mock task
    const newTask = {
      id: Date.now().toString(),
      promoter_id,
      title: body.title,
      description: body.description || '',
      due_date:
        body.due_date ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: body.status || 'pending',
      priority: body.priority || 'medium',
      assigned_to: body.assigned_to || promoter_id,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(newTask);
  } catch (error) {
    console.error('Error creating promoter task:', error);
    return NextResponse.json(
      { error: 'Failed to create promoter task' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promoter_id } = await params;
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    }

    // Mock update
    const updatedTask = {
      id: body.id,
      promoter_id,
      title: body.title || 'Updated Task',
      description: body.description || '',
      due_date: body.due_date || new Date().toISOString(),
      status: body.status || 'pending',
      priority: body.priority || 'medium',
      assigned_to: body.assigned_to || promoter_id,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating promoter task:', error);
    return NextResponse.json(
      { error: 'Failed to update promoter task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promoter_id } = await params;
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    }

    // Mock deletion
    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting promoter task:', error);
    return NextResponse.json(
      { error: 'Failed to delete promoter task' },
      { status: 500 }
    );
  }
}
