import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { notifyPerformanceReview } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// GET - Get all team performance reviews
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

    // Get team members
    const { data: teamMembers } = await supabase
      .from('employer_employees')
      .select('id, employee_id')
      .eq('employer_id', user.id);

    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json({
        success: true,
        reviews: [],
        stats: { draft: 0, submitted: 0, acknowledged: 0, completed: 0 },
      });
    }

    const employerEmployeeIds = teamMembers.map(m => m.id);

    // Try to get reviews - handle case where table doesn't exist
    try {
      let query = (supabaseAdmin.from('employee_performance_reviews') as any)
        .select(
          `
          *,
          employer_employee:employer_employee_id (
            employee:employee_id (
              id,
              full_name,
              email,
              avatar_url
            ),
            job_title,
            department
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
        const empRecord = teamMembers.find(m => m.employee_id === employeeId);
        if (empRecord) {
          query = query.eq('employer_employee_id', empRecord.id);
        }
      }

      const { data: reviews, error } = await query;

      if (error) {
        // If table doesn't exist, return empty state
        if (
          error.code === '42P01' ||
          error.message?.includes('does not exist')
        ) {
          return NextResponse.json({
            success: true,
            reviews: [],
            stats: { draft: 0, submitted: 0, acknowledged: 0, completed: 0 },
            message: 'Performance reviews feature not yet configured',
          });
        }
        return NextResponse.json(
          { error: 'Failed to fetch reviews' },
          { status: 500 }
        );
      }

      // Calculate stats
      const allReviews = reviews || [];
      const stats = {
        draft: allReviews.filter((r: any) => r.status === 'draft').length,
        submitted: allReviews.filter((r: any) => r.status === 'submitted')
          .length,
        acknowledged: allReviews.filter((r: any) => r.status === 'acknowledged')
          .length,
        completed: allReviews.filter((r: any) => r.status === 'completed')
          .length,
      };

      return NextResponse.json({
        success: true,
        reviews: allReviews,
        stats,
      });
    } catch (tableError: any) {
      // Handle case where employee_performance_reviews table doesn't exist
      return NextResponse.json({
        success: true,
        reviews: [],
        stats: { draft: 0, submitted: 0, acknowledged: 0, completed: 0 },
        message: 'Performance reviews feature not yet configured',
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new performance review
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
      review_period_start,
      review_period_end,
      review_type,
      overall_rating,
      performance_rating,
      attendance_rating,
      teamwork_rating,
      communication_rating,
      initiative_rating,
      strengths,
      areas_for_improvement,
      goals_for_next_period,
      manager_comments,
      status: reviewStatus,
    } = body;

    if (!employer_employee_id || !review_period_start || !review_period_end) {
      return NextResponse.json(
        { error: 'Employee, period start, and period end are required' },
        { status: 400 }
      );
    }

    // Verify employer owns this employee
    const { data: employeeRecord } = await supabase
      .from('employer_employees')
      .select('id, employee_id')
      .eq('id', employer_employee_id)
      .eq('employer_id', user.id)
      .single();

    if (!employeeRecord) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Create review
    const { data: review, error: createError } = await (
      supabaseAdmin.from('employee_performance_reviews') as any
    )
      .insert({
        employer_employee_id,
        review_period_start,
        review_period_end,
        review_type: review_type || 'annual',
        overall_rating: overall_rating || null,
        performance_rating: performance_rating || null,
        attendance_rating: attendance_rating || null,
        teamwork_rating: teamwork_rating || null,
        communication_rating: communication_rating || null,
        initiative_rating: initiative_rating || null,
        strengths: strengths || null,
        areas_for_improvement: areas_for_improvement || null,
        goals_for_next_period: goals_for_next_period || null,
        manager_comments: manager_comments || null,
        status: reviewStatus || 'draft',
        reviewed_by: user.id,
        submitted_at:
          reviewStatus === 'submitted' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create review', details: createError.message },
        { status: 500 }
      );
    }

    // Notify employee if submitted
    if (reviewStatus === 'submitted') {
      const { data: employee } = await (supabaseAdmin.from('profiles') as any)
        .select('email, full_name')
        .eq('id', employeeRecord.employee_id)
        .single();

      if (employee?.email) {
        await notifyPerformanceReview(
          employee.email,
          employee.full_name || 'Employee',
          review_type || 'annual',
          review_period_start,
          review_period_end,
          'created'
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Performance review created',
      review,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
