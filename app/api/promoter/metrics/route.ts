import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const promoterId = searchParams.get('promoterId') ?? user.id;

    // Fetch real task metrics from employee_tasks
    const { data: tasks } = await supabase
      .from('employee_tasks')
      .select('id, status, created_at')
      .eq('assigned_to', promoterId)
      .limit(500);

    const totalTasks = tasks?.length ?? 0;
    const completedTasks =
      tasks?.filter(t => t.status === 'completed').length ?? 0;
    const pendingTasks =
      tasks?.filter(t => t.status === 'pending' || t.status === 'in_progress')
        .length ?? 0;
    const overdueTasks = tasks?.filter(t => t.status === 'overdue').length ?? 0;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      personalStats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch promoter metrics' },
      { status: 500 }
    );
  }
}
