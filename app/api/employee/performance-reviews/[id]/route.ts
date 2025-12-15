import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, employee_comments } = body;

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

    // Verify the review belongs to this employee
    const { data: review, error: reviewError } = await supabase
      .from('performance_reviews')
      .select('id, status')
      .eq('id', params.id)
      .eq('employer_employee_id', employerEmployee.id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Only allow acknowledgment if status is 'submitted'
    if (status === 'acknowledged' && review.status !== 'submitted') {
      return NextResponse.json({ error: 'Can only acknowledge submitted reviews' }, { status: 400 });
    }

    // Update the review
    const { data: updatedReview, error: updateError } = await supabase
      .from('performance_reviews')
      .update({
        status: status || review.status,
        employee_comments: employee_comments,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating review:', updateError);
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      review: updatedReview,
    });
  } catch (error: any) {
    console.error('Review update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

