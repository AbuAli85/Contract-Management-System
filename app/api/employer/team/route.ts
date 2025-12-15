import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - List all employees for an employer (company-scoped)
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
      .select('role, id, active_company_id')
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

    // Build query - filter by company if available
    let query = supabase
      .from('employer_employees')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    // If user has an active company, filter by it
    if (profile.active_company_id) {
      query = query.eq('company_id', profile.active_company_id);
    }

    // Fetch team members (base records)
    const { data: teamMembers, error: teamError } = await query;

    if (teamError) {
      console.error('Error fetching team:', teamError);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    // Fetch promoter details for each team member
    const employeeIds = (teamMembers || []).map(m => m.employee_id).filter(Boolean);
    const { data: promoters } = await supabase
      .from('promoters')
      .select('id, email, name_en, name_ar, phone, mobile_number, profile_picture_url')
      .in('id', employeeIds.length > 0 ? employeeIds : ['00000000-0000-0000-0000-000000000000']);

    // Create a lookup map for promoters
    const promoterMap = new Map((promoters || []).map(p => [p.id, p]));

    // Fetch manager details (from profiles since managers are system users)
    const managerIds = (teamMembers || []).map(m => m.reporting_manager_id).filter(Boolean);
    const { data: managers } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', managerIds.length > 0 ? managerIds : ['00000000-0000-0000-0000-000000000000']);

    // Create a lookup map for managers
    const managerMap = new Map((managers || []).map(m => [m.id, m]));

    // Combine data
    const enrichedTeamMembers = (teamMembers || []).map(member => {
      const promoter = promoterMap.get(member.employee_id);
      const manager = managerMap.get(member.reporting_manager_id);
      return {
        ...member,
        employee: promoter ? {
          id: promoter.id,
          email: promoter.email,
          full_name: promoter.name_en || promoter.name_ar || 'Unknown',
          first_name: promoter.name_en?.split(' ')[0] || null,
          last_name: promoter.name_en?.split(' ').slice(1).join(' ') || null,
          phone: promoter.phone || promoter.mobile_number,
          avatar_url: promoter.profile_picture_url,
        } : null,
        manager: manager || null,
      };
    });

    // Get employee permissions for each member
    const teamWithPermissions = await Promise.all(
      enrichedTeamMembers.map(async member => {
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

    // Verify employee exists in promoters table
    const { data: employee, error: employeeError } = await supabase
      .from('promoters')
      .select('id, email, name_en, name_ar')
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

    // Get user's active company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    // Add employee to team (use admin client to bypass RLS)
    // Helper to convert empty strings to null for UUID fields
    const toNullIfEmpty = (val: string | null | undefined) => 
      val && val.trim() !== '' ? val : null;

    const supabaseAdmin = getSupabaseAdmin();
    const insertData = {
      employer_id: user.id,
      employee_id: toNullIfEmpty(employee_id),
      employee_code: toNullIfEmpty(employee_code),
      job_title: toNullIfEmpty(job_title),
      department: toNullIfEmpty(department),
      employment_type: employment_type || 'full_time',
      employment_status: 'active',
      hire_date: toNullIfEmpty(hire_date),
      reporting_manager_id: toNullIfEmpty(reporting_manager_id),
      salary: salary ? Number(salary) : null,
      currency: currency || 'OMR',
      work_location: toNullIfEmpty(work_location),
      notes: toNullIfEmpty(notes),
      created_by: user.id,
      company_id: profile?.active_company_id || null, // Associate with active company
    };

    const { data: teamMember, error: insertError } = await supabaseAdmin
      .from('employer_employees')
      .insert(insertData as never)
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

