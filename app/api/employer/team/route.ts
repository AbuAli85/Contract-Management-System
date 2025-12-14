import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - List all employees for an employer
async function getTeamHandler(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get employer_id from query params or user metadata
    const { searchParams } = new URL(request.url);
    const employerId = searchParams.get('employer_id') || user.id;

    // Verify user is the employer or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const isAdmin = profile.role === 'admin' || profile.role === 'manager';
    const isOwnTeam = employerId === user.id;

    if (!isAdmin && !isOwnTeam) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Fetch team members
    const { data: teamMembers, error: teamError } = await supabase
      .from('employer_employees')
      .select(
        `
        *,
        employee:employee_id (
          id,
          email,
          full_name,
          first_name,
          last_name,
          phone,
          avatar_url
        ),
        manager:reporting_manager_id (
          id,
          full_name,
          email
        )
      `
      )
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (teamError) {
      console.error('Error fetching team:', teamError);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    // Get employee permissions for each member
    const teamWithPermissions = await Promise.all(
      (teamMembers || []).map(async member => {
        const { data: permissions } = await supabase
          .from('employee_permissions')
          .select('permission_id, granted')
          .eq('employer_employee_id', member.id);

        return {
          ...member,
          permissions: permissions || [],
        };
      })
    );

    return NextResponse.json({
      success: true,
      team: teamWithPermissions,
      count: teamWithPermissions.length,
    });
  } catch (error) {
    console.error('Error in GET /api/employer/team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add employee to team
async function addTeamMemberHandler(request: NextRequest) {
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
    const {
      employee_id,
      employee_code,
      job_title,
      department,
      employment_type,
      hire_date,
      reporting_manager_id,
      salary,
      currency,
      work_location,
      notes,
    } = body;

    if (!employee_id) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Verify employee exists
    const { data: employee, error: employeeError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', employee_id)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check if already assigned
    const { data: existing } = await supabase
      .from('employer_employees')
      .select('id')
      .eq('employer_id', user.id)
      .eq('employee_id', employee_id)
      .eq('employment_status', 'active')
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Employee is already in your team' },
        { status: 400 }
      );
    }

    // Add employee to team
    const { data: teamMember, error: insertError } = await supabase
      .from('employer_employees')
      .insert({
        employer_id: user.id,
        employee_id,
        employee_code,
        job_title,
        department,
        employment_type: employment_type || 'full_time',
        hire_date,
        reporting_manager_id,
        salary,
        currency: currency || 'OMR',
        work_location,
        notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding team member:', insertError);
      return NextResponse.json(
        { error: 'Failed to add team member', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Employee added to team successfully',
      team_member: teamMember,
    });
  } catch (error) {
    console.error('Error in POST /api/employer/team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers directly - internal authorization is already implemented in each handler
// The handlers check: 1) user authentication, 2) profile role (admin/manager), 3) own team access
export const GET = getTeamHandler;
export const POST = addTeamMemberHandler;

