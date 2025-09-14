import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ApprovalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const leaveRequestId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(leaveRequestId)) {
      return NextResponse.json({ error: 'Invalid leave request ID' }, { status: 400 });
    }

    const parsed = ApprovalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() }, 
        { status: 400 }
      );
    }

    const { action, rejection_reason } = parsed.data;

    // Get current user's employee ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('hr.user_profiles')
      .select('employee_id, role')
      .eq('user_id', user.id)
      .single();

    if (!userProfile || !userProfile.employee_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user has permission to approve (HR staff or manager)
    if (!['hr_admin', 'hr_staff', 'manager'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get the leave request
    const { data: leaveRequest, error: fetchError } = await supabase
      .from('hr.leave_requests')
      .select(`
        id, employee_id, leave_type, start_date, end_date, total_days,
        reason, approval_status, created_at,
        employees!inner(full_name, employee_code)
      `)
      .eq('id', leaveRequestId)
      .single();

    if (fetchError) {
      console.error('Error fetching leave request:', fetchError);
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    if (leaveRequest.approval_status !== 'pending') {
      return NextResponse.json(
        { error: 'Leave request has already been processed' }, 
        { status: 400 }
      );
    }

    // For managers, check if they can approve this specific request
    if (userProfile.role === 'manager') {
      const { data: isManagerOf } = await supabase
        .rpc('hr.is_manager_of', {
          uid: user.id,
          emp_id: leaveRequest.employee_id
        });

      if (!isManagerOf) {
        return NextResponse.json(
          { error: 'You can only approve leave requests for your team members' }, 
          { status: 403 }
        );
      }
    }

    // Update the leave request
    const updateData: any = {
      approval_status: action === 'approve' ? 'approved' : 'rejected',
      approved_by: userProfile.employee_id,
      approved_at: new Date().toISOString()
    };

    if (action === 'reject' && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    const { data, error } = await supabase
      .from('hr.leave_requests')
      .update(updateData)
      .eq('id', leaveRequestId)
      .select(`
        id, employee_id, leave_type, start_date, end_date, total_days,
        reason, approval_status, approved_by, approved_at, rejection_reason,
        created_at, updated_at,
        employees!inner(full_name, employee_code),
        approver:hr.employees!approved_by(full_name, employee_code)
      `)
      .single();

    if (error) {
      console.error('Error updating leave request:', error);
      return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
    }

    // Create notification for the employee
    await supabase
      .from('hr.notifications')
      .insert({
        employee_id: leaveRequest.employee_id,
        type: 'leave_approval',
        title: `Leave Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: `Your leave request for ${leaveRequest.total_days} days (${leaveRequest.start_date} to ${leaveRequest.end_date}) has been ${action === 'approve' ? 'approved' : 'rejected'}.${rejection_reason ? ` Reason: ${rejection_reason}` : ''}`,
        priority: 'medium'
      });

    return NextResponse.json({ 
      message: `Leave request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data 
    });

  } catch (error) {
    console.error('Error in POST /api/hr/leave-requests/[id]/approve:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
