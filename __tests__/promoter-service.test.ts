import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchPromotersWithPagination,
  fetchPromotersAnalytics,
  getPromoterPerformanceStats,
  exportPromotersToCSV,
  importPromotersFromCSV,
  getPromoterCVData,
  deletePromoters,
  updatePromoterStatus,
  bulkUpdatePromoterStatus,
  searchPromoters,
  getPromotersWithExpiringDocuments,
  getPromoterActivitySummary
} from '../lib/promoter-service'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
  functions: {
    invoke: vi.fn()
  }
}

// Mock the getSupabaseClient function
vi.mock('../lib/supabase', () => ({
  getSupabaseClient: () => mockSupabaseClient
}))

describe('Promoter Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('fetchPromotersWithPagination', () => {
    it('should fetch promoters with pagination successfully', async () => {
      const mockPromoters = [
        { id: '1', name_en: 'John Doe', email: 'john@example.com' },
        { id: '2', name_en: 'Jane Smith', email: 'jane@example.com' }
      ]

      const mockContractsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ count: 2, error: null })
      }

      const mockPromotersQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        and: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPromoters,
          error: null,
          count: 2
        })
      }

      mockSupabaseClient.from
        .mockReturnValueOnce(mockPromotersQuery) // promoters query
        .mockReturnValueOnce(mockContractsQuery) // contracts query for first promoter
        .mockReturnValueOnce(mockContractsQuery) // contracts query for second promoter

      const result = await fetchPromotersWithPagination(
        { page: 1, limit: 10 },
        'test',
        { status: 'active' }
      )

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.hasNext).toBe(false)
      expect(result.hasPrev).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
          count: 0
        })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(
        fetchPromotersWithPagination({ page: 1, limit: 10 })
      ).rejects.toThrow('Error fetching promoters: Database connection failed')
    })

    it('should apply search filters correctly', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await fetchPromotersWithPagination(
        { page: 1, limit: 10 },
        'john'
      )

      expect(mockQuery.or).toHaveBeenCalledWith(
        'name_en.ilike.%john%,name_ar.ilike.%john%,id_card_number.ilike.%john%'
      )
    })
  })

  describe('fetchPromotersAnalytics', () => {
    it('should fetch analytics data using materialized view', async () => {
      const mockAnalyticsData = {
        data: [
          {
            id: '1',
            name_en: 'John Doe',
            overall_status: 'active',
            active_contracts_count: 2
          }
        ],
        total_count: 1,
        page: 1,
        limit: 10,
        total_pages: 1
      }

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [mockAnalyticsData],
        error: null
      })

      const result = await fetchPromotersAnalytics(
        { page: 1, limit: 10 },
        'john',
        { status: 'active', overallStatus: 'active' }
      )

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'get_promoter_analytics_paginated',
        {
          p_page: 1,
          p_limit: 10,
          p_search: 'john',
          p_status: 'active',
          p_overall_status: 'active',
          p_work_location: null,
          p_sort_by: 'name_en',
          p_sort_order: 'asc'
        }
      )
    })
  })

  describe('getPromoterPerformanceStats', () => {
    it('should fetch performance statistics', async () => {
      const mockStats = {
        total_promoters: 100,
        active_promoters: 80,
        total_contracts: 150,
        avg_contract_duration: 30.5
      }

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [mockStats],
        error: null
      })

      const result = await getPromoterPerformanceStats()

      expect(result.total_promoters).toBe(100)
      expect(result.active_promoters).toBe(80)
      expect(result.total_contracts).toBe(150)
      expect(result.avg_contract_duration).toBe(30.5)
    })
  })

  describe('exportPromotersToCSV', () => {
    it('should export promoters to CSV format', async () => {
      const mockPromoters = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          mobile_number: '+1234567890',
          nationality: 'American',
          id_card_number: 'ID123',
          status: 'active',
          created_at: '2023-01-01'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPromoters,
          error: null
        })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const csvContent = await exportPromotersToCSV('john')

      expect(csvContent).toContain('First Name,Last Name,Email,Mobile Number,Nationality')
      expect(csvContent).toContain('John,Doe,john@example.com,+1234567890,American')
    })
  })

  describe('importPromotersFromCSV', () => {
    it('should import promoters from CSV data', async () => {
      const mockImportResult = {
        success: true,
        imported: 2,
        errors: [],
        total: 2
      }

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: mockImportResult,
        error: null
      })

      const csvData = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          mobile_number: '+1234567890',
          nationality: 'American',
          id_card_number: 'ID123',
          status: 'active'
        }
      ]

      const result = await importPromotersFromCSV(csvData, 'user123')

      expect(result.success).toBe(true)
      expect(result.imported).toBe(2)
      expect(result.errors).toHaveLength(0)
      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith(
        'import-promoters-csv',
        {
          body: {
            csvData,
            userId: 'user123'
          }
        }
      )
    })
  })

  describe('getPromoterCVData', () => {
    it('should fetch CV data for a promoter', async () => {
      const mockSkills = [{ id: '1', skill: 'JavaScript', level: 'Expert' }]
      const mockExperience = [{ id: '1', company: 'Tech Corp', role: 'Developer' }]
      const mockEducation = [{ id: '1', degree: 'BS Computer Science', institution: 'University' }]
      const mockDocuments = [{ id: '1', type: 'CV', url: 'https://example.com/cv.pdf' }]

      const mockSkillsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSkills, error: null })
      }

      const mockExperienceQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockExperience, error: null })
      }

      const mockEducationQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEducation, error: null })
      }

      const mockDocumentsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDocuments, error: null })
      }

      mockSupabaseClient.from
        .mockReturnValueOnce(mockSkillsQuery)
        .mockReturnValueOnce(mockExperienceQuery)
        .mockReturnValueOnce(mockEducationQuery)
        .mockReturnValueOnce(mockDocumentsQuery)

      const result = await getPromoterCVData('promoter123')

      expect(result.skills).toEqual(mockSkills)
      expect(result.experience).toEqual(mockExperience)
      expect(result.education).toEqual(mockEducation)
      expect(result.documents).toEqual(mockDocuments)
    })
  })

  describe('deletePromoters', () => {
    it('should delete multiple promoters', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ error: null })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await deletePromoters(['promoter1', 'promoter2'])

      expect(mockQuery.in).toHaveBeenCalledWith('id', ['promoter1', 'promoter2'])
    })
  })

  describe('updatePromoterStatus', () => {
    it('should update promoter status', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ error: null })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await updatePromoterStatus('promoter123', 'active')

      expect(mockQuery.update).toHaveBeenCalledWith({ status: 'active' })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'promoter123')
    })
  })

  describe('bulkUpdatePromoterStatus', () => {
    it('should bulk update promoter statuses', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ error: null })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await bulkUpdatePromoterStatus(['promoter1', 'promoter2'], 'inactive')

      expect(mockQuery.update).toHaveBeenCalledWith({ status: 'inactive' })
      expect(mockQuery.in).toHaveBeenCalledWith('id', ['promoter1', 'promoter2'])
    })
  })

  describe('searchPromoters', () => {
    it('should search promoters by text', async () => {
      const mockPromoters = [
        { id: '1', name_en: 'John Doe', email: 'john@example.com' }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPromoters,
          error: null
        })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await searchPromoters('john')

      expect(result).toEqual(mockPromoters)
      expect(mockQuery.or).toHaveBeenCalledWith(
        'name_en.ilike.%john%,name_ar.ilike.%john%,id_card_number.ilike.%john%'
      )
    })
  })

  describe('getPromotersWithExpiringDocuments', () => {
    it('should fetch promoters with expiring documents', async () => {
      const mockPromoters = [
        { id: '1', name_en: 'John Doe', id_card_expiry_date: '2023-12-31' }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPromoters,
          error: null
        })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await getPromotersWithExpiringDocuments(30)

      expect(result).toEqual(mockPromoters)
    })
  })

  describe('getPromoterActivitySummary', () => {
    it('should get promoter activity summary', async () => {
      const mockContractsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ count: 5, error: null })
      }

      const mockRecentContractsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: [{ id: '1', status: 'active' }],
          error: null
        })
      }

      mockSupabaseClient.from
        .mockReturnValueOnce(mockContractsQuery)
        .mockReturnValueOnce(mockRecentContractsQuery)

      const result = await getPromoterActivitySummary('promoter123')

      expect(result.contracts_count).toBe(5)
      expect(result.recent_contracts).toHaveLength(1)
    })
  })

  describe('Retry Logic', () => {
    it('should retry on network errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({
            data: [],
            error: null,
            count: 0
          })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await fetchPromotersWithPagination({ page: 1, limit: 10 })

      expect(result.data).toEqual([])
      expect(mockQuery.single).toHaveBeenCalledTimes(3)
    })

    it('should not retry on validation errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Invalid input' },
          count: 0
        })
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(
        fetchPromotersWithPagination({ page: 1, limit: 10 })
      ).rejects.toThrow('Error fetching promoters: Invalid input')

      expect(mockQuery.single).toHaveBeenCalledTimes(1)
    })
  })
})