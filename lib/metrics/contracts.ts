/**
 * Centralized Contract Metrics Calculation
 * Ensures consistent metrics across all views (Dashboard, Contracts Page, etc.)
 */

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types';

type ContractStatus = Database['public']['Enums']['contract_status'];

export interface ContractMetrics {
  total: number;
  active: number;
  pending: number;
  approved: number;
  expired: number;
  completed: number;
  cancelled: number;
  expiringSoon: number; // Contracts expiring within 30 days
  totalValue: number;
  averageDuration: number;
  byStatus: {
    [key: string]: number;
  };
}

export interface MetricsOptions {
  userId?: string;
  userRole?: string;
  includeExpiringSoon?: boolean;
  expiryDaysThreshold?: number;
}

/**
 * Calculate comprehensive contract metrics
 * Uses consistent logic for all views
 */
export async function getContractMetrics(
  options: MetricsOptions = {}
): Promise<ContractMetrics> {
  const {
    userId,
    userRole,
    includeExpiringSoon = true,
    expiryDaysThreshold = 30,
  } = options;

  const supabase = await createClient();

  try {
    // Build base query based on user role
    let query = supabase
      .from('contracts')
      .select('status, contract_value, start_date, end_date, created_at');

    // Role-based filtering: non-admins see only their contracts
    // Admins see all contracts
    if (userRole !== 'admin' && userId) {
      query = query.eq('created_by', userId);
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
      countQuery = countQuery.eq('created_by', userId);
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
      return metrics;
    }

    // Calculate metrics from contract data
    let totalDurationDays = 0;
    let contractsWithDuration = 0;

    contracts.forEach(contract => {
      // Count by status
      const status = contract.status?.toLowerCase() || 'unknown';
      
      switch (status) {
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

      // Track status distribution
      metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1;

      // Sum contract values
      if (contract.contract_value) {
        metrics.totalValue += Number(contract.contract_value);
      }

      // Calculate duration
      if (contract.start_date && contract.end_date) {
        const startDate = new Date(contract.start_date);
        const endDate = new Date(contract.end_date);
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
        
        if (durationDays > 0) {
          totalDurationDays += durationDays;
          contractsWithDuration++;
        }

        // Check if expiring soon
        if (includeExpiringSoon && status === 'active') {
          const daysUntilExpiry = Math.floor(
            (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
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

    return metrics;
  } catch (error) {
    console.error('Error calculating contract metrics:', error);
    throw error;
  }
}

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

