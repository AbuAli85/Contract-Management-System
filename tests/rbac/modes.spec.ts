import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'
import { guardPermission, checkPermission, getRBACEnforcementMode } from '@/lib/rbac/guard'

// Mock the RBAC modules
jest.mock('@/lib/rbac/evaluate', () => ({
  permissionEvaluator: {
    evaluatePermission: jest.fn()
  }
}))

jest.mock('@/lib/rbac/audit', () => ({
  auditLogger: {
    logPermissionUsage: jest.fn()
  }
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn()
    }
  })
}))

// Mock environment variables
const originalEnv = process.env

describe('RBAC Enforcement Modes', () => {
  let mockRequest: NextRequest
  let mockUser: any

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv }
    
    // Reset mocks
    jest.clearAllMocks()
    
    // Mock request
    mockRequest = {
      url: 'http://localhost:3000/api/test',
      headers: new Map([
        ['x-forwarded-for', '127.0.0.1'],
        ['user-agent', 'Jest Test Agent']
      ])
    } as any as NextRequest

    // Mock user
    mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'Basic Client'
    }

    // Mock Supabase auth
    const { createClient } = require('@/lib/supabase/server')
    const mockSupabase = createClient()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Environment Variable Configuration', () => {
    it('should default to dry-run mode when RBAC_ENFORCEMENT is not set', () => {
      delete process.env.RBAC_ENFORCEMENT
      const mode = getRBACEnforcementMode()
      expect(mode).toBe('dry-run')
    })

    it('should return dry-run mode when explicitly set', () => {
      process.env.RBAC_ENFORCEMENT = 'dry-run'
      const mode = getRBACEnforcementMode()
      expect(mode).toBe('dry-run')
    })

    it('should return enforce mode when explicitly set', () => {
      process.env.RBAC_ENFORCEMENT = 'enforce'
      const mode = getRBACEnforcementMode()
      expect(mode).toBe('enforce')
    })

    it('should return disabled mode when explicitly set', () => {
      process.env.RBAC_ENFORCEMENT = 'disabled'
      const mode = getRBACEnforcementMode()
      expect(mode).toBe('disabled')
    })

    it('should handle invalid modes gracefully', () => {
      process.env.RBAC_ENFORCEMENT = 'invalid-mode'
      const mode = getRBACEnforcementMode()
      expect(mode).toBe('dry-run') // Should default to dry-run
    })
  })

  describe('Dry-Run Mode', () => {
    beforeEach(() => {
      process.env.RBAC_ENFORCEMENT = 'dry-run'
    })

    it('should allow requests but log WOULD_BLOCK when permission denied', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate')
      const { auditLogger } = require('@/lib/rbac/audit')

      // Mock permission evaluation to return false (denied)
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: false,
        reason: 'Insufficient permissions',
        required_permission: 'admin:access:all',
        user_permissions: [],
        user_roles: [],
        user_id: mockUser.id
      })

      // Mock audit logger
      auditLogger.logPermissionUsage.mockResolvedValue('audit-id')

      const result = await guardPermission('admin:access:all', mockRequest)

      // Should return null (allow request to continue) in dry-run mode
      expect(result).toBeNull()

      // Should log WOULD_BLOCK
      expect(auditLogger.logPermissionUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          requiredPermission: 'admin:access:all',
          result: 'WOULD_BLOCK',
          path: '/api/test'
        })
      )
    })

    it('should allow requests and log ALLOW when permission granted', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate')
      const { auditLogger } = require('@/lib/rbac/audit')

      // Mock permission evaluation to return true (allowed)
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'Permission granted',
        required_permission: 'user:view:own',
        user_permissions: ['user:view:own'],
        user_roles: ['Basic Client'],
        user_id: mockUser.id
      })

      // Mock audit logger
      auditLogger.logPermissionUsage.mockResolvedValue('audit-id')

      const result = await guardPermission('user:view:own', mockRequest)

      // Should return null (allow request to continue)
      expect(result).toBeNull()

      // Should log ALLOW
      expect(auditLogger.logPermissionUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          requiredPermission: 'user:view:own',
          result: 'ALLOW',
          path: '/api/test'
        })
      )
    })
  })

  describe('Enforce Mode', () => {
    beforeEach(() => {
      process.env.RBAC_ENFORCEMENT = 'enforce'
    })

    it('should return 403 when permission denied', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate')
      const { auditLogger } = require('@/lib/rbac/audit')

      // Mock permission evaluation to return false (denied)
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: false,
        reason: 'Insufficient permissions',
        required_permission: 'admin:access:all',
        user_permissions: [],
        user_roles: [],
        user_id: mockUser.id
      })

      // Mock audit logger
      auditLogger.logPermissionUsage.mockResolvedValue('audit-id')

      const result = await guardPermission('admin:access:all', mockRequest)

      // Should return 403 response
      expect(result).toBeInstanceOf(NextResponse)
      expect(result?.status).toBe(403)

      // Should have correct error message
      const responseBody = await result?.json()
      expect(responseBody).toEqual({
        error: 'Insufficient permissions',
        required_permission: 'admin:access:all',
        reason: 'Guard check failed'
      })

      // Should log DENY
      expect(auditLogger.logPermissionUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          requiredPermission: 'admin:access:all',
          result: 'DENY',
          path: '/api/test'
        })
      )
    })

    it('should allow requests when permission granted', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate')
      const { auditLogger } = require('@/lib/rbac/audit')

      // Mock permission evaluation to return true (allowed)
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'Permission granted',
        required_permission: 'user:view:own',
        user_permissions: ['user:view:own'],
        user_roles: ['Basic Client'],
        user_id: mockUser.id
      })

      // Mock audit logger
      auditLogger.logPermissionUsage.mockResolvedValue('audit-id')

      const result = await guardPermission('user:view:own', mockRequest)

      // Should return null (allow request to continue)
      expect(result).toBeNull()

      // Should log ALLOW
      expect(auditLogger.logPermissionUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          requiredPermission: 'user:view:own',
          result: 'ALLOW',
          path: '/api/test'
        })
      )
    })
  })

  describe('Disabled Mode', () => {
    beforeEach(() => {
      process.env.RBAC_ENFORCEMENT = 'disabled'
    })

    it('should short-circuit and allow all requests without evaluation', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate')
      const { auditLogger } = require('@/lib/rbac/audit')

      const result = await guardPermission('admin:access:all', mockRequest)

      // Should return null (allow request to continue)
      expect(result).toBeNull()

      // Should not call permission evaluator
      expect(permissionEvaluator.evaluatePermission).not.toHaveBeenCalled()

      // Should not call audit logger
      expect(auditLogger.logPermissionUsage).not.toHaveBeenCalled()
    })

    it('should not evaluate any permissions regardless of complexity', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate')
      const { auditLogger } = require('@/lib/rbac/audit')

      const complexPermission = 'system:admin:all:critical:operation'
      const result = await guardPermission(complexPermission, mockRequest)

      // Should return null (allow request to continue)
      expect(result).toBeNull()

      // Should not call permission evaluator
      expect(permissionEvaluator.evaluatePermission).not.toHaveBeenCalled()

      // Should not call audit logger
      expect(auditLogger.logPermissionUsage).not.toHaveBeenCalled()
    })
  })

  describe('Public Permission Handling', () => {
    it('should bypass authentication for public permissions in dry-run mode', async () => {
      process.env.RBAC_ENFORCEMENT = 'dry-run'
      
      const { permissionEvaluator } = require('@/lib/rbac/evaluate')
      const { auditLogger } = require('@/lib/rbac/audit')

      // Mock permission evaluation for public permission
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'Public permission',
        required_permission: 'auth:login:public',
        user_permissions: ['auth:login:public'],
        user_roles: ['Public'],
        user_id: mockUser.id
      })

      // Mock audit logger
      auditLogger.logPermissionUsage.mockResolvedValue('audit-id')

      const result = await guardPermission('auth:login:public', mockRequest)

      // Should return null (allow request to continue)
      expect(result).toBeNull()

      // Should log ALLOW
      expect(auditLogger.logPermissionUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          requiredPermission: 'auth:login:public',
          result: 'ALLOW'
        })
      )
    })

    it('should bypass authentication for public permissions in enforce mode', async () => {
      process.env.RBAC_ENFORCEMENT = 'enforce'
      
      const { permissionEvaluator } = require('@/lib/rbac/evaluate')
      const { auditLogger } = require('@/lib/rbac/audit')

      // Mock permission evaluation for public permission
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: true,
        reason: 'Public permission',
        required_permission: 'auth:login:public',
        user_permissions: ['auth:login:public'],
        user_roles: ['Public'],
        user_id: mockUser.id
      })

      // Mock audit logger
      auditLogger.logPermissionUsage.mockResolvedValue('audit-id')

      const result = await guardPermission('auth:login:public', mockRequest)

      // Should return null (allow request to continue)
      expect(result).toBeNull()

      // Should log ALLOW
      expect(auditLogger.logPermissionUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          requiredPermission: 'auth:login:public',
          result: 'ALLOW'
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle permission evaluation errors gracefully in dry-run mode', async () => {
      process.env.RBAC_ENFORCEMENT = 'dry-run'
      
      const { permissionEvaluator } = require('@/lib/rbac/evaluate')
      const { auditLogger } = require('@/lib/rbac/audit')

      // Mock permission evaluation to throw error
      permissionEvaluator.evaluatePermission.mockRejectedValue(
        new Error('Database connection failed')
      )

      // Mock audit logger
      auditLogger.logPermissionUsage.mockResolvedValue('audit-id')

      const result = await guardPermission('user:view:own', mockRequest)

      // Should return null (allow request to continue) in dry-run mode
      expect(result).toBeNull()

      // Should log WOULD_BLOCK due to error
      expect(auditLogger.logPermissionUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          requiredPermission: 'user:view:own',
          result: 'WOULD_BLOCK'
        })
      )
    })

    it('should handle permission evaluation errors gracefully in enforce mode', async () => {
      process.env.RBAC_ENFORCEMENT = 'enforce'
      
      const { permissionEvaluator } = require('@/lib/rbac/evaluate')
      const { auditLogger } = require('@/lib/rbac/audit')

      // Mock permission evaluation to throw error
      permissionEvaluator.evaluatePermission.mockRejectedValue(
        new Error('Database connection failed')
      )

      // Mock audit logger
      auditLogger.logPermissionUsage.mockResolvedValue('audit-id')

      const result = await guardPermission('user:view:own', mockRequest)

      // Should return 403 response due to error
      expect(result).toBeInstanceOf(NextResponse)
      expect(result?.status).toBe(403)

      // Should log DENY due to error
      expect(auditLogger.logPermissionUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          requiredPermission: 'user:view:own',
          result: 'DENY'
        })
      )
    })
  })

  describe('checkPermission Function', () => {
    it('should work with different enforcement modes', async () => {
      const { permissionEvaluator } = require('@/lib/rbac/evaluate')

      // Test dry-run mode
      process.env.RBAC_ENFORCEMENT = 'dry-run'
      permissionEvaluator.evaluatePermission.mockResolvedValue({
        allowed: false,
        reason: 'Insufficient permissions',
        required_permission: 'admin:access:all',
        user_permissions: [],
        user_roles: [],
        user_id: mockUser.id
      })

      const dryRunResult = await checkPermission('admin:access:all')
      expect(dryRunResult.allowed).toBe(false)

      // Test enforce mode
      process.env.RBAC_ENFORCEMENT = 'enforce'
      const enforceResult = await checkPermission('admin:access:all')
      expect(enforceResult.allowed).toBe(false)

      // Test disabled mode
      process.env.RBAC_ENFORCEMENT = 'disabled'
      const disabledResult = await checkPermission('admin:access:all')
      expect(disabledResult.allowed).toBe(true) // Should always allow in disabled mode
    })
  })
})
