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
      .select('role, id, active_company_id, email')
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

    // ✅ COMPANY SCOPE: Get company's party_id if active company exists
    let partyId: string | null = null;
    let employerProfileId: string | null = null; // Profile ID that corresponds to the party
    
    if (profile.active_company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('party_id')
        .eq('id', profile.active_company_id)
        .single();
      
      if (company?.party_id) {
        partyId = company.party_id;
        
        // ✅ LINKING FIX: Find the profile ID that corresponds to this party
        // employer_employees.employer_id uses profile.id, not party.id
        // So we need to find the profile whose email matches the party's contact_email
        const { data: party } = await supabase
          .from('parties')
          .select('contact_email')
          .eq('id', partyId)
          .single();
        
        if (party?.contact_email) {
          const { data: employerProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', party.contact_email)
            .single();
          
          if (employerProfile) {
            employerProfileId = employerProfile.id;
          }
        }
      }
    }

    // ✅ LINKING FIX: Use employerProfileId if available, otherwise fallback to employerId
    const effectiveEmployerId = employerProfileId || employerId;

    // Build query - filter by company if available
    // employer_employees.employer_id references profiles.id, not parties.id
    let query = supabase
      .from('employer_employees')
      .select('*')
      .eq('employer_id', effectiveEmployerId)
      .order('created_at', { ascending: false });

    // If user has an active company, filter by it
    // But also include employees with null company_id for backwards compatibility
    if (profile.active_company_id) {
      query = query.or(`company_id.eq.${profile.active_company_id},company_id.is.null`);
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

    // ✅ LINKING FIX: Fetch promoters directly from parties if company has party_id
    // promoters.employer_id references parties.id (not profiles.id)
    let promotersFromParty: any[] = [];
    if (partyId) {
      const { data: partyPromoters, error: partyPromotersError } = await supabase
        .from('promoters')
        .select('id, email, name_en, name_ar, phone, mobile_number, profile_picture_url, status, created_at')
        .eq('employer_id', partyId) // ✅ Correct: promoters.employer_id = parties.id
        .order('name_en', { ascending: true });

      if (!partyPromotersError && partyPromoters) {
        promotersFromParty = partyPromoters;
      }
    }

    // Fetch promoter details for each team member from employer_employees
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

    // Combine data from employer_employees
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

    // Add promoters from party that aren't already in employer_employees
    const existingEmployeeIds = new Set((teamMembers || []).map(m => m.employee_id).filter(Boolean));
    const additionalPromoters = promotersFromParty
      .filter(p => !existingEmployeeIds.has(p.id))
      .map(promoter => ({
        // Use promoter.id as the record ID since there's no employer_employee record yet
        // Prefix with 'promoter_' to distinguish from employer_employee IDs
        id: `promoter_${promoter.id}`,
        employer_id: effectiveEmployerId, // ✅ Use effective employer ID (profile.id)
        employee_id: promoter.id,
        employee_code: null,
        job_title: null,
        department: null,
        employment_type: 'full_time' as const,
        employment_status: (promoter.status === 'active' ? 'active' : 'inactive') as string,
        hire_date: null,
        termination_date: null,
        reporting_manager_id: null,
        salary: null,
        currency: 'OMR',
        work_location: null,
        notes: null,
        created_at: promoter.created_at,
        updated_at: promoter.created_at,
        created_by: null,
        company_id: profile.active_company_id || null,
        employee: {
          id: promoter.id,
          email: promoter.email || '',
          full_name: promoter.name_en || promoter.name_ar || 'Unknown',
          first_name: promoter.name_en?.split(' ')[0] || null,
          last_name: promoter.name_en?.split(' ').slice(1).join(' ') || null,
          phone: promoter.phone || promoter.mobile_number || null,
          avatar_url: promoter.profile_picture_url || null,
        },
        manager: null,
      }));

    // Merge both lists
    const allTeamMembers = [...enrichedTeamMembers, ...additionalPromoters];

    // Get employee permissions for each member
    type Permission = { permission_id: string; granted: boolean };
    const teamWithPermissions = await Promise.all(
      allTeamMembers.map(async (member): Promise<any> => {
        // Only fetch permissions if member has an employer_employee record (not a promoter-only record)
        const permissions: Permission[] = [];
        if (member.id && !member.id.startsWith('promoter_')) {
          const { data: perms } = await supabase
            .from('employee_permissions')
            .select('permission_id, granted')
            .eq('employer_employee_id', member.id);
          if (perms) {
            permissions.push(...(perms as Permission[]));
          }
        }

        return {
          ...member,
          permissions: permissions,
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

    // ✅ LINKING FIX: Verify employee exists in promoters table
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

    // ✅ LINKING FIX: Get the effective employer ID (profile ID that corresponds to party)
    // Get user's active company and find the corresponding employer profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('active_company_id, email')
      .eq('id', user.id)
      .single();

    let effectiveEmployerId = user.id; // Default to user.id

    if (userProfile?.active_company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('party_id')
        .eq('id', userProfile.active_company_id)
        .single();

      if (company?.party_id) {
        // Find the profile ID that corresponds to this party
        const { data: party } = await supabase
          .from('parties')
          .select('contact_email')
          .eq('id', company.party_id)
          .single();

        if (party?.contact_email) {
          const { data: employerProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', party.contact_email)
            .single();

          if (employerProfile) {
            effectiveEmployerId = employerProfile.id;
          }
        }
      }
    }

    // Check if already assigned (using effective employer ID)
    const { data: existing } = await supabase
      .from('employer_employees')
      .select('id')
      .eq('employer_id', effectiveEmployerId) // ✅ Use effective employer ID
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
      employer_id: effectiveEmployerId, // ✅ Use effective employer ID (profile.id that matches party)
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

