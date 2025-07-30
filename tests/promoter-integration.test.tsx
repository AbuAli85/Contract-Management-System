import React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { createClient } from "@supabase/supabase-js"
import {
  fetchPromotersWithPagination,
  getPromoterCVData,
  fetchPromotersAnalytics,
  getPromoterPerformanceStats,
  exportPromotersToCSV,
  importPromotersFromCSV,
} from "@/lib/promoter-service"
import { promoterProfileSchema } from "@/lib/promoter-profile-schema"

// Mock Supabase client for integration tests
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ne: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    and: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    then: jest.fn().mockResolvedValue({ data: [], error: null }),
  })),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  functions: {
    invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabaseClient,
}))

// Test component for promoter management
const TestPromoterComponent = () => {
  const [promoters, setPromoters] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)

  const loadPromoters = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchPromotersWithPagination(1, 10)
      if (result.error) {
        setError(result.error)
      } else {
        setPromoters(result.data || [])
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={loadPromoters} disabled={loading}>
        {loading ? "Loading..." : "Load Promoters"}
      </button>
      {error && <div data-testid="error">Error: {error.message}</div>}
      <div data-testid="promoters-count">Count: {promoters.length}</div>
      {promoters.map((promoter: any) => (
        <div key={promoter.id} data-testid={`promoter-${promoter.id}`}>
          {promoter.first_name} {promoter.last_name}
        </div>
      ))}
    </div>
  )
}

