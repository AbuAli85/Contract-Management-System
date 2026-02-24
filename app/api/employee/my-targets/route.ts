import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Get all targets for the current employee
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
    const period = searchParams.get('period'); // current, upcoming, past

    // Find all employer_employee records for this employee
    const { data: employeeRecords } = await supabase
      .from('employer_employees')
      .select('id')
      .eq('employee_id', user.id)
      .eq('employment_status', 'active');

    if (!employeeRecords || employeeRecords.length === 0) {
      return NextResponse.json({
        success: true,
        targets: [],
        count: 0,
        message: 'No active employment found',
      });
    }

    const employerEmployeeIds = employeeRecords.map(r => r.id);

    let query = supabase
      .from('employee_targets')
      .select(
        `
        *,
        assigned_by_user:assigned_by (
          id,
          full_name,
          email
        )
      `
      )
      .in('employer_employee_id', employerEmployeeIds)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: targets, error: targetsError } = await query;

    if (targetsError) {
      console.error('Error fetching targets:', targetsError);
      return NextResponse.json(
        { error: 'Failed to fetch targets' },
        { status: 500 }
      );
    }

    // Filter by period if specified
    let filteredTargets = targets || [];
    if (period) {
      const now = new Date();
      filteredTargets = filteredTargets.filter(target => {
        const startDate = new Date(target.start_date);
        const endDate = new Date(target.end_date);

        if (period === 'current') {
          return startDate <= now && endDate >= now;
        } else if (period === 'upcoming') {
          return startDate > now;
        } else if (period === 'past') {
          return endDate < now;
        }
        return true;
      });
    }

    return NextResponse.json({
      success: true,
      targets: filteredTargets,
      count: filteredTargets.length,
    });
  } catch (error) {
    console.error('Error in GET /api/employee/my-targets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
