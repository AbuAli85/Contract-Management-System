/**
 * Centralized Metrics Service with Caching
 * Single source of truth for all contract, promoter, and party metrics
 * 
 * Features:
 * - Role-based access control (admin sees all, users see their own)
 * - In-memory caching with TTL (5 minutes default)
 * - Consistent counting logic across all pages
 * - Clear scope labeling (system-wide vs user-specific)
 */

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types';

// ==================== TYPES ====================

type ContractStatus = Database['public']['Enums']['contract_status'];

export interface ContractMetrics {
  total: number;
  active: number;
  pending: number;
  approved: number;
  expired: number;
  completed: number;
  cancelled: number;
  expiringSoon: number;
  totalValue: number;
  averageDuration: number;
  byStatus: { [key: string]: number };
}

export interface PromoterMetrics {
  total: number;
  active: number;
  inactive: number;
  onAssignments: number;
  available: number;
}

export interface PartyMetrics {
  total: number;
  companies: number;
  individuals: number;
}

export interface DashboardMetrics {
  contracts: ContractMetrics;
  promoters: PromoterMetrics;
  parties: PartyMetrics;
  scope: 'system-wide' | 'user-specific';
  scopeLabel: string;
  timestamp: string;
}

export interface MetricsOptions {
  userId?: string;
  userRole?: string;
  includeExpiringSoon?: boolean;
  expiryDaysThreshold?: number;
  forceRefresh?: boolean;
}

// ==================== CACHING ====================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class MetricsCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton cache instance
const metricsCache = new MetricsCache();

// ==================== HELPER FUNCTIONS ====================

/**
 * Get user role from database using proper fallback chain
 */
async function getUserRole(supabase: any, userId: string): Promise<string> {
  try {
    // Try users table first (most common)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!userError && userData?.role) {
      return userData.role;
    }

    // Try user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!roleError && roleData?.role) {
      return roleData.role;
    }

    // Default to 'user' role
    return 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
}

/**
 * Generate cache key for metrics
 */
function getCacheKey(type: 'contracts' | 'promoters' | 'parties' | 'dashboard', userId?: string, userRole?: string): string {
  if (userRole === 'admin') {
    return `${type}:admin:all`;
  }
  return `${type}:user:${userId || 'anonymous'}`;
}

// ==================== CONTRACT METRICS ====================

/**
 * Calculate comprehensive contract metrics
 * This is the SINGLE SOURCE OF TRUTH for contract counts
 */
