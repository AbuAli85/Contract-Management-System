import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// PATCH - Approve or reject a leave request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = await params;
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, review_notes } = body; // action: 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use approve or reject' },
        { status: 400 }
      );
    }

    // Get the leave request
    const { data: leaveRequest, error: fetchError } = await (supabaseAdmin.from('employee_leave_requests') as any)
      .select(`
        *,
        employer_employee:employer_employee_id (
          employer_id,
          employee_id
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    // Verify the user is the employer
    if (leaveRequest.employer_employee?.employer_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Check if already processed
    if (leaveRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'This leave request has already been processed' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const now = new Date().toISOString();

    // Update the leave request
    const { data: updated, error: updateError } = await (supabaseAdmin.from('employee_leave_requests') as any)
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: now,
        review_notes: review_notes || null,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating leave request:', updateError);
      return NextResponse.json(
        { error: 'Failed to update leave request' },
        { status: 500 }
      );
    }

    // Update leave balance
    const year = new Date(leaveRequest.start_date).getFullYear();
    
    if (action === 'approve') {
      // Move from pending to used
      await (supabaseAdmin.from('employee_leave_balances') as any)
        .upsert({
          employer_employee_id: leaveRequest.employer_employee_id,
          leave_type: leaveRequest.leave_type,
          year,
          total_days: 21,
          used_days: leaveRequest.total_days,
          pending_days: 0,
        }, { 
          onConflict: 'employer_employee_id,leave_type,year',
          ignoreDuplicates: false 
        });
    } else {
      // Remove from pending
      const { data: balance } = await (supabaseAdmin.from('employee_leave_balances') as any)
        .select('pending_days')
        .eq('employer_employee_id', leaveRequest.employer_employee_id)
        .eq('leave_type', leaveRequest.leave_type)
        .eq('year', year)
        .single();

      if (balance) {
        await (supabaseAdmin.from('employee_leave_balances') as any)
          .update({
            pending_days: Math.max(0, (balance.pending_days || 0) - leaveRequest.total_days),
            updated_at: now,
          })
          .eq('employer_employee_id', leaveRequest.employer_employee_id)
          .eq('leave_type', leaveRequest.leave_type)
          .eq('year', year);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Leave request ${newStatus}`,
      request: updated,
    });
  } catch (error) {
    console.error('Error in leave request PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

