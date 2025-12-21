import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ensureEmployerEmployeeRecord } from '@/lib/utils/ensure-employee-record';

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
    let { id } = await params; // employer_employee_id (may be prefixed with 'promoter_')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ AUTO-CONVERT: Ensure employer_employee record exists (auto-create for promoters)
    try {
      const { employerEmployeeId } = await ensureEmployerEmployeeRecord(id, user.id);
      id = employerEmployeeId; // Use the actual employer_employee ID
    } catch (error: any) {
      console.error('Error in ensureEmployerEmployeeRecord:', error);
      return NextResponse.json(
        { 
          error: 'Failed to process employee record',
          details: error.message || 'Could not create or find employer_employee record',
          input_id: id
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const month = searchParams.get('month'); // YYYY-MM format

    // ✅ COMPANY SCOPE: Verify access and check company scope
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    const { data: teamMember } = await supabase
      .from('employer_employees')
      .select('employer_id, employee_id, company_id')
      .eq('id', id)
      .single();

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // ✅ FIX: Check if employee_id is valid (exists in profiles)
    // If employee_id points to a promoter ID, try to fix it automatically
    const { data: profileCheck } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', teamMember.employee_id)
      .single();

    if (!profileCheck) {
      // employee_id points to invalid ID (likely promoter ID)
      // Try to find the correct profile ID by matching promoter email
      const { data: promoter } = await supabase
        .from('promoters')
        .select('id, email')
        .eq('id', teamMember.employee_id)
        .single();

      if (promoter && promoter.email) {
        const { data: correctProfile } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', promoter.email)
          .single();

        if (correctProfile) {
          // Fix the record automatically
          const supabaseAdmin = getSupabaseAdmin();
          await (supabaseAdmin.from('employer_employees') as any)
            .update({ 
              employee_id: correctProfile.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);

          // Update teamMember for rest of function
          teamMember.employee_id = correctProfile.id;
        } else {
          return NextResponse.json(
            { 
              error: 'Employee profile not found',
              details: 'The employee record has an invalid employee_id. Please try adding this person to your team again using "Add Team Member" - the system will automatically fix the record.'
            },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            error: 'Employee profile not found',
            details: 'The employee record has an invalid employee_id. Please try adding this person to your team again using "Add Team Member" - the system will automatically fix the record.'
          },
          { status: 404 }
        );
      }
    }

    // ✅ COMPANY SCOPE: Verify team member belongs to active company
    // Allow if company_id is null (backwards compatibility) OR matches active company
    if (profile?.active_company_id && teamMember.company_id && teamMember.company_id !== profile.active_company_id) {
      return NextResponse.json(
        { error: 'Team member does not belong to your active company' },
        { status: 403 }
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
    let { id } = await params; // employer_employee_id (may be prefixed with 'promoter_')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ FIX: Handle promoter-only IDs (prefixed with 'promoter_')
    // These are not actual employer_employee records, so we can't record attendance
    if (id.startsWith('promoter_')) {
      return NextResponse.json(
        { 
          error: 'Promoter-only records cannot have attendance. Please add this person to employer_employees first.',
          details: 'This person exists in the promoters table but has no employer_employee record. Attendance tracking requires an employer_employee record.'
        },
        { status: 404 }
      );
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

    // ✅ COMPANY SCOPE: Verify access and check company scope
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    const { data: teamMember } = await supabase
      .from('employer_employees')
      .select('employer_id, employee_id, company_id')
      .eq('id', id)
      .single();

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // ✅ COMPANY SCOPE: Verify team member belongs to active company
    // Allow if company_id is null (backwards compatibility) OR matches active company
    if (userProfile?.active_company_id && teamMember.company_id && teamMember.company_id !== userProfile.active_company_id) {
      return NextResponse.json(
        { error: 'Team member does not belong to your active company' },
        { status: 403 }
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

