import { NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac/guard';
import { getPromoterMetrics } from '@/lib/metrics/promoters';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/promoter-metrics
 * 
 * Returns system-wide promoter metrics calculated from the entire database,
 * not just the current page. This ensures consistency and accuracy in dashboard metrics.
 * 
 * Metrics returned:
 * - total: Total number of promoters
 * - active: Number of active promoters (status='active')
 * - assigned: Active promoters with employer
 * - unassigned: Active promoters without employer (available for assignment)
 * - onAssignments: Currently working on active contracts
 * - available: Active but not on contracts
 * - inactive: Not available for assignments
 * - critical: Promoters with expired documents
 * - expiring: Promoters with documents expiring within 30 days
 * - compliant: Promoters with all valid documents (>30 days until expiry)
 * - complianceRate: Percentage of compliant promoters
 */
export const GET = withRBAC('promoter:read:own', async () => {
  try {
    console.log('📊 Calculating promoter metrics...');

    // Use centralized metrics function for consistency
    const metrics = await getPromoterMetrics();

    console.log('📊 Promoter metrics calculated:', {
      total: metrics.total,
      active: metrics.active,
      onAssignments: metrics.onAssignments,
    });

    return NextResponse.json({
      success: true,
      metrics,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error calculating promoter metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate promoter metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

