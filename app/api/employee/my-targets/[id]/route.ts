import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Get a specific target
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get target with employer_employee verification
    const { data: target, error: targetError } = await supabase
      .from('employee_targets')
      .select(
        `
        *,
        employer_employee:employer_employee_id (
          id,
          employee_id,
          employer_id
        ),
        assigned_by_user:assigned_by (
          id,
          full_name,
          email
        )
      `
      )
      .eq('id', id)
      .single();

    if (targetError || !target) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }

    // Verify the user is the employee
    const employerEmployee = target.employer_employee as any;
    if (employerEmployee?.employee_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have access to this target' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      target,
    });
  } catch (error) {
    console.error('Error in GET /api/employee/my-targets/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add progress to a target (incremental update)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { progress_value, notes } = body;

    if (progress_value === undefined || isNaN(Number(progress_value))) {
      return NextResponse.json(
        { error: 'Progress value is required' },
        { status: 400 }
      );
    }

    // First verify the target belongs to this employee
    const { data: target, error: targetError } = await supabase
      .from('employee_targets')
      .select(
        `
        id,
        target_value,
        current_value,
        status,
        employer_employee:employer_employee_id (
          id,
          employee_id
        )
      `
      )
      .eq('id', id)
      .single();

    if (targetError || !target) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }

    const employerEmployee = target.employer_employee as any;
    if (employerEmployee?.employee_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have access to this target' },
        { status: 403 }
      );
    }

    // Calculate new value (incremental)
    const progressAmount = Number(progress_value);
    const newValue = Number(target.current_value || 0) + progressAmount;
    const targetValue = Number(target.target_value);

    // Build update object
    const updateData: any = {
      current_value: newValue,
      updated_at: new Date().toISOString(),
    };

    // Calculate progress percentage
    if (targetValue > 0) {
      updateData.progress_percentage = Math.min(
        Math.round((newValue / targetValue) * 100),
        100
      );
    }

    // Auto-complete if 100% reached
    if (newValue >= targetValue && target.status === 'active') {
      updateData.status = 'completed';
    }

    // Update the target
    const { data: updatedTarget, error: updateError } = await supabase
      .from('employee_targets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating target:', updateError);
      return NextResponse.json(
        { error: 'Failed to update target', details: updateError.message },
        { status: 500 }
      );
    }

    // Record progress in target_progress table if it exists
    try {
      await supabase.from('target_progress').insert({
        target_id: id,
        recorded_value: progressAmount,
        recorded_date: new Date().toISOString().split('T')[0],
        recorded_by: user.id,
        notes: notes || null,
      });
    } catch {
      // Ignore if target_progress table doesn't exist
    }

    return NextResponse.json({
      success: true,
      message: `Added ${progressAmount} to target`,
      previous_value: target.current_value,
      new_value: newValue,
      target: updatedTarget,
    });
  } catch (error) {
    console.error('Error in POST /api/employee/my-targets/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update target progress (employee can update current_value and notes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { current_value, notes } = body;

    // First verify the target belongs to this employee
    const { data: target, error: targetError } = await supabase
      .from('employee_targets')
      .select(
        `
        id,
        target_value,
        current_value,
        status,
        employer_employee:employer_employee_id (
          id,
          employee_id
        )
      `
      )
      .eq('id', id)
      .single();

    if (targetError || !target) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }

    const employerEmployee = target.employer_employee as any;
    if (employerEmployee?.employee_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have access to this target' },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (current_value !== undefined) {
      const newValue = Number(current_value);
      if (isNaN(newValue) || newValue < 0) {
        return NextResponse.json(
          { error: 'Invalid current value' },
          { status: 400 }
        );
      }
      updateData.current_value = newValue;

      // Calculate progress percentage
      const targetValue = Number(target.target_value);
      if (targetValue > 0) {
        updateData.progress_percentage = Math.min(
          Math.round((newValue / targetValue) * 100),
          100
        );
      }

      // Auto-complete if 100% reached
      if (newValue >= targetValue && target.status === 'active') {
        updateData.status = 'completed';
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Update the target
    const { data: updatedTarget, error: updateError } = await supabase
      .from('employee_targets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating target:', updateError);
      return NextResponse.json(
        { error: 'Failed to update target', details: updateError.message },
        { status: 500 }
      );
    }

    // Optionally record progress in target_progress table if it exists
    try {
      await supabase.from('target_progress').insert({
        target_id: id,
        recorded_value: current_value,
        recorded_date: new Date().toISOString().split('T')[0],
        recorded_by: user.id,
        notes: notes || null,
      });
    } catch {
      // Ignore if target_progress table doesn't exist
    }

    return NextResponse.json({
      success: true,
      message: 'Target updated successfully',
      target: updatedTarget,
    });
  } catch (error) {
    console.error('Error in PATCH /api/employee/my-targets/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