export async function getContractMetrics(
  options: MetricsOptions = {}
): Promise<ContractMetrics> {
  const {
    userId,
    userRole,
    includeExpiringSoon = true,
    expiryDaysThreshold = 30,
    forceRefresh = false,
  } = options;

  // Check cache first
  const cacheKey = getCacheKey('contracts', userId, userRole);
  if (!forceRefresh) {
    const cached = metricsCache.get<ContractMetrics>(cacheKey);
    if (cached) {
      console.log('📊 Metrics: Using cached contract metrics:', cacheKey);
      return cached;
    }
  }

  console.log('📊 Metrics: Calculating fresh contract metrics:', { userId, userRole });

  const supabase = await createClient();

  try {
    // Build base query based on user role
    let query = supabase
      .from('contracts')
      .select('status, contract_value, start_date, end_date, created_at');

    // RBAC: Non-admins see only their contracts
    if (userRole !== 'admin' && userId) {
      query = query.or(`first_party_id.eq.${userId},second_party_id.eq.${userId},client_id.eq.${userId},employer_id.eq.${userId}`);
    }

    const { data: contracts, error } = await query;

    if (error) {
      console.error('Error fetching contracts for metrics:', error);
      throw new Error(`Failed to fetch contracts: ${error.message}`);
    }

    // Get total count (more efficient for large datasets)
    let countQuery = supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true });

    if (userRole !== 'admin' && userId) {
      countQuery = countQuery.or(`first_party_id.eq.${userId},second_party_id.eq.${userId},client_id.eq.${userId},employer_id.eq.${userId}`);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting contracts:', countError);
      throw new Error(`Failed to count contracts: ${countError.message}`);
    }

    const now = new Date();
    const metrics: ContractMetrics = {
      total: totalCount || 0,
      active: 0,
      pending: 0,
      approved: 0,
      expired: 0,
      completed: 0,
      cancelled: 0,
      expiringSoon: 0,
      totalValue: 0,
      averageDuration: 0,
      byStatus: {},
    };

    if (!contracts || contracts.length === 0) {
      // Cache even empty results
      metricsCache.set(cacheKey, metrics);
      return metrics;
    }

    // Calculate metrics from contract data
    let totalDurationDays = 0;
    let contractsWithDuration = 0;

    contracts.forEach(contract => {
      // Count by status - only use status field since approval_status doesn't exist yet
      const status = contract.status?.toLowerCase() || 'unknown';
      
      // Determine the effective status for counting
      let effectiveStatus = status;
      
      // Map pending-related statuses to 'pending' for consistent counting
      if (['legal_review', 'hr_review', 'final_approval', 'signature'].includes(status)) {
        effectiveStatus = 'pending';
      }
      
      switch (effectiveStatus) {
        case 'active':
          metrics.active++;
          break;
        case 'pending':
          metrics.pending++;
          break;
        case 'approved':
          metrics.approved++;
          break;
        case 'expired':
          metrics.expired++;
          break;
        case 'completed':
          metrics.completed++;
          break;
        case 'cancelled':
          metrics.cancelled++;
          break;
      }

      // Track status distribution using effective status
      metrics.byStatus[effectiveStatus] = (metrics.byStatus[effectiveStatus] || 0) + 1;

      // Sum contract values
      if (contract.contract_value) {
        metrics.totalValue += Number(contract.contract_value);
      }

      // Calculate duration using start_date and end_date columns
      const startDate = contract.start_date;
      const endDate = contract.end_date;

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const durationMs = end.getTime() - start.getTime();
        const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
        
        if (durationDays > 0) {
          totalDurationDays += durationDays;
          contractsWithDuration++;
        }

        // Check if expiring soon
        if (includeExpiringSoon && status === 'active') {
          const daysUntilExpiry = Math.floor(
            (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysUntilExpiry > 0 && daysUntilExpiry <= expiryDaysThreshold) {
            metrics.expiringSoon++;
          }
        }
      }
    });

    // Calculate average duration
    if (contractsWithDuration > 0) {
      metrics.averageDuration = Math.round(
        totalDurationDays / contractsWithDuration
      );
    }

    // Cache the results
    metricsCache.set(cacheKey, metrics);

    console.log('📊 Metrics: Contract metrics calculated:', {
      total: metrics.total,
      active: metrics.active,
      pending: metrics.pending,
      cached: true,
    });

    return metrics;
  } catch (error) {
    console.error('Error calculating contract metrics:', error);
    throw error;
  }
}

// ==================== PROMOTER METRICS ====================

/**
 * Calculate promoter metrics
 */
export async function getPromoterMetrics(
  options: MetricsOptions = {}
): Promise<PromoterMetrics> {
  const { userId, userRole, forceRefresh = false } = options;

  const cacheKey = getCacheKey('promoters', userId, userRole);
  if (!forceRefresh) {
    const cached = metricsCache.get<PromoterMetrics>(cacheKey);
    if (cached) {
      console.log('📊 Metrics: Using cached promoter metrics');
      return cached;
    }
  }

  const supabase = await createClient();

  try {
    // Get total promoters count
    const { count: totalCount, error: totalError } = await supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get active promoters count
    const { count: activeCount, error: activeError } = await supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (activeError) throw activeError;

    // Get promoters on assignments (with active contracts)
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('contracts')
      .select('promoter_id')
      .eq('status', 'active')
      .not('promoter_id', 'is', null);

    if (assignmentError) throw assignmentError;

    const uniquePromotersOnAssignments = new Set(
      assignmentData?.map(c => c.promoter_id) || []
    ).size;

    const metrics: PromoterMetrics = {
      total: totalCount || 0,
      active: activeCount || 0,
      inactive: (totalCount || 0) - (activeCount || 0),
      onAssignments: uniquePromotersOnAssignments,
      available: (activeCount || 0) - uniquePromotersOnAssignments,
    };

    metricsCache.set(cacheKey, metrics);
    return metrics;
  } catch (error) {
    console.error('Error calculating promoter metrics:', error);
    throw error;
  }
}

