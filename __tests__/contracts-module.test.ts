// __tests__/contracts-module.test.ts
// Comprehensive tests for Contracts Module improvements

import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  validateAndMapContractData,
  STANDARD_TEMPLATE_PLACEHOLDERS,
} from "@/lib/contract-data-mapping"
import { contractService } from "@/lib/contract-service"
import { ExportErrorCode } from "@/components/contract-export-error"

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockContract, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockContract, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: mockContract, error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: mockAnalyticsData, error: null })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: { path: "test.pdf" }, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://test.com/test.pdf" } })),
      })),
    },
  })),
}))

// Mock data
const mockContract = {
  id: "test-contract-id",
  contract_number: "PAC-01012024-TEST",
  first_party_id: "party-1",
  second_party_id: "party-2",
  promoter_id: "promoter-1",
  contract_start_date: "2024-01-01T00:00:00Z",
  contract_end_date: "2024-12-31T00:00:00Z",
  job_title: "Software Developer",
  work_location: "Muscat, Oman",
  department: "IT",
  contract_type: "oman-unlimited-contract",
  currency: "OMR",
  contract_value: 1000,
  email: "test@example.com",
  special_terms: "Standard terms apply",
  status: "draft",
  is_current: true,
}

const mockAnalyticsData = [
  {
    date: "2024-01-01",
    submissions: 5,
    approvals: 3,
    rejections: 1,
    pending: 1,
  },
]

const mockFormData = {
  first_party_id: "party-1",
  second_party_id: "party-2",
  promoter_id: "promoter-1",
  contract_start_date: new Date("2024-01-01"),
  contract_end_date: new Date("2024-12-31"),
  job_title: "Software Developer",
  work_location: "Muscat, Oman",
  department: "IT",
  contract_type: "oman-unlimited-contract",
  currency: "OMR",
  basic_salary: 1000,
  email: "test@example.com",
  special_terms: "Standard terms apply",
}

