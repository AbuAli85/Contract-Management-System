import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Get my attendance records
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    
    const startDate = `${month}-01`;
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr || '2025', 10);
    const monthNum = parseInt(monthStr || '1', 10);
    const endDate = new Date(year, monthNum, 0)
      .toISOString()
      .slice(0, 10);

    const supabaseAdmin = getSupabaseAdmin();
    const { data: attendance, error } = await (supabaseAdmin.from('employee_attendance') as any)
      .select('*')
      .eq('employer_employee_id', employeeLink.id)
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate)
      .order('attendance_date', { ascending: false });

    if (error) {
      console.error('Error fetching attendance:', error);
      return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }

    // Calculate summary
    const totalDays = attendance?.length || 0;
    const presentDays = attendance?.filter((a: any) => a.status === 'present').length || 0;
    const lateDays = attendance?.filter((a: any) => a.status === 'late').length || 0;
    const absentDays = attendance?.filter((a: any) => a.status === 'absent').length || 0;
    const totalHours = attendance?.reduce((sum: number, a: any) => sum + (parseFloat(a.total_hours) || 0), 0) || 0;

    return NextResponse.json({
      attendance: attendance || [],
      summary: {
        totalDays,
        presentDays,
        lateDays,
        absentDays,
        totalHours: totalHours.toFixed(1),
      },
    });
  } catch (error) {
    console.error('Error in attendance GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Check in or check out
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, location, notes } = body; // action: 'check_in' or 'check_out'

    if (!action || !['check_in', 'check_out'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use check_in or check_out' },
        { status: 400 }
      );
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

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const supabaseAdmin = getSupabaseAdmin();

    // Check existing attendance for today
    const { data: existing } = await (supabaseAdmin.from('employee_attendance') as any)
      .select('*')
      .eq('employer_employee_id', employeeLink.id)
      .eq('attendance_date', today)
      .single();

    if (action === 'check_in') {
      if (existing?.check_in) {
        return NextResponse.json(
          { error: 'Already checked in today', attendance: existing },
          { status: 400 }
        );
      }

      // Determine if late (after 9 AM)
      const hour = new Date().getHours();
      const status = hour >= 9 ? 'late' : 'present';

      if (existing) {
        // Update existing record
        const { data: updated, error: updateError } = await (supabaseAdmin.from('employee_attendance') as any)
          .update({
            check_in: now,
            status,
            location: location || existing.location,
            notes: notes || existing.notes,
            method: 'web',
            updated_at: now,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return NextResponse.json({
          success: true,
          message: 'Checked in successfully',
          attendance: updated,
        });
      } else {
        // Create new record
        const { data: created, error: createError } = await (supabaseAdmin.from('employee_attendance') as any)
          .insert({
            employer_employee_id: employeeLink.id,
            attendance_date: today,
            check_in: now,
            status,
            location,
            notes,
            method: 'web',
          })
          .select()
          .single();

        if (createError) throw createError;
        return NextResponse.json({
          success: true,
          message: `Checked in successfully${status === 'late' ? ' (Late)' : ''}`,
          attendance: created,
        });
      }
    } else {
      // check_out
      if (!existing?.check_in) {
        return NextResponse.json(
          { error: 'Must check in before checking out' },
          { status: 400 }
        );
      }

      if (existing?.check_out) {
        return NextResponse.json(
          { error: 'Already checked out today', attendance: existing },
          { status: 400 }
        );
      }

      // Calculate total hours
      const checkInTime = new Date(existing.check_in);
      const checkOutTime = new Date();
      const totalMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60);
      const breakMinutes = existing.break_duration_minutes || 0;
      const netMinutes = totalMinutes - breakMinutes;
      const totalHours = (netMinutes / 60).toFixed(2);
      
      // Calculate overtime (over 8 hours)
      const overtimeHours = Math.max(0, parseFloat(totalHours) - 8).toFixed(2);

      const { data: updated, error: updateError } = await (supabaseAdmin.from('employee_attendance') as any)
        .update({
          check_out: now,
          total_hours: parseFloat(totalHours),
          overtime_hours: parseFloat(overtimeHours),
          notes: notes || existing.notes,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: `Checked out. Total hours: ${totalHours}`,
        attendance: updated,
      });
    }
  } catch (error) {
    console.error('Error in attendance POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

