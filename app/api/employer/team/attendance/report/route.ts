import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const format = searchParams.get('format') || 'json';

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!employeeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Employee ID, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Verify employee belongs to user's company
    const { data: employee, error: employeeError } = await supabase
      .from('employer_employees')
      .select(
        `
        id,
        employee_id,
        employee_code,
        job_title,
        department,
        employee:employee_id (
          id,
          email,
          full_name
        )
      `
      )
      .eq('id', employeeId)
      .eq('employer_id', user.id)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: 'Employee not found or unauthorized' },
        { status: 403 }
      );
    }

    // Fetch attendance records
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('employee_attendance')
      .select('*')
      .eq('employer_employee_id', employeeId)
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate)
      .order('attendance_date', { ascending: false });

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      return NextResponse.json(
        { error: 'Failed to fetch attendance records' },
        { status: 500 }
      );
    }

    // Calculate summary
    const records = attendanceRecords || [];
    const presentDays = records.filter(r => r.status === 'present').length;
    const absentDays = records.filter(r => r.status === 'absent').length;

    // Generate all dates in range (including week offs)
    const allDates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
      allDates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    const totalDays = allDates.length;
    const totalHours = records.reduce(
      (sum, r) => sum + (r.total_hours || 0),
      0
    );
    const averageHours = presentDays > 0 ? totalHours / presentDays : 0;
    const lateCount = records.filter(
      r =>
        r.status === 'present' &&
        r.check_in_time &&
        new Date(r.check_in_time).getHours() >= 13
    ).length; // Late if after 1 PM
    const approvedCount = records.filter(
      r => r.approval_status === 'approved'
    ).length;
    const pendingCount = records.filter(
      r => r.approval_status === 'pending'
    ).length;

    // Create records for all dates (fill in week offs)
    const recordsMap = new Map(records.map((r: any) => [r.attendance_date, r]));
    const allRecords = allDates.map(date => {
      const record = recordsMap.get(date);
      if (record) {
        return record;
      }
      // Check if it's Tuesday (week off)
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 2 = Tuesday
      if (dayOfWeek === 2) {
        return {
          id: `week-off-${date}`,
          attendance_date: date,
          check_in_time: null,
          check_out_time: null,
          total_hours: null,
          status: 'week_off',
          approval_status: 'approved',
          latitude: null,
          longitude: null,
          check_in_photo: null,
        };
      }
      return {
        id: `absent-${date}`,
        attendance_date: date,
        check_in_time: null,
        check_out_time: null,
        total_hours: null,
        status: 'absent',
        approval_status: 'pending',
        latitude: null,
        longitude: null,
        check_in_photo: null,
      };
    });

    const reportData = {
      employee: {
        id: employee.id,
        full_name: (employee.employee as any)?.full_name || 'Unknown',
        email: (employee.employee as any)?.email || '',
        employee_code: employee.employee_code,
        job_title: employee.job_title,
        department: employee.department,
      },
      period: {
        start_date: startDate,
        end_date: endDate,
      },
      summary: {
        total_days: totalDays,
        present_days: presentDays,
        absent_days: absentDays,
        total_hours: totalHours,
        average_hours: averageHours,
        late_count: lateCount,
        approved_count: approvedCount,
        pending_count: pendingCount,
      },
      records: allRecords.map(r => ({
        id: r.id,
        attendance_date: r.attendance_date,
        check_in_time: r.check_in_time,
        check_out_time: r.check_out_time,
        total_hours: r.total_hours,
        status: r.status,
        approval_status: r.approval_status,
        latitude: r.latitude,
        longitude: r.longitude,
        check_in_photo: r.check_in_photo,
        employee: {
          full_name: (employee.employee as any)?.full_name || 'Unknown',
          email: (employee.employee as any)?.email || '',
          employee_code: employee.employee_code,
        },
      })),
    };

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: reportData,
      });
    }

    // Export formats (PDF, Excel, CSV)
    if (format === 'csv') {
      const headers = [
        'Date',
        'Check-In Time',
        'Check-Out Time',
        'Total Hours',
        'Status',
        'Approval Status',
      ];

      const rows = records.map((r: any) => [
        r.attendance_date,
        r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : '',
        r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : '',
        r.total_hours || 0,
        r.status,
        r.approval_status,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) =>
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="attendance-report-${startDate}-to-${endDate}.csv"`,
        },
      });
    }

    if (format === 'excel' || format === 'pdf') {
      // For Excel/PDF, return CSV for now (can be enhanced with xlsx/pdf libraries)
      const headers = [
        'Date',
        'Check-In Time',
        'Check-Out Time',
        'Total Hours',
        'Status',
        'Approval Status',
      ];

      const rows = records.map((r: any) => [
        r.attendance_date,
        r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : '',
        r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : '',
        r.total_hours || 0,
        r.status,
        r.approval_status,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) =>
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type':
            format === 'excel'
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : 'application/pdf',
          'Content-Disposition': `attachment; filename="attendance-report-${startDate}-to-${endDate}.${format === 'excel' ? 'xlsx' : 'pdf'}"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('Error in GET /api/employer/team/attendance/report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
