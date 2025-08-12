<<<<<<< Updated upstream
// ========================================
// 🛡️ RBAC PERMISSIONS TESTS
// ========================================

import { 
  parsePermission, 
  isValidPermission, 
  createPermission,
  permissionMatches,
  getHighestScope,
  scopeIsSufficient,
  validatePermissionComponents
} from '@/lib/rbac/permissions'

describe('RBAC Permissions', () => {
  describe('parsePermission', () => {
    it('should parse valid permission strings', () => {
      const result = parsePermission('user:view:own')
      expect(result).toEqual({
        resource: 'user',
        action: 'view',
        scope: 'own',
        original: 'user:view:own'
      })
    })

    it('should return null for invalid permission strings', () => {
      expect(parsePermission('invalid')).toBeNull()
      expect(parsePermission('user:view')).toBeNull()
      expect(parsePermission('user:view:own:extra')).toBeNull()
      expect(parsePermission('')).toBeNull()
      expect(parsePermission(null as any)).toBeNull()
    })

    it('should validate resource, action, and scope', () => {
      expect(parsePermission('invalid:view:own')).toBeNull()
      expect(parsePermission('user:invalid:own')).toBeNull()
      expect(parsePermission('user:view:invalid')).toBeNull()
    })
  })

  describe('isValidPermission', () => {
    it('should return true for valid permissions', () => {
      expect(isValidPermission('user:view:own')).toBe(true)
      expect(isValidPermission('service:create:all')).toBe(true)
      expect(isValidPermission('booking:edit:provider')).toBe(true)
    })

    it('should return false for invalid permissions', () => {
      expect(isValidPermission('invalid')).toBe(false)
      expect(isValidPermission('user:view')).toBe(false)
      expect(isValidPermission('')).toBe(false)
    })
  })

  describe('createPermission', () => {
    it('should create valid permission strings', () => {
      expect(createPermission('user', 'view', 'own')).toBe('user:view:own')
      expect(createPermission('service', 'create', 'all')).toBe('service:create:all')
      expect(createPermission('booking', 'edit', 'provider')).toBe('booking:edit:provider')
    })
  })

  describe('permissionMatches', () => {
    it('should match exact permissions', () => {
      expect(permissionMatches('user:view:own', 'user:view:own')).toBe(true)
    })

    it('should match wildcard patterns', () => {
      expect(permissionMatches('*:view:own', 'user:view:own')).toBe(true)
      expect(permissionMatches('user:*:own', 'user:view:own')).toBe(true)
      expect(permissionMatches('user:view:*', 'user:view:own')).toBe(true)
      expect(permissionMatches('*:*:*', 'user:view:own')).toBe(true)
    })

    it('should not match different permissions', () => {
      expect(permissionMatches('user:view:own', 'user:edit:own')).toBe(false)
      expect(permissionMatches('user:view:own', 'service:view:own')).toBe(false)
      expect(permissionMatches('user:view:own', 'user:view:all')).toBe(false)
    })
  })

  describe('getHighestScope', () => {
    it('should return highest scope from permissions', () => {
      const permissions = [
        'user:view:public',
        'user:edit:own',
        'user:delete:all'
      ]
      expect(getHighestScope(permissions)).toBe('all')
    })

    it('should return public for empty permissions', () => {
      expect(getHighestScope([])).toBe('public')
    })

    it('should handle single permission', () => {
      expect(getHighestScope(['user:view:own'])).toBe('own')
    })
  })

  describe('scopeIsSufficient', () => {
    it('should return true for sufficient scopes', () => {
      expect(scopeIsSufficient('all', 'own')).toBe(true)
      expect(scopeIsSufficient('provider', 'own')).toBe(true)
      expect(scopeIsSufficient('organization', 'own')).toBe(true)
      expect(scopeIsSufficient('own', 'own')).toBe(true)
    })

    it('should return false for insufficient scopes', () => {
      expect(scopeIsSufficient('own', 'provider')).toBe(false)
      expect(scopeIsSufficient('organization', 'provider')).toBe(false)
      expect(scopeIsSufficient('provider', 'all')).toBe(false)
      expect(scopeIsSufficient('public', 'own')).toBe(false)
    })
  })

  describe('validatePermissionComponents', () => {
    it('should validate valid components', () => {
      const result = validatePermissionComponents('user', 'view', 'own')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should catch invalid components', () => {
      const result = validatePermissionComponents('invalid', 'invalid', 'invalid')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(3)
      expect(result.errors).toContain('Invalid resource: invalid')
      expect(result.errors).toContain('Invalid action: invalid')
      expect(result.errors).toContain('Invalid scope: invalid')
    })

    it('should validate scope restrictions', () => {
      const result = validatePermissionComponents('auth', 'login', 'own')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Scope 'own' is not valid for auth:login")
    })
  })

  describe('edge cases', () => {
    it('should handle special characters in permission strings', () => {
      expect(parsePermission('user:view:own')).not.toBeNull()
      expect(parsePermission('user-view-own')).toBeNull()
    })

    it('should handle case sensitivity', () => {
      expect(parsePermission('USER:VIEW:OWN')).toBeNull()
      expect(parsePermission('user:view:own')).not.toBeNull()
    })

    it('should handle whitespace', () => {
      expect(parsePermission(' user : view : own ')).toBeNull()
      expect(parsePermission('user:view:own')).not.toBeNull()
    })
  })
})
=======
import { describe, it, expect } from 'jest-without-globals'
import { parsePermission } from '@/lib/rbac/permissions'

describe('parsePermission', () => {
  it('parses valid permission', () => {
    expect(parsePermission('user:read:own')).toEqual({ resource: 'user', action: 'read', scope: 'own' })
  })

  it('throws on invalid format', () => {
    expect(() => parsePermission('invalid')).toThrow()
  })

  it('throws on invalid scope', () => {
    expect(() => parsePermission('user:read:invalid')).toThrow()
  })
})


>>>>>>> Stashed changes

