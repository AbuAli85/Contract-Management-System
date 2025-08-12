// ========================================
// 🛡️ RBAC AUDIT LOGGING TESTS
// ========================================

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  AuditLogger,
  PermissionUsageData,
  RoleChangeData,
} from '../lib/rbac/audit';
import { NextRequest } from 'next/server';

// Mock Supabase
jest.mock('../lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({ data: { id: 'audit123' }, error: null })
          ),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    })),
  })),
}));

describe('RBAC Audit Logging', () => {
  let auditLogger: AuditLogger;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create audit logger instance
    auditLogger = new AuditLogger();

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({ data: { id: 'audit123' }, error: null })
            ),
          })),
        })),
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
    };

    // Replace the supabase property for testing
    (auditLogger as any).supabase = mockSupabase;
  });

  describe('Permission Usage Logging', () => {
    it('should log permission usage with all required fields', async () => {
      const permissionData: PermissionUsageData = {
        user_id: 'user123',
        permission: 'user:read:own',
        path: '/api/users/123',
        result: 'ALLOW',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        context: { resourceId: '123' },
      };

      const result = await auditLogger.logPermissionUsage(permissionData);

      expect(result).toBe('audit123');
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user123',
          event_type: 'PERMISSION_CHECK',
          permission: 'user:read:own',
          resource: 'user',
          action: 'read',
          result: 'ALLOW',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          changed_by: 'user123',
        })
      );
    });

    it('should extract resource and action from permission string', async () => {
      const permissionData: PermissionUsageData = {
        user_id: 'user123',
        permission: 'contract:write:organization',
        path: '/api/contracts/456',
        result: 'DENY',
      };

      await auditLogger.logPermissionUsage(permissionData);

      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: 'contract',
          action: 'write',
        })
      );
    });

    it('should handle missing optional fields gracefully', async () => {
      const permissionData: PermissionUsageData = {
        user_id: 'user123',
        permission: 'user:read:own',
        path: '/api/users/123',
        result: 'ALLOW',
        // Missing ip_address, user_agent, context
      };

      const result = await auditLogger.logPermissionUsage(permissionData);

      expect(result).toBe('audit123');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: null,
          user_agent: null,
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: 'Database error',
      });

      const permissionData: PermissionUsageData = {
        user_id: 'user123',
        permission: 'user:read:own',
        path: '/api/users/123',
        result: 'ALLOW',
      };

      const result = await auditLogger.logPermissionUsage(permissionData);

      expect(result).toBeNull();
    });
  });

  describe('Role Change Logging', () => {
    it('should log role changes with all required fields', async () => {
      const roleChangeData: RoleChangeData = {
        user_id: 'user123',
        old_roles: ['user'],
        new_roles: ['user', 'admin'],
        changed_by: 'admin456',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        reason: 'Promotion to admin',
      };

      const result = await auditLogger.logRoleChange(roleChangeData);

      expect(result).toBe('audit123');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user123',
          event_type: 'ROLE_CHANGE',
          resource: 'role',
          action: 'assign',
          result: 'ALLOW',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          old_value: { roles: ['user'] },
          new_value: { roles: ['user', 'admin'] },
          changed_by: 'admin456',
        })
      );
    });
  });

  describe('Permission Grant/Revoke Logging', () => {
    it('should log permission grants', async () => {
      const result = await auditLogger.logPermissionGrant(
        'user123',
        'user:write:all',
        'admin456',
        { reason: 'New responsibility' }
      );

      expect(result).toBe('audit123');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user123',
          event_type: 'PERMISSION_GRANT',
          permission: 'user:write:all',
          resource: 'user',
          action: 'write',
          result: 'ALLOW',
          new_value: {
            permission: 'user:write:all',
            granted_by: 'admin456',
            context: { reason: 'New responsibility' },
          },
          changed_by: 'admin456',
        })
      );
    });

    it('should log permission revocations', async () => {
      const result = await auditLogger.logPermissionRevoke(
        'user123',
        'user:delete:all',
        'admin456',
        'Security violation'
      );

      expect(result).toBe('audit123');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user123',
          event_type: 'PERMISSION_REVOKE',
          permission: 'user:delete:all',
          resource: 'user',
          action: 'delete',
          result: 'DENY',
          old_value: { permission: 'user:delete:all' },
          new_value: {
            permission: 'user:delete:all',
            revoked_by: 'admin456',
            reason: 'Security violation',
          },
          changed_by: 'admin456',
        })
      );
    });
  });

  describe('General Audit Event Logging', () => {
    it('should log general audit events', async () => {
      const auditData = {
        user_id: 'user123',
        event_type: 'PERMISSION_CHECK' as const,
        permission: 'user:read:own',
        resource: 'user',
        action: 'read',
        result: 'ALLOW' as const,
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        old_value: null,
        new_value: null,
        changed_by: 'user123',
      };

      const result = await auditLogger.logAuditEvent(auditData);

      expect(result).toBe('audit123');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining(auditData)
      );
    });
  });

  describe('Audit Log Retrieval', () => {
    it('should retrieve user audit logs', async () => {
      const mockLogs = [
        { id: '1', event_type: 'PERMISSION_CHECK', result: 'ALLOW' },
        { id: '2', event_type: 'ROLE_CHANGE', result: 'ALLOW' },
      ];

      mockSupabase.from().select().eq().order().range.mockResolvedValue({
        data: mockLogs,
        error: null,
      });

      const logs = await auditLogger.getUserAuditLogs('user123', 10, 0);

      expect(logs).toEqual(mockLogs);
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
    });

    it('should retrieve audit logs by event type', async () => {
      const mockLogs = [
        { id: '1', event_type: 'PERMISSION_CHECK', result: 'ALLOW' },
        { id: '2', event_type: 'PERMISSION_CHECK', result: 'DENY' },
      ];

      mockSupabase.from().select().eq().order().range.mockResolvedValue({
        data: mockLogs,
        error: null,
      });

      const logs = await auditLogger.getAuditLogsByType(
        'PERMISSION_CHECK',
        10,
        0
      );

      expect(logs).toEqual(mockLogs);
    });

    it('should retrieve audit logs by result', async () => {
      const mockLogs = [
        { id: '1', event_type: 'PERMISSION_CHECK', result: 'ALLOW' },
        { id: '2', event_type: 'ROLE_CHANGE', result: 'ALLOW' },
      ];

      mockSupabase.from().select().eq().order().range.mockResolvedValue({
        data: mockLogs,
        error: null,
      });

      const logs = await auditLogger.getAuditLogsByResult('ALLOW', 10, 0);

      expect(logs).toEqual(mockLogs);
    });
  });

  describe('Audit Statistics', () => {
    it('should return audit statistics', async () => {
      // Mock count queries
      mockSupabase.from().select().mockResolvedValue({
        count: 100,
        error: null,
      });

      mockSupabase.from().select().gte().mockResolvedValue({
        count: 5,
        error: null,
      });

      // Mock result data
      mockSupabase
        .from()
        .select()
        .mockResolvedValue({
          data: [
            { result: 'ALLOW' },
            { result: 'ALLOW' },
            { result: 'DENY' },
            { result: 'WOULD_BLOCK' },
          ],
          error: null,
        });

      const stats = await auditLogger.getAuditStats();

      expect(stats).toMatchObject({
        total_logs: 100,
        allow_count: 2,
        deny_count: 1,
        would_block_count: 1,
        today_logs: 5,
      });
    });

    it('should handle statistics errors gracefully', async () => {
      // Mock error
      mockSupabase.from().select().mockResolvedValue({
        data: null,
        error: 'Database error',
      });

      const stats = await auditLogger.getAuditStats();

      expect(stats).toMatchObject({
        total_logs: 0,
        allow_count: 0,
        deny_count: 0,
        would_block_count: 0,
        today_logs: 0,
      });
    });
  });

  describe('Request Information Extraction', () => {
    it('should extract client IP from various headers', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            switch (header) {
              case 'x-forwarded-for':
                return '192.168.1.1, 10.0.0.1';
              case 'x-real-ip':
                return '192.168.1.2';
              case 'cf-connecting-ip':
                return '192.168.1.3';
              default:
                return null;
            }
          }),
        },
      } as any;

      const ip = AuditLogger.getClientIP(mockRequest);
      expect(ip).toBe('192.168.1.1'); // Should use first x-forwarded-for
    });

    it('should fall back to alternative IP sources', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            switch (header) {
              case 'x-forwarded-for':
                return null;
              case 'x-real-ip':
                return '192.168.1.2';
              case 'cf-connecting-ip':
                return '192.168.1.3';
              default:
                return null;
            }
          }),
        },
      } as any;

      const ip = AuditLogger.getClientIP(mockRequest);
      expect(ip).toBe('192.168.1.2'); // Should use x-real-ip
    });

    it('should return unknown when no IP headers found', () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null),
        },
      } as any;

      const ip = AuditLogger.getClientIP(mockRequest);
      expect(ip).toBe('unknown');
    });

    it('should extract user agent from request', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'user-agent') {
              return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
            }
            return null;
          }),
        },
      } as any;

      const userAgent = AuditLogger.getUserAgent(mockRequest);
      expect(userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    });

    it('should return unknown when no user agent found', () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null),
        },
      } as any;

      const userAgent = AuditLogger.getUserAgent(mockRequest);
      expect(userAgent).toBe('unknown');
    });
  });

  describe('Permission String Parsing', () => {
    it('should extract resource from permission string', () => {
      const resource = (auditLogger as any).extractResource('user:read:own');
      expect(resource).toBe('user');
    });

    it('should extract action from permission string', () => {
      const action = (auditLogger as any).extractAction('user:read:own');
      expect(action).toBe('read');
    });

    it('should handle malformed permission strings', () => {
      const resource = (auditLogger as any).extractResource('invalid');
      expect(resource).toBeNull();

      const action = (auditLogger as any).extractAction('invalid');
      expect(action).toBeNull();
    });

    it('should handle empty permission strings', () => {
      const resource = (auditLogger as any).extractResource('');
      expect(resource).toBeNull();

      const action = (auditLogger as any).extractAction('');
      expect(action).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      // Mock initialization error
      const failingLogger = new AuditLogger();
      (failingLogger as any).supabase = null;

      // Should not throw on permission usage
      const result = await failingLogger.logPermissionUsage({
        user_id: 'user123',
        permission: 'user:read:own',
        path: '/test',
        result: 'ALLOW',
      });

      expect(result).toBeNull();
    });

    it('should handle all database operation errors gracefully', async () => {
      // Mock various database errors
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: 'Insert error',
      });

      const permissionResult = await auditLogger.logPermissionUsage({
        user_id: 'user123',
        permission: 'user:read:own',
        path: '/test',
        result: 'ALLOW',
      });

      expect(permissionResult).toBeNull();

      // Mock role change error
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: 'Role change error',
      });

      const roleResult = await auditLogger.logRoleChange({
        user_id: 'user123',
        old_roles: ['user'],
        new_roles: ['admin'],
        changed_by: 'admin456',
      });

      expect(roleResult).toBeNull();
    });
  });
});
