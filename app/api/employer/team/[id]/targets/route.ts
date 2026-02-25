import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureEmployerEmployeeRecord } from '@/lib/utils/ensure-employee-record';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Get targets for employee
async function getTargetsHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    let { id } = await params; // employer_employee_id (may be prefixed with 'promoter_')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ AUTO-CONVERT: Ensure employer_employee record exists (auto-create for promoters)
    try {
      const { employerEmployeeId } = await ensureEmployerEmployeeRecord(
        id,
        user.id
      );
      id = employerEmployeeId; // Use the actual employer_employee ID
    } catch (error: any) {
      return NextResponse.json(
        {
          error: 'Failed to process employee record',
          details:
            error.message ||
            'Could not create or find employer_employee record',
          input_id: id,
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const period = searchParams.get('period'); // current, upcoming, past

    // ✅ COMPANY SCOPE: Verify access and check company scope
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    const { data: teamMember } = await supabase
      .from('employer_employees')
      .select('employer_id, employee_id, company_id')
      .eq('id', id)
      .single();

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // ✅ COMPANY SCOPE: Verify team member belongs to active company
    // Allow if company_id is null (backwards compatibility) OR matches active company
    if (
      profile?.active_company_id &&
      teamMember.company_id &&
      teamMember.company_id !== profile.active_company_id
    ) {
      return NextResponse.json(
        { error: 'Team member does not belong to your active company' },
        { status: 403 }
      );
    }

    let query = supabase
      .from('employee_targets')
      .select(
        `
        *,
        assigned_by_user:assigned_by (
          id,
          full_name,
          email
        )
      `
      )
      .eq('employer_employee_id', id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: targets, error: targetsError } = await query;

    if (targetsError) {
      return NextResponse.json(
        { error: 'Failed to fetch targets' },
        { status: 500 }
      );
    }

    // Filter by period if specified
    let filteredTargets = targets || [];
    if (period) {
      const now = new Date();
      filteredTargets = filteredTargets.filter(target => {
        const startDate = new Date(target.start_date);
        const endDate = new Date(target.end_date);

        if (period === 'current') {
          return startDate <= now && endDate >= now;
        } else if (period === 'upcoming') {
          return startDate > now;
        } else if (period === 'past') {
          return endDate < now;
        }
        return true;
      });
    }

    // Get progress records for each target
    const targetIds = filteredTargets.map(t => t.id);
    let progressRecords: Record<string, any[]> = {};

    if (targetIds.length > 0) {
      const { data: progress } = await supabase
        .from('target_progress')
        .select('*')
        .in('target_id', targetIds)
        .order('recorded_date', { ascending: false });

      progressRecords = (progress || []).reduce(
        (acc, record) => {
          if (!acc[record.target_id]) {
            acc[record.target_id] = [];
          }
          acc[record.target_id].push(record);
          return acc;
        },
        {} as Record<string, any[]>
      );
    }

    const targetsWithProgress = filteredTargets.map(target => ({
      ...target,
      progress_records: progressRecords[target.id] || [],
    }));

    return NextResponse.json({
      success: true,
      targets: targetsWithProgress,
      count: targetsWithProgress.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create target
async function createTargetHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    let { id } = await params; // employer_employee_id (may be prefixed with 'promoter_')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ AUTO-CONVERT: Ensure employer_employee record exists (auto-create for promoters)
    try {
      const { employerEmployeeId } = await ensureEmployerEmployeeRecord(
        id,
        user.id
      );
      id = employerEmployeeId; // Use the actual employer_employee ID
    } catch (error: any) {
      return NextResponse.json(
        {
          error: 'Failed to process employee record',
          details:
            error.message ||
            'Could not create or find employer_employee record',
          input_id: id,
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      target_type,
      target_value,
      unit,
      period_type,
      start_date,
      end_date,
      notes,
    } = body;

    if (!title || !target_value || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Title, target value, start date, and end date are required' },
        { status: 400 }
      );
    }

    // ✅ COMPANY SCOPE: Verify user is the employer and check company scope
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    const { data: teamMember } = await supabase
      .from('employer_employees')
      .select('employer_id, company_id')
      .eq('id', id)
      .single();

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // ✅ COMPANY SCOPE: Verify team member belongs to active company
    // Allow if company_id is null (backwards compatibility) OR matches active company
    if (
      userProfile?.active_company_id &&
      teamMember.company_id &&
      teamMember.company_id !== userProfile.active_company_id
    ) {
      return NextResponse.json(
        { error: 'Team member does not belong to your active company' },
        { status: 403 }
      );
    }

    if (teamMember.employer_id !== user.id) {
      if (userProfile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only employer can create targets' },
          { status: 403 }
        );
      }
    }

    // Create target
    const { data: target, error: createError } = await supabase
      .from('employee_targets')
      .insert({
        employer_employee_id: id,
        title,
        description,
        target_type: target_type || 'performance',
        target_value,
        current_value: 0,
        unit: unit || 'units',
        period_type: period_type || 'monthly',
        start_date,
        end_date,
        status: 'active',
        progress_percentage: 0,
        notes,
        assigned_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create target', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Target created successfully',
      target,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers directly - internal authorization is already implemented
export const GET = getTargetsHandler;
export const POST = createTargetHandler;
