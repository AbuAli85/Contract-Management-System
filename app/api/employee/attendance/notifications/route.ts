import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Get attendance notifications
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

    // Get employee record
    const { data: employeeLink } = await supabase
      .from('employer_employees')
      .select('id')
      .eq('employee_id', user.id)
      .eq('employment_status', 'active')
      .single();

    if (!employeeLink) {
      return NextResponse.json(
        { error: 'Not assigned to any employer' },
        { status: 404 }
      );
    }

    // For now, generate notifications from attendance records
    // In a production system, you'd have a dedicated notifications table
    const supabaseAdmin = getSupabaseAdmin();
    const today = new Date().toISOString().slice(0, 10);

    // Get today's attendance
    const { data: todayAttendance } = await (
      supabaseAdmin.from('employee_attendance') as any
    )
      .select('*')
      .eq('employer_employee_id', employeeLink.id)
      .eq('attendance_date', today)
      .single();

    // Get recent attendance records
    const { data: recentAttendance } = await (
      supabaseAdmin.from('employee_attendance') as any
    )
      .select('*')
      .eq('employer_employee_id', employeeLink.id)
      .order('attendance_date', { ascending: false })
      .limit(10);

    const notifications: any[] = [];

    // Check-in reminder (if not checked in and it's before 9 AM)
    const now = new Date();
    const currentHour = now.getHours();
    if (!todayAttendance?.check_in && currentHour < 9) {
      notifications.push({
        id: `reminder-${today}`,
        type: 'check_in_reminder',
        title: 'Check-in Reminder',
        message: "Don't forget to check in today!",
        read: false,
        created_at: new Date().toISOString(),
      });
    }

    // Approval notifications
    (recentAttendance || []).forEach((record: any) => {
      if (record.approval_status === 'pending' && !record.check_out) {
        notifications.push({
          id: `approval-pending-${record.id}`,
          type: 'approval_pending',
          title: 'Attendance Pending Approval',
          message: `Your attendance for ${record.attendance_date} is pending manager approval`,
          read: false,
          created_at: record.created_at,
          metadata: { attendance_id: record.id },
        });
      } else if (record.approval_status === 'approved') {
        notifications.push({
          id: `approval-approved-${record.id}`,
          type: 'approval_approved',
          title: 'Attendance Approved',
          message: `Your attendance for ${record.attendance_date} has been approved`,
          read: false,
          created_at: record.approved_at || record.updated_at,
          metadata: { attendance_id: record.id },
        });
      } else if (record.approval_status === 'rejected') {
        notifications.push({
          id: `approval-rejected-${record.id}`,
          type: 'approval_rejected',
          title: 'Attendance Rejected',
          message: `Your attendance for ${record.attendance_date} was rejected. ${record.rejection_reason || ''}`,
          read: false,
          created_at: record.approved_at || record.updated_at,
          metadata: { attendance_id: record.id },
        });
      }
    });

    // Late warning (if checked in late)
    if (todayAttendance?.check_in) {
      const checkInTime = new Date(todayAttendance.check_in);
      if (checkInTime.getHours() >= 9) {
        notifications.push({
          id: `late-warning-${today}`,
          type: 'late_warning',
          title: 'Late Check-in',
          message:
            'You checked in after 9:00 AM. Please ensure you have manager approval if needed.',
          read: false,
          created_at: todayAttendance.check_in,
        });
      }
    }

    // Sort by created_at descending
    notifications.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      notifications: notifications.slice(0, 50), // Limit to 50 most recent
      unread_count: notifications.filter(n => !n.read).length,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
