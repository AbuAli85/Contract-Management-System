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

interface CompanyMembership {
  company_id: string;
  role: string;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    is_active: boolean;
    group: {
      id: string;
      name: string;
    } | null;
  } | null;
}

interface CompanyStats {
  employees: number;
  pending_leaves: number;
  pending_expenses: number;
  active_contracts: number;
  checked_in_today: number;
  open_tasks: number;
  pending_reviews: number;
}

interface CompanyWithStats {
  id: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
  group_name: string | null;
  user_role: string;
  stats: CompanyStats;
}

interface Summary {
  total_companies: number;
  total_employees: number;
  total_pending_leaves: number;
  total_pending_expenses: number;
  total_contracts: number;
  total_open_tasks: number;
  total_checked_in: number;
}

// GET: Fetch cross-company analytics for all companies user has access to
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

    // ✅ FIX: Use comprehensive company fetching logic (same as /api/user/companies)
    // This ensures we get ALL companies the user has access to, not just from company_members
    let allCompanies: any[] = [];

    // First: Get companies via company_members
    try {
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
            group_id,
            party_id
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('is_primary', { ascending: false });

      if (!membershipError && membershipCompanies) {
        allCompanies = membershipCompanies
          .filter((cm: any) => cm.company?.id && cm.company?.name)
          .map((cm: any) => ({
            company_id: cm.company.id,
            company_name: cm.company.name,
            company_logo: cm.company.logo_url,
            user_role: cm.role,
            is_primary: cm.is_primary,
            group_name: null,
            party_id: cm.company.party_id,
            source: 'company_members',
          }))
          .filter((c: any) => !isInvalidCompany(c.company_name || ''));
      }
    } catch (e) {
      console.warn('Error fetching company_members:', e);
    }

    // Second: Get directly owned companies
    try {
      const { data: ownedCompanies, error: ownedError } = await adminClient
        .from('companies')
        .select('id, name, logo_url, group_id, party_id')
        .eq('owner_id', user.id)
        .eq('is_active', true);

      if (!ownedError && ownedCompanies) {
        const existingIds = new Set(allCompanies.map(c => c.company_id));
        for (const company of ownedCompanies) {
          if (!existingIds.has(company.id) && !isInvalidCompany(company.name || '')) {
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
    } catch (e) {
      console.warn('Error fetching owned companies:', e);
    }

    // Third: Get companies from parties (Employer type) - This is critical for showing all companies
    if (user.email) {
      try {
        const { data: userProfile } = await adminClient
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', user.id)
          .single();

        // Find all employer parties where user is associated
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
              if (!existingIds.has(company.id) && !isInvalidCompany(company.name || '')) {
                const matchingParty = employerParties.find((p: any) => p.id === company.party_id);
                let userRole = 'owner';
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
        console.warn('Error fetching party-linked companies:', e);
      }
    }

    // If still no companies found, return empty state
    if (allCompanies.length === 0) {
      return NextResponse.json({
        success: true,
        companies: [],
        grouped: {},
        summary: {
          total_companies: 0,
          total_employees: 0,
          total_pending_leaves: 0,
          total_pending_expenses: 0,
          total_contracts: 0,
          total_open_tasks: 0,
          total_checked_in: 0,
        },
        message: 'No companies configured yet. Set up multi-company management to see analytics here.',
      });
    }

    // Convert to memberships format for compatibility
    const memberships: CompanyMembership[] = allCompanies.map((c: any) => ({
      company_id: c.company_id,
      role: c.user_role,
      company: {
        id: c.company_id,
        name: c.company_name,
        logo_url: c.company_logo,
        is_active: true,
        group: c.group_name ? { id: '', name: c.group_name } : null,
      }
    }));

    // Helper function to safely query counts (handles missing company_id columns)
    const safeCount = async (table: string, conditions: Record<string, unknown> = {}): Promise<number> => {
      try {
        let query = supabase.from(table).select('id', { count: 'exact', head: true });
        for (const [key, value] of Object.entries(conditions || {})) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (value === null || value === undefined) {
            // Skip null/undefined conditions
          } else {
            query = query.eq(key, value);
          }
        }
        const { count } = await query;
        return count || 0;
      } catch (e) {
        // Column may not exist, return 0
        return 0;
      }
    };

    // Filter out invalid companies before processing
    const validMemberships = memberships.filter((membership) => {
      const companyName = membership.company?.name || '';
      return companyName && !isInvalidCompany(companyName);
    });

    // Fetch stats for each company
    const companiesWithStats: CompanyWithStats[] = await Promise.all(
      validMemberships.map(async (membership) => {
        const companyId = membership.company_id;
        const company = membership.company;

        // ✅ FIX: Get employee count from both employer_employees and promoters
        // Need to count unique employees, avoiding double-counting
        let employeeCount = 0;
        
        try {
          // Get company's party_id first
          const { data: companyData } = await adminClient
            .from('companies')
            .select('party_id')
            .eq('id', companyId)
            .single();

          // 1. Get all unique employee IDs from employer_employees
          const { data: employerEmployees } = await adminClient
            .from('employer_employees')
            .select('employee_id')
            .eq('company_id', companyId)
            .eq('employment_status', 'active')
            .not('employee_id', 'is', null);

          const employerEmployeeIds = new Set(
            (employerEmployees || []).map((ee: any) => ee.employee_id).filter(Boolean)
          );

          // 2. Get all promoter IDs for this company's party
          let promoterIds = new Set<string>();
          if (companyData?.party_id) {
            const { data: promoters } = await adminClient
              .from('promoters')
              .select('id')
              .eq('employer_id', companyData.party_id)
              .eq('status', 'active');
            
            if (promoters) {
              promoterIds = new Set(promoters.map((p: any) => p.id));
            }
          }

          // 3. Combine both sets to get unique employee count (avoid double-counting)
          const allEmployeeIds = new Set([...employerEmployeeIds, ...promoterIds]);
          employeeCount = allEmployeeIds.size;
          
        } catch (e) {
          console.warn('Error counting employees:', e);
          employeeCount = 0;
        }

        // Get pending leave requests
        const pendingLeaves = await safeCount('employee_leave_requests', {
          company_id: companyId,
          status: 'pending',
        } as Record<string, unknown>);

        // Get pending expenses
        const pendingExpenses = await safeCount('employee_expenses', {
          company_id: companyId,
          status: 'pending',
        } as Record<string, unknown>);

        // Get active contracts count
        const activeContracts = await safeCount('contracts', {
          company_id: companyId,
          status: 'active',
        } as Record<string, unknown>);

        // ✅ FIX: Get today's attendance from employee_attendance
        // Attendance is linked via employer_employee_id, so we need to get all employer_employee_ids for this company
        const today = new Date().toISOString().split('T')[0];
        let checkedInToday = 0;
        try {
          // Get all employer_employee_ids for this company
          const { data: employerEmployees } = await adminClient
            .from('employer_employees')
            .select('id, employee_id')
            .eq('company_id', companyId)
            .eq('employment_status', 'active');

          if (employerEmployees && employerEmployees.length > 0) {
            const employerEmployeeIds = employerEmployees.map((ee: { id: string }) => ee.id);
            
            // Count attendance records for today
            const { count } = await adminClient
              .from('employee_attendance')
              .select('id', { count: 'exact', head: true })
              .in('employer_employee_id', employerEmployeeIds)
              .eq('attendance_date', today)
              .not('check_in', 'is', null);
            
            checkedInToday = count || 0;
          }
        } catch (e) {
          console.warn('Error counting attendance:', e);
          checkedInToday = 0;
        }

        // ✅ FIX: Get open tasks - tasks are linked via employer_employee_id
        let openTasks = 0;
        try {
          // Get all employer_employee_ids for this company
          const { data: employerEmployees } = await adminClient
            .from('employer_employees')
            .select('id')
            .eq('company_id', companyId)
            .eq('employment_status', 'active');

          if (employerEmployees && employerEmployees.length > 0) {
            const employerEmployeeIds = employerEmployees.map((ee: { id: string }) => ee.id);
            
            // Count open tasks (pending or in_progress)
            const { count } = await adminClient
              .from('employee_tasks')
              .select('id', { count: 'exact', head: true })
              .in('employer_employee_id', employerEmployeeIds)
              .in('status', ['pending', 'in_progress']);
            
            openTasks = count || 0;
          }
        } catch (e) {
          console.warn('Error counting tasks:', e);
          openTasks = 0;
        }

        // Get pending reviews
        const pendingReviews = await safeCount('performance_reviews', {
          company_id: companyId,
          status: ['draft', 'submitted'],
        });

        return {
          id: companyId,
          name: company?.name || 'Unknown',
          logo_url: company?.logo_url ?? null,
          is_active: company?.is_active ?? true,
          group_name: company?.group?.name ?? null,
          user_role: membership.role,
          stats: {
            employees: employeeCount,
            pending_leaves: pendingLeaves,
            pending_expenses: pendingExpenses,
            active_contracts: activeContracts,
            checked_in_today: checkedInToday,
            open_tasks: openTasks,
            pending_reviews: pendingReviews,
          },
        };
      })
    );

    // Calculate summary
    const summary: Summary = companiesWithStats.reduce(
      (acc: Summary, company: CompanyWithStats) => ({
        total_companies: acc.total_companies + 1,
        total_employees: acc.total_employees + company.stats.employees,
        total_pending_leaves: acc.total_pending_leaves + company.stats.pending_leaves,
        total_pending_expenses: acc.total_pending_expenses + company.stats.pending_expenses,
        total_contracts: acc.total_contracts + company.stats.active_contracts,
        total_open_tasks: acc.total_open_tasks + company.stats.open_tasks,
        total_checked_in: acc.total_checked_in + company.stats.checked_in_today,
      }),
      {
        total_companies: 0,
        total_employees: 0,
        total_pending_leaves: 0,
        total_pending_expenses: 0,
        total_contracts: 0,
        total_open_tasks: 0,
        total_checked_in: 0,
      }
    );

    // Group by company group if applicable
    const groupedCompanies: Record<string, CompanyWithStats[]> = {};
    companiesWithStats.forEach((company: CompanyWithStats) => {
      const groupKey = company.group_name || 'Standalone';
      if (!groupedCompanies[groupKey]) {
        groupedCompanies[groupKey] = [];
      }
      groupedCompanies[groupKey].push(company);
    });

    return NextResponse.json({
      success: true,
      companies: companiesWithStats,
      grouped: groupedCompanies,
      summary,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in cross-company report:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