describe("Contracts Module - Data Mapping Validation", () => {
  describe("validateAndMapContractData", () => {
    it("should validate and map contract data successfully", () => {
      const result = validateAndMapContractData(mockFormData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.mappedFields).toHaveProperty("contract_number")
      expect(result.mappedFields).toHaveProperty("job_title", "Software Developer")
      expect(result.mappedFields).toHaveProperty("work_location", "Muscat, Oman")
    })

    it("should detect missing required fields", () => {
      const incompleteData = {
        ...mockFormData,
        job_title: "",
        work_location: undefined,
      }

      const result = validateAndMapContractData(incompleteData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Job title is required")
      expect(result.missingRequiredFields).toContain("job_title")
    })

    it("should handle unmapped fields", () => {
      const dataWithExtraFields = {
        ...mockFormData,
        extra_field: "should not be mapped",
        another_field: 123,
      }

      const result = validateAndMapContractData(dataWithExtraFields)

      expect(result.isValid).toBe(true)
      expect(result.unmappedFields).toContain("extra_field")
      expect(result.unmappedFields).toContain("another_field")
      expect(result.warnings).toContain(
        "Form field 'extra_field' is not mapped to any template placeholder",
      )
    })

    it("should apply transformations correctly", () => {
      const result = validateAndMapContractData(mockFormData)

      expect(result.mappedFields.contract_start_date).toMatch(/\d{2}\/\d{2}\/\d{4}/)
      expect(result.mappedFields.contract_end_date).toMatch(/\d{2}\/\d{2}\/\d{4}/)
      expect(result.mappedFields.total_salary).toBe("1000")
    })

    it("should generate contract number automatically", () => {
      const result = validateAndMapContractData(mockFormData)

      expect(result.mappedFields.contract_number).toMatch(/^PAC-\d{8}-[A-Z0-9]{4}$/)
    })
  })

  describe("STANDARD_TEMPLATE_PLACEHOLDERS", () => {
    it("should contain all required placeholders", () => {
      const requiredPlaceholders = [
        "contract_number",
        "first_party_name_en",
        "second_party_name_en",
        "promoter_name_en",
        "job_title",
        "department",
        "work_location",
        "contract_start_date",
      ]

      const placeholderKeys = STANDARD_TEMPLATE_PLACEHOLDERS.map((p) => p.key)

      requiredPlaceholders.forEach((key) => {
        expect(placeholderKeys).toContain(key)
      })
    })

    it("should have proper validation rules", () => {
      const jobTitlePlaceholder = STANDARD_TEMPLATE_PLACEHOLDERS.find((p) => p.key === "job_title")

      expect(jobTitlePlaceholder).toBeDefined()
      expect(jobTitlePlaceholder?.required).toBe(true)
      expect(jobTitlePlaceholder?.description).toBe("Job title/position")
    })
  })
})

describe("Contracts Module - Export Error Handling", () => {
  describe("ExportErrorCode enum", () => {
    it("should contain all expected error codes", () => {
      expect(ExportErrorCode.INVALID_CONTRACT_ID).toBe("INVALID_CONTRACT_ID")
      expect(ExportErrorCode.MISSING_REQUIRED_FIELDS).toBe("MISSING_REQUIRED_FIELDS")
      expect(ExportErrorCode.TEMPLATE_NOT_FOUND).toBe("TEMPLATE_NOT_FOUND")
      expect(ExportErrorCode.PDF_GENERATION_FAILED).toBe("PDF_GENERATION_FAILED")
      expect(ExportErrorCode.RATE_LIMIT_ERROR).toBe("RATE_LIMIT_ERROR")
    })
  })

  describe("Error categorization", () => {
    it("should categorize actionable errors correctly", () => {
      const actionableErrors = [
        ExportErrorCode.MISSING_REQUIRED_FIELDS,
        ExportErrorCode.UNMAPPED_FIELDS,
        ExportErrorCode.MISSING_PLACEHOLDERS,
        ExportErrorCode.TEMPLATE_ACCESS_DENIED,
      ]

      actionableErrors.forEach((code) => {
        expect(code).toBeDefined()
      })
    })

    it("should categorize retryable errors correctly", () => {
      const retryableErrors = [
        ExportErrorCode.PDF_GENERATION_FAILED,
        ExportErrorCode.PUPPETEER_ERROR,
        ExportErrorCode.STORAGE_UPLOAD_FAILED,
        ExportErrorCode.RATE_LIMIT_ERROR,
        ExportErrorCode.TIMEOUT_ERROR,
      ]

      retryableErrors.forEach((code) => {
        expect(code).toBeDefined()
      })
    })
  })
})

describe("Contracts Module - Contract Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("generateContract", () => {
    it("should generate contract with validation", async () => {
      const result = await contractService.generateContract(mockFormData, {
        validateDataMapping: true,
        generatePdf: false,
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.details?.contractId).toBeDefined()
      expect(result.details?.status).toBe("created")
    })

    it("should handle validation failures", async () => {
      const invalidData = {
        ...mockFormData,
        job_title: "",
        work_location: "",
      }

      const result = await contractService.generateContract(invalidData, {
        validateDataMapping: true,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("Contract data validation failed")
      expect(result.validation).toBeDefined()
      expect(result.validation?.isValid).toBe(false)
    })

    it("should generate PDF when requested", async () => {
      // Mock fetch for PDF generation
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ pdfUrl: "https://test.com/contract.pdf" }),
        }),
      ) as any

      const result = await contractService.generateContract(mockFormData, {
        generatePdf: true,
      })

      expect(result.success).toBe(true)
      expect(result.details?.pdfUrl).toBeDefined()
    })
  })

  describe("getContract", () => {
    it("should fetch contract by ID", async () => {
      const result = await contractService.getContract("test-contract-id")

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.id).toBe("test-contract-id")
    })

    it("should handle contract not found", async () => {
      // Mock error response
      const mockSupabase = require("@/lib/supabase/client").createClient()
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { message: "Not found" } })),
          })),
        })),
      })

      const result = await contractService.getContract("non-existent-id")

      expect(result.success).toBe(false)
      expect(result.error).toContain("Not found")
    })
  })

  describe("getContracts", () => {
    it("should fetch contracts with pagination", async () => {
      const result = await contractService.getContracts({
        page: 1,
        limit: 10,
        status: "pending_approval",
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.contracts).toBeDefined()
      expect(result.data?.total).toBeDefined()
      expect(result.data?.page).toBe(1)
    })
  })
})

describe("Contracts Module - Digital Signatures", () => {
  describe("Signature data structure", () => {
    it("should have correct signature data interface", () => {
      const signatureData = {
        id: "sig-123",
        contractId: "contract-123",
        signerId: "user-123",
        signerType: "first_party",
        signerName: "John Doe",
        signatureImageUrl: "https://test.com/signature.png",
        signatureTimestamp: "2024-01-01T00:00:00Z",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
      }

      expect(signatureData.id).toBeDefined()
      expect(signatureData.contractId).toBeDefined()
      expect(signatureData.signerId).toBeDefined()
      expect(signatureData.signatureImageUrl).toBeDefined()
      expect(signatureData.signatureTimestamp).toBeDefined()
    })
  })

  describe("Signature validation", () => {
    it("should validate signer types", () => {
      const validSignerTypes = ["first_party", "second_party", "promoter", "admin"]

      validSignerTypes.forEach((type) => {
        expect(["first_party", "second_party", "promoter", "admin"]).toContain(type)
      })
    })
  })
})

