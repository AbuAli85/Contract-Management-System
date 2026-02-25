import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Get attendance analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get employee record
    const { data: employeeLink } = await supabase
      .from('employer_employees')
      .select('id, company_id')
      .eq('employee_id', user.id)
      .eq('employment_status', 'active')
      .single();

    if (!employeeLink) {
      return NextResponse.json(
        { error: 'Not assigned to any employer' },
        { status: 404 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const month =
      searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const _range = searchParams.get('range') || 'month';

    // Calculate date range
    const startDate = `${month}-01`;
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr || '2025', 10);
    const monthNum = parseInt(monthStr || '1', 10);
    const endDate = new Date(year, monthNum, 0).toISOString().slice(0, 10);

    // Fetch attendance records
    const { data: attendance, error } = await (
      supabaseAdmin.from('employee_attendance') as any
    )
      .select('*')
      .eq('employer_employee_id', employeeLink.id)
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate)
      .order('attendance_date', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch attendance' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const records = attendance || [];
    const totalDays = records.length;
    const presentDays = records.filter(
      (a: any) => a.status === 'present' || a.status === 'late'
    ).length;
    const lateDays = records.filter((a: any) => a.status === 'late').length;
    const absentDays = records.filter((a: any) => a.status === 'absent').length;
    const totalHours = records.reduce(
      (sum: number, a: any) => sum + (parseFloat(a.total_hours) || 0),
      0
    );
    const overtimeHours = records.reduce(
      (sum: number, a: any) => sum + (parseFloat(a.overtime_hours) || 0),
      0
    );
    const averageHours = presentDays > 0 ? totalHours / presentDays : 0;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Calculate weekly data
    const weeklyData: any[] = [];
    const weeks: Record<
      string,
      { present: number; late: number; absent: number; hours: number }
    > = {};

    records.forEach((record: any) => {
      const date = new Date(record.attendance_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);

      if (!weeks[weekKey]) {
        weeks[weekKey] = { present: 0, late: 0, absent: 0, hours: 0 };
      }

      if (record.status === 'present') weeks[weekKey].present++;
      if (record.status === 'late') weeks[weekKey].late++;
      if (record.status === 'absent') weeks[weekKey].absent++;
      weeks[weekKey].hours += parseFloat(record.total_hours) || 0;
    });

    Object.entries(weeks).forEach(([week, data]) => {
      weeklyData.push({
        week,
        ...data,
      });
    });

    return NextResponse.json({
      stats: {
        totalDays,
        presentDays,
        lateDays,
        absentDays,
        totalHours,
        averageHours,
        overtimeHours,
        attendanceRate,
      },
      weeklyData: weeklyData.sort((a, b) => a.week.localeCompare(b.week)),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
