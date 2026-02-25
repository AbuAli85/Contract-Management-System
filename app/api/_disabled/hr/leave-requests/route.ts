import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const LeaveRequestSchema = z.object({
  employee_id: z.number(),
  leave_type: z.enum([
    'annual',
    'sick',
    'personal',
    'maternity',
    'paternity',
    'unpaid',
    'other',
  ]),
  start_date: z.string(),
  end_date: z.string(),
  reason: z.string().optional(),
});

const LeaveQuerySchema = z.object({
  employee_id: z.string().optional(),
  status: z.string().optional(),
  leave_type: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.string().default('1'),
  limit: z.string().default('10'),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const queryParams = {
      employee_id: searchParams.get('employee_id'),
      status: searchParams.get('status'),
      leave_type: searchParams.get('leave_type'),
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    };

    const parsed = LeaveQuerySchema.safeParse(queryParams);
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
      .from('hr.leave_requests')
      .select(
        `
        id, employee_id, leave_type, start_date, end_date, total_days,
        reason, approval_status, approved_by, approved_at, rejection_reason,
        created_at, updated_at,
        employees!inner(full_name, employee_code, job_title),
        approver:hr.employees!approved_by(full_name, employee_code)
      `
      )
      .order('created_at', { ascending: false });

    // Apply filters
    if (parsed.data.employee_id) {
      query = query.eq('employee_id', parsed.data.employee_id);
    }

    if (parsed.data.status) {
      query = query.eq('approval_status', parsed.data.status);
    }

    if (parsed.data.leave_type) {
      query = query.eq('leave_type', parsed.data.leave_type);
    }

    if (parsed.data.start_date) {
      query = query.gte('start_date', parsed.data.start_date);
    }

    if (parsed.data.end_date) {
      query = query.lte('end_date', parsed.data.end_date);
    }

    // Get total count for pagination
    const { count } = await query.select('*', { count: 'exact', head: true });

    // Get paginated results
    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch leave requests' },
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const parsed = LeaveRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { employee_id, leave_type, start_date, end_date, reason } =
      parsed.data;

    // Calculate total days
    const start = new Date(start_date);
    const end = new Date(end_date);
    const timeDiff = end.getTime() - start.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates

    if (totalDays <= 0) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check for overlapping leave requests
    const { data: overlappingRequests } = await supabase
      .from('hr.leave_requests')
      .select('id, start_date, end_date, approval_status')
      .eq('employee_id', employee_id)
      .in('approval_status', ['pending', 'approved'])
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`);

    if (overlappingRequests && overlappingRequests.length > 0) {
      return NextResponse.json(
        { error: 'You have overlapping leave requests for this period' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('hr.leave_requests')
      .insert({
        employee_id,
        leave_type,
        start_date,
        end_date,
        total_days: totalDays,
        reason,
      })
      .select(
        `
        id, employee_id, leave_type, start_date, end_date, total_days,
        reason, approval_status, created_at, updated_at
      `
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create leave request' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Leave request submitted successfully',
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
