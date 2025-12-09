/**
 * Metrics Validation Tests
 * Ensures data integrity and consistency across all metric calculations
 *
 * Created: October 27, 2025
 */

import {
  validateContractMetrics,
  validatePromoterMetrics,
  validateCrossMetrics,
  validateAllMetrics,
} from '@/lib/validation/metrics-validation';

describe('Contract Metrics Validation', () => {
  test('should pass validation for consistent contract metrics', () => {
    const metrics = {
      total: 100,
      active: 50,
      pending: 20,
      approved: 10,
      expired: 15,
      completed: 3,
      cancelled: 2,
      expiringSoon: 5,
      totalValue: 1000000,
      averageDuration: 365,
      byStatus: {},
    };

    const result = validateContractMetrics(metrics);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should fail when total does not match sum of statuses', () => {
    const metrics = {
      total: 100, // Should be 90
      active: 50,
      pending: 20,
      approved: 10,
      expired: 5,
      completed: 3,
      cancelled: 2,
      expiringSoon: 5,
      totalValue: 1000000,
      averageDuration: 365,
      byStatus: {},
    };

    const result = validateContractMetrics(metrics);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some(e => e.includes('Total contracts does not equal sum'))
    ).toBe(true);
  });

  test('should fail for negative counts', () => {
    const metrics = {
      total: 100,
      active: -10, // Invalid
      pending: 20,
      approved: 10,
      expired: 15,
      completed: 3,
      cancelled: 2,
      expiringSoon: 5,
      totalValue: 1000000,
      averageDuration: 365,
      byStatus: {},
    };

    const result = validateContractMetrics(metrics);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('negative count'))).toBe(true);
  });

  test('should fail when active exceeds total', () => {
    const metrics = {
      total: 50,
      active: 100, // Invalid
      pending: 0,
      approved: 0,
      expired: 0,
      completed: 0,
      cancelled: 0,
      expiringSoon: 5,
      totalValue: 1000000,
      averageDuration: 365,
      byStatus: {},
    };

    const result = validateContractMetrics(metrics);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some(e =>
        e.includes('Active contracts cannot exceed total')
      )
    ).toBe(true);
  });
});

describe('Promoter Metrics Validation', () => {
  test('should pass validation for consistent promoter metrics', () => {
    const metrics = {
      totalWorkforce: 100,
      activeOnContracts: 30,
      availableForWork: 40,
      onLeave: 10,
      inactive: 15,
      terminated: 5,
      fullyCompliant: 70,
      expiringDocuments: 20,
      expiredDocuments: 10,
      complianceRate: 70,
      utilizationRate: 43, // 30 / (30 + 40) * 100
      averageContractsPerPromoter: 1.2,
      details: {
        byStatus: {},
        criticalIds: 5,
        criticalPassports: 5,
        expiringIds: 10,
        expiringPassports: 10,
      },
    };

    const result = validatePromoterMetrics(metrics);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should fail when workforce total does not match sum', () => {
    const metrics = {
      totalWorkforce: 100, // Should be 95
      activeOnContracts: 30,
      availableForWork: 35,
      onLeave: 10,
      inactive: 15,
      terminated: 5,
      fullyCompliant: 70,
      expiringDocuments: 20,
      expiredDocuments: 10,
      complianceRate: 70,
      utilizationRate: 46,
      averageContractsPerPromoter: 1.2,
      details: {
        byStatus: {},
        criticalIds: 5,
        criticalPassports: 5,
        expiringIds: 10,
        expiringPassports: 10,
      },
    };

    const result = validatePromoterMetrics(metrics);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some(e => e.includes('Total workforce does not match'))
    ).toBe(true);
  });

  test('should fail for invalid utilization rate', () => {
    const metrics = {
      totalWorkforce: 100,
      activeOnContracts: 30,
      availableForWork: 40,
      onLeave: 10,
      inactive: 15,
      terminated: 5,
      fullyCompliant: 70,
      expiringDocuments: 20,
      expiredDocuments: 10,
      complianceRate: 70,
      utilizationRate: 150, // Invalid (> 100)
      averageContractsPerPromoter: 1.2,
      details: {
        byStatus: {},
        criticalIds: 5,
        criticalPassports: 5,
        expiringIds: 10,
        expiringPassports: 10,
      },
    };

    const result = validatePromoterMetrics(metrics);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some(e =>
        e.includes('Utilization rate must be between 0 and 100')
      )
    ).toBe(true);
  });

  test('should fail for invalid compliance rate', () => {
    const metrics = {
      totalWorkforce: 100,
      activeOnContracts: 30,
      availableForWork: 40,
      onLeave: 10,
      inactive: 15,
      terminated: 5,
      fullyCompliant: 70,
      expiringDocuments: 20,
      expiredDocuments: 10,
      complianceRate: -10, // Invalid (< 0)
      utilizationRate: 43,
      averageContractsPerPromoter: 1.2,
      details: {
        byStatus: {},
        criticalIds: 5,
        criticalPassports: 5,
        expiringIds: 10,
        expiringPassports: 10,
      },
    };

    const result = validatePromoterMetrics(metrics);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some(e =>
        e.includes('Compliance rate must be between 0 and 100')
      )
    ).toBe(true);
  });
});

