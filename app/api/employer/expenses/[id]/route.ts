import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { notifyExpenseStatus } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// PATCH - Approve, reject, or mark as paid
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
    const { action, review_notes, payment_reference } = body;

    if (!action || !['approve', 'reject', 'pay'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use approve, reject, or pay' },
        { status: 400 }
      );
    }

    // Get the expense
    const { data: expense, error: fetchError } = await (
      supabaseAdmin.from('employee_expenses') as any
    )
      .select(
        `
        *,
        employer_employee:employer_employee_id (
          employer_id,
          employee:employee_id (
            id,
            email,
            full_name
          )
        )
      `
      )
      .eq('id', id)
      .single();

    if (fetchError || !expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Verify the user is the employer
    if (expense.employer_employee?.employer_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const now = new Date().toISOString();
    let newStatus: string;
    const updateData: any = {
      updated_at: now,
    };

    if (action === 'approve') {
      if (expense.status !== 'pending') {
        return NextResponse.json(
          { error: 'Can only approve pending expenses' },
          { status: 400 }
        );
      }
      newStatus = 'approved';
      updateData.status = newStatus;
      updateData.reviewed_by = user.id;
      updateData.reviewed_at = now;
      updateData.review_notes = review_notes || null;
    } else if (action === 'reject') {
      if (expense.status !== 'pending') {
        return NextResponse.json(
          { error: 'Can only reject pending expenses' },
          { status: 400 }
        );
      }
      newStatus = 'rejected';
      updateData.status = newStatus;
      updateData.reviewed_by = user.id;
      updateData.reviewed_at = now;
      updateData.review_notes = review_notes || null;
    } else {
      // pay
      if (expense.status !== 'approved') {
        return NextResponse.json(
          { error: 'Can only pay approved expenses' },
          { status: 400 }
        );
      }
      newStatus = 'paid';
      updateData.status = newStatus;
      updateData.paid_at = now;
      updateData.payment_reference = payment_reference || null;
    }

    // Update the expense
    const { data: updated, error: updateError } = await (
      supabaseAdmin.from('employee_expenses') as any
    )
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update expense' },
        { status: 500 }
      );
    }

    // Get reviewer name for notification
    const { data: reviewer } = await (supabaseAdmin.from('profiles') as any)
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Send notification
    const employee = expense.employer_employee?.employee;
    if (employee?.email) {
      await notifyExpenseStatus(
        employee.email,
        employee.full_name || 'Employee',
        expense.description,
        parseFloat(expense.amount),
        expense.currency || 'OMR',
        newStatus as 'approved' | 'rejected' | 'paid',
        reviewer?.full_name || 'Manager',
        review_notes
      );
    }

    return NextResponse.json({
      success: true,
      message: `Expense ${newStatus}`,
      expense: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
