/**
 * Centralized Promoter Metrics Calculation
 * Ensures consistent promoter metrics across all views
 */

import { createClient } from '@/lib/supabase/server';

export interface PromoterMetrics {
  total: number;
  active: number; // Status = 'active'
  assigned: number; // Active promoters with employer_id
  unassigned: number; // Active promoters without employer_id (available for assignment)
  inactive: number; // Status != 'active'
  onAssignments: number; // Currently working on contracts
  available: number; // Active but not on assignments

  // Document compliance
  critical: number; // Expired documents
  expiring: number; // Expiring within 30 days
  compliant: number; // All documents valid
  complianceRate: number; // Percentage

  // Additional details
  details: {
    criticalIds: number;
    criticalPassports: number;
    expiringIds: number;
    expiringPassports: number;
  };
}

export interface PromoterStatusDefinitions {
  ACTIVE: 'Currently registered and available in system';
  ASSIGNED: 'Has employer assigned';
  UNASSIGNED: 'Ready for assignment, no current employer';
  ON_ASSIGNMENTS: 'Currently working on active contracts';
  AVAILABLE: 'Active but not currently on contracts';
  INACTIVE: 'Not available for assignments';
}

export const PROMOTER_STATUS_DEFINITIONS: PromoterStatusDefinitions = {
  ACTIVE: 'Currently registered and available in system',
  ASSIGNED: 'Has employer assigned',
  UNASSIGNED: 'Ready for assignment, no current employer',
  ON_ASSIGNMENTS: 'Currently working on active contracts',
  AVAILABLE: 'Active but not currently on contracts',
  INACTIVE: 'Not available for assignments',
};

/**
 * Calculate comprehensive promoter metrics
 */
export async function getPromoterMetrics(): Promise<PromoterMetrics> {
  const supabase = await createClient();

  try {
    // Calculate date thresholds
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

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
      onAssignmentsResult,
    ] = await Promise.all([
      // Total promoters
      supabase.from('promoters').select('*', { count: 'exact', head: true }),

      // Active promoters (status = 'active')
      supabase
        .from('promoters')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),

      // Unassigned (no employer_id) - available for assignment
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

      // On assignments: Count promoters with active contracts
      // This requires checking which promoters have active contracts
      (supabase as any).rpc('count_promoters_with_active_contracts'),
    ]);

    // Extract counts with fallbacks
    const total = totalResult.count || 0;
    const active = activeResult.count || 0;
    const unassigned = unassignedResult.count || 0;

    // Critical documents: promoters with at least one expired document
    const criticalIds = criticalIdsResult.count || 0;
    const criticalPassports = criticalPassportsResult.count || 0;
    const critical = Math.max(criticalIds, criticalPassports);

    // Expiring documents: promoters with at least one document expiring soon
    const expiringIds = expiringIdsResult.count || 0;
    const expiringPassports = expiringPassportsResult.count || 0;
    const expiring = Math.max(expiringIds, expiringPassports);

    const compliant = compliantResult.count || 0;
    // Handle RPC call result - RPC functions return data directly, not wrapped in count
    // The RPC returns a single BIGINT value
    const onAssignments = onAssignmentsResult.data || 0;

    // Calculate derived metrics
    const assigned = active - unassigned;
    const available = active - onAssignments;
    const inactive = total - active;
    const complianceRate =
      total > 0 ? Math.round((compliant / total) * 100) : 0;

    return {
      total,
      active,
      assigned,
      unassigned,
      inactive,
      onAssignments,
      available,
      critical,
      expiring,
      compliant,
      complianceRate,
      details: {
        criticalIds,
        criticalPassports,
        expiringIds,
        expiringPassports,
      },
    };
  } catch (error) {
    console.error('Error calculating promoter metrics:', error);
    throw error;
  }
}

/**
 * Get label for promoter metric with tooltip explanation
 */
export function getPromoterMetricLabel(metricType: keyof PromoterMetrics): {
  title: string;
  subtitle: string;
  tooltip: string;
} {
  const labels: Record<
    string,
    { title: string; subtitle: string; tooltip: string }
  > = {
    total: {
      title: 'Total Promoters',
      subtitle: 'All registered promoters',
      tooltip: 'Total number of promoters registered in the system',
    },
    active: {
      title: 'Active Workforce',
      subtitle: 'Available in system',
      tooltip:
        'Promoters with active status - includes both assigned and unassigned',
    },
    assigned: {
      title: 'Assigned Promoters',
      subtitle: 'With employer',
      tooltip: 'Active promoters who have been assigned to an employer',
    },
    unassigned: {
      title: 'Available for Assignment',
      subtitle: 'Awaiting assignment',
      tooltip:
        'Active promoters ready for assignment but not yet assigned to an employer',
    },
    onAssignments: {
      title: 'Currently Working',
      subtitle: 'On active contracts',
      tooltip: 'Promoters currently working on active contract assignments',
    },
    available: {
      title: 'Ready for Contracts',
      subtitle: 'Not on assignments',
      tooltip: 'Active promoters available to take on new contract work',
    },
    inactive: {
      title: 'Inactive',
      subtitle: 'Not available',
      tooltip: 'Promoters who are not currently available for assignments',
    },
    critical: {
      title: 'Critical Documents',
      subtitle: 'Expired',
      tooltip:
        'Promoters with expired ID cards or passports requiring immediate attention',
    },
    expiring: {
      title: 'Expiring Soon',
      subtitle: 'Within 30 days',
      tooltip: 'Promoters with documents expiring in the next 30 days',
    },
    compliant: {
      title: 'Fully Compliant',
      subtitle: 'All docs valid',
      tooltip: 'Promoters with all documents valid for more than 30 days',
    },
    complianceRate: {
      title: 'Compliance Rate',
      subtitle: 'Percentage',
      tooltip: 'Percentage of promoters with fully compliant documentation',
    },
  };

  return (
    labels[metricType] || {
      title: String(metricType),
      subtitle: '',
      tooltip: '',
    }
  );
}

/**
 * Format promoter metrics for display
 */
export function formatPromoterMetrics(metrics: PromoterMetrics) {
  return {
    ...metrics,
    complianceRate: `${metrics.complianceRate}%`,
  };
}
