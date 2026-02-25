/**
 * Enhanced Promoter Metrics Service
 * Single source of truth for promoter workforce metrics
 *
 * Features:
 * - Clear status categories (ACTIVE, AVAILABLE, ON_LEAVE, INACTIVE, TERMINATED)
 * - Document compliance tracking
 * - Utilization metrics
 * - Caching for performance
 */

import { createClient } from '@/lib/supabase/server';
import {
  PromoterStatus,
  PROMOTER_STATUS_DEFINITIONS,
} from '@/types/promoter-status';
import type { EnhancedPromoterMetrics } from '@/types/promoter-status';

// ==================== CACHING ====================

interface CacheEntry {
  data: EnhancedPromoterMetrics;
  timestamp: number;
  expiresAt: number;
}

class PromoterMetricsCache {
  private cache: CacheEntry | null = null;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  set(data: EnhancedPromoterMetrics): void {
    const now = Date.now();
    this.cache = {
      data,
      timestamp: now,
      expiresAt: now + this.TTL,
    };
  }

  get(): EnhancedPromoterMetrics | null {
    if (!this.cache) return null;

    const now = Date.now();
    if (now > this.cache.expiresAt) {
      this.cache = null;
      return null;
    }

    return this.cache.data;
  }

  clear(): void {
    this.cache = null;
  }
}

const metricsCache = new PromoterMetricsCache();

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate date thresholds for document compliance
 */
function getDateThresholds() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    now: now.toISOString(),
    thirtyDaysFromNow: thirtyDaysFromNow.toISOString(),
  };
}

// ==================== MAIN SERVICE ====================

/**
 * Get comprehensive promoter metrics
 * This is the SINGLE SOURCE OF TRUTH for promoter statistics
 */
