/**
 * Real Promoter Analytics Service
 *
 * Replaces mock data with actual database calculations
 * Provides comprehensive analytics and statistics for promoters
 *
 * Features:
 * - Real-time performance statistics
 * - Document expiry tracking
 * - Distribution analysis (status, location, employer)
 * - Aggregated metrics for dashboards
 */

import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PerformanceStats {
  totalPromoters: number;
  activePromoters: number;
  inactivePromoters: number;
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  totalContractValue: number;
  averageContractDuration: number;
  contractCompletionRate: number;
}

export interface DocumentExpiryStats {
  totalExpired: number;
  expiringSoon: number; // Within 30 days
  expiryWarning: number; // Within 90 days
  upToDate: number;
  idCardsExpired: number;
  passportsExpired: number;
  idCardsExpiringSoon: number;
  passportsExpiringSoon: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface LocationDistribution {
  location: string;
  count: number;
  percentage: number;
}

export interface EmployerDistribution {
  employerId: string;
  employerName: string;
  count: number;
  percentage: number;
}

export interface ComprehensiveAnalytics {
  performance: PerformanceStats;
  documentExpiry: DocumentExpiryStats;
  statusDistribution: StatusDistribution[];
  locationDistribution: LocationDistribution[];
  employerDistribution: EmployerDistribution[];
  lastUpdated: string;
}

export interface AnalyticsFilters {
  status?: string;
  workLocation?: string;
  employerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AnalyticsResult<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get date thresholds for expiry calculations
 */
function getDateThresholds() {
  const _now = new Date();
  const _thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const _ninetyDaysFromNow = new Date(now);
  ninetyDaysFromNow.setDate(now.getDate() + 90);

  return {
    now: now.toISOString(),
    thirtyDaysFromNow: thirtyDaysFromNow.toISOString(),
    ninetyDaysFromNow: ninetyDaysFromNow.toISOString(),
  };
}

/**
 * Calculate percentage
 */
function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Check if date is expired
 */
function isExpired(dateString: string | null): boolean {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
}

/**
 * Check if date is expiring soon (within days)
 */
function isExpiringSoon(dateString: string | null, days: number): boolean {
  if (!dateString) return false;
  const expiryDate = new Date(dateString);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + days);
  return expiryDate <= threshold && expiryDate >= new Date();
}

// ============================================================================
// PERFORMANCE STATISTICS
// ============================================================================

/**
 * Calculate real promoter performance statistics
 */
export async function calculatePromoterPerformanceStats(
  filters?: AnalyticsFilters
): Promise<AnalyticsResult<PerformanceStats>> {
  try {
    const supabase = createClient();
    if (!supabase) {
      return {
        success: false,
        error: 'Failed to initialize client',
      };
    }

    // Build promoter query with filters
    let promoterQuery = supabase
      .from('promoters')
      .select('*', { count: 'exact' });

    if (filters?.status) {
      promoterQuery = promoterQuery.eq('status', filters.status);
    }
    if (filters?.workLocation) {
      promoterQuery = promoterQuery.eq('work_location', filters.workLocation);
    }
    if (filters?.employerId) {
      promoterQuery = promoterQuery.eq('employer_id', filters.employerId);
    }

    // Build contract query
    let contractQuery = supabase.from('contracts').select('*');

    if (filters?.dateFrom) {
      contractQuery = contractQuery.gte('start_date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      contractQuery = contractQuery.lte('end_date', filters.dateTo);
    }

    // Execute queries in parallel
    const [
      promotersResult,
      activePromotersResult,
      contractsResult,
      activeContractsResult,
      completedContractsResult,
    ] = await Promise.all([
      promoterQuery,
      supabase
        .from('promoters')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      contractQuery,
      supabase.from('contracts').select('*').eq('status', 'active'),
      supabase.from('contracts').select('*').eq('status', 'completed'),
    ]);

    // Handle errors
    if (promotersResult.error) throw promotersResult.error;
    if (activePromotersResult.error) throw activePromotersResult.error;
    if (contractsResult.error) throw contractsResult.error;
    if (activeContractsResult.error) throw activeContractsResult.error;
    if (completedContractsResult.error) throw completedContractsResult.error;

    // Calculate statistics
    const totalPromoters = promotersResult.count || 0;
    const activePromoters = activePromotersResult.count || 0;
    const inactivePromoters = totalPromoters - activePromoters;

    const allContracts = contractsResult.data || [];
    const totalContracts = allContracts.length;
    const activeContracts = activeContractsResult.data?.length || 0;
    const completedContracts = completedContractsResult.data?.length || 0;

    // Calculate total contract value
    const totalContractValue = allContracts.reduce(
      (sum: number, contract: any) => {
        const value = parseFloat(contract.contract_value || '0');
        return sum + value;
      },
      0
    );

    // Calculate average contract duration (in days)
    const contractsWithDates = allContracts.filter(
      (c: any) => c.start_date && c.end_date
    );

    const totalDuration = contractsWithDates.reduce(
      (sum: number, contract: any) => {
        const start = new Date(contract.start_date);
        const end = new Date(contract.end_date);
        const duration = Math.floor(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + duration;
      },
      0
    );

    const averageContractDuration =
      contractsWithDates.length > 0
        ? Math.round(totalDuration / contractsWithDates.length)
        : 0;

    // Calculate contract completion rate
    const contractCompletionRate =
      totalContracts > 0
        ? calculatePercentage(completedContracts, totalContracts)
        : 0;

    const stats: PerformanceStats = {
      totalPromoters,
      activePromoters,
      inactivePromoters,
      totalContracts,
      activeContracts,
      completedContracts,
      totalContractValue,
      averageContractDuration,
      contractCompletionRate,
    };

    return { success: true, data: stats };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to calculate performance stats',
    };
  }
}

// ============================================================================
// DOCUMENT EXPIRY STATISTICS
// ============================================================================

/**
 * Calculate document expiry statistics
 */
export async function getDocumentExpiryStats(
  filters?: AnalyticsFilters
): Promise<AnalyticsResult<DocumentExpiryStats>> {
  try {
    const supabase = createClient();
    if (!supabase) {
      return {
        success: false,
        error: 'Failed to initialize client',
      };
    }
    const {
      now: _now,
      thirtyDaysFromNow: _thirtyDaysFromNow,
      ninetyDaysFromNow: _ninetyDaysFromNow,
    } = getDateThresholds();

    // Build query with filters
    let query = supabase
      .from('promoters')
      .select('id_card_expiry_date, passport_expiry_date');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.workLocation) {
      query = query.eq('work_location', filters.workLocation);
    }
    if (filters?.employerId) {
      query = query.eq('employer_id', filters.employerId);
    }

    const { data, error } = await query;

    if (error) throw error;

    let totalExpired = 0;
    let expiringSoon = 0;
    let expiryWarning = 0;
    let upToDate = 0;
    let idCardsExpired = 0;
    let passportsExpired = 0;
    let idCardsExpiringSoon = 0;
    let passportsExpiringSoon = 0;

    data?.forEach(promoter => {
      const idCardExpired = isExpired(promoter.id_card_expiry_date);
      const passportExpired = isExpired(promoter.passport_expiry_date);
      const idCardExpiringSoon = isExpiringSoon(
        promoter.id_card_expiry_date,
        30
      );
      const passportExpiringSoon = isExpiringSoon(
        promoter.passport_expiry_date,
        30
      );
      const idCardExpiryWarning = isExpiringSoon(
        promoter.id_card_expiry_date,
        90
      );
      const passportExpiryWarning = isExpiringSoon(
        promoter.passport_expiry_date,
        90
      );

      // Count expired documents
      if (idCardExpired) {
        idCardsExpired++;
        totalExpired++;
      }
      if (passportExpired) {
        passportsExpired++;
        totalExpired++;
      }

      // Count expiring soon (30 days)
      if (idCardExpiringSoon && !idCardExpired) {
        idCardsExpiringSoon++;
        expiringSoon++;
      }
      if (passportExpiringSoon && !passportExpired) {
        passportsExpiringSoon++;
        expiringSoon++;
      }

      // Count expiry warning (90 days)
      if (idCardExpiryWarning && !idCardExpired && !idCardExpiringSoon) {
        expiryWarning++;
      }
      if (passportExpiryWarning && !passportExpired && !passportExpiringSoon) {
        expiryWarning++;
      }

      // Count up to date
      if (
        !idCardExpired &&
        !idCardExpiringSoon &&
        !idCardExpiryWarning &&
        !passportExpired &&
        !passportExpiringSoon &&
        !passportExpiryWarning
      ) {
        upToDate++;
      }
    });

    const stats: DocumentExpiryStats = {
      totalExpired,
      expiringSoon,
      expiryWarning,
      upToDate,
      idCardsExpired,
      passportsExpired,
      idCardsExpiringSoon,
      passportsExpiringSoon,
    };

    return { success: true, data: stats };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to calculate expiry stats',
    };
  }
}

