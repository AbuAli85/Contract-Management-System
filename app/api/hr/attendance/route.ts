import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get attendance records with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employee_id');

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    // Build date range from month
    let startDate: string | null = null;
    let endDate: string | null = null;

    if (month) {
      const parts = month.split('-');
      const year = parts[0];
      const monthNum = parts[1];

      if (year && monthNum) {
        const yearStr: string = year;
        const monthStr: string = monthNum;
        const yearNum = parseInt(yearStr, 10);
        const monthNumParsed = parseInt(monthStr, 10);

        if (!isNaN(yearNum) && !isNaN(monthNumParsed)) {
          startDate = `${yearStr}-${monthStr.padStart(2, '0')}-01`;
          const lastDay = new Date(yearNum, monthNumParsed, 0).getDate();
          endDate = `${yearStr}-${monthStr.padStart(2, '0')}-${lastDay}`;
        }
      }
    }

    // Company scoping for non-admins - get employer_employee_ids first
    let employerEmployeeIds: string[] | null = null;
    let employerIds: string[] | null = null;

    if (profile?.role !== 'admin' && profile?.active_company_id) {
      // Get employer profiles that belong to this company
      const { data: employerProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('active_company_id', profile.active_company_id);

      if (employerProfiles && employerProfiles.length > 0) {
        employerIds = employerProfiles.map(p => p.id);

        // Get employer_employee_ids for these employers
        const { data: employerEmployees } = await supabase
          .from('employer_employees')
          .select('id')
          .in('employer_id', employerIds);

        if (employerEmployees && employerEmployees.length > 0) {
          employerEmployeeIds = employerEmployees.map(ee => ee.id);
        } else {
          // No employees found for this company, return empty result
          return NextResponse.json({
            success: true,
            attendance: [],
            stats: {
              total_employees: 0,
              present_today: 0,
              absent_today: 0,
              late_today: 0,
              on_leave_today: 0,
              average_hours: 0,
              total_overtime: 0,
            },
          });
        }
      } else {
        // No employers found for this company, return empty result
        return NextResponse.json({
          success: true,
          attendance: [],
          stats: {
            total_employees: 0,
            present_today: 0,
            absent_today: 0,
            late_today: 0,
            on_leave_today: 0,
            average_hours: 0,
            total_overtime: 0,
          },
        });
      }
    }

    // Build query - fetch attendance with employer_employee details
    // Note: We'll fetch employee profile data separately to avoid nested relationship issues
    let query = supabase
      .from('employee_attendance')
      .select(
        `
        *,
        employer_employee:employer_employees!inner(
          id,
          employee_id,
          employer_id,
          job_title,
          department
        )
      `
      )
      .order('attendance_date', { ascending: false });

    // Apply filters
    if (startDate && endDate) {
      query = query
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (employeeId) {
      query = query.eq('employer_employee_id', employeeId);
    }

    // Company scoping for non-admins - filter by employer_employee_ids
    if (employerEmployeeIds && employerEmployeeIds.length > 0) {
      query = query.in('employer_employee_id', employerEmployeeIds);
    } else if (employerEmployeeIds && employerEmployeeIds.length === 0) {
      // No matching employees, return empty
      return NextResponse.json({
        success: true,
        attendance: [],
        stats: {
          total_employees: 0,
          present_today: 0,
          absent_today: 0,
          late_today: 0,
          on_leave_today: 0,
          average_hours: 0,
          total_overtime: 0,
        },
      });
    }

    const { data: attendance, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch attendance', details: error.message },
        { status: 500 }
      );
    }

    // Fetch employee profile data separately for each attendance record
    if (attendance && attendance.length > 0) {
      const employeeIds = [
        ...new Set(
          attendance
            .map((a: any) => a.employer_employee?.employee_id)
            .filter(Boolean)
        ),
      ];

      if (employeeIds.length > 0) {
        const { data: employeeProfiles } = await supabase
          .from('profiles')
          .select('id, name_en, name_ar, email')
          .in('id', employeeIds);

        // Map employee profiles to attendance records
        const employeeMap = new Map(
          (employeeProfiles || []).map((p: any) => [p.id, p])
        );

        attendance.forEach((record: any) => {
          if (record.employer_employee?.employee_id) {
            record.employer_employee.employee =
              employeeMap.get(record.employer_employee.employee_id) || null;
          }
        });
      }
    }

    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const todayRecords =
      attendance?.filter(a => a.attendance_date === today) || [];

    // Get total employees count
    let employeesQuery = supabase
      .from('employer_employees')
      .select('id', { count: 'exact', head: true })
      .eq('employment_status', 'active');

    if (profile?.role !== 'admin' && employerIds && employerIds.length > 0) {
      employeesQuery = employeesQuery.in('employer_id', employerIds);
    }

    const { count: totalEmployees } = await employeesQuery;

    const stats = {
      total_employees: totalEmployees || 0,
      present_today: todayRecords.filter(a => a.status === 'present').length,
      absent_today: todayRecords.filter(a => a.status === 'absent').length,
      late_today: todayRecords.filter(a => a.status === 'late').length,
      on_leave_today: todayRecords.filter(a => a.status === 'leave').length,
      average_hours:
        attendance?.reduce((sum, a) => sum + (a.total_hours || 0), 0) /
          (attendance?.length || 1) || 0,
      total_overtime:
        attendance?.reduce((sum, a) => sum + (a.overtime_hours || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      attendance: attendance || [],
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
