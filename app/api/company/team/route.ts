import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Fetch team members (employees/promoters/candidates) for the active company
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (e) {
      console.warn('Admin client not available, using regular client');
      adminClient = supabase;
    }

    // Get user's active company
    const { data: profile } = await adminClient
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json({
        success: true,
        team: [],
        message: 'No active company selected',
      });
    }

    // Get company details including party_id
    const { data: company } = await adminClient
      .from('companies')
      .select('id, party_id, name')
      .eq('id', profile.active_company_id)
      .single();

    if (!company) {
      return NextResponse.json({
        success: true,
        team: [],
        message: 'Company not found',
      });
    }

    // If company has a party_id, fetch promoters/employees from parties
    let teamMembers: any[] = [];

    if (company.party_id) {
      // Fetch promoters where employer_id matches the party_id
      const { data: promoters, error: promotersError } = await adminClient
        .from('promoters')
        .select(`
          id,
          name_en,
          name_ar,
          email,
          phone,
          mobile_number,
          status,
          profile_picture_url,
          employer_id,
          created_at
        `)
        .eq('employer_id', company.party_id)
        .order('name_en', { ascending: true });

      if (promotersError) {
        console.error('Error fetching promoters:', promotersError);
      } else if (promoters) {
        // Transform promoters to team member format
        teamMembers = promoters.map((promoter: any) => ({
          id: promoter.id,
          name: promoter.name_en || promoter.name_ar || 'Unknown',
          name_en: promoter.name_en,
          name_ar: promoter.name_ar,
          email: promoter.email,
          phone: promoter.phone || promoter.mobile_number,
          status: promoter.status || 'active',
          avatar_url: promoter.profile_picture_url,
          type: 'promoter', // or 'employee'
          role: null, // Promoters don't have roles in company_members
          created_at: promoter.created_at,
        }));
      }

      // Also fetch from employer_employees if they exist (for backward compatibility)
      // This links profiles to employers, but we need to check if employer_id matches party
      // First, get the profile ID that corresponds to this party
      const { data: employerProfile } = await adminClient
        .from('parties')
        .select('contact_email')
        .eq('id', company.party_id)
        .single();

      if (employerProfile?.contact_email) {
        // Find the profile ID for this employer
        const { data: employerUser } = await adminClient
          .from('profiles')
          .select('id')
          .eq('email', employerProfile.contact_email)
          .single();

        if (employerUser) {
          // Fetch employer_employees records
          const { data: employerEmployees, error: employeesError } = await adminClient
            .from('employer_employees')
            .select(`
              id,
              employee_id,
              job_title,
              department,
              employment_status,
              hire_date,
              reporting_manager_id
            `)
            .eq('employer_id', employerUser.id)
            .eq('employment_status', 'active');

          if (!employeesError && employerEmployees) {
            // Get employee profiles
            const employeeIds = employerEmployees.map((ee: any) => ee.employee_id).filter(Boolean);
            if (employeeIds.length > 0) {
              const { data: employeeProfiles } = await adminClient
                .from('profiles')
                .select('id, full_name, email')
                .in('id', employeeIds);

              // Merge with existing team members (avoid duplicates)
              const existingIds = new Set(teamMembers.map((tm: any) => tm.id));
              
              employerEmployees.forEach((ee: any) => {
                const profile = employeeProfiles?.find((p: any) => p.id === ee.employee_id);
                if (profile && !existingIds.has(profile.id)) {
                  teamMembers.push({
                    id: profile.id,
                    name: profile.full_name || 'Unknown',
                    name_en: profile.full_name,
                    name_ar: null,
                    email: profile.email,
                    phone: null,
                    status: ee.employment_status || 'active',
                    avatar_url: null,
                    type: 'employee',
                    role: null,
                    job_title: ee.job_title,
                    department: ee.department,
                    hire_date: ee.hire_date,
                    created_at: ee.created_at,
                  });
                }
              });
            }
          }
        }
      }
    }

    // Also check company_members for additional team members (users with company access)
    const { data: companyMembers, error: membersError } = await adminClient
      .from('company_members')
      .select(`
        user_id,
        role,
        status,
        profiles:user_id (
          id,
          full_name,
          email
        )
      `)
      .eq('company_id', company.id)
      .eq('status', 'active');

    if (!membersError && companyMembers) {
      // Add company members who aren't already in the team list
      const existingIds = new Set(teamMembers.map((tm: any) => tm.id));
      
      companyMembers.forEach((cm: any) => {
        const profile = cm.profiles;
        if (profile && !existingIds.has(profile.id)) {
          teamMembers.push({
            id: profile.id,
            name: profile.full_name || 'Unknown',
            name_en: profile.full_name,
            name_ar: null,
            email: profile.email,
            phone: null,
            status: cm.status || 'active',
            avatar_url: null,
            type: 'member',
            role: cm.role,
            created_at: null,
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      team: teamMembers,
      count: teamMembers.length,
    });
  } catch (error: any) {
    console.error('Error fetching company team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members', details: error.message },
      { status: 500 }
    );
  }
}

