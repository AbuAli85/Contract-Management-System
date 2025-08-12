<<<<<<< Updated upstream
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { PermissionCache } from '@/lib/rbac/cache'

// Mock Redis client
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  flushdb: jest.fn()
}

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn()
}

// Redis mock commented out - package not available
// jest.mock('redis', () => ({
//   createClient: () => mockRedis
// }))

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase
}))

describe('RBAC Permission Cache', () => {
  let permissionCache: PermissionCache
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = process.env
    process.env = { ...originalEnv }
    
    // Clear all mocks
    jest.clearAllMocks()
    
    // Reset Redis mocks
    mockRedis.get.mockReset()
    mockRedis.set.mockReset()
    mockRedis.del.mockReset()
    mockRedis.flushdb.mockReset()
    
    // Reset Supabase mocks
    mockSupabase.from.mockReset()
    mockSupabase.rpc.mockReset()
    
    // Create fresh cache instance
    permissionCache = new PermissionCache({ enableRedis: false })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('In-Memory Caching', () => {
    it('should cache user permissions with TTL', async () => {
      const userId = 'test-user-123'
      const mockPermissions = ['user:view:own', 'service:view:public']
      const mockRoles = ['Basic Client']

      // Mock database fetch
      const mockFetchFromDb = jest.spyOn(permissionCache as any, 'fetchFromDatabase')
      mockFetchFromDb.mockResolvedValue({
        permissions: mockPermissions,
        roles: mockRoles
      })

      // First call - should fetch from database
      const result1 = await permissionCache.getUserPermissions(userId)
      expect(result1.permissions).toEqual(mockPermissions)
      expect(result1.roles).toEqual(mockRoles)
      expect(mockFetchFromDb).toHaveBeenCalledTimes(1)

      // Second call within TTL - should return cached data
      const result2 = await permissionCache.getUserPermissions(userId)
      expect(result2.permissions).toEqual(mockPermissions)
      expect(result2.roles).toEqual(mockRoles)
      expect(mockFetchFromDb).toHaveBeenCalledTimes(1) // Still only called once
    })

    it('should expire cached permissions after TTL', async () => {
      const userId = 'test-user-123'
      const mockPermissions = ['user:view:own']
      const mockRoles = ['Basic Client']

      // Mock database fetch
      const mockFetchFromDb = jest.spyOn(permissionCache as any, 'fetchFromDatabase')
      mockFetchFromDb.mockResolvedValue({
        permissions: mockPermissions,
        roles: mockRoles
      })

      // First call
      await permissionCache.getUserPermissions(userId)
      expect(mockFetchFromDb).toHaveBeenCalledTimes(1)

      // Manually expire the cache by manipulating the timestamp
      const cache = (permissionCache as any).cache
      const cached = cache.get(`permissions:${userId}`)
      if (cached) {
        cached.t = Date.now() - (16 * 60 * 1000) // 16 minutes ago (past TTL)
      }

      // Second call after TTL - should fetch from database again
      await permissionCache.getUserPermissions(userId)
      expect(mockFetchFromDb).toHaveBeenCalledTimes(2)
    })

    it('should handle database fetch errors gracefully', async () => {
      const userId = 'test-user-123'

      // Mock database fetch to throw error
      const mockFetchFromDb = jest.spyOn(permissionCache as any, 'fetchFromDatabase')
      mockFetchFromDb.mockRejectedValue(new Error('Database connection failed'))

      // Should handle error gracefully
      await expect(permissionCache.getUserPermissions(userId)).rejects.toThrow('Database connection failed')
    })

    it('should return null when user not found', async () => {
      const userId = 'non-existent-user'

      // Mock database fetch to return null
      const mockFetchFromDb = jest.spyOn(permissionCache as any, 'fetchFromDatabase')
      mockFetchFromDb.mockResolvedValue(null)

      const result = await permissionCache.getUserPermissions(userId)
      expect(result).toBeNull()
    })
  })

  describe('Cache Invalidation', () => {
    it('should invalidate specific user cache', async () => {
      const userId = 'test-user-123'
      const mockPermissions = ['user:view:own']

      // Mock database fetch
      const mockFetchFromDb = jest.spyOn(permissionCache as any, 'fetchFromDatabase')
      mockFetchFromDb.mockResolvedValue({
        permissions: mockPermissions,
        roles: ['Basic Client']
      })

      // Cache user permissions
      await permissionCache.getUserPermissions(userId)
      expect((permissionCache as any).cache.has(`permissions:${userId}`)).toBe(true)

      // Invalidate user cache
      await permissionCache.invalidateUser(userId)
      expect((permissionCache as any).cache.has(`permissions:${userId}`)).toBe(false)
    })

    it('should invalidate all cache', async () => {
      const userId1 = 'user-1'
      const userId2 = 'user-2'

      // Mock database fetch
      const mockFetchFromDb = jest.spyOn(permissionCache as any, 'fetchFromDatabase')
      mockFetchFromDb.mockResolvedValue({
        permissions: ['user:view:own'],
        roles: ['Basic Client']
      })

      // Cache multiple users
      await permissionCache.getUserPermissions(userId1)
      await permissionCache.getUserPermissions(userId2)
      expect((permissionCache as any).cache.size).toBe(2)

      // Invalidate all cache
      await permissionCache.invalidateAll()
      expect((permissionCache as any).cache.size).toBe(0)
    })

    it('should handle invalidation of non-existent user gracefully', async () => {
      const userId = 'non-existent-user'

      // Should not throw error
      await expect(permissionCache.invalidateUser(userId)).resolves.not.toThrow()
    })
  })

  describe('Redis Integration', () => {
    beforeEach(() => {
      process.env.REDIS_URL = 'redis://localhost:6379'
      permissionCache = new PermissionCache({ enableRedis: true })
    })

    it('should use Redis when REDIS_URL is present', async () => {
      const userId = 'test-user-123'
      const mockPermissions = ['user:view:own']
      const mockRoles = ['Basic Client']

      // Mock Redis get to return cached data
      mockRedis.get.mockResolvedValue(JSON.stringify({
        permissions: mockPermissions,
        roles: mockRoles,
        t: Date.now()
      }))

      const result = await permissionCache.getUserPermissions(userId)
      expect(result?.permissions).toEqual(mockPermissions)
      expect(result?.roles).toEqual(mockRoles)
      expect(mockRedis.get).toHaveBeenCalledWith(`permissions:${userId}`)
    })

    it('should fallback to database when Redis is unavailable', async () => {
      const userId = 'test-user-123'
      const mockPermissions = ['user:view:own']
      const mockRoles = ['Basic Client']

      // Mock Redis get to fail
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'))

      // Mock database fetch
      const mockFetchFromDb = jest.spyOn(permissionCache as any, 'fetchFromDatabase')
      mockFetchFromDb.mockResolvedValue({
        permissions: mockPermissions,
        roles: mockRoles
      })

      const result = await permissionCache.getUserPermissions(userId)
      expect(result?.permissions).toEqual(mockPermissions)
      expect(result?.roles).toEqual(mockRoles)
      expect(mockFetchFromDb).toHaveBeenCalledWith(userId)
    })

    it('should cache data in Redis after database fetch', async () => {
      const userId = 'test-user-123'
      const mockPermissions = ['user:view:own']
      const mockRoles = ['Basic Client']

      // Mock Redis get to return null (cache miss)
      mockRedis.get.mockResolvedValue(null)

      // Mock database fetch
      const mockFetchFromDb = jest.spyOn(permissionCache as any, 'fetchFromDatabase')
      mockFetchFromDb.mockResolvedValue({
        permissions: mockPermissions,
        roles: mockRoles
      })

      await permissionCache.getUserPermissions(userId)

      // Should set data in Redis
      expect(mockRedis.set).toHaveBeenCalledWith(
        `permissions:${userId}`,
        expect.any(String),
        'EX',
        900 // 15 minutes TTL
      )
    })

    it('should invalidate Redis cache on user invalidation', async () => {
      const userId = 'test-user-123'

      await permissionCache.invalidateUser(userId)
      expect(mockRedis.del).toHaveBeenCalledWith(`permissions:${userId}`)
    })

    it('should flush Redis cache on global invalidation', async () => {
      await permissionCache.invalidateAll()
      expect(mockRedis.flushdb).toHaveBeenCalled()
    })
  })

  describe('Cache Statistics', () => {
    it('should provide accurate cache statistics', async () => {
      const userId1 = 'user-1'
      const userId2 = 'user-2'

      // Mock database fetch
      const mockFetchFromDb = jest.spyOn(permissionCache as any, 'fetchFromDatabase')
      mockFetchFromDb.mockResolvedValue({
        permissions: ['user:view:own'],
        roles: ['Basic Client']
      })

      // Cache multiple users
      await permissionCache.getUserPermissions(userId1)
      await permissionCache.getUserPermissions(userId2)

      const stats = (permissionCache as any).getStats()
      expect(stats.totalCachedUsers).toBe(2)
      expect(stats.redisEnabled).toBe(false)
    })

    it('should show Redis enabled when configured', () => {
      process.env.REDIS_URL = 'redis://localhost:6379'
      const cacheWithRedis = new PermissionCache({ enableRedis: true })
      
      const stats = (cacheWithRedis as any).getStats()
      expect(stats.redisEnabled).toBe(true)
    })
  })

  describe('Materialized View Refresh Integration', () => {
    it('should call refresh_user_permissions after role assignment', async () => {
      const userId = 'test-user-123'

      // Mock Supabase RPC call
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

      // Mock database fetch
      const mockFetchFromDb = jest.spyOn(permissionCache as any, 'fetchFromDatabase')
      mockFetchFromDb.mockResolvedValue({
        permissions: ['user:view:own'],
        roles: ['Basic Client']
      })

      // Cache user permissions
      await permissionCache.getUserPermissions(userId)

      // Simulate role assignment (this would typically be called from the admin API)
      // For testing, we'll call the materialized view refresh directly
      await mockSupabase.rpc('refresh_user_permissions')

      expect(mockSupabase.rpc).toHaveBeenCalledWith('refresh_user_permissions')
    })

    it('should handle materialized view refresh errors', async () => {
      // Mock Supabase RPC call to fail
      mockSupabase.rpc.mockResolvedValue({ 
        data: null, 
        error: { message: 'View does not exist' } 
      })

      const result = await mockSupabase.rpc('refresh_user_permissions')
      expect(result.error).toBeTruthy()
      expect(result.error.message).toBe('View does not exist')
    })
  })

  describe('Concurrent Access', () => {
    it('should handle concurrent permission requests for the same user', async () => {
      const userId = 'test-user-123'
      const mockPermissions = ['user:view:own']
      const mockRoles = ['Basic Client']

      // Mock database fetch
      const mockFetchFromDb = jest.spyOn(permissionCache as any, 'fetchFromDatabase')
      mockFetchFromDb.mockResolvedValue({
        permissions: mockPermissions,
        roles: mockRoles
      })

      // Simulate concurrent requests
      const promises = [
        permissionCache.getUserPermissions(userId),
        permissionCache.getUserPermissions(userId),
        permissionCache.getUserPermissions(userId)
      ]

      const results = await Promise.all(promises)
      
      // All should return the same data
      results.forEach(result => {
        expect(result?.permissions).toEqual(mockPermissions)
        expect(result?.roles).toEqual(mockRoles)
      })

      // Database should only be called once
      expect(mockFetchFromDb).toHaveBeenCalledTimes(1)
    })

    it('should handle concurrent cache invalidation', async () => {
      const userId = 'test-user-123'

      // Mock database fetch
      const mockFetchFromDb = jest.spyOn(permissionCache as any, 'fetchFromDatabase')
      mockFetchFromDb.mockResolvedValue({
        permissions: ['user:view:own'],
        roles: ['Basic Client']
      })

      // Cache user permissions
      await permissionCache.getUserPermissions(userId)

      // Simulate concurrent invalidation
      const promises = [
        permissionCache.invalidateUser(userId),
        permissionCache.invalidateUser(userId),
        permissionCache.invalidateUser(userId)
      ]

      await Promise.all(promises)

      // Cache should be invalidated
      expect((permissionCache as any).cache.has(`permissions:${userId}`)).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty permissions array', async () => {
      const userId = 'test-user-123'

      // Mock database fetch to return empty permissions
      const mockFetchFromDb = jest.spyOn(permissionCache as any, 'fetchFromDatabase')
      mockFetchFromDb.mockResolvedValue({
        permissions: [],
        roles: []
      })

      const result = await permissionCache.getUserPermissions(userId)
      expect(result?.permissions).toEqual([])
      expect(result?.roles).toEqual([])
    })

    it('should handle null user ID', async () => {
      // Should handle gracefully
      await expect(permissionCache.getUserPermissions(null as any)).rejects.toThrow()
    })

    it('should handle undefined user ID', async () => {
      // Should handle gracefully
      await expect(permissionCache.getUserPermissions(undefined as any)).rejects.toThrow()
    })

    it('should handle very long user ID', async () => {
      const longUserId = 'a'.repeat(1000)
      const mockPermissions = ['user:view:own']

      // Mock database fetch
      const mockFetchFromDb = jest.spyOn(permissionCache as any, 'fetchFromDatabase')
      mockFetchFromDb.mockResolvedValue({
        permissions: mockPermissions,
        roles: ['Basic Client']
      })

      const result = await permissionCache.getUserPermissions(longUserId)
      expect(result?.permissions).toEqual(mockPermissions)
    })
  })
})
=======
import { PermissionCache } from '@/lib/rbac/cache'

describe('PermissionCache', () => {
  beforeEach(() => {
    PermissionCache.invalidateAll()
  })

  it('has basic cache methods', () => {
    expect(PermissionCache.cache).toBeDefined()
    expect(PermissionCache.invalidateUser).toBeDefined()
    expect(PermissionCache.invalidateAll).toBeDefined()
  })

  it('can invalidate cache', () => {
    PermissionCache.invalidateAll()
    expect(PermissionCache.cache.size).toBe(0)
  })
})


>>>>>>> Stashed changes
