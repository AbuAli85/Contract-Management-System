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

    // Fetch promoter profile
    const { data: promoter, error: promoterError } = await supabase
      .from('promoters')
      .select('*')
      .eq('id', promoterId)
      .single();

    if (promoterError || !promoter) {
      return NextResponse.json(
        { error: 'Promoter not found' },
        { status: 404 }
      );
    }

    // Fetch task stats from employee_tasks
    const { data: tasks } = await supabase
      .from('employee_tasks')
      .select('id, status')
      .eq('assigned_to', promoterId)
      .limit(500);

    const totalTasks = tasks?.length ?? 0;
    const completedTasks =
      tasks?.filter(t => t.status === 'completed').length ?? 0;
    const pendingTasks =
      tasks?.filter(t => t.status === 'pending' || t.status === 'in_progress')
        .length ?? 0;
    const overdueTasks = tasks?.filter(t => t.status === 'overdue').length ?? 0;

    return NextResponse.json({
      promoter: {
        id: promoter.id,
        name: promoter.name_en ?? promoter.name_ar ?? 'Unknown',
        email: promoter.email,
        avatar: promoter.profile_picture_url,
        status: promoter.status,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch promoter dashboard' },
      { status: 500 }
    );
  }
}
