import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get all companies user is a member of
    const { data: memberships, error: memberError } = await supabase
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
      console.error('Error fetching memberships:', memberError);
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({
        success: true,
        companies: [],
        summary: {
          total_companies: 0,
          total_employees: 0,
          total_pending_leaves: 0,
          total_pending_expenses: 0,
        },
      });
    }

    // Fetch stats for each company
    const companiesWithStats: CompanyWithStats[] = await Promise.all(
      (memberships as unknown as CompanyMembership[]).map(async (membership) => {
        const companyId = membership.company_id;
        const company = membership.company;

        // Get employee count
        const { count: employeeCount } = await supabase
          .from('employer_employees')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('employment_status', 'active');

        // Get pending leave requests
        const { count: pendingLeaves } = await supabase
          .from('employee_leave_requests')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'pending');

        // Get pending expenses
        const { count: pendingExpenses } = await supabase
          .from('employee_expenses')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'pending');

        // Get active contracts count
        const { count: activeContracts } = await supabase
          .from('contracts')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'active');

        // Get today's attendance
        const today = new Date().toISOString().split('T')[0];
        const { count: checkedInToday } = await supabase
          .from('employee_attendance')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('date', today)
          .not('check_in', 'is', null);

        // Get open tasks
        const { count: openTasks } = await supabase
          .from('employee_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .in('status', ['pending', 'in_progress']);

        // Get pending reviews
        const { count: pendingReviews } = await supabase
          .from('performance_reviews')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .in('status', ['draft', 'submitted']);

        return {
          id: companyId,
          name: company?.name || 'Unknown',
          logo_url: company?.logo_url ?? null,
          is_active: company?.is_active ?? true,
          group_name: company?.group?.name ?? null,
          user_role: membership.role,
          stats: {
            employees: employeeCount || 0,
            pending_leaves: pendingLeaves || 0,
            pending_expenses: pendingExpenses || 0,
            active_contracts: activeContracts || 0,
            checked_in_today: checkedInToday || 0,
            open_tasks: openTasks || 0,
            pending_reviews: pendingReviews || 0,
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