// ==================== PARTY METRICS ====================

/**
 * Calculate party metrics
 */
export async function getPartyMetrics(
  options: MetricsOptions = {}
): Promise<PartyMetrics> {
  const { userId, userRole, forceRefresh = false } = options;

  const cacheKey = getCacheKey('parties', userId, userRole);
  if (!forceRefresh) {
    const cached = metricsCache.get<PartyMetrics>(cacheKey);
    if (cached) {
      console.log('📊 Metrics: Using cached party metrics');
      return cached;
    }
  }

  const supabase = await createClient();

  try {
    // Get total parties count
    const { count: totalCount, error: totalError } = await supabase
      .from('parties')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get party types
    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select('party_type');

    if (partiesError) throw partiesError;

    const companies = parties?.filter(p => p.party_type === 'company').length || 0;
    const individuals = parties?.filter(p => p.party_type === 'individual').length || 0;

    const metrics: PartyMetrics = {
      total: totalCount || 0,
      companies,
      individuals,
    };

    metricsCache.set(cacheKey, metrics);
    return metrics;
  } catch (error) {
    console.error('Error calculating party metrics:', error);
    throw error;
  }
}

// ==================== DASHBOARD METRICS ====================

/**
 * Get all metrics for dashboard
 * This combines all metrics into a single response
 */
export async function getDashboardMetrics(
  options: MetricsOptions = {}
): Promise<DashboardMetrics> {
  const { userId, userRole, forceRefresh = false } = options;

  const cacheKey = getCacheKey('dashboard', userId, userRole);
  if (!forceRefresh) {
    const cached = metricsCache.get<DashboardMetrics>(cacheKey);
    if (cached) {
      console.log('📊 Metrics: Using cached dashboard metrics');
      return cached;
    }
  }

  // Fetch all metrics in parallel
  const [contracts, promoters, parties] = await Promise.all([
    getContractMetrics({ ...options, forceRefresh: true }), // Force refresh sub-metrics
    getPromoterMetrics({ ...options, forceRefresh: true }),
    getPartyMetrics({ ...options, forceRefresh: true }),
  ]);

  const scope = userRole === 'admin' ? 'system-wide' : 'user-specific';
  const scopeLabel = userRole === 'admin' 
    ? 'All contracts in system' 
    : 'Your contracts only';

  const metrics: DashboardMetrics = {
    contracts,
    promoters,
    parties,
    scope,
    scopeLabel,
    timestamp: new Date().toISOString(),
  };

  metricsCache.set(cacheKey, metrics);
  return metrics;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get metrics scope label based on user role
 */
export function getMetricsScopeLabel(userRole?: string): string {
  return userRole === 'admin' ? 'System-wide' : 'Your contracts';
}

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: ContractMetrics) {
  return {
    ...metrics,
    totalValue: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(metrics.totalValue),
    averageDuration: `${metrics.averageDuration} days`,
  };
}

/**
 * Clear metrics cache
 * Useful for testing or when data changes
 */
export function clearMetricsCache(pattern?: string): void {
  metricsCache.clear(pattern);
  console.log('📊 Metrics: Cache cleared', pattern ? `(pattern: ${pattern})` : '(all)');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return metricsCache.getStats();
}

/**
 * Get metrics with automatic role detection
 */
export async function getMetricsWithAuth(): Promise<DashboardMetrics> {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    // Return metrics for anonymous user (no data)
    return getDashboardMetrics({ userRole: 'anonymous' });
  }

  // Get user role
  const userRole = await getUserRole(supabase, user.id);

  // Get metrics with proper context
  return getDashboardMetrics({
    userId: user.id,
    userRole,
  });
}

