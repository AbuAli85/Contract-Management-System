import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// GET - Get single payroll run with entries
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get payroll run
    const { data: payrollRun, error: runError } = await supabase
      .from('payroll_runs')
      .select('*')
      .eq('id', id)
      .single();

    if (runError || !payrollRun) {
      return NextResponse.json(
        { error: 'Payroll run not found' },
        { status: 404 }
      );
    }

    // Get payroll entries
    const { data: entries, error: entriesError } = await supabase
      .from('payroll_entries')
      .select(
        `
        *,
        employer_employee:employer_employees!inner(
          id,
          employee_id,
          employee:profiles!employer_employees_employee_id_fkey(
            id,
            name_en,
            name_ar,
            email
          )
        )
      `
      )
      .eq('payroll_run_id', id)
      .order('created_at', { ascending: false });

    if (entriesError) {
    }

    return NextResponse.json({
      success: true,
      payroll_run: payrollRun,
      entries: entries || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update payroll run (approve, process, etc.)
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
    const { status, payment_date, notes } = body;

    // Get payroll run
    const { data: payrollRun } = await supabase
      .from('payroll_runs')
      .select('*')
      .eq('id', id)
      .single();

    if (!payrollRun) {
      return NextResponse.json(
        { error: 'Payroll run not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active_company_id')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const isHR = profile?.role === 'hr_manager' || profile?.role === 'manager';
    const isSameCompany = profile?.active_company_id === payrollRun.company_id;

    if (!isAdmin && !(isHR && isSameCompany)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'approved') {
        updateData.approved_by = user.id;
        updateData.approved_at = new Date().toISOString();
      }
      if (status === 'paid') {
        updateData.payment_date =
          payment_date || new Date().toISOString().split('T')[0];
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data: updated, error: updateError } = await (
      supabaseAdmin.from('payroll_runs') as any
    )
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update payroll run', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payroll run updated successfully',
      payroll_run: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
