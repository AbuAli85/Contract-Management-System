import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// GET - List salary structures
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

    const { searchParams } = new URL(request.url);
    const employerEmployeeId = searchParams.get('employer_employee_id');
    const status = searchParams.get('status') || 'active';

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('salary_structures')
      .select(
        `
        *,
        employer_employee:employer_employees!inner(
          id,
          employee_id,
          employer_id,
          employee:profiles!employer_employees_employee_id_fkey(
            id,
            name_en,
            name_ar,
            email
          ),
          employer:profiles!employer_employees_employer_id_fkey(
            id,
            name_en,
            name_ar
          )
        )
      `
      )
      .order('effective_from', { ascending: false });

    // Filter by employer_employee_id if provided
    if (employerEmployeeId) {
      query = query.eq('employer_employee_id', employerEmployeeId);
    }

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Company scoping for non-admins
    if (profile?.role !== 'admin') {
      query = query.eq(
        'employer_employee.company_id',
        profile?.active_company_id
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch salary structures', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      salary_structures: data || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create salary structure
export async function POST(request: NextRequest) {
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
    const {
      employer_employee_id,
      basic_salary,
      currency = 'OMR',
      allowances = {},
      deductions = {},
      overtime_rate = 1.5,
      bonus_structure = {},
      effective_from,
      effective_to,
      notes,
    } = body;

    // Validate required fields
    if (!employer_employee_id || !basic_salary || !effective_from) {
      return NextResponse.json(
        {
          error:
            'employer_employee_id, basic_salary, and effective_from are required',
        },
        { status: 400 }
      );
    }

    // Verify access
    const { data: employeeLink } = await supabase
      .from('employer_employees')
      .select('employer_id, company_id')
      .eq('id', employer_employee_id)
      .single();

    if (!employeeLink) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active_company_id')
      .eq('id', user.id)
      .single();

    const isEmployer = employeeLink.employer_id === user.id;
    const isAdmin = profile?.role === 'admin';
    const isHR = profile?.role === 'hr_manager' || profile?.role === 'manager';
    const isSameCompany =
      profile?.active_company_id === employeeLink.company_id;

    if (!isEmployer && !isAdmin && !(isHR && isSameCompany)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Deactivate existing active structure if creating new one
    if (effective_to === null || !effective_to) {
      await (supabaseAdmin.from('salary_structures') as any)
        .update({
          status: 'inactive',
          effective_to: new Date(effective_from).toISOString().split('T')[0],
        })
        .eq('employer_employee_id', employer_employee_id)
        .eq('status', 'active');
    }

    // Create new salary structure
    const { data: salaryStructure, error: createError } = await (
      supabaseAdmin.from('salary_structures') as any
    )
      .insert({
        employer_employee_id,
        basic_salary: parseFloat(basic_salary),
        currency,
        allowances,
        deductions,
        overtime_rate: parseFloat(overtime_rate),
        bonus_structure,
        effective_from,
        effective_to: effective_to || null,
        status: 'active',
        notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        {
          error: 'Failed to create salary structure',
          details: createError.message,
        },
        { status: 500 }
      );
    }

    // Create salary history entry
    await (supabaseAdmin.from('salary_history') as any).insert({
      employer_employee_id,
      salary_structure_id: salaryStructure.id,
      change_type: 'hiring',
      new_salary: parseFloat(basic_salary),
      change_amount: parseFloat(basic_salary),
      effective_date: effective_from,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Salary structure created successfully',
      salary_structure: salaryStructure,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
