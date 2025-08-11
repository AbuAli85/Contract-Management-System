import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { AuditLogger } from '@/lib/rbac/audit'
import { guardPermission } from '@/lib/rbac/guard'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
  insert: jest.fn()
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase
}))

jest.mock('@/lib/rbac/evaluate', () => ({
  permissionEvaluator: {
    evaluatePermission: jest.fn()
  }
}))

jest.mock('@/lib/rbac/cache', () => ({
  permissionCache: {
    getUserPermissions: jest.fn()
  }
}))

describe('RBAC Audit Logging', () => {
  let auditLogger: AuditLogger
  let mockRequest: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset Supabase mocks
    mockSupabase.from.mockReset()
    mockSupabase.insert.mockReset()
    
    // Setup Supabase mock responses
    mockSupabase.from.mockReturnValue({
      insert: mockSupabase.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'audit-id-123' }, error: null })
        })
      })
    })
    
    // Create fresh audit logger instance
    auditLogger = new AuditLogger()
    
    // Mock request
    mockRequest = {
      url: 'http://localhost:3000/api/test',
      headers: new Map([
        ['x-forwarded-for', '127.0.0.1'],
        ['user-agent', 'Jest Test Agent']
      ])
    } as any as NextRequest
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Permission Usage Logging', () => {
    it('should log ALLOW permission checks', async () => {
      const auditData = {
        userId: 'test-user-123',
        requiredPermission: 'user:view:own',
        path: '/api/test',
        result: 'ALLOW' as const,
        ipAddress: '127.0.0.1',
        userAgent: 'Jest Test Agent',
        canonical: {
          resource: 'user',
          action: 'view',
          scope: 'own'
        }
      }

      const result = await auditLogger.logPermissionUsage(auditData)

      expect(result).toBe('audit-id-123')
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'test-user-123',
        event_type: 'PERMISSION_CHECK',
        permission: 'user:view:own',
        resource: 'user',
        action: 'view',
        result: 'ALLOW',
        ip_address: '127.0.0.1',
        user_agent: 'Jest Test Agent',
        timestamp: expect.any(Date)
      })
    })

    it('should log DENY permission checks', async () => {
      const auditData = {
        userId: 'test-user-123',
        requiredPermission: 'admin:access:all',
        path: '/api/admin',
        result: 'DENY' as const,
        ipAddress: '127.0.0.1',
        userAgent: 'Jest Test Agent',
        canonical: {
          resource: 'admin',
          action: 'access',
          scope: 'all'
        }
      }

      const result = await auditLogger.logPermissionUsage(auditData)

      expect(result).toBe('audit-id-123')
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'test-user-123',
        event_type: 'PERMISSION_CHECK',
        permission: 'admin:access:all',
        resource: 'admin',
        action: 'access',
        result: 'DENY',
        ip_address: '127.0.0.1',
        user_agent: 'Jest Test Agent',
        timestamp: expect.any(Date)
      })
    })

    it('should log WOULD_BLOCK permission checks (dry-run mode)', async () => {
      const auditData = {
        userId: 'test-user-123',
        requiredPermission: 'admin:access:all',
        path: '/api/admin',
        result: 'WOULD_BLOCK' as const,
        ipAddress: '127.0.0.1',
        userAgent: 'Jest Test Agent',
        canonical: {
          resource: 'admin',
          action: 'access',
          scope: 'all'
        }
      }

      const result = await auditLogger.logPermissionUsage(auditData)

      expect(result).toBe('audit-id-123')
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'test-user-123',
        event_type: 'PERMISSION_CHECK',
        permission: 'admin:access:all',
        resource: 'admin',
        action: 'access',
        result: 'WOULD_BLOCK',
        ip_address: '127.0.0.1',
        user_agent: 'Jest Test Agent',
        timestamp: expect.any(Date)
      })
    })

    it('should handle missing IP address gracefully', async () => {
      const auditData = {
        userId: 'test-user-123',
        requiredPermission: 'user:view:own',
        path: '/api/test',
        result: 'ALLOW' as const,
        ipAddress: undefined,
        userAgent: 'Jest Test Agent',
        canonical: {
          resource: 'user',
          action: 'view',
          scope: 'own'
        }
      }

      const result = await auditLogger.logPermissionUsage(auditData)

      expect(result).toBe('audit-id-123')
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: null
        })
      )
    })

    it('should handle missing user agent gracefully', async () => {
      const auditData = {
        userId: 'test-user-123',
        requiredPermission: 'user:view:own',
        path: '/api/test',
        result: 'ALLOW' as const,
        ipAddress: '127.0.0.1',
        userAgent: undefined,
        canonical: {
          resource: 'user',
          action: 'view',
          scope: 'own'
        }
      }

      const result = await auditLogger.logPermissionUsage(auditData)

      expect(result).toBe('audit-id-123')
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_agent: null
        })
      )
    })

    it('should handle missing canonical data gracefully', async () => {
      const auditData = {
        userId: 'test-user-123',
        requiredPermission: 'user:view:own',
        path: '/api/test',
        result: 'ALLOW' as const,
        ipAddress: '127.0.0.1',
        userAgent: 'Jest Test Agent',
        canonical: undefined
      }

      const result = await auditLogger.logPermissionUsage(auditData)

      expect(result).toBe('audit-id-123')
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: null,
          action: null
        })
      )
    })
  })

  describe('Role Change Logging', () => {
    it('should log role assignments', async () => {
      const auditData = {
        userId: 'test-user-123',
        oldRoles: ['Basic Client'],
        newRoles: ['Basic Client', 'Provider Team Member'],
        changedBy: 'admin-user-456',
        ipAddress: '127.0.0.1',
        userAgent: 'Jest Test Agent'
      }

      const result = await auditLogger.logRoleChange(auditData)

      expect(result).toBe('audit-id-123')
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'test-user-123',
        event_type: 'ROLE_CHANGE',
        old_value: JSON.stringify(['Basic Client']),
        new_value: JSON.stringify(['Basic Client', 'Provider Team Member']),
        changed_by: 'admin-user-456',
        ip_address: '127.0.0.1',
        user_agent: 'Jest Test Agent',
        timestamp: expect.any(Date)
      })
    })

    it('should log role removals', async () => {
      const auditData = {
        userId: 'test-user-123',
        oldRoles: ['Basic Client', 'Provider Team Member'],
        newRoles: ['Basic Client'],
        changedBy: 'admin-user-456',
        ipAddress: '127.0.0.1',
        userAgent: 'Jest Test Agent'
      }

      const result = await auditLogger.logRoleChange(auditData)

      expect(result).toBe('audit-id-123')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'test-user-123',
        event_type: 'ROLE_CHANGE',
        old_value: JSON.stringify(['Basic Client', 'Provider Team Member']),
        new_value: JSON.stringify(['Basic Client']),
        changed_by: 'admin-user-456',
        ip_address: '127.0.0.1',
        user_agent: 'Jest Test Agent',
        timestamp: expect.any(Date)
      })
    })

    it('should log complete role replacements', async () => {
      const auditData = {
        userId: 'test-user-123',
        oldRoles: ['Basic Client'],
        newRoles: ['Premium Client'],
        changedBy: 'admin-user-456',
        ipAddress: '127.0.0.1',
        userAgent: 'Jest Test Agent'
      }

      const result = await auditLogger.logRoleChange(auditData)

      expect(result).toBe('audit-id-123')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'test-user-123',
        event_type: 'ROLE_CHANGE',
        old_value: JSON.stringify(['Basic Client']),
        new_value: JSON.stringify(['Premium Client']),
        changed_by: 'admin-user-456',
        ip_address: '127.0.0.1',
        user_agent: 'Jest Test Agent',
        timestamp: expect.any(Date)
      })
    })

    it('should handle empty role arrays', async () => {
      const auditData = {
        userId: 'test-user-123',
        oldRoles: [],
        newRoles: ['Basic Client'],
        changedBy: 'admin-user-456',
        ipAddress: '127.0.0.1',
        userAgent: 'Jest Test Agent'
      }

      const result = await auditLogger.logRoleChange(auditData)

      expect(result).toBe('audit-id-123')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'test-user-123',
        event_type: 'ROLE_CHANGE',
        old_value: JSON.stringify([]),
        new_value: JSON.stringify(['Basic Client']),
        changed_by: 'admin-user-456',
        ip_address: '127.0.0.1',
        user_agent: 'Jest Test Agent',
        timestamp: expect.any(Date)
      })
    })
  })

  describe('General Audit Event Logging', () => {
    it('should log general audit events', async () => {
      const auditData = {
        userId: 'test-user-123',
        eventType: 'USER_LOGIN',
        details: { method: 'password', success: true },
        ipAddress: '127.0.0.1',
        userAgent: 'Jest Test Agent'
      }

      const result = await auditLogger.logAuditEvent(auditData)

      expect(result).toBe('audit-id-123')
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'test-user-123',
        event_type: 'USER_LOGIN',
        details: JSON.stringify({ method: 'password', success: true }),
        ip_address: '127.0.0.1',
        user_agent: 'Jest Test Agent',
        timestamp: expect.any(Date)
      })
    })

    it('should log system events without user ID', async () => {
      const auditData = {
        eventType: 'SYSTEM_STARTUP',
        details: { version: '1.0.0', timestamp: new Date().toISOString() },
        ipAddress: '127.0.0.1',
        userAgent: 'System'
      }

      const result = await auditLogger.logAuditEvent(auditData)

      expect(result).toBe('audit-id-123')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: null,
        event_type: 'SYSTEM_STARTUP',
        details: expect.any(String),
        ip_address: '127.0.0.1',
        user_agent: 'System',
        timestamp: expect.any(Date)
      })
    })
  })

  describe('Client Information Extraction', () => {
    it('should extract client IP from x-forwarded-for header', () => {
      const request = {
        headers: new Map([
          ['x-forwarded-for', '192.168.1.100, 10.0.0.1']
        ])
      } as any as NextRequest

      const clientIP = AuditLogger.getClientIP(request)
      expect(clientIP).toBe('192.168.1.100')
    })

    it('should extract client IP from x-real-ip header', () => {
      const request = {
        headers: new Map([
          ['x-real-ip', '203.0.113.1']
        ])
      } as any as NextRequest

      const clientIP = AuditLogger.getClientIP(request)
      expect(clientIP).toBe('203.0.113.1')
    })

    it('should fallback to x-forwarded-for when x-real-ip is not present', () => {
      const request = {
        headers: new Map([
          ['x-forwarded-for', '172.16.0.100']
        ])
      } as any as NextRequest

      const clientIP = AuditLogger.getClientIP(request)
      expect(clientIP).toBe('172.16.0.100')
    })

    it('should return null when no IP headers are present', () => {
      const request = {
        headers: new Map()
      } as any as NextRequest

      const clientIP = AuditLogger.getClientIP(request)
      expect(clientIP).toBeNull()
    })

    it('should extract user agent from headers', () => {
      const request = {
        headers: new Map([
          ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36']
        ])
      } as any as NextRequest

      const userAgent = AuditLogger.getUserAgent(request)
      expect(userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    })

    it('should return null when user agent header is not present', () => {
      const request = {
        headers: new Map()
      } as any as NextRequest

      const userAgent = AuditLogger.getUserAgent(request)
      expect(userAgent).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from.mockReturnValue({
        insert: mockSupabase.insert.mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
          })
        })
      })

      const auditData = {
        userId: 'test-user-123',
        requiredPermission: 'user:view:own',
        path: '/api/test',
        result: 'ALLOW' as const,
        ipAddress: '127.0.0.1',
        userAgent: 'Jest Test Agent',
        canonical: {
          resource: 'user',
          action: 'view',
          scope: 'own'
        }
      }

      const result = await auditLogger.logPermissionUsage(auditData)
      expect(result).toBeNull()
    })

    it('should handle network errors gracefully', async () => {
      // Mock network error
      mockSupabase.from.mockReturnValue({
        insert: mockSupabase.insert.mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Network error'))
          })
        })
      })

      const auditData = {
        userId: 'test-user-123',
        requiredPermission: 'user:view:own',
        path: '/api/test',
        result: 'ALLOW' as const,
        ipAddress: '127.0.0.1',
        userAgent: 'Jest Test Agent',
        canonical: {
          resource: 'user',
          action: 'view',
          scope: 'own'
        }
      }

      await expect(auditLogger.logPermissionUsage(auditData)).rejects.toThrow('Network error')
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields for permission usage logging', async () => {
      const invalidAuditData = {
        userId: '', // Empty user ID
        requiredPermission: 'user:view:own',
        path: '/api/test',
        result: 'ALLOW' as const
      }

      // Should handle gracefully
      await expect(auditLogger.logPermissionUsage(invalidAuditData as any)).resolves.not.toThrow()
    })

    it('should validate required fields for role change logging', async () => {
      const invalidAuditData = {
        userId: 'test-user-123',
        oldRoles: undefined, // Missing old roles
        newRoles: ['Basic Client'],
        changedBy: 'admin-user-456'
      }

      // Should handle gracefully
      await expect(auditLogger.logRoleChange(invalidAuditData as any)).resolves.not.toThrow()
    })

    it('should handle malformed JSON data gracefully', async () => {
      const auditData = {
        userId: 'test-user-123',
        eventType: 'TEST_EVENT',
        details: { circular: {} as any }, // Circular reference
        ipAddress: '127.0.0.1',
        userAgent: 'Jest Test Agent'
      }

      // Create circular reference
      auditData.details.circular = auditData.details

      // Should handle gracefully
      await expect(auditLogger.logAuditEvent(auditData)).resolves.not.toThrow()
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle high-volume audit logging', async () => {
      const auditPromises = []
      const numEvents = 100

      for (let i = 0; i < numEvents; i++) {
        const auditData = {
          userId: `user-${i}`,
          requiredPermission: 'user:view:own',
          path: `/api/test/${i}`,
          result: 'ALLOW' as const,
          ipAddress: '127.0.0.1',
          userAgent: 'Jest Test Agent',
          canonical: {
            resource: 'user',
            action: 'view',
            scope: 'own'
          }
        }
        auditPromises.push(auditLogger.logPermissionUsage(auditData))
      }

      const results = await Promise.all(auditPromises)
      
      // All should succeed
      expect(results).toHaveLength(numEvents)
      expect(results.every(r => r === 'audit-id-123')).toBe(true)
      
      // Database should be called for each event
      expect(mockSupabase.from).toHaveBeenCalledTimes(numEvents)
    })

    it('should handle concurrent audit logging efficiently', async () => {
      const concurrentAudits = 50
      const auditPromises = []

      // Start all audits simultaneously
      for (let i = 0; i < concurrentAudits; i++) {
        const auditData = {
          userId: `user-${i}`,
          eventType: 'CONCURRENT_TEST',
          details: { index: i },
          ipAddress: '127.0.0.1',
          userAgent: 'Jest Test Agent'
        }
        auditPromises.push(auditLogger.logAuditEvent(auditData))
      }

      const startTime = Date.now()
      const results = await Promise.all(auditPromises)
      const endTime = Date.now()

      // All should succeed
      expect(results).toHaveLength(concurrentAudits)
      expect(results.every(r => r === 'audit-id-123')).toBe(true)
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(5000) // 5 seconds
    })
  })
})
