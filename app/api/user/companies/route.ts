import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Helper function to check if a company is invalid/mock
function isInvalidCompany(companyName: string): boolean {
  const name = companyName.toLowerCase().trim();
  
  // Explicitly allow valid Falcon Eye companies
  if (name.includes('falcon eye modern investments')) {
    return false;
  }
  
  // Filter out invalid/mock companies
  return (
    name === 'digital morph' ||
    name === 'falcon eye group' ||
    name === 'cc' ||
    name === 'digital marketing pro' ||
    name.includes('digital morph') ||
    (name.includes('falcon eye group') && !name.includes('modern investments'))
  );
}

// GET: Fetch user's companies
export async function GET() {
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

    let allCompanies: any[] = [];

    // First try: Get companies via company_members using admin client
    const { data: membershipCompanies, error: membershipError } = await adminClient
      .from('company_members')
      .select(`
        company_id,
        role,
        is_primary,
        company:companies (
          id,
          name,
          logo_url,
          group_id
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('is_primary', { ascending: false });

    if (!membershipError && membershipCompanies) {
      allCompanies = membershipCompanies
        .filter((cm: any) => cm.company?.id && cm.company?.name) // Ensure company exists
        .map((cm: any) => ({
          company_id: cm.company.id,
          company_name: cm.company.name,
          company_logo: cm.company.logo_url,
          user_role: cm.role,
          is_primary: cm.is_primary,
          group_name: null, // Will fetch group names separately if needed
          source: 'company_members',
        }))
        // Filter out invalid/mock companies
        .filter((c: any) => !isInvalidCompany(c.company_name || ''));
    }

    // Second try: Also check if user owns any companies directly (in case company_members is missing)
    const { data: ownedCompanies, error: ownedError } = await adminClient
      .from('companies')
      .select('id, name, logo_url, group_id, party_id')
      .eq('owner_id', user.id)
      .eq('is_active', true);

    if (!ownedError && ownedCompanies) {
      // Add owned companies that aren't already in the list
      const existingIds = new Set(allCompanies.map(c => c.company_id));
      for (const company of ownedCompanies) {
        if (!existingIds.has(company.id) && !isInvalidCompany(company.name || '') && company.id && company.name) {
          allCompanies.push({
            company_id: company.id,
            company_name: company.name,
            company_logo: company.logo_url,
            user_role: 'owner',
            is_primary: allCompanies.length === 0,
            group_name: null,
            party_id: company.party_id,
            source: 'owned_companies',
          });
        }
      }
    }

    // Third try: Get companies linked to parties where user's email matches party contact_email
    // This helps include parties that are linked to companies via party_id
    if (user.email) {
      try {
        const { data: partyLinkedCompanies, error: partyError } = await adminClient
          .from('companies')
          .select(`
            id,
            name,
            logo_url,
            group_id,
            party_id,
            party:parties!companies_party_id_fkey (
              id,
              name_en,
              contact_email,
              role
            )
          `)
          .not('party_id', 'is', null)
          .eq('is_active', true);

        if (!partyError && partyLinkedCompanies) {
          const existingIds = new Set(allCompanies.map(c => c.company_id));
          for (const company of partyLinkedCompanies) {
            const party = company.party as any;
            // Check if user's email matches party contact_email
            if (party?.contact_email && 
                party.contact_email.toLowerCase() === user.email.toLowerCase() &&
                !existingIds.has(company.id)) {
              
              // Filter out invalid/mock companies
              if (isInvalidCompany((company.name || party?.name_en) || '')) continue;
              
              // Determine role from party role
              let userRole = 'member';
              if (party.role && ['ceo', 'chairman', 'owner'].includes(party.role.toLowerCase())) {
                userRole = 'owner';
              } else if (party.role && ['admin', 'manager'].includes(party.role.toLowerCase())) {
                userRole = 'admin';
              }

              allCompanies.push({
                company_id: company.id,
                company_name: company.name || party?.name_en,
                company_logo: company.logo_url,
                user_role: userRole,
                is_primary: allCompanies.length === 0,
                group_name: null,
                party_id: company.party_id,
                source: 'party_linked',
              });
            }
          }
        }
      } catch (e) {
        console.warn('Error fetching party-linked companies:', e);
      }
    }

    // Fourth try: Get companies via employer_employees (if user is an employer)
    // Find companies where user is listed as employer
    try {
      const { data: employerProfile } = await adminClient
        .from('profiles')
        .select('id, email')
        .eq('id', user.id)
        .single();

      if (employerProfile?.email) {
        // Find parties where user's email matches contact_email
        const { data: employerParties, error: partiesError } = await adminClient
          .from('parties')
          .select('id, name_en, contact_email, type')
          .eq('contact_email', employerProfile.email)
          .eq('type', 'Employer')
          .eq('status', 'Active');

        if (!partiesError && employerParties && employerParties.length > 0) {
          const partyIds = employerParties.map((p: any) => p.id);
          
          // Find companies linked to these parties
          const { data: employerCompanies, error: employerCompaniesError } = await adminClient
            .from('companies')
            .select('id, name, logo_url, group_id, party_id')
            .in('party_id', partyIds)
            .eq('is_active', true);

          if (!employerCompaniesError && employerCompanies) {
            const existingIds = new Set(allCompanies.map(c => c.company_id));
            for (const company of employerCompanies) {
              if (!existingIds.has(company.id)) {
                // Filter out invalid/mock companies
                if (isInvalidCompany(company.name || '')) continue;

                allCompanies.push({
                  company_id: company.id,
                  company_name: company.name,
                  company_logo: company.logo_url,
                  user_role: 'owner', // User is the employer, so they're owner
                  is_primary: allCompanies.length === 0,
                  group_name: null,
                  party_id: company.party_id,
                  source: 'employer_party',
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching employer-linked companies:', e);
    }

    // Fifth try: Get companies from parties table where type = 'Employer'
    // This is the primary source for employer companies
    if (user.email) {
      try {
        // Get user profile for additional matching
        const { data: userProfile } = await adminClient
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', user.id)
          .single();

        // Find all parties with type 'Employer' where user is associated
        // Match by: contact_email, contact_person, or any other relationship
        const { data: employerParties, error: employerPartiesError } = await adminClient
          .from('parties')
          .select('id, name_en, name_ar, contact_email, contact_person, type, overall_status, logo_url, crn, role')
          .eq('type', 'Employer')
          .in('overall_status', ['Active', 'active'])
          .or(`contact_email.eq.${user.email},contact_email.eq.${userProfile?.email || ''},contact_person.ilike.%${userProfile?.full_name || ''}%`);

        if (!employerPartiesError && employerParties && employerParties.length > 0) {
          const partyIds = employerParties.map((p: any) => p.id);
          
          // Find companies linked to these parties
          const { data: profileLinkedCompanies, error: profileLinkedError } = await adminClient
            .from('companies')
            .select('id, name, logo_url, group_id, party_id')
            .in('party_id', partyIds)
            .eq('is_active', true);

          if (!profileLinkedError && profileLinkedCompanies) {
            const existingIds = new Set(allCompanies.map(c => c.company_id));
            for (const company of profileLinkedCompanies) {
              if (!existingIds.has(company.id)) {
                // Filter out invalid/mock companies
                if (isInvalidCompany(company.name || '')) continue;

                // Find matching party to determine role
                const matchingParty = employerParties.find((p: any) => p.id === company.party_id);
                let userRole = 'owner'; // Default to owner for employer parties
                if (matchingParty?.role) {
                  const role = matchingParty.role.toLowerCase();
                  if (['ceo', 'chairman', 'owner'].includes(role)) {
                    userRole = 'owner';
                  } else if (['admin', 'manager'].includes(role)) {
                    userRole = 'admin';
                  }
                }

                allCompanies.push({
                  company_id: company.id,
                  company_name: company.name,
                  company_logo: company.logo_url,
                  user_role: userRole,
                  is_primary: allCompanies.length === 0,
                  group_name: null,
                  party_id: company.party_id,
                  source: 'profile_party_match',
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn('Error fetching profile-party matched companies:', e);
      }
    }

    // Sixth try: Directly fetch companies from parties table where type = 'Employer'
    // This ensures all employer parties are available in the company switcher
    if (user.email) {
      try {
        // Get user profile for matching
        const { data: userProfile } = await adminClient
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', user.id)
          .single();

        // Find all active employer parties
        // Match by contact_email, or if user is associated with the party
        const { data: allEmployerParties, error: employerPartiesError } = await adminClient
          .from('parties')
          .select('id, name_en, name_ar, contact_email, contact_person, type, overall_status, logo_url, crn, role')
          .eq('type', 'Employer')
          .in('overall_status', ['Active', 'active']);

        if (!employerPartiesError && allEmployerParties && allEmployerParties.length > 0) {
          const existingIds = new Set(allCompanies.map(c => c.company_id));
          
          for (const party of allEmployerParties) {
            // Skip if already in companies list
            if (existingIds.has(party.id)) continue;
            
            // Filter out invalid/mock companies
            if (isInvalidCompany(party.name_en || '')) continue;

            // Check if there's a company linked to this party that user has access to
            const { data: linkedCompany } = await adminClient
              .from('companies')
              .select('id, name, logo_url, owner_id')
              .eq('party_id', party.id)
              .eq('is_active', true)
              .single();

            // Check if user is associated with this party
            // Match by: contact_email, contact_person name, owns linked company, or is member of linked company
            let isAssociated = false;
            let userRole = 'owner'; // Default to owner for employer parties

            if (linkedCompany) {
              // Check if user owns the linked company
              if (linkedCompany.owner_id === user.id) {
                isAssociated = true;
                userRole = 'owner';
              } else {
                // Check if user is a member of the linked company
                const { data: membership } = await adminClient
                  .from('company_members')
                  .select('role')
                  .eq('company_id', linkedCompany.id)
                  .eq('user_id', user.id)
                  .eq('status', 'active')
                  .single();
                
                if (membership) {
                  isAssociated = true;
                  userRole = membership.role || 'member';
                }
              }
            }

            // Also check direct party association
            if (!isAssociated) {
              isAssociated = 
                (party.contact_email && (
                  party.contact_email.toLowerCase() === user.email?.toLowerCase() ||
                  (userProfile?.email && party.contact_email.toLowerCase() === userProfile.email.toLowerCase())
                )) ||
                (party.contact_person && userProfile?.full_name && 
                  party.contact_person.toLowerCase().includes(userProfile.full_name.toLowerCase()));
              
              // Determine user role from party role
              if (isAssociated && party.role) {
                const role = party.role.toLowerCase();
                if (['ceo', 'chairman', 'owner'].includes(role)) {
                  userRole = 'owner';
                } else if (['admin', 'manager'].includes(role)) {
                  userRole = 'admin';
                } else {
                  userRole = 'member';
                }
              }
            }

            // If user is associated, add the party as a company
            if (isAssociated) {

              // Use linked company if exists, otherwise use party data
              if (linkedCompany && !existingIds.has(linkedCompany.id)) {
                allCompanies.push({
                  company_id: linkedCompany.id,
                  company_name: linkedCompany.name || party.name_en,
                  company_logo: linkedCompany.logo_url || party.logo_url,
                  user_role: userRole,
                  is_primary: allCompanies.length === 0,
                  group_name: null,
                  party_id: party.id,
                  source: 'parties_employer_linked',
                });
              } else {
                // Add party directly as a company (even if no company record exists)
                allCompanies.push({
                  company_id: party.id, // Use party ID as company ID
                  company_name: party.name_en || party.name_ar || 'Unknown Company',
                  company_logo: party.logo_url,
                  user_role: userRole,
                  is_primary: allCompanies.length === 0,
                  group_name: null,
                  party_id: party.id,
                  source: 'parties_employer_direct',
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn('Error fetching employer parties:', e);
      }
    }

    // Get active company from profile using admin client
    const { data: profile } = await adminClient
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    // Determine active_company_id
    let activeCompanyId = profile?.active_company_id;
    
    // If no active company set but user has companies, set the first one
    if (!activeCompanyId && allCompanies.length > 0) {
      activeCompanyId = allCompanies[0].company_id;
      
      // Update profile with active company using admin client
      await adminClient
        .from('profiles')
        .update({ active_company_id: activeCompanyId })
        .eq('id', user.id);
    }

    // Remove any duplicates and ensure all companies have valid data
    const uniqueCompanies = Array.from(
      new Map(allCompanies.map(c => [c.company_id, c])).values()
    ).filter(c => c.company_id && c.company_name); // Ensure company has ID and name

    // Fetch group names for all companies
    // Companies can be linked to groups via:
    // 1. companies.group_id (direct reference to holding_groups)
    // 2. holding_group_members table (many-to-many relationship)
    try {
      // First, get all company IDs
      const companyIds = uniqueCompanies.map(c => c.company_id);
      
      // Fetch companies with their group_id
      const { data: companiesWithGroups } = await adminClient
        .from('companies')
        .select('id, group_id')
        .in('id', companyIds);
      
      // Get all unique group_ids (both from companies.group_id and holding_group_members)
      const groupIdsFromCompanies = new Set(
        (companiesWithGroups || [])
          .map((c: any) => c.group_id)
          .filter(Boolean)
      );
      
      // Also check holding_group_members table
      const { data: groupMembers } = await adminClient
        .from('holding_group_members')
        .select('company_id, holding_group_id')
        .in('company_id', companyIds)
        .eq('member_type', 'company');
      
      const groupIdsFromMembers = new Set(
        (groupMembers || []).map((gm: any) => gm.holding_group_id).filter(Boolean)
      );
      
      // Combine all group IDs
      const allGroupIds = Array.from(new Set([...groupIdsFromCompanies, ...groupIdsFromMembers]));
      
      // Fetch all group names
      const groupNameMap = new Map<string, string>();
      if (allGroupIds.length > 0) {
        const { data: groups } = await adminClient
          .from('holding_groups')
          .select('id, name_en, name_ar')
          .in('id', allGroupIds)
          .eq('is_active', true);
        
        if (groups) {
          for (const group of groups) {
            groupNameMap.set(group.id, group.name_en || group.name_ar || 'Unknown Group');
          }
        }
      }
      
      // Create a map of company_id -> group_id (from both sources)
      const companyGroupMap = new Map<string, string>();
      
      // From companies.group_id
      if (companiesWithGroups) {
        for (const company of companiesWithGroups) {
          if (company.group_id) {
            companyGroupMap.set(company.id, company.group_id);
          }
        }
      }
      
      // From holding_group_members
      if (groupMembers) {
        for (const member of groupMembers) {
          if (member.holding_group_id) {
            companyGroupMap.set(member.company_id, member.holding_group_id);
          }
        }
      }
      
      // Update companies with group names
      for (const company of uniqueCompanies) {
        const groupId = companyGroupMap.get(company.company_id);
        if (groupId) {
          const groupName = groupNameMap.get(groupId);
          if (groupName) {
            company.group_name = groupName;
          }
        }
      }
    } catch (groupError) {
      console.warn('Error fetching group names:', groupError);
      // Continue without group names if there's an error
    }

    // Enrich companies with feature statistics
    const enrichedCompanies = await Promise.all(
      uniqueCompanies.map(async (company) => {
        try {
          const today = new Date().toISOString().split('T')[0];
          
          // Count employees
          let employeesCount = 0;
          try {
            const { count } = await adminClient
              .from('employer_employees')
              .select('id', { count: 'exact', head: true })
              .eq('company_id', company.company_id)
              .eq('employment_status', 'active');
            employeesCount = count || 0;
          } catch (e) {
            // Ignore errors
          }

          // Count attendance records (today)
          let attendanceCount = 0;
          try {
            const { data: employees } = await adminClient
              .from('employer_employees')
              .select('id')
              .eq('company_id', company.company_id)
              .eq('employment_status', 'active');
            
            if (employees && employees.length > 0) {
              const employeeIds = employees.map((e: any) => e.id);
              const { count } = await adminClient
                .from('employee_attendance')
                .select('id', { count: 'exact', head: true })
                .in('employer_employee_id', employeeIds)
                .eq('attendance_date', today);
              attendanceCount = count || 0;
            }
          } catch (e) {
            // Ignore errors
          }

          // Count active tasks
          let tasksCount = 0;
          try {
            const { data: employees } = await adminClient
              .from('employer_employees')
              .select('id')
              .eq('company_id', company.company_id)
              .eq('employment_status', 'active');
            
            if (employees && employees.length > 0) {
              const employeeIds = employees.map((e: any) => e.id);
              const { count } = await adminClient
                .from('employee_tasks')
                .select('id', { count: 'exact', head: true })
                .in('employer_employee_id', employeeIds)
                .in('status', ['pending', 'in_progress']);
              tasksCount = count || 0;
            }
          } catch (e) {
            // Ignore errors
          }

          // Count contracts (if party_id exists)
          let contractsCount = 0;
          if (company.party_id) {
            try {
              const { count } = await adminClient
                .from('contracts')
                .select('id', { count: 'exact', head: true })
                .or(`second_party_id.eq.${company.party_id},first_party_id.eq.${company.party_id}`);
              contractsCount = count || 0;
            } catch (e) {
              // Ignore errors
            }
          }

          return {
            ...company,
            stats: {
              employees: employeesCount,
              attendance_today: attendanceCount,
              active_tasks: tasksCount,
              contracts: contractsCount,
            },
            features: {
              team_management: employeesCount > 0,
              attendance: true, // Always available
              tasks: tasksCount > 0 || employeesCount > 0,
              targets: employeesCount > 0,
              reports: true, // Always available
              contracts: contractsCount > 0 || company.party_id !== null,
              analytics: employeesCount > 0,
            },
          };
        } catch (error) {
          // Return company without stats if enrichment fails
          return {
            ...company,
            stats: {
              employees: 0,
              attendance_today: 0,
              active_tasks: 0,
              contracts: 0,
            },
            features: {
              team_management: false,
              attendance: true,
              tasks: false,
              targets: false,
              reports: true,
              contracts: company.party_id !== null,
              analytics: false,
            },
          };
        }
      })
    );

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Companies API] Found ${enrichedCompanies.length} companies for user ${user.id}:`, {
        sources: enrichedCompanies.map(c => ({ 
          name: c.company_name, 
          source: c.source || 'unknown',
          employees: c.stats?.employees || 0,
        })),
        total_before_dedup: allCompanies.length,
        total_after_dedup: enrichedCompanies.length,
      });
    }

    return NextResponse.json({
      success: true,
      companies: enrichedCompanies,
      active_company_id: activeCompanyId,
    });
  } catch (error: any) {
    console.error('Error in companies endpoint:', error);
    // Return empty state instead of error
    return NextResponse.json({
      success: true,
      companies: [],
      active_company_id: null,
      message: 'An error occurred loading companies',
    });
  }
}

// POST: Create a new company
export async function POST(request: Request) {
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

    const body = await request.json();
    const { name, description, logo_url, business_type, group_id } = body;

    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Create slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Create the company using admin client
    const { data: company, error: createError } = await adminClient
      .from('companies')
      .insert({
        name,
        slug,
        description,
        logo_url,
        business_type,
        group_id,
        owner_id: user.id,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating company:', createError);
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }

    // The trigger will auto-create company_members entry
    // But let's ensure it happened using admin client
    const { data: membership } = await adminClient
      .from('company_members')
      .select('id')
      .eq('company_id', company.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      // Create membership manually if trigger didn't fire
      await adminClient
        .from('company_members')
        .insert({
          company_id: company.id,
          user_id: user.id,
          role: 'owner',
          is_primary: true,
          status: 'active',
        });
    }

    return NextResponse.json({
      success: true,
      company,
      message: 'Company created successfully',
    });
  } catch (error: any) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

