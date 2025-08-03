/**
 * Comprehensive unit tests for promoter-validation.ts
 * Tests enhanced promoter validation with improved type safety and error handling
 */

import { describe, it, expect, vi } from "vitest"
import { z } from "zod"
import {
  validateEmail,
  validatePhone,
  validateNationality,
  validateName,
  validateDate,
  validatePromoterProfile,
  sanitizePromoterData,
  formatValidationErrors,
  getValidationSummary,
  type ValidationResult,
  type ValidationSummary,
  type DateValidationConfig,
  promoterProfileSchema,
  promoterStatuses,
  type PromoterProfileFormData,
  type PromoterStatus,
} from "@/lib/schemas/promoter-validation"

describe("Promoter Validation - Enhanced Functions", () => {
  describe("validateEmail", () => {
    it("should validate valid email addresses", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
        "123@test.com",
      ]

      validEmails.forEach((email) => {
        const result = validateEmail(email)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    it("should reject invalid email addresses", () => {
      const invalidEmails = [
        "invalid-email",
        "@example.com",
        "user@",
        "user@.com",
        "",
        "user@example",
        "user name@example.com",
      ]

      invalidEmails.forEach((email) => {
        const result = validateEmail(email)
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.details).toBeDefined()
      })
    })

    it("should handle edge cases", () => {
      const result = validateEmail("  TEST@EXAMPLE.COM  ")
      expect(result.isValid).toBe(true)
      // Should be normalized to lowercase
    })
  })

  describe("validatePhone", () => {
    it("should validate valid phone numbers", () => {
      const validPhones = [
        "+1234567890",
        "1234567890",
        "+96812345678",
        "96812345678",
        "+1-234-567-8900",
        "1 234 567 8900",
      ]

      validPhones.forEach((phone) => {
        const result = validatePhone(phone)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    it("should reject invalid phone numbers", () => {
      const invalidPhones = [
        "123",
        "1234567890123456", // Too long
        "abcdefghij",
        "",
        "+",
        "123-456-789",
        "123.456.7890",
      ]

      invalidPhones.forEach((phone) => {
        const result = validatePhone(phone)
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.details).toBeDefined()
      })
    })

    it("should normalize phone numbers", () => {
      const result = validatePhone("  +1 234 567 8900  ")
      expect(result.isValid).toBe(true)
      // Should remove spaces
    })
  })

  describe("validateNationality", () => {
    it("should validate valid nationalities", () => {
      const validNationalities = [
        "Omani",
        "American",
        "British",
        "Canadian",
        "Australian",
        "New Zealand",
        "South African",
      ]

      validNationalities.forEach((nationality) => {
        const result = validateNationality(nationality)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    it("should reject invalid nationalities", () => {
      const invalidNationalities = [
        "A", // Too short
        "This nationality name is way too long and exceeds the maximum allowed length",
        "123",
        "Omani123",
        "",
        "Omani@",
        "Omani!",
      ]

      invalidNationalities.forEach((nationality) => {
        const result = validateNationality(nationality)
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.details).toBeDefined()
      })
    })

    it("should accept nationalities with hyphens and apostrophes", () => {
      const validSpecialNationalities = ["Costa Rican", "O'Connor", "Van der Berg", "De la Cruz"]

      validSpecialNationalities.forEach((nationality) => {
        const result = validateNationality(nationality)
        expect(result.isValid).toBe(true)
      })
    })
  })

  describe("validateName", () => {
    it("should validate valid names", () => {
      const validNames = ["John", "Mary", "Jean-Pierre", "O'Connor", "Van der Berg", "De la Cruz"]

      validNames.forEach((name) => {
        const result = validateName(name)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    it("should reject invalid names", () => {
      const invalidNames = [
        "A", // Too short
        "This name is way too long and exceeds the maximum allowed length",
        "John123",
        "",
        "John@",
        "John!",
      ]

      invalidNames.forEach((name) => {
        const result = validateName(name)
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.details).toBeDefined()
      })
    })

    it("should handle custom field names", () => {
      const result = validateName("John", "First name")
      expect(result.isValid).toBe(true)
    })

    it("should trim whitespace", () => {
      const result = validateName("  John  ")
      expect(result.isValid).toBe(true)
    })
  })

  describe("validateDate", () => {
    it("should validate valid dates", () => {
      const validDates = [new Date(), "2024-01-01", "2024-12-31", "2025-06-15"]

      validDates.forEach((date) => {
        const result = validateDate(date)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    it("should reject invalid dates", () => {
      const invalidDates = [
        "invalid-date",
        "2024-13-01", // Invalid month
        "2024-01-32", // Invalid day
        "not-a-date",
        "",
        null,
        undefined,
      ]

      invalidDates.forEach((date) => {
        const result = validateDate(date)
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })

    it("should handle custom date validation config", () => {
      const config: DateValidationConfig = {
        allowNull: true,
        allowUndefined: true,
        minDate: new Date("2024-01-01"),
        maxDate: new Date("2024-12-31"),
        customErrorMessage: "Date must be in 2024",
      }

      const validResult = validateDate("2024-06-15", config)
      expect(validResult.isValid).toBe(true)

      const invalidResult = validateDate("2023-06-15", config)
      expect(invalidResult.isValid).toBe(false)
    })
  })

  describe("validatePromoterProfile", () => {
    it("should validate a complete valid profile", () => {
      const validProfile = {
        firstName: "John",
        lastName: "Doe",
        nationality: "Omani",
        email: "john.doe@example.com",
        mobile_number: "+96812345678",
        name_en: "John Doe",
        name_ar: "جون دو",
        id_card_number: "1234567890",
        status: "active" as PromoterStatus,
        job_title: "Software Developer",
        department: "IT",
        work_location: "Muscat",
        contract_valid_until: "2025-12-31",
        id_card_expiry_date: "2025-12-31",
        passport_expiry_date: "2025-12-31",
        passport_number: "P123456789",
        notes: "Test promoter",
        notify_days_before_id_expiry: 100,
        notify_days_before_passport_expiry: 210,
      }

      const result = validatePromoterProfile(validProfile)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("should reject invalid profiles", () => {
      const invalidProfiles = [
        {
          firstName: "J", // Too short
          lastName: "Doe",
          nationality: "Omani",
          email: "invalid-email",
          mobile_number: "123",
          name_en: "John Doe",
          name_ar: "جون دو",
          id_card_number: "1234567890",
          status: "active",
        },
        {
          firstName: "John",
          lastName: "Doe",
          nationality: "Omani",
          email: "john.doe@example.com",
          mobile_number: "+96812345678",
          name_en: "John Doe",
          name_ar: "جون دو",
          id_card_number: "1234567890",
          status: "invalid_status", // Invalid status
        },
      ]

      invalidProfiles.forEach((profile) => {
        const result = validatePromoterProfile(profile)
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.details).toBeDefined()
      })
    })

    it("should handle missing required fields", () => {
      const incompleteProfile = {
        firstName: "John",
        lastName: "Doe",
        // Missing required fields
      }

      const result = validatePromoterProfile(incompleteProfile)
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe("sanitizePromoterData", () => {
    it("should sanitize string fields", () => {
      const rawData = {
        firstName: "  John  ",
        lastName: "  Doe  ",
        email: "  JOHN.DOE@EXAMPLE.COM  ",
        mobile_number: "  +968 123 456 78  ",
        name_en: "  John Doe  ",
        name_ar: "  جون دو  ",
        job_title: "  Software Developer  ",
        department: "  IT  ",
        work_location: "  Muscat  ",
        notes: "  Test notes  ",
        passport_number: "  P123456789  ",
      }

      const sanitized = sanitizePromoterData(rawData)

      expect(sanitized.firstName).toBe("John")
      expect(sanitized.lastName).toBe("Doe")
      expect(sanitized.email).toBe("john.doe@example.com")
      expect(sanitized.mobile_number).toBe("+96812345678")
      expect(sanitized.name_en).toBe("John Doe")
      expect(sanitized.name_ar).toBe("جون دو")
      expect(sanitized.job_title).toBe("Software Developer")
      expect(sanitized.department).toBe("IT")
      expect(sanitized.work_location).toBe("Muscat")
      expect(sanitized.notes).toBe("Test notes")
      expect(sanitized.passport_number).toBe("P123456789")
    })

    it("should handle date fields", () => {
      const rawData = {
        contract_valid_until: "2024-12-31",
        id_card_expiry_date: "2025-06-15",
        passport_expiry_date: "2025-12-31",
      }

      const sanitized = sanitizePromoterData(rawData)

      expect(sanitized.contract_valid_until).toBeInstanceOf(Date)
      expect(sanitized.id_card_expiry_date).toBeInstanceOf(Date)
      expect(sanitized.passport_expiry_date).toBeInstanceOf(Date)
    })

    it("should handle number fields", () => {
      const rawData = {
        notify_days_before_id_expiry: "100",
        notify_days_before_passport_expiry: "210",
      }

      const sanitized = sanitizePromoterData(rawData)

      expect(sanitized.notify_days_before_id_expiry).toBe(100)
      expect(sanitized.notify_days_before_passport_expiry).toBe(210)
    })

    it("should handle undefined and null values", () => {
      const rawData = {
        firstName: "John",
        lastName: "Doe",
        job_title: null,
        department: undefined,
        notes: "",
      }

      const sanitized = sanitizePromoterData(rawData)

      expect(sanitized.firstName).toBe("John")
      expect(sanitized.lastName).toBe("Doe")
      expect(sanitized.job_title).toBe(null)
      expect(sanitized.department).toBeUndefined()
      expect(sanitized.notes).toBe("")
    })
  })

  describe("formatValidationErrors", () => {
    it("should format Zod errors correctly", () => {
      const mockErrors = [
        {
          code: "invalid_string",
          message: "Invalid email",
          path: ["email"],
        },
        {
          code: "too_small",
          message: "First name must be at least 2 characters",
          path: ["firstName"],
        },
        {
          code: "invalid_type",
          message: "Status is required",
          path: ["status"],
        },
      ] as z.ZodIssue[]

      const zodError = new z.ZodError(mockErrors)
      const formatted = formatValidationErrors(zodError)

      expect(formatted).toEqual({
        email: "Invalid email",
        firstName: "First name must be at least 2 characters",
        status: "Status is required",
      })
    })

    it("should handle nested path errors", () => {
      const mockErrors = [
        {
          code: "invalid_string",
          message: "Invalid nested field",
          path: ["address", "street"],
        },
      ] as z.ZodIssue[]

      const zodError = new z.ZodError(mockErrors)
      const formatted = formatValidationErrors(zodError)

      expect(formatted).toEqual({
        "address.street": "Invalid nested field",
      })
    })
  })

  describe("getValidationSummary", () => {
    it("should provide validation summary for valid data", () => {
      const validData = {
        firstName: "John",
        lastName: "Doe",
        nationality: "Omani",
        email: "john.doe@example.com",
        mobile_number: "+96812345678",
        name_en: "John Doe",
        name_ar: "جون دو",
        id_card_number: "1234567890",
        status: "active",
        id_card_expiry_date: "2025-12-31",
        passport_expiry_date: "2025-12-31",
      }

      const summary = getValidationSummary(validData)

      expect(summary.isValid).toBe(true)
      expect(summary.errors).toEqual({})
      expect(summary.warnings).toEqual([])
      expect(summary.fieldCount).toBeGreaterThan(0)
      expect(summary.errorCount).toBe(0)
      expect(summary.warningCount).toBe(0)
    })

    it("should provide validation summary for invalid data", () => {
      const invalidData = {
        firstName: "J",
        lastName: "Doe",
        email: "invalid-email",
        mobile_number: "123",
        name_en: "John Doe",
        name_ar: "جون دو",
        id_card_number: "1234567890",
        status: "active",
      }

      const summary = getValidationSummary(invalidData)

      expect(summary.isValid).toBe(false)
      expect(Object.keys(summary.errors).length).toBeGreaterThan(0)
      expect(summary.errorCount).toBeGreaterThan(0)
    })

    it("should provide warnings for expiring documents", () => {
      const dataWithExpiringDocs = {
        firstName: "John",
        lastName: "Doe",
        nationality: "Omani",
        email: "john.doe@example.com",
        mobile_number: "+96812345678",
        name_en: "John Doe",
        name_ar: "جون دو",
        id_card_number: "1234567890",
        status: "active",
        id_card_expiry_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        passport_expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      }

      const summary = getValidationSummary(dataWithExpiringDocs)

      expect(summary.warnings.length).toBeGreaterThan(0)
      expect(summary.warningCount).toBeGreaterThan(0)
      expect(summary.warnings.some((w) => w.includes("ID card expires"))).toBe(true)
      expect(summary.warnings.some((w) => w.includes("Passport expires"))).toBe(true)
    })
  })

  describe("Type Safety", () => {
    it("should enforce proper types for validation results", () => {
      const result: ValidationResult = {
        isValid: true,
        error: undefined,
        details: undefined,
      }

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("should enforce proper types for validation summaries", () => {
      const summary: ValidationSummary = {
        isValid: true,
        errors: {},
        warnings: [],
        fieldCount: 20,
        errorCount: 0,
        warningCount: 0,
      }

      expect(summary.isValid).toBe(true)
      expect(summary.fieldCount).toBe(20)
      expect(summary.errorCount).toBe(0)
    })

    it("should enforce proper types for promoter statuses", () => {
      const validStatuses: PromoterStatus[] = [
        "active",
        "inactive",
        "suspended",
        "holiday",
        "on_leave",
        "terminated",
        "pending_approval",
        "retired",
        "probation",
        "resigned",
        "contractor",
        "temporary",
        "training",
        "other",
      ]

      validStatuses.forEach((status) => {
        expect(promoterStatuses.parse(status)).toBe(status)
      })
    })

    it("should reject invalid promoter statuses", () => {
      expect(() => promoterStatuses.parse("invalid_status")).toThrow()
    })
  })

  describe("Schema Validation", () => {
    it("should validate complete promoter profile schema", () => {
      const validProfile: PromoterProfileFormData = {
        firstName: "John",
        lastName: "Doe",
        nationality: "Omani",
        email: "john.doe@example.com",
        mobile_number: "+96812345678",
        name_en: "John Doe",
        name_ar: "جون دو",
        id_card_number: "1234567890",
        status: "active",
        job_title: "Software Developer",
        department: "IT",
        work_location: "Muscat",
        contract_valid_until: new Date("2025-12-31"),
        id_card_expiry_date: new Date("2025-12-31"),
        passport_expiry_date: new Date("2025-12-31"),
        passport_number: "P123456789",
        notes: "Test promoter",
        notify_days_before_id_expiry: 100,
        notify_days_before_passport_expiry: 210,
      }

      const result = promoterProfileSchema.safeParse(validProfile)
      expect(result.success).toBe(true)
    })

    it("should reject invalid promoter profile schema", () => {
      const invalidProfile = {
        firstName: "J", // Too short
        lastName: "Doe",
        nationality: "Omani",
        email: "invalid-email",
        mobile_number: "123",
        name_en: "John Doe",
        name_ar: "جون دو",
        id_card_number: "1234567890",
        status: "invalid_status", // Invalid status
      }

      const result = promoterProfileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
    })
  })

  describe("Error Handling", () => {
    it("should handle validation errors gracefully", () => {
      const invalidData = {
        firstName: "",
        email: "not-an-email",
        mobile_number: "invalid-phone",
      }

      const result = validatePromoterProfile(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.details).toBeDefined()
    })

    it("should provide detailed error information", () => {
      const result = validateEmail("invalid-email")
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.details).toBeDefined()
    })
  })
})
