import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// GET - List targets
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
    const status = searchParams.get('status');
    const targetType = searchParams.get('target_type');
    const employeeId = searchParams.get('employee_id');

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('employee_targets')
      .select(`
        *,
        employer_employee:employer_employees!inner(
          id,
          employee_id,
          employer_id,
          job_title,
          company_id,
          employee:profiles!employer_employees_employee_id_fkey(
            id,
            name_en,
            name_ar
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (targetType && targetType !== 'all') {
      query = query.eq('target_type', targetType);
    }

    if (employeeId) {
      query = query.eq('employer_employee_id', employeeId);
    }

    // Company scoping for non-admins
    if (profile?.role !== 'admin' && profile?.active_company_id) {
      query = query.eq('employer_employee.company_id', profile.active_company_id);
    }

    const { data: targets, error } = await query;

    if (error) {
      console.error('Error fetching targets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch targets', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      targets: targets || [],
    });
  } catch (error) {
    console.error('Error in GET /api/hr/targets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create target
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
      title,
      description,
      target_type = 'performance',
      target_value,
      unit,
      period_type = 'monthly',
      start_date,
      end_date,
    } = body;

    // Validate required fields
    if (!employer_employee_id || !title || !target_value || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
    const isSameCompany = profile?.active_company_id === employeeLink.company_id;

    if (!isEmployer && !isAdmin && !(isHR && isSameCompany)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Create target
    const { data: target, error: createError } = await (supabaseAdmin.from('employee_targets') as any)
      .insert({
        employer_employee_id,
        title,
        description: description || null,
        target_type,
        target_value: parseFloat(target_value),
        unit: unit || null,
        period_type,
        start_date,
        end_date,
        status: 'active',
        current_value: 0,
        progress_percentage: 0,
        assigned_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating target:', createError);
      return NextResponse.json(
        { error: 'Failed to create target', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Target created successfully',
      target,
    });
  } catch (error) {
    console.error('Error in POST /api/hr/targets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

