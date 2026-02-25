import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Run all queries in parallel for performance
    const [
      promotersResult,
      contractsResult,
      tasksResult,
      recentContractsResult,
    ] = await Promise.all([
      supabase
        .from('promoters')
        .select('id, status', { count: 'exact', head: false })
        .limit(1000),
      supabase
        .from('contracts')
        .select('id, status, created_at', { count: 'exact', head: false })
        .limit(1000),
      supabase
        .from('tasks')
        .select('id, status', { count: 'exact', head: false })
        .limit(1000),
      supabase
        .from('contracts')
        .select('id, status, created_at, contract_number')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const promoters = promotersResult.data ?? [];
    const contracts = contractsResult.data ?? [];
    const tasks = tasksResult.data ?? [];
    const recentContracts = recentContractsResult.data ?? [];

    const totalPromoters = promoters.length;
    const activePromoters = promoters.filter(p => p.status === 'active').length;

    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(
      c => c.status === 'active' || c.status === 'approved'
    ).length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(
      t => t.status === 'pending' || t.status === 'in_progress'
    ).length;
    const overdueTasks = tasks.filter(t => t.status === 'overdue').length;

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Build recent activity from real contracts
    const recentActivity = recentContracts.map((c, i) => ({
      id: i + 1,
      type: 'contract_update',
      title: `Contract ${c.status === 'approved' ? 'Approved' : 'Updated'}`,
      description: `Contract #${c.contract_number ?? c.id} is ${c.status}`,
      timestamp: c.created_at ?? new Date().toISOString(),
      status: c.status === 'approved' ? 'completed' : 'pending',
    }));

    const metrics = {
      totalPromoters,
      activePromoters,
      totalContracts,
      activeContracts,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
      recentActivity,
    };

    return NextResponse.json(metrics, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
