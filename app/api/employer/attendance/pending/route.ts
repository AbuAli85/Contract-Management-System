import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Get pending attendance records for approval
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

    // Get user's profile to check company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json(
        { error: 'No active company found' },
        { status: 400 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'pending';

    // Build query
    let query = (supabaseAdmin.from('employee_attendance') as any)
      .select(
        `
        *,
        employer_employee:employer_employees!inner(
          id,
          employee_id,
          company_id,
          employee:profiles!employer_employees_employee_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        )
      `
      )
      .eq('employer_employee.company_id', profile.active_company_id);

    // Apply filter
    if (filter !== 'all') {
      query = query.eq('approval_status', filter);
    } else {
      query = query.not('approval_status', 'is', null);
    }

    // Order by date descending
    query = query
      .order('attendance_date', { ascending: false })
      .order('check_in', { ascending: false });

    const { data: attendance, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch attendance records' },
        { status: 500 }
      );
    }

    // Transform data to include employee info
    const transformedAttendance = (attendance || []).map((record: any) => ({
      ...record,
      employee: record.employer_employee?.employee || null,
    }));

    return NextResponse.json({
      attendance: transformedAttendance,
      count: transformedAttendance.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
