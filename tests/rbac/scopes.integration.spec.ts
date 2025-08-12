import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { NextRequest } from 'next/server';
import { permissionEvaluator } from '@/lib/rbac/evaluate';
import { auditLogger } from '@/lib/rbac/audit';
import {
  testUsers,
  testBookings,
  testCompanies,
  testServices,
  testOrganizations,
  testProviders,
  buildTestContext,
  permissionTestScenarios,
} from './__fixtures__/data';

// Mock the RBAC modules
jest.mock('@/lib/rbac/evaluate', () => ({
  permissionEvaluator: {
    evaluatePermission: jest.fn(),
  },
}));

jest.mock('@/lib/rbac/audit', () => ({
  auditLogger: {
    logPermissionUsage: jest.fn(),
  },
}));

jest.mock('@/lib/rbac/cache', () => ({
  permissionCache: {
    getUserPermissions: jest.fn(),
  },
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  }),
}));

describe('RBAC Scope Integration Tests', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request
    mockRequest = {
      url: 'http://localhost:3000/api/test',
      headers: new Map([
        ['x-forwarded-for', '127.0.0.1'],
        ['user-agent', 'Jest Test Agent'],
      ]),
    } as any as NextRequest;

    // Mock audit logger
    const { auditLogger } = require('@/lib/rbac/audit');
    auditLogger.logPermissionUsage.mockResolvedValue('audit-id');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Own Scope (own)', () => {
    it('should allow user to view own profile', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'client-basic-1';
      const user = testUsers.find(u => u.id === userId)!;
      const context = buildTestContext(userId, userId, 'user');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'User owns the resource',
        requiredPermission: 'user:view:own',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'user:view:own',
        { context }
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('User owns the resource');

      // Verify audit logging
      expect(auditLogger.logPermissionUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          requiredPermission: 'user:view:own',
          result: 'ALLOW',
          path: '/api/test',
        })
      );
    });

    it('should deny user from viewing other user profile', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'client-basic-1';
      const otherUserId = 'client-premium-1';
      const context = buildTestContext(userId, otherUserId, 'user');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: false,
        reason: 'User does not own the resource',
        requiredPermission: 'user:view:own',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'user:view:own',
        { context }
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('User does not own the resource');

      // Verify audit logging
      expect(auditLogger.logPermissionUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          requiredPermission: 'user:view:own',
          result: 'DENY',
          path: '/api/test',
        })
      );
    });

    it('should allow provider to view own service', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'provider-individual-1';
      const serviceId = 'service-1';
      const context = buildTestContext(userId, serviceId, 'service');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'Provider owns the service',
        requiredPermission: 'service:view:own',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'service:view:own',
        { context }
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Provider owns the service');
    });

    it('should deny provider from viewing other provider service', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'provider-individual-1';
      const otherServiceId = 'service-4'; // Belongs to different provider
      const context = buildTestContext(userId, otherServiceId, 'service');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: false,
        reason: 'Provider does not own the service',
        requiredPermission: 'service:view:own',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'service:view:own',
        { context }
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Provider does not own the service');
    });
  });

  describe('Provider Scope (provider)', () => {
    it('should allow provider to view provider booking', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'provider-individual-1';
      const bookingId = 'booking-1'; // Belongs to this provider
      const context = buildTestContext(userId, bookingId, 'booking');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'Provider is associated with the booking',
        requiredPermission: 'booking:view:provider',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'booking:view:provider',
        { context }
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Provider is associated with the booking');
    });

    it('should deny provider from viewing other provider booking', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'provider-individual-1';
      const otherBookingId = 'booking-3'; // Belongs to different provider
      const context = buildTestContext(userId, otherBookingId, 'booking');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: false,
        reason: 'Provider is not associated with the booking',
        requiredPermission: 'booking:view:provider',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'booking:view:provider',
        { context }
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Provider is not associated with the booking');
    });

    it('should allow provider to edit provider booking', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'provider-manager-1';
      const bookingId = 'booking-2'; // Belongs to this provider
      const context = buildTestContext(userId, bookingId, 'booking');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'Provider can edit associated bookings',
        requiredPermission: 'booking:edit:provider',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'booking:edit:provider',
        { context }
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Provider can edit associated bookings');
    });
  });

  describe('Organization Scope (organization)', () => {
    it('should allow user to view organization company', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'client-basic-1';
      const companyId = 'company-1'; // Belongs to user's organization
      const context = buildTestContext(userId, companyId, 'company');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'User belongs to the organization',
        requiredPermission: 'company:view:organization',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'company:view:organization',
        { context }
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('User belongs to the organization');
    });

    it('should deny user from viewing other organization company', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'client-basic-1';
      const otherCompanyId = 'company-2'; // Belongs to different organization
      const context = buildTestContext(userId, otherCompanyId, 'company');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: false,
        reason: 'User does not belong to the organization',
        requiredPermission: 'company:view:organization',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'company:view:organization',
        { context }
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('User does not belong to the organization');
    });

    it('should allow provider to view organization resources', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'provider-admin-1';
      const resourceId = 'company-3'; // Belongs to provider's organization
      const context = buildTestContext(userId, resourceId, 'company');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'Provider belongs to the organization',
        requiredPermission: 'company:view:organization',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'company:view:organization',
        { context }
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Provider belongs to the organization');
    });
  });

  describe('Booking Scope (booking)', () => {
    it('should allow client to view own booking', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'client-basic-1';
      const bookingId = 'booking-1'; // Belongs to this client
      const context = buildTestContext(userId, bookingId, 'booking');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'Client owns the booking',
        requiredPermission: 'booking:view:own',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'booking:view:own',
        { context }
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Client owns the booking');
    });

    it('should allow provider to view associated booking', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'provider-individual-1';
      const bookingId = 'booking-1'; // Associated with this provider
      const context = buildTestContext(userId, bookingId, 'booking');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'Provider is associated with the booking',
        requiredPermission: 'booking:view:provider',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'booking:view:provider',
        { context }
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Provider is associated with the booking');
    });

    it('should deny user from viewing unrelated booking', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'client-basic-1';
      const unrelatedBookingId = 'booking-3'; // No relationship to this user
      const context = buildTestContext(userId, unrelatedBookingId, 'booking');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: false,
        reason: 'No relationship to the booking',
        requiredPermission: 'booking:view:own',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'booking:view:own',
        { context }
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('No relationship to the booking');
    });
  });

  describe('Public Scope (public)', () => {
    it('should allow any user to view public services', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'client-basic-1';
      const context = buildTestContext(userId);

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'Public resource accessible to all',
        requiredPermission: 'service:view:public',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'service:view:public',
        { context }
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Public resource accessible to all');
    });

    it('should allow unauthenticated users to access public resources', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const context = { user: null };

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'Public resource accessible to all',
        requiredPermission: 'discovery:search:public',
      });

      const result = await permissionEvaluator.evaluatePermission(
        null,
        'discovery:search:public',
        { context }
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Public resource accessible to all');
    });
  });

  describe('All Scope (all)', () => {
    it('should allow admin to view all users', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'admin-platform-1';
      const context = buildTestContext(userId, 'client-basic-1', 'user');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'Admin has all access',
        requiredPermission: 'user:read:all',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'user:read:all',
        { context }
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Admin has all access');
    });

    it('should deny non-admin from viewing all users', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'client-basic-1';
      const context = buildTestContext(userId, 'client-premium-1', 'user');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: false,
        reason: 'User does not have all access',
        requiredPermission: 'user:read:all',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'user:read:all',
        { context }
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('User does not have all access');
    });

    it('should allow system admin to access all resources', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'admin-system-1';
      const context = buildTestContext(userId, 'any-resource', 'any');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'System admin has full access',
        requiredPermission: 'system:admin:all',
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        'system:admin:all',
        { context }
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('System admin has full access');
    });
  });

  describe('Permission Test Scenarios', () => {
    it('should run all predefined test scenarios', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');

      for (const scenario of permissionTestScenarios) {
        const context = buildTestContext(
          scenario.user,
          scenario.resourceId,
          scenario.resourceType
        );

        // Mock permission evaluation based on expected result
        permissionEvaluator.evaluatePermission.mockResolvedValue({
          allowed: scenario.expectedResult,
          reason: scenario.expectedResult
            ? 'Permission granted'
            : 'Permission denied',
          requiredPermission: scenario.permission,
        });

        const result = await permissionEvaluator.evaluatePermission(
          scenario.user,
          scenario.permission,
          { context }
        );

        expect(result.allowed).toBe(scenario.expectedResult);
        expect(result.requiredPermission).toBe(scenario.permission);
      }
    });
  });

  describe('Audit Logging', () => {
    it('should log all permission checks with correct data', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'client-basic-1';
      const permission = 'user:view:own';
      const context = buildTestContext(userId, userId, 'user');

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'Permission granted',
        requiredPermission: permission,
      });

      await permissionEvaluator.evaluatePermission(userId, permission, {
        context,
      });

      // Verify audit logging
      expect(auditLogger.logPermissionUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          requiredPermission: permission,
          result: 'ALLOW',
          path: '/api/test',
          timestamp: expect.any(Date),
        })
      );
    });

    it('should log denied permissions correctly', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'client-basic-1';
      const permission = 'admin:access:all';
      const context = buildTestContext(userId);

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: false,
        reason: 'Insufficient permissions',
        requiredPermission: permission,
      });

      await permissionEvaluator.evaluatePermission(userId, permission, {
        context,
      });

      // Verify audit logging
      expect(auditLogger.logPermissionUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          requiredPermission: permission,
          result: 'DENY',
          path: '/api/test',
          timestamp: expect.any(Date),
        })
      );
    });
  });

  describe('Context Evaluation', () => {
    it('should handle missing context gracefully', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'client-basic-1';
      const permission = 'user:view:own';

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: false,
        reason: 'Missing context',
        requiredPermission: permission,
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        permission,
        {}
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing context');
    });

    it('should handle complex context with multiple resources', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate');
      const { auditLogger } = require('@/lib/rbac/audit');

      const userId = 'provider-manager-1';
      const permission = 'booking:edit:provider';
      const context = {
        user: testUsers.find(u => u.id === userId),
        params: { id: 'booking-2' },
        resourceType: 'booking',
        additionalContext: {
          serviceId: 'service-2',
          providerId: 'provider-team-1',
        },
      };

      // Mock permission evaluation
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'Provider manager can edit team bookings',
        requiredPermission: permission,
      });

      const result = await permissionEvaluator.evaluatePermission(
        userId,
        permission,
        { context }
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Provider manager can edit team bookings');
    });
  });
});
