import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: promoterId } = await params;
    if (!promoterId) {
      return NextResponse.json({ error: 'Promoter ID is required' }, { status: 400 });
    }

    // Verify promoter exists
    const { data: promoter, error: promoterError } = await supabase
      .from('promoters')
      .select('id, name_en, status')
      .eq('id', promoterId)
      .single();

    if (promoterError || !promoter) {
      return NextResponse.json({ error: 'Promoter not found' }, { status: 404 });
    }

    // Fetch all metrics in parallel
    const [
      contractsResult,
      tasksResult,
      attendanceResult,
      ratingsResult,
    ] = await Promise.allSettled([
      supabase
        .from('contracts')
        .select('id, status, start_date, end_date, created_at')
        .eq('promoter_id', promoterId),
      supabase
        .from('promoter_tasks')
        .select('id, status, created_at, completed_at')
        .eq('promoter_id', promoterId),
      supabase
        .from('promoter_attendance')
        .select('id, date, status')
        .eq('promoter_id', promoterId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('promoter_feedback')
        .select('id, rating, created_at')
        .eq('promoter_id', promoterId),
    ]);

    const contracts = contractsResult.status === 'fulfilled' ? contractsResult.value.data || [] : [];
    const tasks = tasksResult.status === 'fulfilled' ? tasksResult.value.data || [] : [];
    const attendance = attendanceResult.status === 'fulfilled' ? attendanceResult.value.data || [] : [];
    const ratings = ratingsResult.status === 'fulfilled' ? ratingsResult.value.data || [] : [];

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const metrics = {
      contracts: {
        total: contracts.length,
        active: contracts.filter((c) => c.status === 'active').length,
        completed: contracts.filter((c) => c.status === 'completed').length,
        thisMonth: contracts.filter((c) => c.created_at && new Date(c.created_at) >= thisMonthStart).length,
      },
      tasks: {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === 'completed').length,
        pending: tasks.filter((t) => t.status === 'pending').length,
        overdue: tasks.filter((t) => {
          if (t.status !== 'pending' || !t.created_at) return false;
          const created = new Date(t.created_at);
          const daysSince = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
          return daysSince > 7;
        }).length,
        completionRate: tasks.length > 0
          ? Math.round((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100)
          : 0,
      },
      attendance: {
        total: attendance.length,
        present: attendance.filter((a) => a.status === 'present').length,
        absent: attendance.filter((a) => a.status === 'absent').length,
        attendanceRate: attendance.length > 0
          ? Math.round((attendance.filter((a) => a.status === 'present').length / attendance.length) * 100)
          : 0,
      },
      ratings: {
        total: ratings.length,
        average: ratings.length > 0
          ? Math.round((ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length) * 10) / 10
          : 0,
      },
      overall: {
        score: 0, // Calculated below
        trend: 'stable' as 'up' | 'down' | 'stable',
      },
    };

    // Calculate overall score (0-100)
    const contractScore = Math.min(contracts.length * 10, 40);
    const taskScore = metrics.tasks.completionRate * 0.3;
    const attendanceScore = metrics.attendance.attendanceRate * 0.2;
    const ratingScore = metrics.ratings.average > 0 ? (metrics.ratings.average / 5) * 10 : 0;
    metrics.overall.score = Math.round(contractScore + taskScore + attendanceScore + ratingScore);

    return NextResponse.json({ success: true, metrics, promoter });
  } catch (error) {
    console.error('Error fetching promoter performance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
