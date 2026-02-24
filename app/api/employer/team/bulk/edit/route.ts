import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { employee_ids, updates } = body;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !employee_ids ||
      !Array.isArray(employee_ids) ||
      employee_ids.length === 0
    ) {
      return NextResponse.json(
        { error: 'Employee IDs are required' },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'At least one update field is required' },
        { status: 400 }
      );
    }

    // Verify all employees belong to the user's company
    const { data: employees, error: employeesError } = await supabase
      .from('employer_employees')
      .select('id, company_id')
      .in('id', employee_ids)
      .eq('employer_id', user.id);

    if (
      employeesError ||
      !employees ||
      employees.length !== employee_ids.length
    ) {
      return NextResponse.json(
        { error: 'Some employees not found or unauthorized' },
        { status: 403 }
      );
    }

    // Build update object (only include non-empty fields)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.employment_status) {
      updateData.employment_status = updates.employment_status;
    }
    if (updates.department) {
      updateData.department = updates.department;
    }
    if (updates.job_title) {
      updateData.job_title = updates.job_title;
    }

    // Perform bulk update
    const { error: updateError } = await (
      supabaseAdmin.from('employer_employees') as any
    )
      .update(updateData)
      .in('id', employee_ids);

    if (updateError) {
      console.error('Error updating employees:', updateError);
      return NextResponse.json(
        { error: 'Failed to update employees' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${employee_ids.length} employee(s)`,
      updated_count: employee_ids.length,
    });
  } catch (error) {
    console.error('Error in POST /api/employer/team/bulk/edit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
