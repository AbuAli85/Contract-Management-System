import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { withRBAC } from '@/lib/rbac/guard';

export const dynamic = 'force-dynamic';

// GET - List all employee groups
export const GET = withRBAC('attendance:read:all', async (
  request: NextRequest
) => {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json(
        { error: 'No active company found' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';
    const groupType = searchParams.get('type'); // location, department, custom, project

    let query = (supabaseAdmin.from('employee_attendance_groups') as any)
      .select(`
        *,
        office_location:office_location_id (
          id,
          name,
          address,
          latitude,
          longitude
        )
      `)
      .eq('company_id', profile.active_company_id)
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (groupType) {
      query = query.eq('group_type', groupType);
    }

    const { data: groups, error } = await query;

    if (error) {
      console.error('Error fetching employee groups:', error);
      return NextResponse.json(
        { error: 'Failed to fetch employee groups', details: error.message },
        { status: 500 }
      );
    }

    // Fetch employee assignments separately to avoid complex nested joins
    const groupIds = (groups || []).map((g: any) => g.id);
    let employeeAssignments: any[] = [];
    
    if (groupIds.length > 0) {
      const { data: assignments, error: assignError } = await (supabaseAdmin.from('employee_group_assignments') as any)
        .select(`
          id,
          group_id,
          employer_employee_id,
          employer_employee:employer_employee_id (
            id,
            employee_code,
            job_title,
            department,
            employee_id
          )
        `)
        .in('group_id', groupIds);

      if (!assignError && assignments) {
        // Fetch profile data for employees
        const employeeIds = [...new Set(assignments.map((a: any) => a.employer_employee?.employee_id).filter(Boolean))];
        
        if (employeeIds.length > 0) {
          const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, email, phone')
            .in('id', employeeIds);

          // Map profiles to assignments
          const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
          
          assignments.forEach((assignment: any) => {
            if (assignment.employer_employee?.employee_id) {
              assignment.employer_employee.employee = profileMap.get(assignment.employer_employee.employee_id);
            }
          });
        }
        
        employeeAssignments = assignments;
      }
    }

    // Format the response
    const formattedGroups = (groups || []).map((group: any) => {
      const groupEmployees = employeeAssignments.filter((a: any) => a.group_id === group.id);
      return {
        ...group,
        employees: groupEmployees,
        employee_count: groupEmployees.length,
      };
    });

    return NextResponse.json({
      success: true,
      groups: formattedGroups,
      count: formattedGroups.length,
    });
  } catch (error) {
    console.error('Error in GET /api/employer/attendance-groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST - Create a new employee group
export const POST = withRBAC('attendance:create:all', async (
  request: NextRequest
) => {
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
      name,
      description,
      group_type = 'location',
      office_location_id,
      department_name,
      project_name,
      default_check_in_time,
      default_check_out_time,
      employee_ids = [], // Array of employer_employee IDs
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json(
        { error: 'No active company found' },
        { status: 400 }
      );
    }

    // Create the group
    const { data: group, error: createError } = await (supabaseAdmin.from('employee_attendance_groups') as any)
      .insert({
        company_id: profile.active_company_id,
        created_by: user.id,
        name,
        description,
        group_type,
        office_location_id: office_location_id || null,
        department_name: department_name || null,
        project_name: project_name || null,
        default_check_in_time: default_check_in_time || null,
        default_check_out_time: default_check_out_time || null,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating employee group:', createError);
      return NextResponse.json(
        { error: 'Failed to create employee group', details: createError.message },
        { status: 500 }
      );
    }

    // Assign employees to the group
    if (employee_ids.length > 0) {
      const assignments = employee_ids.map((employeeId: string) => ({
        group_id: group.id,
        employer_employee_id: employeeId,
        assigned_by: user.id,
        is_primary: true,
      }));

      const { error: assignError } = await (supabaseAdmin.from('employee_group_assignments') as any)
        .insert(assignments);

      if (assignError) {
        console.error('Error assigning employees to group:', assignError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      group,
    });
  } catch (error) {
    console.error('Error in POST /api/employer/attendance-groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

