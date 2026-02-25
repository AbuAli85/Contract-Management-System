/**
 * Contract Analytics API
 * Comprehensive performance metrics and insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const _endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // ✅ COMPANY SCOPE: Get active company's party_id
    let activePartyId: string | null = null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (profile?.active_company_id) {
      const { createAdminClient } = await import('@/lib/supabase/server');
      let adminClient;
      try {
        adminClient = createAdminClient();
      } catch (e) {
        adminClient = supabase;
      }

      const { data: company } = await adminClient
        .from('companies')
        .select('party_id')
        .eq('id', profile.active_company_id)
        .single();

      if (company?.party_id) {
        activePartyId = company.party_id;
      }
    }

    // Fetch contracts in date range - filter by company if available
    let contractsQuery = supabase
      .from('contracts')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (activePartyId) {
      contractsQuery = contractsQuery.or(
        `second_party_id.eq.${activePartyId},first_party_id.eq.${activePartyId}`
      );
    }

    const { data: contracts } = await contractsQuery;

    // Calculate overview metrics
    const total_contracts = contracts?.length || 0;
    const active_contracts =
      contracts?.filter(c => c.status === 'active').length || 0;
    const total_value =
      contracts?.reduce((sum, c) => sum + (c.value || 0), 0) || 0;

    // Get approval stats - filter by company contracts if available
    let approvalsQuery = supabase
      .from('contract_approvals')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // Filter approvals by company's contracts
    if (activePartyId && contracts) {
      const contractIds = contracts.map(c => c.id);
      if (contractIds.length > 0) {
        approvalsQuery = approvalsQuery.in('contract_id', contractIds);
      } else {
        // No contracts for this company, return empty
        approvalsQuery = approvalsQuery.eq(
          'contract_id',
          '00000000-0000-0000-0000-000000000000'
        );
      }
    }

    const { data: approvals } = await approvalsQuery;

    const approvedApprovals =
      approvals?.filter(a => a.status === 'approved' && a.approved_at) || [];
    const avg_approval_time =
      approvedApprovals.length > 0
        ? approvedApprovals.reduce((sum, a) => {
            const created = new Date(a.created_at).getTime();
            const approved = new Date(a.approved_at!).getTime();
            return sum + (approved - created) / (1000 * 60 * 60); // hours
          }, 0) / approvedApprovals.length
        : 0;

    // Get expiring contracts - filter by company if available
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    let expiringQuery = supabase
      .from('contracts')
      .select('id')
      .lte('end_date', thirtyDaysFromNow.toISOString())
      .gte('end_date', new Date().toISOString())
      .in('status', ['active', 'signed']);

    if (activePartyId) {
      expiringQuery = expiringQuery.or(
        `second_party_id.eq.${activePartyId},first_party_id.eq.${activePartyId}`
      );
    }

    const { data: expiringContracts } = await expiringQuery;
    const expiring_soon = expiringContracts?.length || 0;

    // Get pending obligations
    const { data: obligations } = await supabase
      .from('contract_obligations')
      .select('id')
      .in('status', ['pending', 'in_progress']);
    const obligations_pending = obligations?.length || 0;

    // Calculate status distribution
    const by_status: Record<string, number> = {};
    contracts?.forEach(contract => {
      by_status[contract.status] = (by_status[contract.status] || 0) + 1;
    });

    // Calculate type distribution
    const by_type: Record<string, number> = {};
    contracts?.forEach(contract => {
      if (contract.type) {
        by_type[contract.type] = (by_type[contract.type] || 0) + 1;
      }
    });

    // Get top vendors from real contract data
    const vendorMap: Record<string, { contracts: number; value: number }> = {};
    contracts?.forEach(contract => {
      const vendorName = (contract as Record<string, unknown>).party_name_en as
        | string
        | undefined;
      if (vendorName) {
        if (!vendorMap[vendorName]) {
          vendorMap[vendorName] = { contracts: 0, value: 0 };
        }
        vendorMap[vendorName].contracts += 1;
        vendorMap[vendorName].value +=
          ((contract as Record<string, unknown>).total_value as number) ?? 0;
      }
    });
    const top_vendors = Object.entries(vendorMap)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.contracts - a.contracts)
      .slice(0, 5);

    // Performance metrics (calculated from real data)
    const completedContracts =
      contracts?.filter(c => c.status === 'completed') ?? [];
    const on_time_completion =
      total_contracts > 0
        ? Math.round((completedContracts.length / total_contracts) * 100)
        : 0;
    const performance = {
      on_time_completion,
      average_cycle_time: Math.round(avg_approval_time / 24) || 0,
      obligations_completed_on_time: on_time_completion,
    };

    // Build real monthly trends from contract data
    const monthlyMap: Record<string, { count: number; value: number }> = {};
    contracts?.forEach(contract => {
      const date = contract.created_at ? new Date(contract.created_at) : null;
      if (date) {
        const key = date.toLocaleString('en-US', { month: 'short' });
        if (!monthlyMap[key]) {
          monthlyMap[key] = { count: 0, value: 0 };
        }
        monthlyMap[key].count += 1;
        monthlyMap[key].value +=
          ((contract as Record<string, unknown>).total_value as number) ?? 0;
      }
    });
    const trends = {
      contracts_by_month: Object.entries(monthlyMap).map(([month, d]) => ({
        month,
        count: d.count,
      })),
      value_by_month: Object.entries(monthlyMap).map(([month, d]) => ({
        month,
        value: d.value,
      })),
      approval_times: [] as { month: string; hours: number }[],
    };

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total_contracts,
          active_contracts,
          total_value,
          avg_approval_time: Math.round(avg_approval_time * 10) / 10,
          expiring_soon,
          obligations_pending,
        },
        trends,
        by_status,
        by_type,
        top_vendors,
        performance,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
