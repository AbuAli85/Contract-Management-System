import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { withRBAC } from '@/lib/rbac/guard';

export const dynamic = 'force-dynamic';

// POST - Approve or reject attendance
export const POST = withRBAC('attendance:approve:all', async (
  request: NextRequest
) => {
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

    const body = await request.json();
    const { attendance_id, action, reason } = body; // action: 'approve' or 'reject'

    if (!attendance_id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request. Provide attendance_id and action (approve/reject)' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get attendance record
    const { data: attendance, error: attendanceError } = await (supabaseAdmin.from('employee_attendance') as any)
      .select(`
        *,
        employer_employee:employer_employee_id (
          employer_id,
          company_id
        )
      `)
      .eq('id', attendance_id)
      .single();

    if (attendanceError || !attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    const employerEmployee = attendance.employer_employee as any;

    // Verify user is the employer or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active_company_id')
      .eq('id', user.id)
      .single();

    const isEmployer = employerEmployee?.employer_id === user.id;
    const isAdmin = profile?.role === 'admin';
    const isSameCompany = profile?.active_company_id === employerEmployee?.company_id;

    if (!isEmployer && !isAdmin && !isSameCompany) {
      return NextResponse.json(
        { error: 'You do not have permission to approve this attendance' },
        { status: 403 }
      );
    }

    // Update attendance record
    const updateData: any = {
      approval_status: action === 'approve' ? 'approved' : 'rejected',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (action === 'reject') {
      updateData.rejection_reason = reason;
    }

    const { data: updated, error: updateError } = await (supabaseAdmin.from('employee_attendance') as any)
      .update(updateData)
      .eq('id', attendance_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating attendance:', updateError);
      return NextResponse.json(
        { error: 'Failed to update attendance' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Attendance ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      attendance: updated,
    });
  } catch (error) {
    console.error('Error in attendance approval:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET - Get pending attendance records for approval
export const GET = withRBAC('attendance:read:all', async (
  request: NextRequest
) => {
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

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    // Build query
    let query = (supabaseAdmin.from('employee_attendance') as any)
      .select(`
        *,
        employer_employee:employer_employee_id (
          id,
          employee:employee_id (
            id,
            full_name,
            email
          ),
          employer_id,
          company_id
        )
      `)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    // Filter by company if not admin
    if (profile?.role !== 'admin' && profile?.active_company_id) {
      query = query.eq('employer_employee.company_id', profile.active_company_id);
    }

    const { data: pendingAttendance, error } = await query;

    if (error) {
      console.error('Error fetching pending attendance:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending attendance' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attendance: pendingAttendance || [],
      count: pendingAttendance?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET attendance approval:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

