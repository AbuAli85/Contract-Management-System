import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Get my leave requests and balances
export async function GET(request: NextRequest) {
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

    // Get employee link
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const year =
      searchParams.get('year') || new Date().getFullYear().toString();

    // Get leave requests
    let requestsQuery = (supabaseAdmin.from('employee_leave_requests') as any)
      .select(
        `
        *,
        reviewed_by_user:reviewed_by (
          full_name,
          email
        )
      `
      )
      .eq('employer_employee_id', employeeLink.id)
      .order('created_at', { ascending: false });

    if (status) {
      requestsQuery = requestsQuery.eq('status', status);
    }

    const { data: requests, error: requestsError } = await requestsQuery;

    if (requestsError) {
      console.error('Error fetching leave requests:', requestsError);
      return NextResponse.json(
        { error: 'Failed to fetch leave requests' },
        { status: 500 }
      );
    }

    // Get leave balances
    const { data: balances, error: balancesError } = await (
      supabaseAdmin.from('employee_leave_balances') as any
    )
      .select('*')
      .eq('employer_employee_id', employeeLink.id)
      .eq('year', parseInt(year));

    if (balancesError) {
      console.error('Error fetching leave balances:', balancesError);
    }

    // Calculate stats
    const pending = (requests || []).filter(
      (r: any) => r.status === 'pending'
    ).length;
    const approved = (requests || []).filter(
      (r: any) => r.status === 'approved'
    ).length;
    const totalUsed = (balances || []).reduce(
      (sum: number, b: any) => sum + (b.used_days || 0),
      0
    );
    const totalAvailable = (balances || []).reduce(
      (sum: number, b: any) =>
        sum + (b.total_days - b.used_days - b.pending_days),
      0
    );

    return NextResponse.json({
      success: true,
      requests: requests || [],
      balances: balances || [],
      stats: {
        pending,
        approved,
        totalUsed,
        totalAvailable,
      },
    });
  } catch (error) {
    console.error('Error in leave requests GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Submit a new leave request
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
    const { leave_type, start_date, end_date, reason } = body;

    // Validate required fields
    if (!leave_type || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Leave type, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Validate date range
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Calculate total days (excluding weekends)
    let totalDays = 0;
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get employee link
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

    // Check for overlapping leave requests
    const { data: overlapping } = await (
      supabaseAdmin.from('employee_leave_requests') as any
    )
      .select('id')
      .eq('employer_employee_id', employeeLink.id)
      .in('status', ['pending', 'approved'])
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`);

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json(
        { error: 'You already have a leave request for these dates' },
        { status: 400 }
      );
    }

    // Create leave request
    const { data: leaveRequest, error: createError } = await (
      supabaseAdmin.from('employee_leave_requests') as any
    )
      .insert({
        employer_employee_id: employeeLink.id,
        leave_type,
        start_date,
        end_date,
        total_days: totalDays,
        reason,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating leave request:', createError);
      return NextResponse.json(
        {
          error: 'Failed to create leave request',
          details: createError.message,
        },
        { status: 500 }
      );
    }

    // Update pending days in balance
    const year = new Date(start_date).getFullYear();
    await (supabaseAdmin.from('employee_leave_balances') as any).upsert(
      {
        employer_employee_id: employeeLink.id,
        leave_type,
        year,
        total_days: 21, // Default annual leave
        used_days: 0,
        pending_days: totalDays,
      },
      {
        onConflict: 'employer_employee_id,leave_type,year',
        ignoreDuplicates: false,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Leave request submitted successfully',
      request: leaveRequest,
    });
  } catch (error) {
    console.error('Error in leave requests POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
