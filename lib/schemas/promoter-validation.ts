import { z } from "zod"
// Utility provides browser-aware validation helpers
import { createOptionalFileSchema } from "./utils"

// Enhanced type definitions for better type safety
export interface ValidationResult {
  isValid: boolean
  error?: string
  details?: any
}

export interface FileValidationConfig {
  maxSize: number
  acceptedTypes: string[]
  maxSizeMessage: string
  acceptedTypesMessage: string
}

export interface DateValidationConfig {
  allowNull: boolean
  allowUndefined: boolean
  minDate?: Date
  maxDate?: Date
  customErrorMessage?: string
}

// Constants for better maintainability
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

// Enhanced file validation configuration
const FILE_VALIDATION_CONFIG: FileValidationConfig = {
  maxSize: MAX_FILE_SIZE,
  acceptedTypes: ACCEPTED_IMAGE_TYPES,
  maxSizeMessage: "Max file size is 5MB.",
  acceptedTypesMessage: ".jpg, .jpeg, .png and .webp files are accepted.",
}

// Enhanced date validation configuration
const DATE_VALIDATION_CONFIG: DateValidationConfig = {
  allowNull: true,
  allowUndefined: true,
  minDate: new Date("1900-01-01"),
  maxDate: new Date("2100-12-31"),
  customErrorMessage: "Invalid date format",
}

// Enhanced file schema with better error handling
const fileSchema = createOptionalFileSchema(
  FILE_VALIDATION_CONFIG.maxSize,
  FILE_VALIDATION_CONFIG.acceptedTypes,
  FILE_VALIDATION_CONFIG.maxSizeMessage,
  FILE_VALIDATION_CONFIG.acceptedTypesMessage,
)

// Enhanced date schema with better validation and error handling
const createDateSchema = (config: DateValidationConfig = DATE_VALIDATION_CONFIG) => {
  return z.preprocess(
    (arg) => {
      if (typeof arg === "string" || arg instanceof Date) {
        const date = new Date(arg)

        // Check if date is valid
        if (isNaN(date.getTime())) {
          return config.allowUndefined ? undefined : null
        }

        // Check min/max date constraints
        if (config.minDate && date < config.minDate) {
          return config.allowUndefined ? undefined : null
        }

        if (config.maxDate && date > config.maxDate) {
          return config.allowUndefined ? undefined : null
        }

        return date
      }

      if (arg === null && config.allowNull) {
        return null
      }

      if (arg === undefined && config.allowUndefined) {
        return undefined
      }

      return arg
    },
    z
      .date({
        invalid_type_error: config.customErrorMessage || "Invalid date format",
      })
      .optional()
      .nullable(),
  )
}

