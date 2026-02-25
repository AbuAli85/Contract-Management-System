import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    const supabase = await createClient();

    // Calculate date range based on period
    const today = new Date();
    const startDate = new Date(today);
    if (period === 'week') {
      startDate.setDate(today.getDate() - 7);
    } else {
      startDate.setDate(today.getDate() - 30); // default: last 30 days
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    // Fetch real attendance data
    const { data: attendanceRows, error } = await supabase
      .from('employee_attendance')
      .select('attendance_date, check_in, check_out, approval_status')
      .gte('attendance_date', startDateStr)
      .lte('attendance_date', todayStr)
      .order('attendance_date', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Group by date
    const byDate: Record<
      string,
      { present: number; absent: number; late: number; total: number }
    > = {};

    for (const row of attendanceRows ?? []) {
      const d = row.attendance_date;
      if (!byDate[d]) {
        byDate[d] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      byDate[d].total += 1;
      if (row.check_in) {
        byDate[d].present += 1;
        // Consider late if check-in is after 09:00
        const checkInTime = row.check_in?.substring(11, 16);
        if (checkInTime && checkInTime > '09:00') {
          byDate[d].late += 1;
        }
      } else {
        byDate[d].absent += 1;
      }
    }

    const data = Object.entries(byDate).map(([date, stats]) => ({
      date,
      ...stats,
      attendanceRate:
        stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
    }));

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attendance data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
