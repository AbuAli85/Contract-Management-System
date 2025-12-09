/**
 * Growth Calculation Utilities
 *
 * Provides safe mathematical calculations for dashboard metrics.
 * Handles edge cases like zero values and prevents NaN errors.
 *
 * Usage: Import these functions in dashboard components
 */

/**
 * Calculate percentage growth between two values
 * Handles edge cases:
 * - Returns 0 if both values are 0
 * - Returns 100% if previous is 0 but current is positive
 * - Returns proper negative percentages for decline
 *
 * @param current - Current period value
 * @param previous - Previous period value
 * @returns Growth percentage (can be negative)
 */
export function calculateGrowthPercentage(
  current: number,
  previous: number
): number {
  // Handle zero cases
  if (previous === 0 && current === 0) {
    return 0;
  }

  if (previous === 0 && current > 0) {
    return 100; // 100% growth from nothing
  }

  if (previous === 0 && current < 0) {
    return -100; // Edge case: negative from nothing
  }

  // Standard percentage calculation
  const growth = ((current - previous) / previous) * 100;

  // Round to 1 decimal place
  return Math.round(growth * 10) / 10;
}

/**
 * Determine trend direction based on change value
 *
 * @param change - The change value (can be percentage or absolute)
 * @returns 'up' for positive, 'down' for negative, 'neutral' for zero
 */
export function determineGrowthTrend(
  change: number
): 'up' | 'down' | 'neutral' {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'neutral';
}

/**
 * Calculate compliance rate safely
 * Prevents NaN errors and provides proper formatting
 *
 * @param compliant - Number of compliant items
 * @param total - Total number of items
 * @returns Compliance rate as percentage (0-100)
 */
export function calculateComplianceRate(
  compliant: number,
  total: number
): number {
  if (total === 0) {
    return 0;
  }

  if (compliant > total) {
    console.warn('Data inconsistency: More compliant than total');
    return 100;
  }

  return Math.round((compliant / total) * 100);
}

/**
 * Format compliance display string
 *
 * @param compliant - Number of compliant items
 * @param total - Total number of items
 * @returns Formatted string like "75% (150/200 compliant)"
 */
export function formatComplianceDisplay(
  compliant: number,
  total: number
): string {
  if (total === 0) {
    return 'No data available';
  }

  const rate = calculateComplianceRate(compliant, total);
  return `${rate}% (${compliant}/${total} compliant)`;
}

/**
 * Calculate utilization rate for workforce
 *
 * @param active - Number of active workers
 * @param total - Total workforce
 * @returns Utilization rate as percentage (0-100)
 */
export function calculateUtilizationRate(
  active: number,
  total: number
): number {
  if (total === 0) {
    return 0;
  }

  if (active > total) {
    console.warn('Data inconsistency: More active than total workforce');
    return 100;
  }

  return Math.round((active / total) * 100);
}

/**
 * Format percentage with proper sign
 *
 * @param value - Percentage value
 * @returns Formatted string with + or - sign
 */
export function formatPercentageChange(value: number): string {
  if (value === 0) {
    return '0%';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Validate data consistency
 * Logs warnings for suspicious data patterns
 *
 * @param data - Object containing metrics to validate
 */
export function validateMetricsData(data: {
  total?: number;
  active?: number;
  pending?: number;
  completed?: number;
}): boolean {
  const { total = 0, active = 0, pending = 0, completed = 0 } = data;

  // Check if sum of statuses matches total
  const sum = active + pending + completed;
  if (total > 0 && sum !== total) {
    console.warn('Data inconsistency: Status sum does not match total', {
      total,
      sum,
      breakdown: { active, pending, completed },
    });
    return false;
  }

  // Check for negative values
  if (total < 0 || active < 0 || pending < 0 || completed < 0) {
    console.error('Data error: Negative values detected', data);
    return false;
  }

  return true;
}
