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
      const [year, monthNum] = month.split('-');
      startDate = `${year}-${monthNum}-01`;
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      endDate = `${year}-${monthNum}-${lastDay}`;
    }

    // Build query
    let query = supabase
      .from('employee_attendance')
      .select(`
        *,
        employer_employee:employer_employees!inner(
          id,
          employee_id,
          employer_id,
          job_title,
          department,
          company_id,
          employee:profiles!employer_employees_employee_id_fkey(
            id,
            name_en,
            name_ar,
            email
          )
        )
      `)
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

    // Company scoping for non-admins
    if (profile?.role !== 'admin' && profile?.active_company_id) {
      query = query.eq('employer_employee.company_id', profile.active_company_id);
    }

    const { data: attendance, error } = await query;

    if (error) {
      console.error('Error fetching attendance:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attendance', details: error.message },
        { status: 500 }
      );
    }

    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendance?.filter((a) => a.attendance_date === today) || [];

    // Get total employees count
    let employeesQuery = supabase
      .from('employer_employees')
      .select('id', { count: 'exact', head: true })
      .eq('employment_status', 'active');

    if (profile?.role !== 'admin' && profile?.active_company_id) {
      employeesQuery = employeesQuery.eq('company_id', profile.active_company_id);
    }

    const { count: totalEmployees } = await employeesQuery;

    const stats = {
      total_employees: totalEmployees || 0,
      present_today: todayRecords.filter((a) => a.status === 'present').length,
      absent_today: todayRecords.filter((a) => a.status === 'absent').length,
      late_today: todayRecords.filter((a) => a.status === 'late').length,
      on_leave_today: todayRecords.filter((a) => a.status === 'leave').length,
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
    console.error('Error in GET /api/hr/attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

