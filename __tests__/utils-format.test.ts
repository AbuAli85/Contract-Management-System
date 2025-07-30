/**
 * Comprehensive unit tests for utils/format.ts
 * Tests enhanced utility functions with strict typing and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  calculateDuration,
  copyToClipboard,
  formatCurrencyLegacy,
  formatDateLegacy,
  formatDateTimeLegacy,
  calculateDurationLegacy,
  type CurrencyFormatOptions,
  type DateFormatOptions,
  type DurationFormatOptions,
  type FormatResult,
} from "@/utils/format"

// Mock navigator.clipboard for clipboard tests
const mockClipboard = {
  writeText: vi.fn(),
}

Object.defineProperty(navigator, "clipboard", {
  value: mockClipboard,
  writable: true,
})

describe("Utils Format - Enhanced Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("formatCurrency", () => {
    it("should format currency with default options", () => {
      const result = formatCurrency(1234.56)
      expect(result).toEqual({
        value: "$1,234.56",
        isValid: true,
      })
    })

    it("should format currency with custom options", () => {
      const options: CurrencyFormatOptions = {
        currency: "EUR",
        locale: "de-DE",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
      const result = formatCurrency(1234.56, options)
      expect(result).toEqual({
        value: "1.234,56 €",
        isValid: true,
      })
    })

    it("should handle null/undefined amounts", () => {
      expect(formatCurrency(null)).toEqual({
        value: "N/A",
        isValid: false,
      })
      expect(formatCurrency(undefined)).toEqual({
        value: "N/A",
        isValid: false,
      })
    })

    it("should handle NaN amounts", () => {
      const result = formatCurrency(NaN)
      expect(result).toEqual({
        value: "N/A",
        isValid: false,
      })
    })

    it("should handle zero amounts", () => {
      const result = formatCurrency(0)
      expect(result).toEqual({
        value: "$0.00",
        isValid: true,
      })
    })

    it("should handle negative amounts", () => {
      const result = formatCurrency(-1234.56)
      expect(result).toEqual({
        value: "-$1,234.56",
        isValid: true,
      })
    })

    it("should handle large amounts", () => {
      const result = formatCurrency(1234567.89)
      expect(result).toEqual({
        value: "$1,234,567.89",
        isValid: true,
      })
    })
  })

  describe("formatDate", () => {
    it("should format date with default options", () => {
      const result = formatDate("2024-01-15")
      expect(result.isValid).toBe(true)
      expect(result.value).toMatch(/Jan 15, 2024/)
    })

    it("should format date with custom options", () => {
      const options: DateFormatOptions = {
        locale: "de-DE",
        dateStyle: "full",
      }
      const result = formatDate("2024-01-15", options)
      expect(result.isValid).toBe(true)
      expect(result.value).toMatch(/Montag, 15\. Januar 2024/)
    })

    it("should handle null/undefined dates", () => {
      expect(formatDate(null)).toEqual({
        value: "N/A",
        isValid: false,
      })
      expect(formatDate(undefined)).toEqual({
        value: "N/A",
        isValid: false,
      })
    })

    it("should handle invalid date strings", () => {
      const result = formatDate("invalid-date")
      expect(result).toEqual({
        value: "N/A",
        error: "Invalid date string provided",
        isValid: false,
      })
    })

    it("should handle ISO date strings", () => {
      const result = formatDate("2024-01-15T10:30:00Z")
      expect(result.isValid).toBe(true)
      expect(result.value).toMatch(/Jan 15, 2024/)
    })

    it("should handle different date formats", () => {
      const result1 = formatDate("01/15/2024")
      const result2 = formatDate("2024-01-15T00:00:00.000Z")

      expect(result1.isValid).toBe(true)
      expect(result2.isValid).toBe(true)
    })
  })

  describe("formatDateTime", () => {
    it("should format date and time with default options", () => {
      const result = formatDateTime("2024-01-15T10:30:00Z")
      expect(result.isValid).toBe(true)
      expect(result.value).toMatch(/Jan 15, 2024/)
    })

    it("should format date and time with custom options", () => {
      const options: DateFormatOptions = {
        locale: "de-DE",
        dateStyle: "full",
        timeStyle: "short",
      }
      const result = formatDateTime("2024-01-15T10:30:00Z", options)
      expect(result.isValid).toBe(true)
      expect(result.value).toMatch(/Montag, 15\. Januar 2024/)
    })

    it("should handle null/undefined dates", () => {
      expect(formatDateTime(null)).toEqual({
        value: "N/A",
        isValid: false,
      })
      expect(formatDateTime(undefined)).toEqual({
        value: "N/A",
        isValid: false,
      })
    })

    it("should handle invalid date strings", () => {
      const result = formatDateTime("invalid-date")
      expect(result).toEqual({
        value: "N/A",
        error: "Invalid date string provided",
        isValid: false,
      })
    })
  })

  describe("calculateDuration", () => {
    it("should calculate duration in days for short periods", () => {
      const result = calculateDuration("2024-01-01", "2024-01-05")
      expect(result).toEqual({
        value: "4 days",
        isValid: true,
      })
    })

    it("should calculate duration in weeks for medium periods", () => {
      const result = calculateDuration("2024-01-01", "2024-01-15")
      expect(result).toEqual({
        value: "2 weeks",
        isValid: true,
      })
    })

    it("should calculate duration in months for longer periods", () => {
      const result = calculateDuration("2024-01-01", "2024-03-01")
      expect(result).toEqual({
        value: "2 months",
        isValid: true,
      })
    })

    it("should calculate duration in years for very long periods", () => {
      const result = calculateDuration("2024-01-01", "2026-01-01")
      expect(result).toEqual({
        value: "2 years",
        isValid: true,
      })
    })

    it("should handle short format option", () => {
      const options: DurationFormatOptions = { shortFormat: true }
      const result = calculateDuration("2024-01-01", "2024-01-05", options)
      expect(result).toEqual({
        value: "4d",
        isValid: true,
      })
    })

    it("should handle null/undefined dates", () => {
      expect(calculateDuration(null, "2024-01-05")).toEqual({
        value: "N/A",
        isValid: false,
      })
      expect(calculateDuration("2024-01-01", null)).toEqual({
        value: "N/A",
        isValid: false,
      })
    })

    it("should handle invalid date strings", () => {
      const result = calculateDuration("invalid-date", "2024-01-05")
      expect(result).toEqual({
        value: "N/A",
        error: "Invalid date string provided",
        isValid: false,
      })
    })

    it("should handle single day duration", () => {
      const result = calculateDuration("2024-01-01", "2024-01-01")
      expect(result).toEqual({
        value: "0 days",
        isValid: true,
      })
    })

    it("should handle reverse date order", () => {
      const result = calculateDuration("2024-01-05", "2024-01-01")
      expect(result).toEqual({
        value: "4 days",
        isValid: true,
      })
    })

    it("should handle complex duration with weeks and days", () => {
      const result = calculateDuration("2024-01-01", "2024-01-10")
      expect(result).toEqual({
        value: "1 week, 2 days",
        isValid: true,
      })
    })
  })

  describe("copyToClipboard", () => {
    it("should copy text to clipboard successfully", async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)

      const result = await copyToClipboard("test text")
      expect(result).toEqual({
        value: "Copied to clipboard",
        isValid: true,
      })
      expect(mockClipboard.writeText).toHaveBeenCalledWith("test text")
    })

    it("should handle clipboard API errors", async () => {
      mockClipboard.writeText.mockRejectedValue(new Error("Clipboard error"))

      const result = await copyToClipboard("test text")
      expect(result).toEqual({
        value: "",
        error: "Clipboard copy failed: Clipboard error",
        isValid: false,
      })
    })

    it("should handle empty text", async () => {
      const result = await copyToClipboard("")
      expect(result).toEqual({
        value: "",
        error: "Invalid text provided for clipboard copy",
        isValid: false,
      })
    })

    it("should handle whitespace-only text", async () => {
      const result = await copyToClipboard("   ")
      expect(result).toEqual({
        value: "",
        error: "Invalid text provided for clipboard copy",
        isValid: false,
      })
    })

    it("should handle non-string input", async () => {
      // @ts-ignore - Testing invalid input
      const result = await copyToClipboard(123)
      expect(result).toEqual({
        value: "",
        error: "Invalid text provided for clipboard copy",
        isValid: false,
      })
    })

    it("should handle server-side environment", async () => {
      const originalWindow = global.window
      // @ts-ignore - Mocking window as undefined
      global.window = undefined

      const result = await copyToClipboard("test text")
      expect(result).toEqual({
        value: "",
        error: "Clipboard API not available in server environment",
        isValid: false,
      })

      global.window = originalWindow
    })

    it("should handle missing clipboard API", async () => {
      const originalClipboard = navigator.clipboard
      // @ts-ignore - Mocking clipboard as undefined
      navigator.clipboard = undefined

      const result = await copyToClipboard("test text")
      expect(result).toEqual({
        value: "",
        error: "Clipboard API not supported in this browser",
        isValid: false,
      })

      navigator.clipboard = originalClipboard
    })
  })

  describe("Legacy Functions", () => {
    it("should maintain backward compatibility for formatCurrencyLegacy", () => {
      const result = formatCurrencyLegacy(1234.56, "EUR")
      expect(result).toBe("€1,234.56")
    })

    it("should maintain backward compatibility for formatDateLegacy", () => {
      const result = formatDateLegacy("2024-01-15")
      expect(result).toMatch(/Jan 15, 2024/)
    })

    it("should maintain backward compatibility for formatDateTimeLegacy", () => {
      const result = formatDateTimeLegacy("2024-01-15T10:30:00Z")
      expect(result).toMatch(/Jan 15, 2024/)
    })

    it("should maintain backward compatibility for calculateDurationLegacy", () => {
      const result = calculateDurationLegacy("2024-01-01", "2024-01-05")
      expect(result).toBe("4 days")
    })
  })

  describe("Edge Cases and Error Handling", () => {
    it("should handle very large numbers in currency formatting", () => {
      const result = formatCurrency(Number.MAX_SAFE_INTEGER)
      expect(result.isValid).toBe(true)
      expect(result.value).toMatch(/\$/)
    })

    it("should handle very small numbers in currency formatting", () => {
      const result = formatCurrency(0.0001)
      expect(result.isValid).toBe(true)
      expect(result.value).toBe("$0.00")
    })

    it("should handle very long durations", () => {
      const result = calculateDuration("1900-01-01", "2024-01-01")
      expect(result.isValid).toBe(true)
      expect(result.value).toMatch(/years/)
    })

    it("should handle timezone differences in date calculations", () => {
      const result = calculateDuration("2024-01-01T00:00:00Z", "2024-01-02T23:59:59Z")
      expect(result.isValid).toBe(true)
      expect(result.value).toBe("1 day")
    })

    it("should handle leap year calculations", () => {
      const result = calculateDuration("2024-02-28", "2024-03-01")
      expect(result.isValid).toBe(true)
      expect(result.value).toBe("2 days")
    })
  })

  describe("Type Safety", () => {
    it("should enforce proper types for currency options", () => {
      // This should compile without errors
      const options: CurrencyFormatOptions = {
        currency: "USD",
        locale: "en-US",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
      const result = formatCurrency(100, options)
      expect(result.isValid).toBe(true)
    })

    it("should enforce proper types for date options", () => {
      // This should compile without errors
      const options: DateFormatOptions = {
        locale: "en-US",
        dateStyle: "medium",
        timeStyle: "short",
      }
      const result = formatDate("2024-01-15", options)
      expect(result.isValid).toBe(true)
    })

    it("should enforce proper types for duration options", () => {
      // This should compile without errors
      const options: DurationFormatOptions = {
        includeWeeks: true,
        includeMonths: true,
        includeYears: true,
        shortFormat: false,
      }
      const result = calculateDuration("2024-01-01", "2024-01-05", options)
      expect(result.isValid).toBe(true)
    })
  })
})
