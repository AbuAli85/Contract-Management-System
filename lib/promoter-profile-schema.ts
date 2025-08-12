import { z } from 'zod';
// Utility provides browser-aware validation helpers
import { createOptionalFileSchema } from './utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const fileSchema = createOptionalFileSchema(
  MAX_FILE_SIZE,
  ACCEPTED_IMAGE_TYPES,
  'Max file size is 5MB.',
  '.jpg, .jpeg, .png and .webp files are accepted.'
);

// Simple date schema that accepts Date objects, strings, null, or undefined
const dateOptionalNullableSchema = z.any().optional().nullable();

// Enhanced validation schemas
const emailSchema = z
  .string()
  .min(1, 'Email address is required')
  .email('Please enter a valid email address')
  .toLowerCase()
  .trim();

const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    /^(\+?[1-9]\d{1,14}|[0-9]{10,15})$/,
    'Please enter a valid phone number (10-15 digits, optionally starting with +)'
  )
  .transform(val => val.replace(/\s+/g, '')); // Remove spaces

const nationalitySchema = z
  .string()
  .min(1, 'Nationality is required')
  .min(2, 'Nationality must be at least 2 characters')
  .max(50, 'Nationality must be less than 50 characters');

const firstNameSchema = z
  .string()
  .min(1, 'First name is required')
  .min(2, 'First name must be at least 2 characters')
  .max(50, 'First name must be less than 50 characters')
  .regex(
    /^[a-zA-Z\s\-']+$/,
    'First name can only contain letters, spaces, hyphens, and apostrophes'
  );

const lastNameSchema = z
  .string()
  .min(1, 'Last name is required')
  .min(2, 'Last name must be at least 2 characters')
  .max(50, 'Last name must be less than 50 characters')
  .regex(
    /^[a-zA-Z\s\-']+$/,
    'Last name can only contain letters, spaces, hyphens, and apostrophes'
  );

export const promoterStatuses = z.enum([
  'active',
  'inactive',
  'suspended',
  'holiday',
  'on_leave',
  'terminated',
  'pending_approval',
  'retired',
  'probation',
  'resigned',
  'contractor',
  'temporary',
  'training',
  'other',
]);
export type PromoterStatus = z.infer<typeof promoterStatuses>;

export const promoterProfileSchema = z.object({
  // Enhanced required fields with custom validation
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  nationality: nationalitySchema,
  email: emailSchema,
  mobile_number: phoneSchema,

  // Existing fields with enhanced validation
  name_en: z.string().min(1, 'Name (English) is required.'),
  name_ar: z.string().min(1, 'Name (Arabic) is required.'),
  id_card_number: z.string().min(1, 'ID card number is required.'),
  employer_id: z.string().nullable().optional(),
  outsourced_to_id: z.string().nullable().optional(),
  job_title: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  work_location: z.string().optional().nullable(),
  status: promoterStatuses.describe('Status is required.'),
  contract_valid_until: dateOptionalNullableSchema,
  id_card_image: fileSchema,
  passport_image: fileSchema,
  existing_id_card_url: z.string().optional().nullable(),
  existing_passport_url: z.string().optional().nullable(),
  id_card_expiry_date: dateOptionalNullableSchema,
  passport_expiry_date: dateOptionalNullableSchema,
  notify_days_before_id_expiry: z
    .number()
    .min(1)
    .max(365)
    .optional()
    .nullable(),
  notify_days_before_passport_expiry: z
    .number()
    .min(1)
    .max(365)
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  passport_number: z
    .string()
    .min(1, 'Passport number is required.')
    .optional()
    .nullable(),
  profile_picture_url: z
    .string()
    .url('Invalid photo URL')
    .optional()
    .nullable(),
});

export type PromoterProfileFormData = z.infer<typeof promoterProfileSchema>;

// Additional validation helpers
export const validateEmail = (
  email: string
): { isValid: boolean; error?: string } => {
  try {
    emailSchema.parse(email);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid email format' };
  }
};

export const validatePhone = (
  phone: string
): { isValid: boolean; error?: string } => {
  try {
    phoneSchema.parse(phone);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid phone number format' };
  }
};

export const validateNationality = (
  nationality: string
): { isValid: boolean; error?: string } => {
  try {
    nationalitySchema.parse(nationality);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid nationality format' };
  }
};