// Enhanced validation schemas with better error handling
const createEmailSchema = (customErrorMessage?: string) => {
  return z
    .string()
    .min(1, "Email address is required")
    .email(customErrorMessage || "Please enter a valid email address")
    .toLowerCase()
    .trim()
    .refine((email) => {
      // Additional email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }, "Please enter a valid email address")
}

const createPhoneSchema = (customErrorMessage?: string) => {
  return z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^(\+?[1-9]\d{1,14}|[0-9]{10,15})$/,
      customErrorMessage ||
        "Please enter a valid phone number (10-15 digits, optionally starting with +)",
    )
    .transform((val) => val.replace(/\s+/g, "")) // Remove spaces
    .refine((phone) => {
      // Additional phone validation
      const cleanPhone = phone.replace(/[^\d+]/g, "")
      return cleanPhone.length >= 10 && cleanPhone.length <= 15
    }, "Phone number must be between 10 and 15 digits")
}

const createNationalitySchema = (customErrorMessage?: string) => {
  return z
    .string()
    .min(1, "Nationality is required")
    .min(2, "Nationality must be at least 2 characters")
    .max(50, "Nationality must be less than 50 characters")
    .regex(
      /^[a-zA-Z\s\-']+$/,
      customErrorMessage ||
        "Nationality can only contain letters, spaces, hyphens, and apostrophes",
    )
}

const createNameSchema = (fieldName: string, customErrorMessage?: string) => {
  return z
    .string()
    .min(1, `${fieldName} is required`)
    .min(2, `${fieldName} must be at least 2 characters`)
    .max(50, `${fieldName} must be less than 50 characters`)
    .regex(
      /^[a-zA-Z\s\-']+$/,
      customErrorMessage ||
        `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
    )
    .transform((val) => val.trim()) // Trim whitespace
}

// Enhanced promoter statuses with better type safety
export const promoterStatuses = z.enum([
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
])

export type PromoterStatus = z.infer<typeof promoterStatuses>

// Enhanced promoter profile schema with better validation
export const promoterProfileSchema = z.object({
  // Enhanced required fields with custom validation
  firstName: createNameSchema("First name"),
  lastName: createNameSchema("Last name"),
  nationality: createNationalitySchema(),
  email: createEmailSchema(),
  mobile_number: createPhoneSchema(),

  // Existing fields with enhanced validation
  name_en: z
    .string()
    .min(1, "Name (English) is required.")
    .max(100, "Name (English) must be less than 100 characters")
    .transform((val) => val.trim()),
  name_ar: z
    .string()
    .min(1, "Name (Arabic) is required.")
    .max(100, "Name (Arabic) must be less than 100 characters")
    .transform((val) => val.trim()),
  id_card_number: z
    .string()
    .min(1, "ID card number is required.")
    .max(50, "ID card number must be less than 50 characters")
    .transform((val) => val.trim()),
  employer_id: z.string().nullable().optional(),
  outsourced_to_id: z.string().nullable().optional(),
  job_title: z
    .string()
    .max(100, "Job title must be less than 100 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  department: z
    .string()
    .max(100, "Department must be less than 100 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  work_location: z
    .string()
    .max(100, "Work location must be less than 100 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  status: promoterStatuses.describe("Status is required."),
  contract_valid_until: createDateSchema(),
  id_card_image: fileSchema,
  passport_image: fileSchema,
  existing_id_card_url: z.string().url("Invalid ID card image URL").optional().nullable(),
  existing_passport_url: z.string().url("Invalid passport image URL").optional().nullable(),
  id_card_expiry_date: createDateSchema({
    ...DATE_VALIDATION_CONFIG,
    minDate: new Date(),
    customErrorMessage: "ID card expiry date must be in the future",
  }),
  passport_expiry_date: createDateSchema({
    ...DATE_VALIDATION_CONFIG,
    minDate: new Date(),
    customErrorMessage: "Passport expiry date must be in the future",
  }),
  notify_days_before_id_expiry: z
    .number()
    .min(1, "Notification days must be at least 1")
    .max(365, "Notification days cannot exceed 365")
    .optional()
    .nullable(),
  notify_days_before_passport_expiry: z
    .number()
    .min(1, "Notification days must be at least 1")
    .max(365, "Notification days cannot exceed 365")
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(1000, "Notes must be less than 1000 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  passport_number: z
    .string()
    .min(1, "Passport number is required.")
    .max(50, "Passport number must be less than 50 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  profile_picture_url: z.string().url("Invalid photo URL").optional().nullable(),
})

export type PromoterProfileFormData = z.infer<typeof promoterProfileSchema>

// Enhanced validation helpers with better error handling
export const validateEmail = (email: string): ValidationResult => {
  try {
    createEmailSchema().parse(email)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0].message,
        details: error.errors,
      }
    }
    return {
      isValid: false,
      error: "Invalid email format",
      details: error,
    }
  }
}

export const validatePhone = (phone: string): ValidationResult => {
  try {
    createPhoneSchema().parse(phone)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0].message,
        details: error.errors,
      }
    }
    return {
      isValid: false,
      error: "Invalid phone number format",
      details: error,
    }
  }
}

export const validateNationality = (nationality: string): ValidationResult => {
  try {
    createNationalitySchema().parse(nationality)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0].message,
        details: error.errors,
      }
    }
    return {
      isValid: false,
      error: "Invalid nationality format",
      details: error,
    }
  }
}

export const validateName = (name: string, fieldName: string = "Name"): ValidationResult => {
  try {
    createNameSchema(fieldName).parse(name)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0].message,
        details: error.errors,
      }
    }
    return {
      isValid: false,
      error: `Invalid ${fieldName.toLowerCase()} format`,
      details: error,
    }
  }
}

export const validateDate = (date: any, config?: DateValidationConfig): ValidationResult => {
  try {
    createDateSchema(config).parse(date)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0].message,
        details: error.errors,
      }
    }
    return {
      isValid: false,
      error: "Invalid date format",
      details: error,
    }
  }
}

// Enhanced validation for the entire promoter profile
export const validatePromoterProfile = (data: any): ValidationResult => {
  try {
    promoterProfileSchema.parse(data)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: "Please fix the validation errors below",
        details: error.errors,
      }
    }
    return {
      isValid: false,
      error: "Invalid promoter profile data",
      details: error,
    }
  }
}

// Utility functions for form handling
export const sanitizePromoterData = (data: any): Partial<PromoterProfileFormData> => {
  const sanitized: any = {}

  // Sanitize string fields
  const stringFields = [
    "firstName",
    "lastName",
    "nationality",
    "email",
    "mobile_number",
    "name_en",
    "name_ar",
    "id_card_number",
    "job_title",
    "department",
    "work_location",
    "notes",
    "passport_number",
  ]

  stringFields.forEach((field) => {
    if (data[field] && typeof data[field] === "string") {
      sanitized[field] = data[field].trim()
    } else if (data[field] !== undefined) {
      sanitized[field] = data[field]
    }
  })

  // Handle phone number
  if (data.mobile_number) {
    sanitized.mobile_number = data.mobile_number.replace(/\s+/g, "")
  }

  // Handle email
  if (data.email) {
    sanitized.email = data.email.toLowerCase().trim()
  }

  // Handle dates
  const dateFields = ["contract_valid_until", "id_card_expiry_date", "passport_expiry_date"]
  dateFields.forEach((field) => {
    if (data[field]) {
      const date = new Date(data[field])
      if (!isNaN(date.getTime())) {
        sanitized[field] = date
      }
    }
  })

  // Handle numbers
  const numberFields = ["notify_days_before_id_expiry", "notify_days_before_passport_expiry"]
  numberFields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== null) {
      const num = Number(data[field])
      if (!isNaN(num)) {
        sanitized[field] = num
      }
    }
  })

  // Handle other fields
  const otherFields = [
    "employer_id",
    "outsourced_to_id",
    "status",
    "existing_id_card_url",
    "existing_passport_url",
    "profile_picture_url",
    "id_card_image",
    "passport_image",
  ]

  otherFields.forEach((field) => {
    if (data[field] !== undefined) {
      sanitized[field] = data[field]
    }
  })

  return sanitized
}

// Enhanced error formatting for UI display
export const formatValidationErrors = (errors: z.ZodError): Record<string, string> => {
  const formattedErrors: Record<string, string> = {}

  errors.errors.forEach((error) => {
    const field = error.path.join(".")
    formattedErrors[field] = error.message
  })

  return formattedErrors
}

// Type-safe validation result
export interface ValidationSummary {
  isValid: boolean
  errors: Record<string, string>
  warnings: string[]
  fieldCount: number
  errorCount: number
  warningCount: number
}

export const getValidationSummary = (data: any): ValidationSummary => {
  const result = validatePromoterProfile(data)
  const errors: Record<string, string> = {}
  const warnings: string[] = []

  if (!result.isValid && result.details) {
    const zodErrors = result.details as z.ZodError
    errors = formatValidationErrors(zodErrors)
  }

  // Add warnings for optional fields that might need attention
  if (data.id_card_expiry_date) {
    const expiryDate = new Date(data.id_card_expiry_date)
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry <= 30) {
      warnings.push(`ID card expires in ${daysUntilExpiry} days`)
    }
  }

  if (data.passport_expiry_date) {
    const expiryDate = new Date(data.passport_expiry_date)
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry <= 30) {
      warnings.push(`Passport expires in ${daysUntilExpiry} days`)
    }
  }

  return {
    isValid: result.isValid,
    errors,
    warnings,
    fieldCount: Object.keys(promoterProfileSchema.shape).length,
    errorCount: Object.keys(errors).length,
    warningCount: warnings.length,
  }
}