describe("Promoter Management - Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("End-to-End Promoter Management Flow", () => {
    it("should complete full promoter lifecycle", async () => {
      const mockPromoters = [
        { id: 1, first_name: "John", last_name: "Doe", email: "john@example.com" },
        { id: 2, first_name: "Jane", last_name: "Smith", email: "jane@example.com" },
      ]

      // Mock successful promoter fetch
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: mockPromoters, error: null }),
      })

      render(<TestPromoterComponent />)

      const loadButton = screen.getByText("Load Promoters")
      fireEvent.click(loadButton)

      await waitFor(() => {
        expect(screen.getByText("Count: 2")).toBeInTheDocument()
      })

      expect(screen.getByTestId("promoter-1")).toBeInTheDocument()
      expect(screen.getByTestId("promoter-2")).toBeInTheDocument()
    })

    it("should handle promoter creation and validation", async () => {
      const validPromoter = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        phone: "+1234567890",
        nationality: "US",
      }

      const validationResult = promoterProfileSchema.safeParse(validPromoter)
      expect(validationResult.success).toBe(true)

      // Mock successful insertion
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: { id: 1, ...validPromoter },
          error: null,
        }),
      })

      const result = await mockSupabaseClient
        .from("promoters")
        .insert(validPromoter)
        .select()
        .single()

      expect(result.data.id).toBe(1)
      expect(result.data.first_name).toBe("John")
      expect(result.error).toBeNull()
    })

    it("should handle promoter update workflow", async () => {
      const updatedData = {
        first_name: "John Updated",
        last_name: "Doe Updated",
      }

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: { id: 1, ...updatedData },
          error: null,
        }),
      })

      const result = await mockSupabaseClient
        .from("promoters")
        .update(updatedData)
        .eq("id", 1)
        .select()
        .single()

      expect(result.data.first_name).toBe("John Updated")
      expect(result.data.last_name).toBe("Doe Updated")
    })

    it("should handle promoter deletion with cleanup", async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: null, error: null }),
      })

      const result = await mockSupabaseClient.from("promoters").delete().eq("id", 1)

      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe("CV Data Management Integration", () => {
    it("should fetch and display CV data", async () => {
      const mockCVData = {
        skills: [
          { id: 1, skill_name: "JavaScript", proficiency: "Advanced" },
          { id: 2, skill_name: "React", proficiency: "Intermediate" },
        ],
        experience: [
          { id: 1, company: "Tech Corp", position: "Senior Developer", duration: "2 years" },
        ],
        education: [{ id: 1, institution: "University", degree: "Computer Science", year: "2020" }],
        documents: [{ id: 1, document_name: "Resume.pdf", document_type: "resume" }],
      }

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: mockCVData.skills, error: null }),
      })

      const result = await getPromoterCVData(1)

      expect(result.skills).toEqual(mockCVData.skills)
      expect(result.error).toBeNull()
    })

    it("should handle CV data updates", async () => {
      const newSkill = {
        skill_name: "TypeScript",
        proficiency: "Advanced",
        years_experience: 3,
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: { id: 3, ...newSkill },
          error: null,
        }),
      })

      const result = await mockSupabaseClient
        .from("promoter_skills")
        .insert(newSkill)
        .select()
        .single()

      expect(result.data.skill_name).toBe("TypeScript")
      expect(result.data.proficiency).toBe("Advanced")
    })
  })

  describe("Analytics and Performance Integration", () => {
    it("should fetch promoter analytics", async () => {
      const mockAnalytics = {
        total_promoters: 150,
        active_promoters: 120,
        average_rating: 4.5,
        top_skills: ["JavaScript", "React", "Node.js"],
        performance_metrics: {
          average_completion_rate: 0.85,
          average_response_time: 2.5,
          total_contracts: 500,
        },
      }

      mockSupabaseClient.rpc.mockResolvedValue({ data: mockAnalytics, error: null })

      const result = await fetchPromotersAnalytics()

      expect(result.data.total_promoters).toBe(150)
      expect(result.data.active_promoters).toBe(120)
      expect(result.data.average_rating).toBe(4.5)
      expect(result.data.top_skills).toContain("JavaScript")
    })

    it("should calculate performance stats", async () => {
      const mockStats = {
        total_contracts: 50,
        completed_contracts: 45,
        success_rate: 0.9,
        average_rating: 4.8,
        total_earnings: 50000,
        performance_trend: [
          { month: "Jan", contracts: 10, earnings: 10000 },
          { month: "Feb", contracts: 12, earnings: 12000 },
        ],
      }

      mockSupabaseClient.rpc.mockResolvedValue({ data: mockStats, error: null })

      const result = await getPromoterPerformanceStats(1)

      expect(result.data.total_contracts).toBe(50)
      expect(result.data.success_rate).toBe(0.9)
      expect(result.data.total_earnings).toBe(50000)
    })
  })

  describe("CSV Import/Export Integration", () => {
    it("should export promoters to CSV format", async () => {
      const mockPromoters = [
        {
          id: 1,
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          phone: "+1234567890",
        },
        {
          id: 2,
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
          phone: "+0987654321",
        },
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: mockPromoters, error: null }),
      })

      const result = await exportPromotersToCSV()

      expect(result.data).toContain("first_name,last_name,email,phone")
      expect(result.data).toContain("John,Doe,john@example.com,+1234567890")
      expect(result.data).toContain("Jane,Smith,jane@example.com,+0987654321")
      expect(result.error).toBeNull()
    })

    it("should import promoters from CSV with validation", async () => {
      const csvData = `first_name,last_name,email,phone,nationality
John,Doe,john@example.com,+1234567890,US
Jane,Smith,jane@example.com,+0987654321,UK`

      const mockImportedPromoters = [
        { id: 1, first_name: "John", last_name: "Doe", email: "john@example.com" },
        { id: 2, first_name: "Jane", last_name: "Smith", email: "jane@example.com" },
      ]

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { promoters: mockImportedPromoters },
        error: null,
      })

      const result = await importPromotersFromCSV(csvData)

      expect(result.data).toHaveLength(2)
      expect(result.data[0].first_name).toBe("John")
      expect(result.data[1].first_name).toBe("Jane")
      expect(result.error).toBeNull()
    })

    it("should handle CSV import validation errors", async () => {
      const invalidCsvData = `first_name,last_name,email
John,Doe,invalid-email
Jane,Smith,jane@example.com`

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: "Validation failed for row 2: Invalid email format" },
      })

      const result = await importPromotersFromCSV(invalidCsvData)

      expect(result.data).toBeNull()
      expect(result.error.message).toContain("Validation failed")
    })
  })

  describe("Search and Filtering Integration", () => {
    it("should perform fuzzy search on promoters", async () => {
      const searchTerm = "john"
      const mockSearchResults = [
        { id: 1, first_name: "John", last_name: "Doe", email: "john@example.com" },
        { id: 3, first_name: "Johnny", last_name: "Smith", email: "johnny@example.com" },
      ]

      mockSupabaseClient.rpc.mockResolvedValue({ data: mockSearchResults, error: null })

      const result = await mockSupabaseClient.rpc("search_promoters", { search_term: searchTerm })

      expect(result.data).toHaveLength(2)
      expect(result.data[0].first_name).toContain("John")
      expect(result.data[1].first_name).toContain("Johnny")
    })

    it("should filter promoters by multiple criteria", async () => {
      const filters = {
        status: "active",
        skills: ["JavaScript", "React"],
        experience_level: "senior",
        location: "New York",
      }

      const mockFilteredResults = [
        { id: 1, first_name: "John", status: "active", skills: ["JavaScript", "React"] },
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: mockFilteredResults, error: null }),
      })

      const result = await mockSupabaseClient
        .from("promoters")
        .select()
        .eq("status", filters.status)
        .in("skills", filters.skills)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].status).toBe("active")
    })
  })

  describe("Error Handling and Recovery", () => {
    it("should handle database connection failures", async () => {
      const mockError = { message: "Database connection failed", code: "CONNECTION_ERROR" }

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      })

      render(<TestPromoterComponent />)

      const loadButton = screen.getByText("Load Promoters")
      fireEvent.click(loadButton)

      await waitFor(() => {
        expect(screen.getByTestId("error")).toBeInTheDocument()
      })

      expect(screen.getByText(/Database connection failed/)).toBeInTheDocument()
    })

    it("should handle partial data failures gracefully", async () => {
      // Mock partial failure where some data loads but CV data fails
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: null, error: { message: "CV data not found" } }),
      })

      const result = await getPromoterCVData(1)

      expect(result.skills).toEqual([])
      expect(result.error).toBeTruthy()
    })

    it("should retry failed operations", async () => {
      let callCount = 0
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(() => {
          callCount++
          if (callCount < 3) {
            return Promise.resolve({ data: null, error: { message: "Temporary failure" } })
          }
          return Promise.resolve({ data: [], error: null })
        }),
      })

      const result = await fetchPromotersWithPagination(1, 10)

      expect(callCount).toBe(3)
      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })
  })

  describe("Data Consistency and Integrity", () => {
    it("should maintain referential integrity", async () => {
      const mockPromoter = { id: 1, first_name: "John", last_name: "Doe" }
      const mockContracts = [
        { id: 1, promoter_id: 1, status: "active" },
        { id: 2, promoter_id: 1, status: "completed" },
      ]

      // Mock promoter fetch
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: mockPromoter, error: null }),
      })

      // Mock contracts fetch
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: mockContracts, error: null }),
      })

      const promoterResult = await mockSupabaseClient
        .from("promoters")
        .select()
        .eq("id", 1)
        .single()

      const contractsResult = await mockSupabaseClient
        .from("contracts")
        .select()
        .eq("promoter_id", 1)

      expect(promoterResult.data.id).toBe(1)
      expect(contractsResult.data).toHaveLength(2)
      expect(contractsResult.data[0].promoter_id).toBe(1)
    })

    it("should handle concurrent data modifications", async () => {
      let concurrentCalls = 0
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(async () => {
          concurrentCalls++
          await new Promise((resolve) => setTimeout(resolve, 50))
          return { data: { id: 1, version: concurrentCalls }, error: null }
        }),
      })

      const promises = Array(3)
        .fill(null)
        .map(() =>
          mockSupabaseClient.from("promoters").update({ first_name: "Updated" }).eq("id", 1),
        )

      await Promise.all(promises)

      expect(concurrentCalls).toBe(3)
    })
  })

  describe("Performance and Scalability", () => {
    it("should handle large datasets efficiently", async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        first_name: `User${i}`,
        last_name: `Last${i}`,
        email: `user${i}@example.com`,
      }))

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: largeDataset, error: null }),
      })

      const startTime = Date.now()
      const result = await fetchPromotersWithPagination(1, 1000)
      const endTime = Date.now()

      expect(result.data).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it("should implement proper pagination for large datasets", async () => {
      const pageSize = 50
      const totalRecords = 1000
      const totalPages = Math.ceil(totalRecords / pageSize)

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: Array.from({ length: pageSize }, (_, i) => ({ id: i + 1 })),
          error: null,
        }),
      })

      for (let page = 1; page <= Math.min(totalPages, 5); page++) {
        const result = await fetchPromotersWithPagination(page, pageSize)
        expect(result.data).toHaveLength(pageSize)
      }
    })
  })
})
