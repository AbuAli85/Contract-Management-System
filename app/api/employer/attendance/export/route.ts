import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

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

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // csv or excel
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const companyId = searchParams.get('company_id');

    // Get user's active company if not provided
    let activeCompanyId = companyId;
    if (!activeCompanyId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id')
        .eq('id', user.id)
        .single();
      activeCompanyId = profile?.active_company_id;
    }

    if (!activeCompanyId) {
      return NextResponse.json(
        { error: 'Company ID required' },
        { status: 400 }
      );
    }

    // Build query
    let query = (supabaseAdmin.from('employee_attendance') as any)
      .select(
        `
        *,
        employer_employee:employer_employees!inner(
          company_id,
          employee:profiles!employer_employees_employee_id_fkey(
            id,
            full_name,
            email
          )
        )
      `
      )
      .eq('employer_employee.company_id', activeCompanyId);

    if (startDate) {
      query = query.gte('attendance_date', startDate);
    }
    if (endDate) {
      query = query.lte('attendance_date', endDate);
    }

    query = query.order('attendance_date', { ascending: false });

    const { data: attendance, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch attendance data' },
        { status: 500 }
      );
    }

    // Convert to CSV
    if (format === 'csv') {
      const headers = [
        'Date',
        'Employee Name',
        'Employee Email',
        'Check In',
        'Check Out',
        'Total Hours',
        'Overtime Hours',
        'Status',
        'Approval Status',
      ];

      const rows = (attendance || []).map((record: any) => [
        record.attendance_date,
        record.employer_employee?.employee?.full_name || '',
        record.employer_employee?.employee?.email || '',
        record.check_in || '',
        record.check_out || '',
        record.total_hours || 0,
        record.overtime_hours || 0,
        record.status || '',
        record.approval_status || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="attendance-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // For Excel, return JSON (client can use a library like xlsx)
    return NextResponse.json({
      success: true,
      data: attendance || [],
      count: attendance?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
