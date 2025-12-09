/**
 * Promoter Status System
 * Clear definitions for promoter workforce status
 */

/**
 * Promoter Status Enum
 * Defines the current employment/availability status of a promoter
 */
export enum PromoterStatus {
  /** Currently assigned to contracts and actively working */
  ACTIVE = 'active',

  /** Ready for assignment but not currently assigned to any contracts */
  AVAILABLE = 'available',

  /** Temporarily unavailable (vacation, sick leave, personal leave) */
  ON_LEAVE = 'on_leave',

  /** Not available for assignments (suspended, pending approval, etc.) */
  INACTIVE = 'inactive',

  /** No longer with company (resigned, contract ended, terminated) */
  TERMINATED = 'terminated',
}

/**
 * Status Definitions with Descriptions
 */
export const PROMOTER_STATUS_DEFINITIONS = {
  [PromoterStatus.ACTIVE]: {
    label: 'Active',
    description: 'Currently assigned to contracts',
    color: 'green',
    icon: '✅',
    tooltip: 'Promoter is currently working on active contract assignments',
  },
  [PromoterStatus.AVAILABLE]: {
    label: 'Available',
    description: 'Ready for assignment',
    color: 'blue',
    icon: '🟦',
    tooltip: 'Promoter is registered and ready to be assigned to contracts',
  },
  [PromoterStatus.ON_LEAVE]: {
    label: 'On Leave',
    description: 'Temporarily unavailable',
    color: 'yellow',
    icon: '⏸️',
    tooltip: 'Promoter is on vacation, sick leave, or other temporary leave',
  },
  [PromoterStatus.INACTIVE]: {
    label: 'Inactive',
    description: 'Not available for assignments',
    color: 'gray',
    icon: '⭕',
    tooltip:
      'Promoter is not currently available (suspended, pending approval, etc.)',
  },
  [PromoterStatus.TERMINATED]: {
    label: 'Terminated',
    description: 'No longer with company',
    color: 'red',
    icon: '🚫',
    tooltip: 'Promoter has left the company or contract has ended',
  },
} as const;

/**
 * Type guard to check if a string is a valid promoter status
 */
export function isValidPromoterStatus(
  status: string
): status is PromoterStatus {
  return Object.values(PromoterStatus).includes(status as PromoterStatus);
}

/**
 * Get status definition by status value
 */
export function getStatusDefinition(status: PromoterStatus) {
  return PROMOTER_STATUS_DEFINITIONS[status];
}

/**
 * Get all status options for dropdowns/selects
 */
export function getStatusOptions() {
  return Object.values(PromoterStatus).map(status => ({
    value: status,
    label: PROMOTER_STATUS_DEFINITIONS[status].label,
    description: PROMOTER_STATUS_DEFINITIONS[status].description,
  }));
}

/**
 * Extended Promoter Metrics with Clear Status Categories
 */
export interface EnhancedPromoterMetrics {
  // Total Counts
  totalWorkforce: number; // All registered promoters

  // By Status
  activeOnContracts: number; // Currently working (assigned to active contracts)
  availableForWork: number; // Ready but not assigned
  onLeave: number; // Temporarily unavailable
  inactive: number; // Not available for assignments
  terminated: number; // No longer with company

  // Document Compliance
  fullyCompliant: number; // All documents valid
  expiringDocuments: number; // Documents expiring within 30 days
  expiredDocuments: number; // Documents already expired
  complianceRate: number; // Percentage of fully compliant

  // Utilization
  utilizationRate: number; // Percentage of available workforce on contracts
  averageContractsPerPromoter: number;

  // Additional Details
  details: {
    byStatus: Record<PromoterStatus, number>;
    criticalIds: number;
    criticalPassports: number;
    expiringIds: number;
    expiringPassports: number;
  };
}

/**
 * Metric Labels with Tooltips
 */
export const PROMOTER_METRIC_LABELS = {
  totalWorkforce: {
    title: 'Total Workforce',
    subtitle: 'All registered',
    tooltip:
      'Total number of promoters registered in the system (includes all statuses)',
  },
  activeOnContracts: {
    title: 'Active Promoters',
    subtitle: 'On assignments',
    tooltip: 'Promoters currently working on active contract assignments',
  },
  availableForWork: {
    title: 'Available',
    subtitle: 'Ready for work',
    tooltip:
      'Promoters registered and ready to be assigned to contracts but not currently working',
  },
  onLeave: {
    title: 'On Leave',
    subtitle: 'Temporary absence',
    tooltip:
      'Promoters temporarily unavailable due to vacation, sick leave, or personal leave',
  },
  inactive: {
    title: 'Inactive',
    subtitle: 'Not available',
    tooltip:
      'Promoters not available for assignments (suspended, pending approval, etc.)',
  },
  terminated: {
    title: 'Terminated',
    subtitle: 'Left company',
    tooltip:
      'Promoters who have left the company or whose contracts have ended',
  },
  utilizationRate: {
    title: 'Utilization Rate',
    subtitle: 'Workforce efficiency',
    tooltip: 'Percentage of available workforce currently working on contracts',
  },
  complianceRate: {
    title: 'Compliance Rate',
    subtitle: 'Document status',
    tooltip: 'Percentage of promoters with all documents valid and up-to-date',
  },
} as const;
