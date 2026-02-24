import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Get all team leave requests
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
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employee_id');

    // Get all team member IDs
    const { data: teamMembers } = await supabase
      .from('employer_employees')
      .select('id, employee_id')
      .eq('employer_id', user.id);

    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json({
        success: true,
        requests: [],
        stats: { pending: 0, approved: 0, rejected: 0 },
      });
    }

    const employerEmployeeIds = teamMembers.map(m => m.id);

    // Try to get leave requests - handle case where table doesn't exist
    try {
      let query = (supabaseAdmin.from('employee_leave_requests') as any)
        .select(
          `
          *,
          employer_employee:employer_employee_id (
            id,
            employee_id,
            job_title,
            department,
            employee:employee_id (
              full_name,
              email,
              avatar_url
            )
          ),
          reviewed_by_user:reviewed_by (
            full_name
          )
        `
        )
        .in('employer_employee_id', employerEmployeeIds)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (employeeId) {
        const employerEmployee = teamMembers.find(
          m => m.employee_id === employeeId
        );
        if (employerEmployee) {
          query = query.eq('employer_employee_id', employerEmployee.id);
        }
      }

      const { data: requests, error: requestsError } = await query;

      if (requestsError) {
        // If table doesn't exist, return empty state
        if (
          requestsError.code === '42P01' ||
          requestsError.message?.includes('does not exist')
        ) {
          return NextResponse.json({
            success: true,
            requests: [],
            stats: { pending: 0, approved: 0, rejected: 0 },
            message: 'Leave requests feature not yet configured',
          });
        }
        console.error('Error fetching leave requests:', requestsError);
        return NextResponse.json(
          { error: 'Failed to fetch leave requests' },
          { status: 500 }
        );
      }

      // Calculate stats
      const allRequests = requests || [];
      const stats = {
        pending: allRequests.filter((r: any) => r.status === 'pending').length,
        approved: allRequests.filter((r: any) => r.status === 'approved')
          .length,
        rejected: allRequests.filter((r: any) => r.status === 'rejected')
          .length,
      };

      return NextResponse.json({
        success: true,
        requests: allRequests,
        stats,
      });
    } catch (tableError: any) {
      // Handle case where employee_leave_requests table doesn't exist
      console.error('Leave requests table error:', tableError);
      return NextResponse.json({
        success: true,
        requests: [],
        stats: { pending: 0, approved: 0, rejected: 0 },
        message: 'Leave requests feature not yet configured',
      });
    }
  } catch (error) {
    console.error('Error in employer leave requests GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