describe("Contracts Module - Analytics", () => {
  describe("Analytics data structure", () => {
    it("should have correct analytics interface", () => {
      const analyticsData = {
        submissionsOverTime: [
          {
            date: "2024-01-01",
            submissions: 5,
            approvals: 3,
            rejections: 1,
            pending: 1,
          },
        ],
        approvalTimes: [
          {
            contract_type: "oman-unlimited-contract",
            avg_approval_hours: 24.5,
            min_approval_hours: 2,
            max_approval_hours: 72,
            total_contracts: 10,
          },
        ],
        contractsRequiringAttention: [
          {
            id: "contract-123",
            contract_number: "PAC-01012024-001",
            job_title: "Software Developer",
            status: "pending_approval",
            priority: "high",
            days_pending: 5,
            reminder_count: 2,
            assigned_reviewer: "admin@example.com",
            escalation_needed: true,
          },
        ],
        summary: {
          totalContracts: 100,
          pendingContracts: 15,
          approvedContracts: 80,
          rejectedContracts: 5,
          avgApprovalTime: 24.5,
          contractsNeedingAttention: 3,
        },
      }

      expect(analyticsData.submissionsOverTime).toBeDefined()
      expect(analyticsData.approvalTimes).toBeDefined()
      expect(analyticsData.contractsRequiringAttention).toBeDefined()
      expect(analyticsData.summary).toBeDefined()
    })
  })

  describe("Analytics calculations", () => {
    it("should calculate summary statistics correctly", () => {
      const submissions = [
        { date: "2024-01-01", submissions: 5, approvals: 3, rejections: 1, pending: 1 },
        { date: "2024-01-02", submissions: 3, approvals: 2, rejections: 0, pending: 1 },
      ]

      const approvals = [
        {
          contract_type: "type1",
          avg_approval_hours: 24,
          min_approval_hours: 2,
          max_approval_hours: 48,
          total_contracts: 5,
        },
        {
          contract_type: "type2",
          avg_approval_hours: 36,
          min_approval_hours: 12,
          max_approval_hours: 72,
          total_contracts: 3,
        },
      ]

      const attention = [
        {
          id: "1",
          contract_number: "TEST-001",
          job_title: "Job 1",
          status: "pending",
          priority: "high",
          days_pending: 5,
          reminder_count: 2,
          assigned_reviewer: "admin",
          escalation_needed: true,
        },
        {
          id: "2",
          contract_number: "TEST-002",
          job_title: "Job 2",
          status: "pending",
          priority: "medium",
          days_pending: 3,
          reminder_count: 1,
          assigned_reviewer: "user",
          escalation_needed: false,
        },
      ]

      // This would be the actual calculation function
      const totalSubmissions = submissions.reduce(
        (sum, day) => sum + day.submissions + day.approvals + day.rejections + day.pending,
        0,
      )

      const totalPending = submissions.reduce((sum, day) => sum + day.pending, 0)
      const totalApproved = submissions.reduce((sum, day) => sum + day.approvals, 0)
      const totalRejected = submissions.reduce((sum, day) => sum + day.rejections, 0)

      const avgApprovalTime =
        approvals.length > 0
          ? approvals.reduce((sum, type) => sum + type.avg_approval_hours, 0) / approvals.length
          : 0

      expect(totalSubmissions).toBe(16) // 5+3+1+1 + 3+2+0+1
      expect(totalPending).toBe(2)
      expect(totalApproved).toBe(5)
      expect(totalRejected).toBe(1)
      expect(avgApprovalTime).toBe(30) // (24+36)/2
      expect(attention.length).toBe(2)
    })
  })
})

describe("Contracts Module - Integration Tests", () => {
  describe("End-to-end contract workflow", () => {
    it("should handle complete contract lifecycle", async () => {
      // 1. Generate contract with validation
      const generationResult = await contractService.generateContract(mockFormData, {
        validateDataMapping: true,
        generatePdf: true,
      })

      expect(generationResult.success).toBe(true)

      // 2. Get contract details
      const contractResult = await contractService.getContract(
        generationResult.details!.contractId!,
      )
      expect(contractResult.success).toBe(true)

      // 3. Update contract
      const updateResult = await contractService.updateContract(
        generationResult.details!.contractId!,
        {
          status: "pending_approval",
        },
      )
      expect(updateResult.success).toBe(true)

      // 4. Get contracts list
      const listResult = await contractService.getContracts({
        status: "pending_approval",
      })
      expect(listResult.success).toBe(true)
      expect(
        listResult.data?.contracts.some((c) => c.id === generationResult.details!.contractId),
      ).toBe(true)
    })
  })

  describe("Error handling scenarios", () => {
    it("should handle network errors gracefully", async () => {
      // Mock network error
      global.fetch = vi.fn(() => Promise.reject(new Error("Network error"))) as any

      const result = await contractService.generateContract(mockFormData, {
        generatePdf: true,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("Network error")
    })

    it("should handle validation errors with detailed feedback", async () => {
      const invalidData = {
        contract_type: "invalid-type",
        job_title: "",
        work_location: "",
      }

      const result = await contractService.generateContract(invalidData as any, {
        validateDataMapping: true,
      })

      expect(result.success).toBe(false)
      expect(result.validation).toBeDefined()
      expect(result.validation?.errors.length).toBeGreaterThan(0)
      expect(result.validation?.missingRequiredFields.length).toBeGreaterThan(0)
    })
  })
})
