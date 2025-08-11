// ========================================
// 🛡️ RBAC CACHE TESTS
// ========================================

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals'
import { PermissionCache } from '../lib/rbac/cache'

// Mock Supabase
jest.mock('../lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          is: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}))

describe('RBAC Permission Cache', () => {
  let cache: PermissionCache
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create cache instance
    cache = new PermissionCache({
      ttl: 1000, // 1 second for testing
      maxSize: 10,
      enableRedis: false
    })

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              single: jest.fn()
            }))
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    }

    // Replace the supabase property for testing
    ;(cache as any).supabase = mockSupabase
  })

  afterEach(async () => {
    await cache.close()
  })

  describe('Cache API Methods', () => {
    it('should have invalidateUser method', async () => {
      expect(typeof cache.invalidateUser).toBe('function')
      
      // Test that it doesn't throw
      await expect(cache.invalidateUser('user123')).resolves.not.toThrow()
    })

    it('should have invalidateAll method', async () => {
      expect(typeof cache.invalidateAll).toBe('function')
      
      // Test that it doesn't throw
      await expect(cache.invalidateAll()).resolves.not.toThrow()
    })

    it('should have getStats method', () => {
      expect(typeof cache.getStats).toBe('function')
      
      const stats = cache.getStats()
      expect(stats).toHaveProperty('memorySize')
      expect(stats).toHaveProperty('redisEnabled')
      expect(stats).toHaveProperty('totalCachedUsers')
    })

    it('should have invalidateUsers method for multiple users', async () => {
      expect(typeof cache.invalidateUsers).toBe('function')
      
      // Test that it doesn't throw
      await expect(cache.invalidateUsers(['user1', 'user2'])).resolves.not.toThrow()
    })

    it('should have refreshUser method', async () => {
      expect(typeof cache.refreshUser).toBe('function')
      
      // Test that it doesn't throw
      await expect(cache.refreshUser('user123')).resolves.not.toThrow()
    })
  })

  describe('Cache Statistics', () => {
    it('should return correct cache statistics', () => {
      const stats = cache.getStats()
      
      expect(stats.memorySize).toBe(0) // No users cached initially
      expect(stats.redisEnabled).toBe(false) // Redis disabled in test config
      expect(stats.totalCachedUsers).toBe(0)
    })

    it('should track cache size correctly', async () => {
      // Mock successful database fetch
      const mockRoleAssignments = [
        { role_id: 'role1', roles: { name: 'user', category: 'basic' } }
      ]
      
      const mockPermissions = [
        { permissions: { name: 'user:read:own' } }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: mockRoleAssignments, error: null }))
            }))
          }))
        }))
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          in: jest.fn(() => Promise.resolve({ data: mockPermissions, error: null }))
        }))
      })

      // Get user permissions (this should cache them)
      await cache.getUserPermissions('user123')
      
      const stats = cache.getStats()
      expect(stats.memorySize).toBe(1)
      expect(stats.totalCachedUsers).toBe(1)
    })
  })

  describe('Cache Invalidation', () => {
    it('should invalidate specific user cache', async () => {
      // First, cache some data
      const mockRoleAssignments = [
        { role_id: 'role1', roles: { name: 'user', category: 'basic' } }
      ]
      
      const mockPermissions = [
        { permissions: { name: 'user:read:own' } }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: mockRoleAssignments, error: null }))
            }))
          }))
        }))
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          in: jest.fn(() => Promise.resolve({ data: mockPermissions, error: null }))
        }))
      })

      await cache.getUserPermissions('user123')
      
      // Verify data is cached
      let stats = cache.getStats()
      expect(stats.memorySize).toBe(1)
      
      // Invalidate user
      await cache.invalidateUser('user123')
      
      // Verify cache is cleared
      stats = cache.getStats()
      expect(stats.memorySize).toBe(0)
    })

    it('should invalidate all cache', async () => {
      // Cache data for multiple users
      const mockRoleAssignments = [
        { role_id: 'role1', roles: { name: 'user', category: 'basic' } }
      ]
      
      const mockPermissions = [
        { permissions: { name: 'user:read:own' } }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: mockRoleAssignments, error: null }))
            }))
          }))
        }))
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          in: jest.fn(() => Promise.resolve({ data: mockPermissions, error: null }))
        }))
      })

      await cache.getUserPermissions('user1')
      await cache.getUserPermissions('user2')
      
      // Verify data is cached
      let stats = cache.getStats()
      expect(stats.memorySize).toBe(2)
      
      // Invalidate all
      await cache.invalidateAll()
      
      // Verify all cache is cleared
      stats = cache.getStats()
      expect(stats.memorySize).toBe(0)
    })
  })

  describe('Cache TTL and Expiration', () => {
    it('should respect TTL settings', async () => {
      // Create cache with very short TTL
      const shortTTLCache = new PermissionCache({
        ttl: 100, // 100ms
        maxSize: 10,
        enableRedis: false
      })

      // Mock successful database fetch
      const mockRoleAssignments = [
        { role_id: 'role1', roles: { name: 'user', category: 'basic' } }
      ]
      
      const mockPermissions = [
        { permissions: { name: 'user:read:own' } }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: mockRoleAssignments, error: null }))
            }))
          }))
        }))
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          in: jest.fn(() => Promise.resolve({ data: mockPermissions, error: null }))
        }))
      })

      await shortTTLCache.getUserPermissions('user123')
      
      // Verify data is cached initially
      let stats = shortTTLCache.getStats()
      expect(stats.memorySize).toBe(1)
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Try to get permissions again - should trigger cleanup
      await shortTTLCache.getUserPermissions('user123')
      
      // Cache should still exist but with fresh data
      stats = shortTTLCache.getStats()
      expect(stats.memorySize).toBe(1)
      
      await shortTTLCache.close()
    })
  })

  describe('Cache Max Size Enforcement', () => {
    it('should enforce maximum cache size', async () => {
      // Create cache with very small max size
      const smallCache = new PermissionCache({
        ttl: 1000,
        maxSize: 2,
        enableRedis: false
      })

      // Mock successful database fetch
      const mockRoleAssignments = [
        { role_id: 'role1', roles: { name: 'user', category: 'basic' } }
      ]
      
      const mockPermissions = [
        { permissions: { name: 'user:read:own' } }
      ]

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: mockRoleAssignments, error: null }))
            }))
          }))
        }))
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          in: jest.fn(() => Promise.resolve({ data: mockPermissions, error: null }))
        }))
      })

      // Add more users than max size
      await smallCache.getUserPermissions('user1')
      await smallCache.getUserPermissions('user2')
      await smallCache.getUserPermissions('user3')
      
      // Cache should not exceed max size
      const stats = smallCache.getStats()
      expect(stats.memorySize).toBeLessThanOrEqual(2)
      
      await smallCache.close()
    })
  })

  describe('Redis Integration', () => {
    it('should handle Redis connection gracefully', async () => {
      // Test with Redis enabled but no connection
      const redisCache = new PermissionCache({
        ttl: 1000,
        maxSize: 10,
        enableRedis: true
      })

      // Should fall back to memory cache when Redis fails
      const stats = redisCache.getStats()
      expect(stats.redisEnabled).toBe(false) // Should be false when Redis fails
      
      await redisCache.close()
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: 'Database error' }))
            }))
          }))
        }))
      })

      // Should return empty permissions on error
      const result = await cache.getUserPermissions('user123')
      expect(result.permissions).toEqual([])
      expect(result.roles).toEqual([])
    })

    it('should handle cache invalidation errors gracefully', async () => {
      // Test that invalidation methods don't throw on errors
      await expect(cache.invalidateUser('user123')).resolves.not.toThrow()
      await expect(cache.invalidateAll()).resolves.not.toThrow()
      await expect(cache.invalidateUsers(['user1', 'user2'])).resolves.not.toThrow()
    })
  })
})
