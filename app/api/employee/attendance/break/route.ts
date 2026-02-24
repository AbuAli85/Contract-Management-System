import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// POST - Start or end break
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
    const { action } = body; // 'start' or 'end'

    if (!action || !['start', 'end'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use start or end' },
        { status: 400 }
      );
    }

    // Get employee record
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

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    // Get today's attendance record
    const { data: existing } = await (
      supabaseAdmin.from('employee_attendance') as any
    )
      .select('*')
      .eq('employer_employee_id', employeeLink.id)
      .eq('attendance_date', today)
      .single();

    if (!existing || !existing.check_in) {
      return NextResponse.json(
        { error: 'You must check in before starting a break' },
        { status: 400 }
      );
    }

    if (existing.check_out) {
      return NextResponse.json(
        { error: 'Cannot manage breaks after checking out' },
        { status: 400 }
      );
    }

    // Get or create break sessions table
    // For now, we'll store break data in the attendance record
    // In a professional system, you'd have a separate break_sessions table

    if (action === 'start') {
      // Check if already on break
      if (existing.break_start_time) {
        return NextResponse.json(
          { error: 'Break already started' },
          { status: 400 }
        );
      }

      // Start break
      const { data: updated, error: updateError } = await (
        supabaseAdmin.from('employee_attendance') as any
      )
        .update({
          break_start_time: now,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: 'Break started',
        attendance: updated,
      });
    } else {
      // End break
      if (!existing.break_start_time) {
        return NextResponse.json(
          { error: 'No active break to end' },
          { status: 400 }
        );
      }

      const breakStart = new Date(existing.break_start_time);
      const breakEnd = new Date(now);
      const breakDurationMinutes = Math.round(
        (breakEnd.getTime() - breakStart.getTime()) / 1000 / 60
      );

      const currentBreakMinutes = existing.break_duration_minutes || 0;
      const totalBreakMinutes = currentBreakMinutes + breakDurationMinutes;

      const { data: updated, error: updateError } = await (
        supabaseAdmin.from('employee_attendance') as any
      )
        .update({
          break_duration_minutes: totalBreakMinutes,
          break_start_time: null,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: 'Break ended',
        break_duration_minutes: breakDurationMinutes,
        total_break_minutes: totalBreakMinutes,
        attendance: updated,
      });
    }
  } catch (error: any) {
    console.error('Error in break action:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
