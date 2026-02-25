import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { startOfDay, endOfDay, isToday } from 'date-fns';

export const dynamic = 'force-dynamic';

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

    // Get user's active company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json(
        { error: 'No active company found' },
        { status: 400 }
      );
    }

    const companyId = profile.active_company_id;
    const today = new Date();
    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();

    // Get total employees
    const { data: employees, error: employeesError } = await (
      supabaseAdmin.from('employer_employees') as any
    )
      .select('id')
      .eq('company_id', companyId)
      .eq('employment_status', 'active');

    const totalEmployees = employees?.length || 0;

    // Get today's attendance
    const { data: todayAttendance, error: attendanceError } = await (
      supabaseAdmin.from('employee_attendance') as any
    )
      .select(
        `
        *,
        employer_employee:employer_employees!inner(
          company_id,
          employment_status
        )
      `
      )
      .eq('employer_employee.company_id', companyId)
      .eq('employer_employee.employment_status', 'active')
      .gte('attendance_date', todayStart.split('T')[0])
      .lte('attendance_date', todayStart.split('T')[0]);

    const attendanceRecords = todayAttendance || [];

    // Calculate stats
    const checkedInToday = attendanceRecords.filter(
      (r: any) => r.check_in !== null
    ).length;
    const lateToday = attendanceRecords.filter(
      (r: any) => r.status === 'late'
    ).length;
    const absentToday = totalEmployees - checkedInToday;
    const pendingApprovals = attendanceRecords.filter(
      (r: any) => r.approval_status === 'pending'
    ).length;

    // Calculate average hours and overtime
    const recordsWithHours = attendanceRecords.filter(
      (r: any) => r.total_hours !== null && r.total_hours > 0
    );
    const averageHours =
      recordsWithHours.length > 0
        ? recordsWithHours.reduce(
            (sum: number, r: any) => sum + (r.total_hours || 0),
            0
          ) / recordsWithHours.length
        : 0;

    const totalOvertime = attendanceRecords.reduce(
      (sum: number, r: any) => sum + (r.overtime_hours || 0),
      0
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalEmployees,
        checkedInToday,
        pendingApprovals,
        lateToday,
        absentToday,
        averageHours: Math.round(averageHours * 10) / 10,
        totalOvertime: Math.round(totalOvertime * 10) / 10,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
