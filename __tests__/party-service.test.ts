import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  fetchPartiesWithPagination,
  searchParties,
  fetchPartyWithContacts,
  saveParty,
  saveContact,
  deleteParty,
  bulkDeleteParties,
  exportPartiesToCSV,
  getPartyStatistics,
  getPartiesWithExpiringDocuments,
  updatePartyStatus,
  bulkUpdatePartyStatus,
} from "../lib/party-service"

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
  functions: {
    invoke: vi.fn(),
  },
}

// Mock the getSupabaseClient function
vi.mock("../lib/supabase", () => ({
  getSupabaseClient: () => mockSupabaseClient,
}))

describe("Party Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe("fetchPartiesWithPagination", () => {
    it("should fetch parties with pagination successfully", async () => {
      const mockParties = [
        { id: "1", name_en: "Test Company", email: "test@example.com" },
        { id: "2", name_en: "Another Company", email: "another@example.com" },
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockParties,
          error: null,
          count: 2,
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await fetchPartiesWithPagination({
        page: 1,
        limit: 10,
        searchText: "test",
      })

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.hasNext).toBe(false)
      expect(result.hasPrev).toBe(false)
    })

    it("should handle search with fuzzy matching", async () => {
      const mockSearchResults = [{ id: "1", name_en: "Test Company", similarity_score: 0.8 }]

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockSearchResults,
        error: null,
      })

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockSearchResults,
          error: null,
          count: 1,
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await fetchPartiesWithPagination({
        page: 1,
        limit: 10,
        searchText: "test",
      })

      expect(result.data).toHaveLength(1)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("search_parties_with_contacts", {
        search_text: "test",
      })
    })

    it("should handle database errors gracefully", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database connection failed" },
          count: 0,
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(fetchPartiesWithPagination({ page: 1, limit: 10 })).rejects.toThrow(
        "Error fetching parties: Database connection failed",
      )
    })
  })

  describe("searchParties", () => {
    it("should search parties with fuzzy matching", async () => {
      const mockSearchResults = [{ id: "1", name_en: "Test Company", similarity_score: 0.8 }]

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockSearchResults,
        error: null,
      })

      const result = await searchParties("test")

      expect(result).toEqual(mockSearchResults)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("search_parties_with_contacts", {
        search_text: "test",
      })
    })

    it("should handle search errors", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: "Search failed" },
      })

      await expect(searchParties("test")).rejects.toThrow("Error searching parties: Search failed")
    })
  })

  describe("fetchPartyWithContacts", () => {
    it("should fetch party with contacts", async () => {
      const mockParty = { id: "1", name_en: "Test Company" }
      const mockContacts = [{ id: "1", party_id: "1", name_en: "John Doe", is_primary: true }]

      const mockPartyQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockParty, error: null }),
      }

      const mockContactsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockContacts, error: null }),
      }

      mockSupabaseClient.from
        .mockReturnValueOnce(mockPartyQuery)
        .mockReturnValueOnce(mockContactsQuery)

      const result = await fetchPartyWithContacts("1")

      expect(result).toEqual({
        ...mockParty,
        contacts: mockContacts,
      })
    })
  })

  describe("saveParty", () => {
    it("should create new party", async () => {
      const partyData = { name_en: "New Company", name_ar: "شركة جديدة" }
      const mockCreatedParty = { id: "1", ...partyData }

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedParty, error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await saveParty(partyData)

      expect(result).toEqual(mockCreatedParty)
      expect(mockQuery.insert).toHaveBeenCalledWith(partyData)
    })

    it("should update existing party", async () => {
      const partyData = { id: "1", name_en: "Updated Company" }
      const mockUpdatedParty = { id: "1", name_en: "Updated Company" }

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedParty, error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await saveParty(partyData)

      expect(result).toEqual(mockUpdatedParty)
      expect(mockQuery.update).toHaveBeenCalledWith(partyData)
      expect(mockQuery.eq).toHaveBeenCalledWith("id", "1")
    })
  })

  describe("saveContact", () => {
    it("should create new contact", async () => {
      const contactData = {
        party_id: "1",
        name_en: "John Doe",
        name_ar: "جون دو",
        email: "john@example.com",
      }
      const mockCreatedContact = { id: "1", ...contactData }

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedContact, error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await saveContact(contactData)

      expect(result).toEqual(mockCreatedContact)
      expect(mockQuery.insert).toHaveBeenCalledWith(contactData)
    })
  })

  describe("deleteParty", () => {
    it("should delete party successfully", async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await deleteParty("1")

      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith("id", "1")
    })
  })

  describe("bulkDeleteParties", () => {
    it("should bulk delete parties via Edge Function", async () => {
      const mockResult = {
        success: true,
        deleted: 2,
        errors: [],
        total: 2,
      }

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: mockResult,
        error: null,
      })

      const result = await bulkDeleteParties(["1", "2"], "user123")

      expect(result).toEqual(mockResult)
      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith("delete-parties", {
        body: {
          partyIds: ["1", "2"],
          userId: "user123",
        },
      })
    })
  })

  describe("exportPartiesToCSV", () => {
    it("should export parties to CSV format", async () => {
      const mockParties = [
        {
          id: "1",
          name_en: "Test Company",
          name_ar: "شركة تجريبية",
          crn: "CRN123",
          type: "Employer",
          status: "Active",
        },
      ]

      const mockContacts = [
        {
          id: "1",
          party_id: "1",
          name_en: "John Doe",
          name_ar: "جون دو",
          email: "john@example.com",
          is_primary: true,
        },
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValueOnce({ data: mockParties, error: null })
          .mockResolvedValueOnce({ data: mockContacts, error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const csvContent = await exportPartiesToCSV(["1"], true)

      expect(csvContent).toContain("Party ID,English Name,Arabic Name,CRN")
      expect(csvContent).toContain("Test Company")
      expect(csvContent).toContain("John Doe")
    })

    it("should handle empty parties list", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const csvContent = await exportPartiesToCSV()

      expect(csvContent).toBe("No parties found to export")
    })
  })

  describe("getPartyStatistics", () => {
    it("should fetch party statistics", async () => {
      const mockStats = {
        total: 100,
        active: 80,
        inactive: 15,
        suspended: 5,
        employers: 40,
        clients: 50,
        generic: 10,
        expiring_documents: 5,
        expired_documents: 2,
      }

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockStats,
        error: null,
      })

      const result = await getPartyStatistics()

      expect(result).toEqual(mockStats)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("get_party_statistics")
    })
  })

  describe("getPartiesWithExpiringDocuments", () => {
    it("should fetch parties with expiring documents", async () => {
      const mockParties = [{ id: "1", name_en: "Test Company", cr_expiry_date: "2023-12-31" }]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockParties, error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await getPartiesWithExpiringDocuments(30)

      expect(result).toEqual(mockParties)
    })
  })

  describe("updatePartyStatus", () => {
    it("should update party status", async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await updatePartyStatus("1", "Inactive")

      expect(mockQuery.update).toHaveBeenCalledWith({ status: "Inactive" })
      expect(mockQuery.eq).toHaveBeenCalledWith("id", "1")
    })
  })

  describe("bulkUpdatePartyStatus", () => {
    it("should bulk update party statuses", async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await bulkUpdatePartyStatus(["1", "2"], "Active")

      expect(mockQuery.update).toHaveBeenCalledWith({ status: "Active" })
      expect(mockQuery.in).toHaveBeenCalledWith("id", ["1", "2"])
    })
  })

  describe("Retry Logic", () => {
    it("should retry on network errors", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockRejectedValueOnce(new Error("Network error"))
          .mockRejectedValueOnce(new Error("Network error"))
          .mockResolvedValueOnce({
            data: [],
            error: null,
            count: 0,
          }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await fetchPartiesWithPagination({ page: 1, limit: 10 })

      expect(result.data).toEqual([])
      expect(mockQuery.single).toHaveBeenCalledTimes(3)
    })

    it("should not retry on validation errors", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Invalid input" },
          count: 0,
        }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await expect(fetchPartiesWithPagination({ page: 1, limit: 10 })).rejects.toThrow(
        "Error fetching parties: Invalid input",
      )

      expect(mockQuery.single).toHaveBeenCalledTimes(1)
    })
  })
})
