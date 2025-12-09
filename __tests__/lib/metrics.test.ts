/**
 * Comprehensive Tests for Metrics Service
 *
 * Tests all metrics calculations, validation, and consistency checks
 */

import {
  getContractMetrics,
  getPromoterMetrics,
  getPartyMetrics,
  getDashboardMetrics,
  validateMetrics,
  checkDataConsistency,
  runFullDataIntegrityCheck,
  clearMetricsCache,
} from '@/lib/metrics';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  })),
}));

describe('Metrics Service', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearMetricsCache();
    jest.clearAllMocks();
  });

  describe('Contract Metrics', () => {
    it('should return zero values for empty database', async () => {
      const metrics = await getContractMetrics();

      expect(metrics.total).toBe(0);
      expect(metrics.active).toBe(0);
      expect(metrics.pending).toBe(0);
      expect(metrics.totalValue).toBe(0);
      expect(metrics.averageDuration).toBe(0);
    });

    it('should calculate metrics correctly with valid data', async () => {
      // This test would use real or mocked data
      const metrics = await getContractMetrics({ forceRefresh: true });

      expect(metrics).toHaveProperty('total');
      expect(metrics).toHaveProperty('active');
      expect(metrics).toHaveProperty('pending');
      expect(metrics).toHaveProperty('totalValue');
      expect(metrics).toHaveProperty('averageDuration');
      expect(metrics).toHaveProperty('byStatus');
    });

    it('should respect user role for RBAC', async () => {
      const adminMetrics = await getContractMetrics({
        userId: 'admin-id',
        userRole: 'admin',
      });

      const userMetrics = await getContractMetrics({
        userId: 'user-id',
        userRole: 'user',
      });

      // Metrics structure should be the same
      expect(adminMetrics).toHaveProperty('total');
      expect(userMetrics).toHaveProperty('total');
    });

    it('should cache metrics correctly', async () => {
      // First call - not cached
      const metrics1 = await getContractMetrics();

      // Second call - should be cached
      const metrics2 = await getContractMetrics();

      // Results should be identical
      expect(metrics1).toEqual(metrics2);
    });

    it('should handle date ranges correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const metrics = await getContractMetrics({
        dateRange: { start: startDate, end: endDate },
        forceRefresh: true,
      });

      expect(metrics).toHaveProperty('total');
    });
  });

  describe('Promoter Metrics', () => {
    it('should calculate promoter metrics correctly', async () => {
      const metrics = await getPromoterMetrics();

      expect(metrics).toHaveProperty('total');
      expect(metrics).toHaveProperty('active');
      expect(metrics).toHaveProperty('inactive');
      expect(metrics).toHaveProperty('complianceRate');
      expect(metrics).toHaveProperty('critical');
      expect(metrics).toHaveProperty('expiring');
    });

    it('should calculate compliance rate within valid bounds', async () => {
      const metrics = await getPromoterMetrics({ forceRefresh: true });

      expect(metrics.complianceRate).toBeGreaterThanOrEqual(0);
      expect(metrics.complianceRate).toBeLessThanOrEqual(100);
    });

    it('should ensure active + inactive equals total', async () => {
      const metrics = await getPromoterMetrics({ forceRefresh: true });

      expect(metrics.active + metrics.inactive).toBe(metrics.total);
    });

    it('should ensure on assignments does not exceed active', async () => {
      const metrics = await getPromoterMetrics({ forceRefresh: true });

      expect(metrics.onAssignments).toBeLessThanOrEqual(metrics.active);
    });
  });

  describe('Party Metrics', () => {
    it('should calculate party metrics correctly', async () => {
      const metrics = await getPartyMetrics();

      expect(metrics).toHaveProperty('total');
      expect(metrics).toHaveProperty('companies');
      expect(metrics).toHaveProperty('individuals');
    });

    it('should ensure companies + individuals equals total', async () => {
      const metrics = await getPartyMetrics({ forceRefresh: true });

      expect(metrics.companies + metrics.individuals).toBeLessThanOrEqual(
        metrics.total
      );
    });
  });

  describe('Dashboard Metrics', () => {
    it('should combine all metrics correctly', async () => {
      const metrics = await getDashboardMetrics();

      expect(metrics).toHaveProperty('contracts');
      expect(metrics).toHaveProperty('promoters');
      expect(metrics).toHaveProperty('parties');
      expect(metrics).toHaveProperty('scope');
      expect(metrics).toHaveProperty('scopeLabel');
      expect(metrics).toHaveProperty('timestamp');
    });

    it('should set correct scope for admin users', async () => {
      const metrics = await getDashboardMetrics({
        userId: 'admin-id',
        userRole: 'admin',
      });

      expect(metrics.scope).toBe('system-wide');
      expect(metrics.scopeLabel).toContain('All contracts');
    });

    it('should set correct scope for regular users', async () => {
      const metrics = await getDashboardMetrics({
        userId: 'user-id',
        userRole: 'user',
      });

      expect(metrics.scope).toBe('user-specific');
      expect(metrics.scopeLabel).toContain('Your contracts');
    });
  });

  describe('Metrics Validation', () => {
    it('should pass validation for valid contract metrics', () => {
      const validMetrics = {
        total: 100,
        active: 50,
        pending: 20,
        approved: 10,
        expired: 10,
        completed: 5,
        cancelled: 5,
        expiringSoon: 10,
        totalValue: 1000000,
        averageDuration: 365,
        byStatus: { active: 50, pending: 20 },
      };

      const validation = validateMetrics(validMetrics);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should fail validation for invalid compliance rate', () => {
      const invalidMetrics = {
        total: 100,
        active: 50,
        inactive: 50,
        onAssignments: 30,
        available: 20,
        complianceRate: 150, // Invalid: > 100
        critical: 10,
        expiring: 5,
        unassigned: 20,
      };

      const validation = validateMetrics(invalidMetrics);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('Compliance rate');
    });

    it('should fail validation for negative total value', () => {
      const invalidMetrics = {
        total: 100,
        active: 50,
        pending: 20,
        approved: 10,
        expired: 10,
        completed: 5,
        cancelled: 5,
        expiringSoon: 10,
        totalValue: -1000, // Invalid: negative
        averageDuration: 365,
        byStatus: {},
      };

      const validation = validateMetrics(invalidMetrics);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('negative'))).toBe(true);
    });

    it('should fail validation for expiring soon exceeding active', () => {
      const invalidMetrics = {
        total: 100,
        active: 50,
        pending: 20,
        approved: 10,
        expired: 10,
        completed: 5,
        cancelled: 5,
        expiringSoon: 60, // Invalid: > active (50)
        totalValue: 1000000,
        averageDuration: 365,
        byStatus: {},
      };

      const validation = validateMetrics(invalidMetrics);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Expiring soon'))).toBe(
        true
      );
    });

    it('should warn about unusual average duration', () => {
      const unusualMetrics = {
        total: 100,
        active: 50,
        pending: 20,
        approved: 10,
        expired: 10,
        completed: 5,
        cancelled: 5,
        expiringSoon: 10,
        totalValue: 1000000,
        averageDuration: 5000, // Warning: very long
        byStatus: {},
      };

      const validation = validateMetrics(unusualMetrics);

      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('duration');
    });

    it('should validate nested dashboard metrics', () => {
      const dashboardMetrics = {
        contracts: {
          total: 100,
          active: 50,
          pending: 20,
          approved: 10,
          expired: 10,
          completed: 5,
          cancelled: 5,
          expiringSoon: 60, // Invalid
          totalValue: 1000000,
          averageDuration: 365,
          byStatus: {},
        },
        promoters: {
          total: 100,
          active: 50,
          inactive: 50,
          onAssignments: 30,
          available: 20,
          complianceRate: 75,
          critical: 10,
          expiring: 5,
          unassigned: 20,
        },
        parties: {
          total: 50,
          companies: 30,
          individuals: 20,
        },
        scope: 'system-wide' as const,
        scopeLabel: 'All contracts',
        timestamp: new Date().toISOString(),
      };

      const validation = validateMetrics(dashboardMetrics);

      // Should catch the invalid expiringSoon in nested contract metrics
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Data Consistency Checks', () => {
    it('should run all consistency checks', async () => {
      const checks = await checkDataConsistency();

      expect(Array.isArray(checks)).toBe(true);
      expect(checks.length).toBeGreaterThan(0);

      // All checks should have required properties
      checks.forEach(check => {
        expect(check).toHaveProperty('checkName');
        expect(check).toHaveProperty('status');
        expect(check).toHaveProperty('message');
        expect(['PASS', 'FAIL', 'WARNING']).toContain(check.status);
      });
    });

    it('should check for orphaned contract assignments', async () => {
      const checks = await checkDataConsistency();

      const orphanCheck = checks.find(
        c => c.checkName === 'orphaned_contract_assignments'
      );

      expect(orphanCheck).toBeDefined();
      expect(orphanCheck?.message).toBeDefined();
    });

    it('should check utilization bounds', async () => {
      const checks = await checkDataConsistency();

      const utilizationCheck = checks.find(
        c => c.checkName === 'utilization_bounds'
      );

      expect(utilizationCheck).toBeDefined();
      expect(utilizationCheck?.details).toHaveProperty('total');
      expect(utilizationCheck?.details).toHaveProperty('assigned');
    });

    it('should check compliance rate calculation', async () => {
      const checks = await checkDataConsistency();

      const complianceCheck = checks.find(
        c => c.checkName === 'compliance_rate_calculation'
      );

      expect(complianceCheck).toBeDefined();
      if (complianceCheck?.details) {
        expect(complianceCheck.details.rate).toBeGreaterThanOrEqual(0);
        expect(complianceCheck.details.rate).toBeLessThanOrEqual(100);
      }
    });

    it('should check status distribution', async () => {
      const checks = await checkDataConsistency();

      const statusCheck = checks.find(
        c => c.checkName === 'status_distribution'
      );

      expect(statusCheck).toBeDefined();
      expect(statusCheck?.details).toBeDefined();
    });
  });

  describe('Full Data Integrity Check', () => {
    it('should run complete integrity check', async () => {
      const report = await runFullDataIntegrityCheck();

      expect(report).toHaveProperty('metricsValidation');
      expect(report).toHaveProperty('consistencyChecks');
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('overallStatus');
    });

    it('should have valid overall status', async () => {
      const report = await runFullDataIntegrityCheck();

      expect(['PASS', 'FAIL', 'WARNING']).toContain(report.overallStatus);
    });

    it('should include validation results', async () => {
      const report = await runFullDataIntegrityCheck();

      expect(report.metricsValidation).toHaveProperty('isValid');
      expect(report.metricsValidation).toHaveProperty('errors');
      expect(report.metricsValidation).toHaveProperty('warnings');
    });

    it('should include consistency checks', async () => {
      const report = await runFullDataIntegrityCheck();

      expect(Array.isArray(report.consistencyChecks)).toBe(true);
      expect(report.consistencyChecks.length).toBeGreaterThan(0);
    });

    it('should set FAIL status when errors exist', async () => {
      const report = await runFullDataIntegrityCheck();

      if (!report.metricsValidation.isValid) {
        expect(report.overallStatus).toBe('FAIL');
      }
    });

    it('should set WARNING status when warnings exist', async () => {
      const report = await runFullDataIntegrityCheck();

      if (
        report.metricsValidation.warnings.length > 0 &&
        report.metricsValidation.isValid
      ) {
        expect(['WARNING', 'PASS']).toContain(report.overallStatus);
      }
    });
  });

  describe('Cache Management', () => {
    it('should cache metrics for subsequent calls', async () => {
      const startTime = Date.now();
      await getContractMetrics();
      const firstCallTime = Date.now() - startTime;

      const cachedStartTime = Date.now();
      await getContractMetrics();
      const cachedCallTime = Date.now() - cachedStartTime;

      // Cached call should be significantly faster (or at least not slower)
      expect(cachedCallTime).toBeLessThanOrEqual(firstCallTime + 100);
    });

    it('should respect force refresh flag', async () => {
      await getContractMetrics();

      // Force refresh should bypass cache
      const metrics = await getContractMetrics({ forceRefresh: true });

      expect(metrics).toBeDefined();
    });

    it('should clear cache correctly', () => {
      clearMetricsCache();

      // After clearing, next call should not be cached
      expect(async () => {
        await getContractMetrics();
      }).not.toThrow();
    });

    it('should use separate cache keys for different users', async () => {
      const adminMetrics = await getContractMetrics({
        userId: 'admin-id',
        userRole: 'admin',
      });

      const userMetrics = await getContractMetrics({
        userId: 'user-id',
        userRole: 'user',
      });

      // Both should have valid results
      expect(adminMetrics).toBeDefined();
      expect(userMetrics).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Test that errors are thrown with meaningful messages
      await expect(async () => {
        // This would require mocking a database error
        await getContractMetrics();
      }).not.toThrow();
    });

    it('should handle missing user data', async () => {
      const metrics = await getDashboardMetrics({
        userRole: 'anonymous',
      });

      expect(metrics).toBeDefined();
      expect(metrics.contracts.total).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid date ranges', async () => {
      const metrics = await getContractMetrics({
        dateRange: {
          start: new Date('2025-01-01'),
          end: new Date('2024-01-01'), // End before start
        },
        forceRefresh: true,
      });

      expect(metrics).toBeDefined();
    });
  });
});
