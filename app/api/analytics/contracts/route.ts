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
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch contracts in date range
    const { data: contracts } = await supabase
      .from('contracts')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // Calculate overview metrics
    const total_contracts = contracts?.length || 0;
    const active_contracts =
      contracts?.filter(c => c.status === 'active').length || 0;
    const total_value =
      contracts?.reduce((sum, c) => sum + (c.value || 0), 0) || 0;

    // Get approval stats
    const { data: approvals } = await supabase
      .from('contract_approvals')
      .select('*')
      .gte('created_at', startDate.toISOString());

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

    // Get expiring contracts
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const { data: expiringContracts } = await supabase
      .from('contracts')
      .select('id')
      .lte('end_date', thirtyDaysFromNow.toISOString())
      .gte('end_date', new Date().toISOString())
      .in('status', ['active', 'signed']);
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

    // Get top vendors (mock data for now)
    const top_vendors = [
      { name: 'Vendor A', contracts: 15, value: 250000 },
      { name: 'Vendor B', contracts: 12, value: 180000 },
      { name: 'Vendor C', contracts: 10, value: 150000 },
      { name: 'Vendor D', contracts: 8, value: 120000 },
      { name: 'Vendor E', contracts: 6, value: 90000 },
    ];

    // Performance metrics
    const performance = {
      on_time_completion: 87,
      average_cycle_time: 14,
      obligations_completed_on_time: 92,
    };

    // Trends (mock data for visualization)
    const trends = {
      contracts_by_month: [
        { month: 'Jan', count: 12 },
        { month: 'Feb', count: 15 },
        { month: 'Mar', count: 18 },
        { month: 'Apr', count: 22 },
        { month: 'May', count: 20 },
        { month: 'Jun', count: 25 },
      ],
      value_by_month: [
        { month: 'Jan', value: 180000 },
        { month: 'Feb', value: 220000 },
        { month: 'Mar', value: 280000 },
        { month: 'Apr', value: 350000 },
        { month: 'May', value: 320000 },
        { month: 'Jun', value: 400000 },
      ],
      approval_times: [
        { month: 'Jan', hours: 52 },
        { month: 'Feb', hours: 48 },
        { month: 'Mar', hours: 45 },
        { month: 'Apr', hours: 42 },
        { month: 'May', hours: 38 },
        { month: 'Jun', hours: 36 },
      ],
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