// ============================================================================
// DISTRIBUTION ANALYSIS
// ============================================================================

/**
 * Get status distribution
 */
export async function getStatusDistribution(
  filters?: AnalyticsFilters
): Promise<AnalyticsResult<StatusDistribution[]>> {
  try {
    const supabase = createClient();
    if (!supabase) {
      return {
        success: false,
        error: 'Failed to initialize client',
      };
    }

    let query = supabase.from('promoters').select('status');

    if (filters?.workLocation) {
      query = query.eq('work_location', filters.workLocation);
    }
    if (filters?.employerId) {
      query = query.eq('employer_id', filters.employerId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Count by status
    const statusCounts: Record<string, number> = {};
    data?.forEach((promoter: any) => {
      const status = promoter.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const total = data?.length || 0;

    // Convert to distribution array
    const distribution: StatusDistribution[] = Object.entries(statusCounts).map(
      ([status, count]) => ({
        status,
        count,
        percentage: calculatePercentage(count, total),
      })
    );

    // Sort by count descending
    distribution.sort((a, b) => b.count - a.count);

    return { success: true, data: distribution };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to calculate status distribution',
    };
  }
}

/**
 * Get location distribution
 */
export async function getLocationDistribution(
  filters?: AnalyticsFilters
): Promise<AnalyticsResult<LocationDistribution[]>> {
  try {
    const supabase = createClient();
    if (!supabase) {
      return {
        success: false,
        error: 'Failed to initialize client',
      };
    }

    let query = supabase.from('promoters').select('work_location');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.employerId) {
      query = query.eq('employer_id', filters.employerId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Count by location
    const locationCounts: Record<string, number> = {};
    data?.forEach((promoter: any) => {
      const location = promoter.work_location || 'Unassigned';
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    const total = data?.length || 0;

    // Convert to distribution array
    const distribution: LocationDistribution[] = Object.entries(
      locationCounts
    ).map(([location, count]) => ({
      location,
      count,
      percentage: calculatePercentage(count, total),
    }));

    // Sort by count descending
    distribution.sort((a, b) => b.count - a.count);

    return { success: true, data: distribution };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to calculate location distribution',
    };
  }
}

/**
 * Get employer distribution
 */
export async function getEmployerDistribution(
  filters?: AnalyticsFilters
): Promise<AnalyticsResult<EmployerDistribution[]>> {
  try {
    const supabase = createClient();
    if (!supabase) {
      return {
        success: false,
        error: 'Failed to initialize client',
      };
    }

    let query = supabase
      .from('promoters')
      .select('employer_id, employers(name_en)');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.workLocation) {
      query = query.eq('work_location', filters.workLocation);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Count by employer
    const employerCounts: Record<string, { name: string; count: number }> = {};

    data?.forEach((promoter: any) => {
      const employerId = promoter.employer_id || 'unassigned';
      const employerName = promoter.employers?.name_en || 'Unassigned';

      if (!employerCounts[employerId]) {
        employerCounts[employerId] = { name: employerName, count: 0 };
      }
      employerCounts[employerId].count++;
    });

    const total = data?.length || 0;

    // Convert to distribution array
    const distribution: EmployerDistribution[] = Object.entries(
      employerCounts
    ).map(([employerId, { name, count }]) => ({
      employerId,
      employerName: name,
      count,
      percentage: calculatePercentage(count, total),
    }));

    // Sort by count descending
    distribution.sort((a, b) => b.count - a.count);

    return { success: true, data: distribution };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to calculate employer distribution',
    };
  }
}

// ============================================================================
// COMPREHENSIVE ANALYTICS
// ============================================================================

/**
 * Get all analytics in one call
 */
export async function getComprehensiveAnalytics(
  filters?: AnalyticsFilters
): Promise<AnalyticsResult<ComprehensiveAnalytics>> {
  try {
    // Execute all analytics queries in parallel
    const [
      performanceResult,
      expiryResult,
      statusResult,
      locationResult,
      employerResult,
    ] = await Promise.all([
      calculatePromoterPerformanceStats(filters),
      getDocumentExpiryStats(filters),
      getStatusDistribution(filters),
      getLocationDistribution(filters),
      getEmployerDistribution(filters),
    ]);

    // Check for errors
    if (!performanceResult.success) {
      throw new Error(performanceResult.error);
    }
    if (!expiryResult.success) {
      throw new Error(expiryResult.error);
    }
    if (!statusResult.success) {
      throw new Error(statusResult.error);
    }
    if (!locationResult.success) {
      throw new Error(locationResult.error);
    }
    if (!employerResult.success) {
      throw new Error(employerResult.error);
    }

    const analytics: ComprehensiveAnalytics = {
      performance: performanceResult.data!,
      documentExpiry: expiryResult.data!,
      statusDistribution: statusResult.data!,
      locationDistribution: locationResult.data!,
      employerDistribution: employerResult.data!,
      lastUpdated: new Date().toISOString(),
    };

    return { success: true, data: analytics };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get comprehensive analytics',
    };
  }
}
