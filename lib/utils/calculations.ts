/**
 * Calculate growth percentage between two values
 * Handles edge cases like zero previous values
 *
 * @param current Current value
 * @param previous Previous value
 * @returns Growth percentage (positive or negative)
 */
export function calculateGrowthPercentage(
  current: number,
  previous: number
): number {
  // If both are 0, no change
  if (current === 0 && previous === 0) {
    return 0;
  }

  // If previous is 0 but current is positive, show 100% growth
  if (previous === 0 && current > 0) {
    return 100;
  }

  // If previous is 0 but current is negative (shouldn't happen often)
  if (previous === 0 && current < 0) {
    return -100;
  }

  // Standard percentage change formula
  return ((current - previous) / previous) * 100;
}

/**
 * Determine the trend direction based on growth value
 *
 * @param change Growth percentage value
 * @returns Trend direction: 'up', 'down', or 'neutral'
 */
export function determineGrowthTrend(
  change: number
): 'up' | 'down' | 'neutral' {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'neutral';
}

/**
 * Calculate compliance rate safely (handles NaN cases)
 *
 * @param compliantCount Number of compliant items
 * @param totalCount Total number of items
 * @returns Compliance rate percentage (0-100)
 */
export function calculateComplianceRate(
  compliantCount: number,
  totalCount: number
): number {
  if (totalCount === 0 || !totalCount || isNaN(totalCount)) {
    return 0;
  }

  if (!compliantCount || isNaN(compliantCount)) {
    return 0;
  }

  return Math.round((compliantCount / totalCount) * 100);
}

/**
 * Calculate utilization rate safely
 *
 * @param activeCount Number of active workers
 * @param totalCount Total workforce
 * @returns Utilization rate percentage (0-100)
 */
export function calculateUtilizationRate(
  activeCount: number,
  totalCount: number
): number {
  if (totalCount === 0 || !totalCount || isNaN(totalCount)) {
    return 0;
  }

  if (!activeCount || isNaN(activeCount)) {
    return 0;
  }

  // Ensure we don't have more active than total (data inconsistency check)
  if (activeCount > totalCount) {
    return 100;
  }

  return Math.round((activeCount / totalCount) * 100);
}

/**
 * Format a compliance display string
 *
 * @param compliantCount Number of compliant items
 * @param totalCount Total number of items
 * @returns Formatted string like "85% (170/200 compliant)" or "No data available"
 */
export function formatComplianceDisplay(
  compliantCount: number,
  totalCount: number
): string {
  if (totalCount === 0 || !totalCount || isNaN(totalCount)) {
    return 'No data available';
  }

  const rate = calculateComplianceRate(compliantCount, totalCount);
  return `${rate}% (${compliantCount}/${totalCount} compliant)`;
}
