import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const CheckInSchema = z.object({
  employee_id: z.number(),
  action: z.enum(['check_in', 'check_out']),
  method: z.string().default('web'),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const AttendanceQuerySchema = z.object({
  employee_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.string().default('1'),
  limit: z.string().default('10'),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const queryParams = {
      employee_id: searchParams.get('employee_id'),
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    };

    const parsed = AttendanceQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const page = parseInt(parsed.data.page);
    const limit = parseInt(parsed.data.limit);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('hr.attendance_logs')
      .select(
        `
        id, employee_id, check_in, check_out, location, method, 
        notes, overtime_hours, break_duration_minutes, created_at,
        employees!inner(full_name, employee_code, job_title)
      `
      )
      .order('check_in', { ascending: false });

    // Apply filters
    if (parsed.data.employee_id) {
      query = query.eq('employee_id', parsed.data.employee_id);
    }

    if (parsed.data.start_date) {
      query = query.gte('check_in', parsed.data.start_date);
    }

    if (parsed.data.end_date) {
      query = query.lte('check_in', parsed.data.end_date);
    }

    // Get total count for pagination (apply same filters)
    let countQuery = supabase
      .from('hr.attendance_logs')
      .select('*', { count: 'exact', head: true });

    if (parsed.data.employee_id) {
      countQuery = countQuery.eq('employee_id', parsed.data.employee_id);
    }
    if (parsed.data.start_date) {
      countQuery = countQuery.gte('check_in', parsed.data.start_date);
    }
    if (parsed.data.end_date) {
      countQuery = countQuery.lte('check_in', parsed.data.end_date);
    }

    const { count } = await countQuery;

    // Get paginated results
    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching attendance:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attendance records' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/hr/attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const parsed = CheckInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { employee_id, action, method, location, notes } = parsed.data;

    if (action === 'check_in') {
      // Check if employee already has an open shift
      const { data: openShift } = await supabase
        .from('hr.attendance_logs')
        .select('id')
        .eq('employee_id', employee_id)
        .is('check_out', null)
        .order('check_in', { ascending: false })
        .limit(1)
        .single();

      if (openShift) {
        return NextResponse.json(
          {
            error:
              'Employee already has an open shift. Please check out first.',
          },
          { status: 400 }
        );
      }

      // Create new check-in record
      const { data, error } = await supabase
        .from('hr.attendance_logs')
        .insert({
          employee_id,
          check_in: new Date().toISOString(),
          method,
          location,
          notes,
        })
        .select(
          `
          id, employee_id, check_in, check_out, location, method, 
          notes, overtime_hours, break_duration_minutes, created_at
        `
        )
        .single();

      if (error) {
        console.error('Error creating check-in:', error);
        return NextResponse.json(
          { error: 'Failed to check in' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Checked in successfully',
        data,
      });
    } else if (action === 'check_out') {
      // Find the latest open attendance record
      const { data: openLogs, error: findError } = await supabase
        .from('hr.attendance_logs')
        .select('id, check_in, notes')
        .eq('employee_id', employee_id)
        .is('check_out', null)
        .order('check_in', { ascending: false })
        .limit(1);

      if (findError) {
        console.error('Error finding open shift:', findError);
        return NextResponse.json(
          { error: 'Failed to find open shift' },
          { status: 500 }
        );
      }

      if (!openLogs || openLogs.length === 0 || !openLogs[0]) {
        return NextResponse.json(
          { error: 'No open shift found. Please check in first.' },
          { status: 400 }
        );
      }

      const openLog = openLogs[0];
      const checkOutTime = new Date();
      const checkInTime = new Date(openLog.check_in);
      const workHours =
        (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      const overtimeHours = Math.max(0, workHours - 8); // Assuming 8 hours standard work day

      // Update the attendance record with check-out
      const { data, error } = await supabase
        .from('hr.attendance_logs')
        .update({
          check_out: checkOutTime.toISOString(),
          overtime_hours: overtimeHours,
          notes: notes
            ? `${openLog.notes || ''}\n${notes}`.trim()
            : openLog.notes || null,
        })
        .eq('id', openLog.id)
        .select(
          `
          id, employee_id, check_in, check_out, location, method, 
          notes, overtime_hours, break_duration_minutes, created_at
        `
        )
        .single();

      if (error) {
        console.error('Error updating check-out:', error);
        return NextResponse.json(
          { error: 'Failed to check out' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Checked out successfully',
        data,
        work_hours: workHours,
        overtime_hours: overtimeHours,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/hr/attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
