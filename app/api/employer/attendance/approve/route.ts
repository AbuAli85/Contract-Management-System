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
    const { attendance_id, attendance_ids, action, rejection_reason, reason } = body; // action: 'approve' or 'reject'

    // Support both single and bulk operations
    const ids = attendance_ids || (attendance_id ? [attendance_id] : []);
    const rejectionReason = rejection_reason || reason;

    if (!ids.length || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request. Provide attendance_id(s) and action (approve/reject)' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get user's profile to check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active_company_id')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    // Get attendance records
    const { data: attendanceRecords, error: attendanceError } = await (supabaseAdmin.from('employee_attendance') as any)
      .select(`
        *,
        employer_employee:employer_employee_id (
          employer_id,
          company_id
        )
      `)
      .in('id', ids);

    if (attendanceError || !attendanceRecords || attendanceRecords.length === 0) {
      return NextResponse.json(
        { error: 'Attendance record(s) not found' },
        { status: 404 }
      );
    }

    // Verify permissions for all records
    for (const attendance of attendanceRecords) {
      const employerEmployee = attendance.employer_employee as any;
      const isEmployer = employerEmployee?.employer_id === user.id;
      const isSameCompany = profile?.active_company_id === employerEmployee?.company_id;

      if (!isEmployer && !isAdmin && !isSameCompany) {
        return NextResponse.json(
          { error: 'You do not have permission to approve one or more attendance records' },
          { status: 403 }
        );
      }
    }

    // Update all attendance records
    const updateData: any = {
      approval_status: action === 'approve' ? 'approved' : 'rejected',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (action === 'reject') {
      updateData.rejection_reason = rejectionReason;
    }

    const { data: updated, error: updateError } = await (supabaseAdmin.from('employee_attendance') as any)
      .update(updateData)
      .in('id', ids)
      .select();

    if (updateError) {
      console.error('Error updating attendance:', updateError);
      return NextResponse.json(
        { error: 'Failed to update attendance' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${updated.length} attendance record(s) ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      attendance: updated,
      count: updated.length,
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