export async function getEnhancedPromoterMetrics(
  forceRefresh = false,
  partyId: string | null = null
): Promise<EnhancedPromoterMetrics> {
  // Check cache first
  if (!forceRefresh) {
    const cached = metricsCache.get();
    if (cached) {
      return cached;
    }
  }

  const supabase = await createClient();
  const { now, thirtyDaysFromNow } = getDateThresholds();

  try {
    // ✅ COMPANY SCOPE: Build queries with company filter if available
    let totalQuery = supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true });
    let statusQuery = supabase.from('promoters').select('status, status_enum');
    let documentQuery = supabase
      .from('promoters')
      .select('id_card_expiry_date, passport_expiry_date, status, status_enum');
    let contractsQuery = supabase
      .from('contracts')
      .select('promoter_id')
      .eq('status', 'active')
      .not('promoter_id', 'is', null);

    if (partyId) {
      // Filter promoters by employer_id (party_id)
      totalQuery = totalQuery.eq('employer_id', partyId);
      statusQuery = statusQuery.eq('employer_id', partyId);
      documentQuery = documentQuery.eq('employer_id', partyId);
      // Filter contracts by company's party_id
      contractsQuery = contractsQuery.or(
        `second_party_id.eq.${partyId},first_party_id.eq.${partyId}`
      );
    }

    // Execute all queries in parallel for performance
    const [
      totalResult,
      statusCountsResult,
      activeContractsResult,
      documentComplianceResult,
    ] = await Promise.all([
      // Total promoters count
      totalQuery,

      // Count by status (using status_enum if available, fallback to status)
      statusQuery,

      // Count promoters with active contracts
      contractsQuery,

      // Document compliance data
      documentQuery,
    ]);

    // Handle errors
    if (totalResult.error) throw totalResult.error;
    if (statusCountsResult.error) throw statusCountsResult.error;
    if (activeContractsResult.error) throw activeContractsResult.error;
    if (documentComplianceResult.error) throw documentComplianceResult.error;

    // Total workforce
    const totalWorkforce = totalResult.count || 0;

    // Count by status (use status_enum if available, fallback to status)
    const statusCounts: Record<PromoterStatus, number> = {
      [PromoterStatus.ACTIVE]: 0,
      [PromoterStatus.AVAILABLE]: 0,
      [PromoterStatus.ON_LEAVE]: 0,
      [PromoterStatus.INACTIVE]: 0,
      [PromoterStatus.TERMINATED]: 0,
    };

    statusCountsResult.data?.forEach((promoter: any) => {
      // Use status_enum if available, fallback to status text column
      const statusValue = promoter.status_enum || promoter.status;
      const status = statusValue
        ? String(statusValue).toLowerCase()
        : 'available';

      // Map status to enum with comprehensive fallback logic
      // NOTE: 'active' means employed/active employee, NOT on contracts
      // We'll determine "Active on Contracts" separately using actual contract data
      switch (status) {
        case 'active':
          // 'active' status means employed, treat as available for work
          statusCounts[PromoterStatus.AVAILABLE]++;
          break;
        case 'available':
        case 'pending':
          statusCounts[PromoterStatus.AVAILABLE]++;
          break;
        case 'on_leave':
        case 'leave':
          statusCounts[PromoterStatus.ON_LEAVE]++;
          break;
        case 'inactive':
        case 'suspended':
          statusCounts[PromoterStatus.INACTIVE]++;
          break;
        case 'terminated':
        case 'resigned':
          statusCounts[PromoterStatus.TERMINATED]++;
          break;
        default:
          // Any unknown status defaults to available
          statusCounts[PromoterStatus.AVAILABLE]++;
          console.warn(
            `Unknown promoter status: "${statusValue}", defaulting to AVAILABLE`
          );
      }
    });

    // Count unique promoters with active contracts
    const activeOnContracts = new Set(
      activeContractsResult.data?.map((c: any) => c.promoter_id) || []
    ).size;

    // Document compliance calculations
    let fullyCompliant = 0;
    let expiringDocuments = 0;
    let expiredDocuments = 0;
    let criticalIds = 0;
    let criticalPassports = 0;
    let expiringIds = 0;
    let expiringPassports = 0;

    documentComplianceResult.data?.forEach((promoter: any) => {
      const idExpiry = promoter.id_card_expiry_date
        ? new Date(promoter.id_card_expiry_date)
        : null;
      const passportExpiry = promoter.passport_expiry_date
        ? new Date(promoter.passport_expiry_date)
        : null;

      const nowDate = new Date(now);
      const thirtyDaysDate = new Date(thirtyDaysFromNow);

      // Check ID card status
      if (idExpiry) {
        if (idExpiry < nowDate) {
          criticalIds++;
        } else if (idExpiry <= thirtyDaysDate) {
          expiringIds++;
        }
      }

      // Check passport status
      if (passportExpiry) {
        if (passportExpiry < nowDate) {
          criticalPassports++;
        } else if (passportExpiry <= thirtyDaysDate) {
          expiringPassports++;
        }
      }

      // Overall document status
      const hasExpired =
        (idExpiry && idExpiry < nowDate) ||
        (passportExpiry && passportExpiry < nowDate);
      const hasExpiring =
        (idExpiry && idExpiry >= nowDate && idExpiry <= thirtyDaysDate) ||
        (passportExpiry &&
          passportExpiry >= nowDate &&
          passportExpiry <= thirtyDaysDate);
      const isCompliant =
        idExpiry &&
        passportExpiry &&
        idExpiry > thirtyDaysDate &&
        passportExpiry > thirtyDaysDate;

      if (hasExpired) {
        expiredDocuments++;
      } else if (hasExpiring) {
        expiringDocuments++;
      } else if (isCompliant) {
        fullyCompliant++;
      }
    });

    // Calculate derived metrics
    const availableWorkforce =
      statusCounts[PromoterStatus.ACTIVE] +
      statusCounts[PromoterStatus.AVAILABLE];

    const utilizationRate =
      availableWorkforce > 0
        ? Math.round((activeOnContracts / availableWorkforce) * 100)
        : 0;

    const complianceRate =
      totalWorkforce > 0
        ? Math.round((fullyCompliant / totalWorkforce) * 100)
        : 0;

    const averageContractsPerPromoter =
      activeOnContracts > 0
        ? Number(
            (activeContractsResult.data?.length || 0) / activeOnContracts
          ).toFixed(2)
        : 0;

    // Validate that all promoters are accounted for
    const totalCounted =
      activeOnContracts +
      statusCounts[PromoterStatus.AVAILABLE] +
      statusCounts[PromoterStatus.ON_LEAVE] +
      statusCounts[PromoterStatus.INACTIVE] +
      statusCounts[PromoterStatus.TERMINATED];

    if (totalCounted !== totalWorkforce) {
      console.error('❌ Promoter count mismatch!', {
        totalWorkforce,
        totalCounted,
        missing: totalWorkforce - totalCounted,
        breakdown: {
          activeOnContracts,
          available: statusCounts[PromoterStatus.AVAILABLE],
          onLeave: statusCounts[PromoterStatus.ON_LEAVE],
          inactive: statusCounts[PromoterStatus.INACTIVE],
          terminated: statusCounts[PromoterStatus.TERMINATED],
        },
      });
    }

    // Build metrics object
    const metrics: EnhancedPromoterMetrics = {
      totalWorkforce,
      activeOnContracts,
      availableForWork: statusCounts[PromoterStatus.AVAILABLE],
      onLeave: statusCounts[PromoterStatus.ON_LEAVE],
      inactive: statusCounts[PromoterStatus.INACTIVE],
      terminated: statusCounts[PromoterStatus.TERMINATED],
      fullyCompliant,
      expiringDocuments,
      expiredDocuments,
      complianceRate,
      utilizationRate,
      averageContractsPerPromoter: Number(averageContractsPerPromoter),
      details: {
        byStatus: statusCounts,
        criticalIds,
        criticalPassports,
        expiringIds,
        expiringPassports,
      },
    };

    // Data validation check
    const statusSum =
      statusCounts[PromoterStatus.ACTIVE] +
      statusCounts[PromoterStatus.AVAILABLE] +
      statusCounts[PromoterStatus.ON_LEAVE] +
      statusCounts[PromoterStatus.INACTIVE] +
      statusCounts[PromoterStatus.TERMINATED];

    if (statusSum !== totalWorkforce) {
      console.warn('⚠️ Promoter Metrics: Status sum mismatch!', {
        totalWorkforce,
        statusSum,
        difference: totalWorkforce - statusSum,
        breakdown: statusCounts,
        rawDataLength: statusCountsResult.data?.length,
      });
    }

    // Cache the results
    metricsCache.set(metrics);

    return metrics;
  } catch (error) {
    console.error('❌ Error calculating promoter metrics:', error);
    throw new Error(
      `Failed to calculate promoter metrics: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Clear metrics cache
 * Use this when promoter data is updated
 */
export function clearPromoterMetricsCache(): void {
  metricsCache.clear();
}

/**
 * Get status distribution summary
 */
export async function getPromoterStatusSummary() {
  const metrics = await getEnhancedPromoterMetrics();

  return Object.entries(metrics.details.byStatus).map(([status, count]) => ({
    status: status as PromoterStatus,
    count,
    percentage:
      metrics.totalWorkforce > 0
        ? Math.round((count / metrics.totalWorkforce) * 100)
        : 0,
    definition: PROMOTER_STATUS_DEFINITIONS[status as PromoterStatus],
  }));
}

/**
 * Get document compliance summary
 */
export async function getDocumentComplianceSummary() {
  const metrics = await getEnhancedPromoterMetrics();

  return {
    fullyCompliant: {
      count: metrics.fullyCompliant,
      percentage: metrics.complianceRate,
      description: 'All documents valid for more than 30 days',
    },
    expiringSoon: {
      count: metrics.expiringDocuments,
      percentage:
        metrics.totalWorkforce > 0
          ? Math.round(
              (metrics.expiringDocuments / metrics.totalWorkforce) * 100
            )
          : 0,
      description: 'Documents expiring within 30 days',
      details: {
        ids: metrics.details.expiringIds,
        passports: metrics.details.expiringPassports,
      },
    },
    expired: {
      count: metrics.expiredDocuments,
      percentage:
        metrics.totalWorkforce > 0
          ? Math.round(
              (metrics.expiredDocuments / metrics.totalWorkforce) * 100
            )
          : 0,
      description: 'Documents already expired',
      details: {
        ids: metrics.details.criticalIds,
        passports: metrics.details.criticalPassports,
      },
    },
  };
}

/**
 * Get workforce utilization summary
 */
export async function getWorkforceUtilizationSummary() {
  const metrics = await getEnhancedPromoterMetrics();

  const availableWorkforce =
    metrics.activeOnContracts + metrics.availableForWork;

  return {
    total: metrics.totalWorkforce,
    availableWorkforce,
    working: metrics.activeOnContracts,
    readyForWork: metrics.availableForWork,
    utilizationRate: metrics.utilizationRate,
    onLeave: metrics.onLeave,
    unavailable: metrics.inactive + metrics.terminated,
    averageContractsPerPromoter: metrics.averageContractsPerPromoter,
  };
}
