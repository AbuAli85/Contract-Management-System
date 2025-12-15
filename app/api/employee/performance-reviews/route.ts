import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the employee's employer_employee record
    const { data: employerEmployee, error: eeError } = await supabase
      .from('employer_employees')
      .select('id')
      .eq('employee_id', user.id)
      .eq('employment_status', 'active')
      .single();

    if (eeError || !employerEmployee) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 });
    }

    // Get performance reviews for this employee
    const { data: reviews, error } = await supabase
      .from('performance_reviews')
      .select(`
        *,
        reviewer:profiles!performance_reviews_reviewed_by_fkey (
          full_name
        )
      `)
      .eq('employer_employee_id', employerEmployee.id)
      .order('review_period_end', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reviews: reviews || [],
    });
  } catch (error: any) {
    console.error('Performance reviews fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

