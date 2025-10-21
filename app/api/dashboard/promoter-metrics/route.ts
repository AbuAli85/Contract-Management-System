import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac/guard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/promoter-metrics
 * 
 * Returns system-wide promoter metrics calculated from the entire database,
 * not just the current page. This ensures consistency and accuracy in dashboard metrics.
 * 
 * Metrics returned:
 * - total: Total number of promoters
 * - active: Number of active promoters
 * - unassigned: Active promoters without employer
 * - assigned: Active promoters with employer
 * - critical: Promoters with expired documents
 * - expiring: Promoters with documents expiring within 30 days
 * - compliant: Promoters with all valid documents (>30 days until expiry)
 * - complianceRate: Percentage of compliant promoters
 */
export const GET = withRBAC('promoter:read:own', async () => {
  try {
    const supabase = await createClient();

    // Calculate date thresholds
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Execute all count queries in parallel for performance
    const [
      totalResult,
      activeResult,
      unassignedResult,
      criticalIdsResult,
      criticalPassportsResult,
      expiringIdsResult,
      expiringPassportsResult,
      compliantResult,
    ] = await Promise.all([
      // Total promoters
      supabase
        .from('promoters')
        .select('*', { count: 'exact', head: true }),

      // Active promoters
      supabase
        .from('promoters')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),

      // Unassigned (no employer_id)
      supabase
        .from('promoters')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .is('employer_id', null),

      // Critical: Expired ID cards
      supabase
        .from('promoters')
        .select('*', { count: 'exact', head: true })
        .not('id_card_expiry_date', 'is', null)
        .lt('id_card_expiry_date', now.toISOString()),

      // Critical: Expired passports
      supabase
        .from('promoters')
        .select('*', { count: 'exact', head: true })
        .not('passport_expiry_date', 'is', null)
        .lt('passport_expiry_date', now.toISOString()),

      // Expiring: ID cards expiring within 30 days
      supabase
        .from('promoters')
        .select('*', { count: 'exact', head: true })
        .gte('id_card_expiry_date', now.toISOString())
        .lte('id_card_expiry_date', thirtyDaysFromNow.toISOString()),

      // Expiring: Passports expiring within 30 days
      supabase
        .from('promoters')
        .select('*', { count: 'exact', head: true })
        .gte('passport_expiry_date', now.toISOString())
        .lte('passport_expiry_date', thirtyDaysFromNow.toISOString()),

      // Compliant: Both documents valid (expire more than 30 days from now)
      supabase
        .from('promoters')
        .select('*', { count: 'exact', head: true })
        .gt('id_card_expiry_date', thirtyDaysFromNow.toISOString())
        .gt('passport_expiry_date', thirtyDaysFromNow.toISOString()),
    ]);

    // Extract counts with fallbacks
    const total = totalResult.count || 0;
    const active = activeResult.count || 0;
    const unassigned = unassignedResult.count || 0;
    
    // Critical documents: promoters with at least one expired document
    // Use max to avoid double-counting promoters with both docs expired
    const criticalIds = criticalIdsResult.count || 0;
    const criticalPassports = criticalPassportsResult.count || 0;
    // This is an approximation; for exact count would need UNION query
    const critical = Math.max(criticalIds, criticalPassports);
    
    // Expiring documents: promoters with at least one document expiring soon
    const expiringIds = expiringIdsResult.count || 0;
    const expiringPassports = expiringPassportsResult.count || 0;
    const expiring = Math.max(expiringIds, expiringPassports);
    
    const compliant = compliantResult.count || 0;

    // Calculate derived metrics
    const assigned = total - unassigned;
    const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;

    const metrics = {
      total,
      active,
      unassigned,
      assigned,
      critical,
      expiring,
      compliant,
      complianceRate,
      // Additional context
      inactive: total - active,
      // Breakdown for clarity
      details: {
        criticalIds,
        criticalPassports,
        expiringIds,
        expiringPassports,
      },
    };

    console.log('📊 Promoter metrics calculated:', metrics);

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

