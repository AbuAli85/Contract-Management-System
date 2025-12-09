/**
 * Metrics Data Validation Service
 * Ensures data integrity and consistency across all metric calculations
 *
 * Created: October 27, 2025
 * Purpose: Fix critical data integrity issues identified in review
 */

export interface MetricsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics?: {
    name: string;
    value: number;
    expected?: number;
  }[];
}

export interface ValidationRule {
  name: string;
  check: (data: any) => boolean;
  errorMessage: string;
  severity: 'error' | 'warning';
}

/**
 * Validation Rules for Contract Metrics
 */
export const contractMetricsRules: ValidationRule[] = [
  {
    name: 'total_equals_sum',
    check: data => {
      const sum =
        data.active +
        data.pending +
        data.approved +
        data.expired +
        data.completed +
        data.cancelled;
      return Math.abs(data.total - sum) <= 1; // Allow 1 unit tolerance for rounding
    },
    errorMessage: 'Total contracts does not equal sum of status counts',
    severity: 'error',
  },
  {
    name: 'non_negative_counts',
    check: data => {
      return Object.values(data).every(val =>
        typeof val === 'number' ? val >= 0 : true
      );
    },
    errorMessage: 'Found negative count values',
    severity: 'error',
  },
  {
    name: 'active_not_greater_than_total',
    check: data => data.active <= data.total,
    errorMessage: 'Active contracts cannot exceed total contracts',
    severity: 'error',
  },
  {
    name: 'expiring_not_greater_than_active',
    check: data => data.expiringSoon <= data.active,
    errorMessage: 'Expiring contracts cannot exceed active contracts',
    severity: 'warning',
  },
];

/**
 * Validation Rules for Promoter Metrics
 */
export const promoterMetricsRules: ValidationRule[] = [
  {
    name: 'workforce_consistency',
    check: data => {
      const sum =
        data.activeOnContracts +
        data.availableForWork +
        data.onLeave +
        data.inactive +
        data.terminated;
      return Math.abs(data.totalWorkforce - sum) <= 1;
    },
    errorMessage: 'Total workforce does not match sum of status categories',
    severity: 'error',
  },
  {
    name: 'utilization_bounds',
    check: data => {
      return data.utilizationRate >= 0 && data.utilizationRate <= 100;
    },
    errorMessage: 'Utilization rate must be between 0 and 100',
    severity: 'error',
  },
  {
    name: 'compliance_bounds',
    check: data => {
      return data.complianceRate >= 0 && data.complianceRate <= 100;
    },
    errorMessage: 'Compliance rate must be between 0 and 100',
    severity: 'error',
  },
  {
    name: 'active_on_contracts_not_greater_than_available',
    check: data => {
      const available = data.activeOnContracts + data.availableForWork;
      return data.activeOnContracts <= available;
    },
    errorMessage: 'Active on contracts cannot exceed available workforce',
    severity: 'error',
  },
  {
    name: 'compliance_sum_not_greater_than_total',
    check: data => {
      const sum =
        data.fullyCompliant + data.expiringDocuments + data.expiredDocuments;
      return sum <= data.totalWorkforce;
    },
    errorMessage: 'Sum of compliance categories exceeds total workforce',
    severity: 'warning',
  },
];

/**
 * Validate contract metrics
 */
export function validateContractMetrics(metrics: any): MetricsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  contractMetricsRules.forEach(rule => {
    if (!rule.check(metrics)) {
      if (rule.severity === 'error') {
        errors.push(`[${rule.name}] ${rule.errorMessage}`);
      } else {
        warnings.push(`[${rule.name}] ${rule.errorMessage}`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metrics: [
      { name: 'total', value: metrics.total },
      { name: 'active', value: metrics.active },
      { name: 'pending', value: metrics.pending },
      {
        name: 'sum_of_statuses',
        value:
          metrics.active +
          metrics.pending +
          metrics.approved +
          metrics.expired +
          metrics.completed +
          metrics.cancelled,
      },
    ],
  };
}

/**
 * Validate promoter metrics
 */
export function validatePromoterMetrics(metrics: any): MetricsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  promoterMetricsRules.forEach(rule => {
    if (!rule.check(metrics)) {
      if (rule.severity === 'error') {
        errors.push(`[${rule.name}] ${rule.errorMessage}`);
      } else {
        warnings.push(`[${rule.name}] ${rule.errorMessage}`);
      }
    }
  });

  const statusSum =
    metrics.activeOnContracts +
    metrics.availableForWork +
    metrics.onLeave +
    metrics.inactive +
    metrics.terminated;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metrics: [
      { name: 'totalWorkforce', value: metrics.totalWorkforce },
      { name: 'statusSum', value: statusSum, expected: metrics.totalWorkforce },
      { name: 'utilizationRate', value: metrics.utilizationRate },
      { name: 'complianceRate', value: metrics.complianceRate },
    ],
  };
}

/**
 * Cross-metric validation (checks consistency across different metric sources)
 */
export function validateCrossMetrics(
  contractMetrics: any,
  promoterMetrics: any
): MetricsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check 1: If there are active contracts, there should be promoters on contracts
  if (contractMetrics.active > 0 && promoterMetrics.activeOnContracts === 0) {
    warnings.push(
      'There are active contracts but no promoters assigned to them'
    );
  }

  // Check 2: If promoters are on contracts, there should be active contracts
  if (promoterMetrics.activeOnContracts > 0 && contractMetrics.active === 0) {
    errors.push(
      'Promoters are assigned to contracts but no contracts are marked as active'
    );
  }

  // Check 3: Promoters on contracts cannot exceed total promoters
  if (promoterMetrics.activeOnContracts > promoterMetrics.totalWorkforce) {
    errors.push('Promoters on contracts exceeds total workforce');
  }

  // Check 4: If workforce is 0, utilization should be 0
  if (
    promoterMetrics.totalWorkforce === 0 &&
    promoterMetrics.utilizationRate !== 0
  ) {
    errors.push('Utilization rate is non-zero with zero workforce');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Comprehensive validation of all metrics
 */
export function validateAllMetrics(
  contractMetrics: any,
  promoterMetrics: any
): MetricsValidationResult {
  const contractValidation = validateContractMetrics(contractMetrics);
  const promoterValidation = validatePromoterMetrics(promoterMetrics);
  const crossValidation = validateCrossMetrics(
    contractMetrics,
    promoterMetrics
  );

  return {
    isValid:
      contractValidation.isValid &&
      promoterValidation.isValid &&
      crossValidation.isValid,
    errors: [
      ...contractValidation.errors.map(e => `[Contracts] ${e}`),
      ...promoterValidation.errors.map(e => `[Promoters] ${e}`),
      ...crossValidation.errors.map(e => `[Cross-Metrics] ${e}`),
    ],
    warnings: [
      ...contractValidation.warnings.map(w => `[Contracts] ${w}`),
      ...promoterValidation.warnings.map(w => `[Promoters] ${w}`),
      ...crossValidation.warnings.map(w => `[Cross-Metrics] ${w}`),
    ],
    metrics: [
      ...(contractValidation.metrics || []),
      ...(promoterValidation.metrics || []),
    ],
  };
}
