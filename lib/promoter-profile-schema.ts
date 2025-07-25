import { z } from "zod"
// Utility provides browser-aware validation helpers
import { createOptionalFileSchema } from "./utils"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

const fileSchema = createOptionalFileSchema(
  MAX_FILE_SIZE,
  ACCEPTED_IMAGE_TYPES,
  "Max file size is 5MB.",
  ".jpg, .jpeg, .png and .webp files are accepted.",
)

// Simple date schema that accepts Date objects, strings, null, or undefined
const dateOptionalNullableSchema = z.any().optional().nullable()

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
  "other"
])
export type PromoterStatus = z.infer<typeof promoterStatuses>

export const promoterProfileSchema = z.object({
  name_en: z.string().min(1, "Name (English) is required."),
  name_ar: z.string().min(1, "Name (Arabic) is required."),
  id_card_number: z.string().min(1, "ID card number is required."),
  employer_id: z.string().nullable().optional(),
  outsourced_to_id: z.string().nullable().optional(),
  job_title: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  work_location: z.string().optional().nullable(),
  status: promoterStatuses.describe("Status is required."),
  contract_valid_until: dateOptionalNullableSchema,
  id_card_image: fileSchema,
  passport_image: fileSchema,
  existing_id_card_url: z.string().optional().nullable(),
  existing_passport_url: z.string().optional().nullable(),
  id_card_expiry_date: dateOptionalNullableSchema,
  passport_expiry_date: dateOptionalNullableSchema,
  notify_days_before_id_expiry: z.number().min(1).max(365).optional().nullable(),
  notify_days_before_passport_expiry: z.number().min(1).max(365).optional().nullable(),
  notes: z.string().optional().nullable(),
  passport_number: z.string().min(1, "Passport number is required.").optional().nullable(),
  mobile_number: z.string().min(5, "Mobile number is required.").optional().nullable(),
  profile_picture_url: z.string().url("Invalid photo URL").optional().nullable(),
})

export type PromoterProfileFormData = z.infer<typeof promoterProfileSchema>
