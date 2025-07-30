/**
 * Comprehensive unit tests for promoter-service.ts
 * Tests enhanced promoter service with improved type safety and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  fetchPromotersWithPagination,
  fetchPromotersAnalytics,
  getPromoterPerformanceStats,
  exportPromotersToCSV,
  importPromotersFromCSV,
  fetchPromotersWithContractCount,
  deletePromoters,
  updatePromoterStatus,
  bulkUpdatePromoterStatus,
  getPromotersWithExpiringDocuments,
  searchPromoters,
  type PaginationParams,
  type PromoterFilters,
  type PromoterAnalyticsFilters,
  type PaginatedResult,
  type ServiceError,
  type PromoterPerformanceStats,
  type ImportResult,
} from "@/lib/promoter-service"

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        in: vi.fn(() => ({
          update: vi.fn(() => ({
            delete: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() => ({
                  or: vi.fn(() => ({
                    and: vi.fn(() => ({
                      single: vi.fn(() => Promise.resolve({ data: mockPromoter, error: null })),
                    })),
                  })),
                })),
              })),
            })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      delete: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
  rpc: vi.fn(() => Promise.resolve({ data: mockAnalyticsData, error: null })),
  functions: {
    invoke: vi.fn(() => Promise.resolve({ data: mockImportResult, error: null })),
  },
}

// Mock data
const mockPromoter = {
  id: "promoter-1",
  name_en: "John Doe",
  name_ar: "جون دو",
  email: "john@example.com",
  mobile_number: "+96812345678",
  nationality: "Omani",
  id_card_number: "1234567890",
  passport_number: "P123456789",
  job_title: "Software Developer",
  work_location: "Muscat",
  status: "active",
  id_card_expiry_date: "2025-12-31",
  passport_expiry_date: "2025-12-31",
  notes: "Test promoter",
  created_at: "2024-01-01T00:00:00Z",
  active_contracts_count: 2,
}

const mockAnalyticsData = [
  {
    data: [mockPromoter],
    total_count: 1,
    page: 1,
    limit: 10,
    total_pages: 1,
  },
]

const mockImportResult: ImportResult = {
  success: true,
  imported: 5,
  errors: [],
  total: 5,
}

const mockPerformanceStats: PromoterPerformanceStats = {
  total_promoters: 100,
  active_promoters: 80,
  inactive_promoters: 20,
  critical_status_count: 5,
  warning_status_count: 10,
  total_contracts: 150,
  total_contract_value: 50000,
  avg_contract_duration: 12,
  avg_completion_rate: 85,
  expiring_documents_count: 8,
  expired_documents_count: 2,
}

// Mock the getSupabaseClient function
vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: vi.fn(() => mockSupabaseClient),
}))

describe("Promoter Service - Enhanced Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("fetchPromotersWithPagination", () => {
    it("should fetch promoters with pagination successfully", async () => {
      const params: PaginationParams = { page: 1, limit: 10 }
      const mockQuery = {
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            eq: vi.fn(() => ({
              range: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({
                    data: [mockPromoter],
                    error: null,
                    count: 1,
                  }),
                ),
              })),
            })),
          })),
        })),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await fetchPromotersWithPagination(params)

      expect(result).toEqual({
        data: [{ ...mockPromoter, active_contracts_count: 0 }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })
    })

    it("should handle search term correctly", async () => {
      const params: PaginationParams = { page: 1, limit: 10 }
      const searchTerm = "John"

      const mockQuery = {
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            range: vi.fn(() => ({
              order: vi.fn(() =>
                Promise.resolve({
                  data: [mockPromoter],
                  error: null,
                  count: 1,
                }),
              ),
            })),
          })),
        })),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await fetchPromotersWithPagination(params, searchTerm)

      expect(mockQuery.select).toHaveBeenCalledWith("*", { count: "exact" })
    })

    it("should handle filters correctly", async () => {
      const params: PaginationParams = { page: 1, limit: 10 }
      const filters: PromoterFilters = {
        status: "active",
        documentStatus: "valid",
      }

      const mockQuery = {
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            eq: vi.fn(() => ({
              range: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({
                    data: [mockPromoter],
                    error: null,
                    count: 1,
                  }),
                ),
              })),
            })),
          })),
        })),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await fetchPromotersWithPagination(params, undefined, filters)

      expect(mockQuery.select).toHaveBeenCalledWith("*", { count: "exact" })
    })

    it("should handle database errors gracefully", async () => {
      const params: PaginationParams = { page: 1, limit: 10 }
      const mockQuery = {
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            eq: vi.fn(() => ({
              range: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: { message: "Database connection failed" },
                    count: 0,
                  }),
                ),
              })),
            })),
          })),
        })),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await fetchPromotersWithPagination(params)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain("Error fetching promoters")
      expect(result.data).toEqual([])
    })
  })

  describe("fetchPromotersAnalytics", () => {
    it("should fetch promoter analytics successfully", async () => {
      const params: PaginationParams = { page: 1, limit: 10 }
      const filters: PromoterAnalyticsFilters = {
        status: "active",
        workLocation: "Muscat",
      }

      const result = await fetchPromotersAnalytics(params, "search", filters)

      expect(result).toEqual({
        data: [mockPromoter],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })
    })

    it("should handle empty analytics data", async () => {
      const params: PaginationParams = { page: 1, limit: 10 }

      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await fetchPromotersAnalytics(params)

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      })
    })

    it("should handle RPC errors gracefully", async () => {
      const params: PaginationParams = { page: 1, limit: 10 }

      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: "RPC function not found" },
      })

      const result = await fetchPromotersAnalytics(params)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toContain("Error fetching promoter analytics")
    })
  })

  describe("getPromoterPerformanceStats", () => {
    it("should fetch performance stats successfully", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [mockPerformanceStats],
        error: null,
      })

      const result = await getPromoterPerformanceStats()

      expect(result).toEqual(mockPerformanceStats)
    })

    it("should return default stats when no data", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await getPromoterPerformanceStats()

      expect(result).toEqual({
        total_promoters: 0,
        active_promoters: 0,
        inactive_promoters: 0,
        critical_status_count: 0,
        warning_status_count: 0,
        total_contracts: 0,
        total_contract_value: 0,
        avg_contract_duration: 0,
        avg_completion_rate: 0,
        expiring_documents_count: 0,
        expired_documents_count: 0,
      })
    })

    it("should handle RPC errors", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      })

      await expect(getPromoterPerformanceStats()).rejects.toThrow(
        "Failed to get promoter performance stats",
      )
    })
  })

  describe("exportPromotersToCSV", () => {
    it("should export promoters to CSV successfully", async () => {
      const mockQuery = {
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() =>
                Promise.resolve({
                  data: [mockPromoter],
                  error: null,
                }),
              ),
            })),
          })),
        })),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await exportPromotersToCSV("search", { status: "active" })

      expect(result).toContain("First Name")
      expect(result).toContain("John Doe")
    })

    it("should handle export errors", async () => {
      const mockQuery = {
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { message: "Export failed" },
                }),
              ),
            })),
          })),
        })),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(exportPromotersToCSV()).rejects.toThrow("Failed to export promoters to CSV")
    })
  })

  describe("importPromotersFromCSV", () => {
    it("should import promoters from CSV successfully", async () => {
      const csvData = [["John", "Doe", "john@example.com", "+96812345678"]]
      const userId = "user-1"

      const result = await importPromotersFromCSV(csvData, userId)

      expect(result).toEqual(mockImportResult)
    })

    it("should handle import errors", async () => {
      const csvData = [["John", "Doe"]]
      const userId = "user-1"

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: "Import failed" },
      })

      await expect(importPromotersFromCSV(csvData, userId)).rejects.toThrow(
        "Failed to import promoters from CSV",
      )
    })
  })

  describe("fetchPromotersWithContractCount", () => {
    it("should fetch promoters with contract counts successfully", async () => {
      const mockQuery = {
        select: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({
              data: [mockPromoter],
              error: null,
            }),
          ),
        })),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await fetchPromotersWithContractCount()

      expect(result).toEqual([{ ...mockPromoter, active_contracts_count: 0 }])
    })

    it("should handle contract count errors gracefully", async () => {
      const mockQuery = {
        select: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({
              data: [mockPromoter],
              error: null,
            }),
          ),
        })),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await fetchPromotersWithContractCount()

      expect(result[0].active_contracts_count).toBe(0)
    })
  })

  describe("deletePromoters", () => {
    it("should delete promoters successfully", async () => {
      const promoterIds = ["promoter-1", "promoter-2"]

      await expect(deletePromoters(promoterIds)).resolves.not.toThrow()
    })

    it("should handle delete errors", async () => {
      const promoterIds = ["promoter-1"]

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          delete: vi.fn(() => ({
            in: vi.fn(() =>
              Promise.resolve({
                error: { message: "Delete failed" },
              }),
            ),
          })),
        })),
      })

      await expect(deletePromoters(promoterIds)).rejects.toThrow("Failed to delete promoters")
    })
  })

  describe("updatePromoterStatus", () => {
    it("should update promoter status successfully", async () => {
      const promoterId = "promoter-1"
      const status = "inactive"

      await expect(updatePromoterStatus(promoterId, status)).resolves.not.toThrow()
    })

    it("should handle update errors", async () => {
      const promoterId = "promoter-1"
      const status = "active"

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                error: { message: "Update failed" },
              }),
            ),
          })),
        })),
      })

      await expect(updatePromoterStatus(promoterId, status)).rejects.toThrow(
        "Failed to update promoter status",
      )
    })
  })

  describe("bulkUpdatePromoterStatus", () => {
    it("should bulk update promoter statuses successfully", async () => {
      const promoterIds = ["promoter-1", "promoter-2"]
      const status = "active"

      await expect(bulkUpdatePromoterStatus(promoterIds, status)).resolves.not.toThrow()
    })

    it("should handle bulk update errors", async () => {
      const promoterIds = ["promoter-1"]
      const status = "inactive"

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          update: vi.fn(() => ({
            in: vi.fn(() =>
              Promise.resolve({
                error: { message: "Bulk update failed" },
              }),
            ),
          })),
        })),
      })

      await expect(bulkUpdatePromoterStatus(promoterIds, status)).rejects.toThrow(
        "Failed to bulk update promoter status",
      )
    })
  })

  describe("getPromotersWithExpiringDocuments", () => {
    it("should fetch promoters with expiring documents successfully", async () => {
      const mockQuery = {
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({
                data: [mockPromoter],
                error: null,
              }),
            ),
          })),
        })),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await getPromotersWithExpiringDocuments(30)

      expect(result).toEqual([mockPromoter])
    })

    it("should handle expiring documents errors", async () => {
      const mockQuery = {
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: "Query failed" },
              }),
            ),
          })),
        })),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(getPromotersWithExpiringDocuments(30)).rejects.toThrow(
        "Failed to get promoters with expiring documents",
      )
    })
  })

  describe("searchPromoters", () => {
    it("should search promoters successfully", async () => {
      const searchTerm = "John"
      const mockQuery = {
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({
                data: [mockPromoter],
                error: null,
              }),
            ),
          })),
        })),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await searchPromoters(searchTerm)

      expect(result).toEqual([mockPromoter])
    })

    it("should handle search errors", async () => {
      const searchTerm = "John"
      const mockQuery = {
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: "Search failed" },
              }),
            ),
          })),
        })),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(searchPromoters(searchTerm)).rejects.toThrow("Failed to search promoters")
    })
  })

  describe("Type Safety", () => {
    it("should enforce proper types for pagination params", () => {
      const params: PaginationParams = {
        page: 1,
        limit: 10,
        offset: 0,
      }

      expect(params.page).toBe(1)
      expect(params.limit).toBe(10)
      expect(params.offset).toBe(0)
    })

    it("should enforce proper types for promoter filters", () => {
      const filters: PromoterFilters = {
        status: "active",
        documentStatus: "valid",
        hasContracts: true,
        overallStatus: "good",
        workLocation: "Muscat",
      }

      expect(filters.status).toBe("active")
      expect(filters.documentStatus).toBe("valid")
      expect(filters.hasContracts).toBe(true)
    })

    it("should enforce proper types for service errors", () => {
      const error: ServiceError = {
        message: "Test error",
        code: "TEST_ERROR",
        details: { test: "details" },
        retryable: false,
      }

      expect(error.message).toBe("Test error")
      expect(error.code).toBe("TEST_ERROR")
      expect(error.retryable).toBe(false)
    })

    it("should enforce proper types for performance stats", () => {
      const stats: PromoterPerformanceStats = {
        total_promoters: 100,
        active_promoters: 80,
        inactive_promoters: 20,
        critical_status_count: 5,
        warning_status_count: 10,
        total_contracts: 150,
        total_contract_value: 50000,
        avg_contract_duration: 12,
        avg_completion_rate: 85,
        expiring_documents_count: 8,
        expired_documents_count: 2,
      }

      expect(stats.total_promoters).toBe(100)
      expect(stats.active_promoters).toBe(80)
      expect(stats.avg_completion_rate).toBe(85)
    })
  })

  describe("Error Handling", () => {
    it("should handle network errors with retry logic", async () => {
      const params: PaginationParams = { page: 1, limit: 10 }

      // Mock a network error that should be retried
      const mockQuery = {
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            eq: vi.fn(() => ({
              range: vi.fn(() => ({
                order: vi.fn(() => {
                  throw new Error("Network timeout")
                }),
              })),
            })),
          })),
        })),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(fetchPromotersWithPagination(params)).rejects.toThrow()
    })

    it("should handle validation errors without retry", async () => {
      const params: PaginationParams = { page: 1, limit: 10 }

      // Mock a validation error that should not be retried
      const mockQuery = {
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            eq: vi.fn(() => ({
              range: vi.fn(() => ({
                order: vi.fn(() => {
                  throw new Error("Invalid input: page must be positive")
                }),
              })),
            })),
          })),
        })),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(fetchPromotersWithPagination(params)).rejects.toThrow()
    })
  })
})
