import { z } from "zod"

// Contact schema
export const contactSchema = z.object({
  id: z.string().uuid().optional(),
  party_id: z.string().uuid().min(1, "Party selection is required"),
  name_en: z
    .string()
    .min(1, "English name is required")
    .min(2, "English name must be at least 2 characters")
    .max(100, "English name must be less than 100 characters")
    .regex(
      /^[a-zA-Z\s\-'\.]+$/,
      "English name can only contain letters, spaces, hyphens, apostrophes, and periods",
    ),
  name_ar: z
    .string()
    .min(1, "Arabic name is required")
    .min(2, "Arabic name must be at least 2 characters")
    .max(100, "Arabic name must be less than 100 characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim()
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(
      /^(\+?[1-9]\d{1,14}|[0-9]{10,15})?$/,
      "Please enter a valid phone number (10-15 digits, optionally starting with +)",
    )
    .transform((val) => val?.replace(/\s+/g, "") || "")
    .optional()
    .or(z.literal("")),
  mobile: z
    .string()
    .regex(
      /^(\+?[1-9]\d{1,14}|[0-9]{10,15})?$/,
      "Please enter a valid mobile number (10-15 digits, optionally starting with +)",
    )
    .transform((val) => val?.replace(/\s+/g, "") || "")
    .optional()
    .or(z.literal("")),
  position: z
    .string()
    .max(100, "Position must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  department: z
    .string()
    .max(100, "Department must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  is_primary: z.boolean().default(false),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().or(z.literal("")),
})

// Party schema
export const partySchema = z.object({
  id: z.string().uuid().optional(),
  name_en: z
    .string()
    .min(1, "English name is required")
    .min(2, "English name must be at least 2 characters")
    .max(200, "English name must be less than 200 characters")
    .regex(
      /^[a-zA-Z0-9\s\-'\.&]+$/,
      "English name can only contain letters, numbers, spaces, hyphens, apostrophes, periods, and ampersands",
    ),
  name_ar: z
    .string()
    .min(1, "Arabic name is required")
    .min(2, "Arabic name must be at least 2 characters")
    .max(200, "Arabic name must be less than 200 characters"),
  crn: z
    .string()
    .min(1, "CRN is required")
    .min(5, "CRN must be at least 5 characters")
    .max(50, "CRN must be less than 50 characters")
    .regex(/^[A-Z0-9\-]+$/, "CRN can only contain uppercase letters, numbers, and hyphens"),
  type: z.enum(["Employer", "Client", "Generic"]).default("Generic"),
  role: z.string().max(100, "Role must be less than 100 characters").optional().or(z.literal("")),
  cr_expiry_date: z.date().optional(),
  contact_person: z
    .string()
    .max(100, "Contact person must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  contact_email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim()
    .optional()
    .or(z.literal("")),
  contact_phone: z
    .string()
    .regex(
      /^(\+?[1-9]\d{1,14}|[0-9]{10,15})?$/,
      "Please enter a valid phone number (10-15 digits, optionally starting with +)",
    )
    .transform((val) => val?.replace(/\s+/g, "") || "")
    .optional()
    .or(z.literal("")),
  address_en: z
    .string()
    .max(500, "English address must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  address_ar: z
    .string()
    .max(500, "Arabic address must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  tax_number: z
    .string()
    .max(50, "Tax number must be less than 50 characters")
    .regex(/^[A-Z0-9\-]+$/, "Tax number can only contain uppercase letters, numbers, and hyphens")
    .optional()
    .or(z.literal("")),
  license_number: z
    .string()
    .max(50, "License number must be less than 50 characters")
    .regex(
      /^[A-Z0-9\-]+$/,
      "License number can only contain uppercase letters, numbers, and hyphens",
    )
    .optional()
    .or(z.literal("")),
  license_expiry_date: z.date().optional(),
  status: z.enum(["Active", "Inactive", "Suspended"]).default("Active"),
  notes: z
    .string()
    .max(1000, "Notes must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
})

// Party form data schema (for form submission)
export const partyFormSchema = partySchema.extend({
  cr_expiry_date: z.date().optional().or(z.literal("")),
  license_expiry_date: z.date().optional().or(z.literal("")),
})

// Contact form data schema (for form submission)
export const contactFormSchema = contactSchema

// Party with contacts schema
export const partyWithContactsSchema = partySchema.extend({
  contacts: z.array(contactSchema).optional(),
})

// Search parameters schema
export const partySearchSchema = z.object({
  searchText: z.string().optional(),
  type: z.enum(["Employer", "Client", "Generic", "all"]).optional(),
  status: z.enum(["Active", "Inactive", "Suspended", "all"]).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(25),
})

// Bulk operations schema
export const bulkPartyOperationSchema = z.object({
  partyIds: z.array(z.string().uuid()).min(1, "At least one party must be selected"),
  operation: z.enum(["delete", "export", "update_status"]),
  newStatus: z.enum(["Active", "Inactive", "Suspended"]).optional(),
})

// Export parameters schema
export const partyExportSchema = z.object({
  partyIds: z.array(z.string().uuid()).optional(),
  includeContacts: z.boolean().default(true),
  format: z.enum(["csv", "json"]).default("csv"),
})

// Types
export type Contact = z.infer<typeof contactSchema>
export type Party = z.infer<typeof partySchema>
export type PartyFormData = z.infer<typeof partyFormSchema>
export type ContactFormData = z.infer<typeof contactFormSchema>
export type PartyWithContacts = z.infer<typeof partyWithContactsSchema>
export type PartySearchParams = z.infer<typeof partySearchSchema>
export type BulkPartyOperation = z.infer<typeof bulkPartyOperationSchema>
export type PartyExportParams = z.infer<typeof partyExportSchema>

// Validation helper functions
export function validateEmail(email: string): boolean {
  return contactSchema.shape.email.safeParse(email).success
}

export function validatePhone(phone: string): boolean {
  return contactSchema.shape.phone.safeParse(phone).success
}

export function validateCRN(crn: string): boolean {
  return partySchema.shape.crn.safeParse(crn).success
}

export function validatePartyName(name: string): boolean {
  return partySchema.shape.name_en.safeParse(name).success
}

// Transform functions for form data
export function transformPartyForForm(party: Party): PartyFormData {
  return {
    ...party,
    cr_expiry_date: party.cr_expiry_date ? new Date(party.cr_expiry_date) : undefined,
    license_expiry_date: party.license_expiry_date
      ? new Date(party.license_expiry_date)
      : undefined,
  }
}

export function transformContactForForm(contact: Contact): ContactFormData {
  return {
    ...contact,
    email: contact.email || "",
    phone: contact.phone || "",
    mobile: contact.mobile || "",
    position: contact.position || "",
    department: contact.department || "",
    notes: contact.notes || "",
  }
}