describe('Cross-Metrics Validation', () => {
  test('should pass for consistent cross-metrics', () => {
    const contractMetrics = {
      total: 100,
      active: 50,
      pending: 20,
      approved: 10,
      expired: 15,
      completed: 3,
      cancelled: 2,
    };

    const promoterMetrics = {
      totalWorkforce: 100,
      activeOnContracts: 30,
      availableForWork: 40,
      onLeave: 10,
      inactive: 15,
      terminated: 5,
    };

    const result = validateCrossMetrics(contractMetrics, promoterMetrics);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should warn when active contracts exist but no promoters assigned', () => {
    const contractMetrics = {
      total: 100,
      active: 50, // Active contracts
      pending: 20,
    };

    const promoterMetrics = {
      totalWorkforce: 100,
      activeOnContracts: 0, // No promoters assigned
      availableForWork: 90,
    };

    const result = validateCrossMetrics(contractMetrics, promoterMetrics);
    expect(
      result.warnings.some(w => w.includes('active contracts but no promoters'))
    ).toBe(true);
  });

  test('should fail when promoters assigned but no active contracts', () => {
    const contractMetrics = {
      total: 100,
      active: 0, // No active contracts
      pending: 20,
    };

    const promoterMetrics = {
      totalWorkforce: 100,
      activeOnContracts: 30, // But promoters are assigned?
      availableForWork: 40,
    };

    const result = validateCrossMetrics(contractMetrics, promoterMetrics);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some(e =>
        e.includes(
          'Promoters are assigned to contracts but no contracts are marked as active'
        )
      )
    ).toBe(true);
  });

  test('should fail when promoters on contracts exceeds total workforce', () => {
    const contractMetrics = {
      total: 100,
      active: 50,
    };

    const promoterMetrics = {
      totalWorkforce: 50,
      activeOnContracts: 100, // Impossible
      availableForWork: 0,
    };

    const result = validateCrossMetrics(contractMetrics, promoterMetrics);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some(e =>
        e.includes('Promoters on contracts exceeds total workforce')
      )
    ).toBe(true);
  });
});

describe('All Metrics Validation', () => {
  test('should pass comprehensive validation for consistent metrics', () => {
    const contractMetrics = {
      total: 100,
      active: 50,
      pending: 20,
      approved: 10,
      expired: 15,
      completed: 3,
      cancelled: 2,
      expiringSoon: 5,
      totalValue: 1000000,
      averageDuration: 365,
      byStatus: {},
    };

    const promoterMetrics = {
      totalWorkforce: 100,
      activeOnContracts: 30,
      availableForWork: 40,
      onLeave: 10,
      inactive: 15,
      terminated: 5,
      fullyCompliant: 70,
      expiringDocuments: 20,
      expiredDocuments: 10,
      complianceRate: 70,
      utilizationRate: 43,
      averageContractsPerPromoter: 1.2,
      details: {
        byStatus: {},
        criticalIds: 5,
        criticalPassports: 5,
        expiringIds: 10,
        expiringPassports: 10,
      },
    };

    const result = validateAllMetrics(contractMetrics, promoterMetrics);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should catch multiple validation errors', () => {
    const contractMetrics = {
      total: 100, // Wrong
      active: 200, // Invalid (exceeds total)
      pending: 0,
      approved: 0,
      expired: 0,
      completed: 0,
      cancelled: 0,
      expiringSoon: 5,
      totalValue: 1000000,
      averageDuration: 365,
      byStatus: {},
    };

    const promoterMetrics = {
      totalWorkforce: 50,
      activeOnContracts: 100, // Invalid (exceeds workforce)
      availableForWork: 0,
      onLeave: 0,
      inactive: 0,
      terminated: 0,
      fullyCompliant: 40,
      expiringDocuments: 10,
      expiredDocuments: 0,
      complianceRate: 80,
      utilizationRate: 200, // Invalid (> 100)
      averageContractsPerPromoter: 1.2,
      details: {
        byStatus: {},
        criticalIds: 0,
        criticalPassports: 0,
        expiringIds: 5,
        expiringPassports: 5,
      },
    };

    const result = validateAllMetrics(contractMetrics, promoterMetrics);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});
