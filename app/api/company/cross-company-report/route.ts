import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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

    // Try to get companies - handle case where company_members table doesn't exist yet
    let memberships: CompanyMembership[] | null = null;
    
    try {
      const { data, error: memberError } = await adminClient
        .from('company_members')
        .select(`
          company_id,
          role,
          company:companies (
            id,
            name,
            logo_url,
            is_active,
            group:company_groups (
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (memberError) {
        // Table might not exist yet - return empty state
        console.warn('company_members query error (table may not exist):', memberError.message);
        memberships = null;
      } else {
        memberships = data as unknown as CompanyMembership[];
      }
    } catch (e) {
      console.warn('company_members table may not exist:', e);
      memberships = null;
    }

    // If no memberships found, also check for directly owned companies
    if (!memberships || memberships.length === 0) {
      // Fallback: Check for companies where user is owner
      const { data: ownedCompanies } = await adminClient
        .from('companies')
        .select(`
          id,
          name,
          logo_url,
          is_active,
          group_id
        `)
        .eq('owner_id', user.id)
        .eq('is_active', true);

      if (ownedCompanies && ownedCompanies.length > 0) {
        memberships = ownedCompanies.map((c: { id: string; name: string; logo_url: string | null; is_active: boolean }) => ({
          company_id: c.id,
          role: 'owner',
          company: {
            id: c.id,
            name: c.name,
            logo_url: c.logo_url,
            is_active: c.is_active,
            group: null,
          }
        }));
      } else {
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
    }

    // Helper function to safely query counts (handles missing company_id columns)
    const safeCount = async (table: string, conditions: Record<string, unknown>): Promise<number> => {
      try {
        let query = supabase.from(table).select('id', { count: 'exact', head: true });
        for (const [key, value] of Object.entries(conditions)) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (value === null) {
            // Skip null conditions
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

    // Fetch stats for each company
    const companiesWithStats: CompanyWithStats[] = await Promise.all(
      (memberships || []).map(async (membership) => {
        const companyId = membership.company_id;
        const company = membership.company;

        // Get employee count (may not have company_id column yet)
        let employeeCount = 0;
        try {
          const { count } = await supabase
            .from('employer_employees')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('employment_status', 'active');
          employeeCount = count || 0;
        } catch (e) {
          employeeCount = 0;
        }

        // Get pending leave requests
        const pendingLeaves = await safeCount('employee_leave_requests', {
          company_id: companyId,
          status: 'pending',
        });

        // Get pending expenses
        const pendingExpenses = await safeCount('employee_expenses', {
          company_id: companyId,
          status: 'pending',
        });

        // Get active contracts count
        const activeContracts = await safeCount('contracts', {
          company_id: companyId,
          status: 'active',
        });

        // Get today's attendance
        const today = new Date().toISOString().split('T')[0];
        let checkedInToday = 0;
        try {
          const { count } = await supabase
            .from('employee_attendance')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('date', today)
            .not('check_in', 'is', null);
          checkedInToday = count || 0;
        } catch (e) {
          checkedInToday = 0;
        }

        // Get open tasks
        const openTasks = await safeCount('employee_tasks', {
          company_id: companyId,
          status: ['pending', 'in_progress'],
        });

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
