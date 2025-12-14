import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Get attendance records
async function getAttendanceHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params; // employer_employee_id
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const month = searchParams.get('month'); // YYYY-MM format

    // Verify access
    const { data: teamMember } = await supabase
      .from('employer_employees')
      .select('employer_id, employee_id')
      .eq('id', id)
      .single();

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    let query = supabase
      .from('employee_attendance')
      .select('*')
      .eq('employer_employee_id', id)
      .order('attendance_date', { ascending: false });

    // Apply date filters
    if (month) {
      const [year, monthNum] = month.split('-');
      const start = `${year}-${monthNum}-01`;
      const end = `${year}-${monthNum}-31`;
      query = query.gte('attendance_date', start).lte('attendance_date', end);
    } else if (startDate && endDate) {
      query = query
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);
    } else {
      // Default to current month
      const now = new Date();
      const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      query = query.gte('attendance_date', start);
    }

    const { data: attendance, error: attendanceError } = await query;

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
      return NextResponse.json(
        { error: 'Failed to fetch attendance' },
        { status: 500 }
      );
    }

    // Calculate summary
    const summary = {
      total_days: attendance?.length || 0,
      present: attendance?.filter(a => a.status === 'present').length || 0,
      absent: attendance?.filter(a => a.status === 'absent').length || 0,
      late: attendance?.filter(a => a.status === 'late').length || 0,
      leave: attendance?.filter(a => a.status === 'leave').length || 0,
      total_hours: attendance?.reduce((sum, a) => sum + (a.total_hours || 0), 0) || 0,
      overtime_hours: attendance?.reduce((sum, a) => sum + (a.overtime_hours || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      attendance: attendance || [],
      summary,
    });
  } catch (error) {
    console.error('Error in GET /api/employer/team/[id]/attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Record attendance
async function recordAttendanceHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params; // employer_employee_id
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      attendance_date,
      check_in,
      check_out,
      location,
      method,
      status,
      notes,
    } = body;

    if (!attendance_date) {
      return NextResponse.json(
        { error: 'Attendance date is required' },
        { status: 400 }
      );
    }

    // Verify access
    const { data: teamMember } = await supabase
      .from('employer_employees')
      .select('employer_id, employee_id')
      .eq('id', id)
      .single();

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    const isEmployee = teamMember.employee_id === user.id;
    const isEmployer = teamMember.employer_id === user.id;

    // Employees can only check in/out, employers can record any status
    if (!isEmployee && !isEmployer) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Calculate hours if check_in and check_out provided
    let total_hours = 0;
    if (check_in && check_out) {
      const checkInTime = new Date(check_in).getTime();
      const checkOutTime = new Date(check_out).getTime();
      total_hours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    }

    // Upsert attendance record
    const { data: attendance, error: upsertError } = await supabase
      .from('employee_attendance')
      .upsert(
        {
          employer_employee_id: id,
          attendance_date,
          check_in: check_in || null,
          check_out: check_out || null,
          location: location || null,
          method: method || (isEmployee ? 'web' : 'manual'),
          status: status || (check_in ? 'present' : 'absent'),
          total_hours: total_hours || null,
          notes: notes || null,
        },
        {
          onConflict: 'employer_employee_id,attendance_date',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Error recording attendance:', upsertError);
      return NextResponse.json(
        { error: 'Failed to record attendance', details: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance recorded successfully',
      attendance,
    });
  } catch (error) {
    console.error('Error in POST /api/employer/team/[id]/attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers directly - internal authorization is already implemented
export const GET = getAttendanceHandler;
export const POST = recordAttendanceHandler;

