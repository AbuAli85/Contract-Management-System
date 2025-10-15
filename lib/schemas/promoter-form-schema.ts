import { z } from 'zod';

/**
 * Comprehensive Promoter Form Schema
 * Based on the promoters database table structure
 */
export const promoterFormSchema = z.object({
  // Basic Information
  name_en: z.string().min(2, 'English name is required').max(255).optional().nullable(),
  name_ar: z.string().min(2, 'Arabic name is required').max(255).optional().nullable(),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  
  // Contact Information
  email: z.string().email('Invalid email format').max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  mobile_number: z.string().max(20).optional().nullable(),
  
  // Profile
  profile_picture_url: z.string().url('Invalid URL').optional().nullable(),
  
  // Identity Documents
  id_card_number: z.string().min(5, 'ID card number is required').max(50),
  id_card_expiry_date: z.date({
    required_error: 'ID card expiry date is required',
    invalid_type_error: 'Please enter a valid date',
  }).refine((date) => date > new Date(), {
    message: 'ID card expiry date must be in the future',
  }),
  
  passport_number: z.string().max(50).optional().nullable(),
  passport_expiry_date: z.date().optional().nullable(),
  
  visa_number: z.string().max(50).optional().nullable(),
  visa_expiry_date: z.date().optional().nullable(),
  
  work_permit_number: z.string().max(50).optional().nullable(),
  work_permit_expiry_date: z.date().optional().nullable(),
  
  // Personal Information
  nationality: z.string().max(100).optional().nullable(),
  date_of_birth: z.date().optional().nullable(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().nullable(),
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed']).optional().nullable(),
  
  // Address Information
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  
  // Emergency Contact
  emergency_contact: z.string().max(200).optional().nullable(),
  emergency_phone: z.string().max(20).optional().nullable(),
  
  // Employment Information
  job_title: z.string().max(200).optional().nullable(),
  company: z.string().max(255).optional().nullable(),
  department: z.string().max(200).optional().nullable(),
  specialization: z.string().max(255).optional().nullable(),
  experience_years: z.number().int().min(0).max(70).optional().nullable(),
  
  // Education
  education_level: z.enum(['high_school', 'diploma', 'bachelor', 'master', 'phd', 'other']).optional().nullable(),
  university: z.string().max(255).optional().nullable(),
  graduation_year: z.number().int().min(1950).max(new Date().getFullYear() + 10).optional().nullable(),
  
  // Skills and Certifications
  skills: z.string().max(1000).optional().nullable(),
  certifications: z.string().max(1000).optional().nullable(),
  
  // Banking Information
  bank_name: z.string().max(200).optional().nullable(),
  account_number: z.string().max(50).optional().nullable(),
  iban: z.string().max(50).optional().nullable(),
  swift_code: z.string().max(20).optional().nullable(),
  tax_id: z.string().max(50).optional().nullable(),
  
  // Status and Availability
  status: z.enum(['active', 'inactive', 'pending', 'suspended', 'on_leave']).default('pending'),
  overall_status: z.enum(['excellent', 'good', 'fair', 'warning', 'critical']).default('good'),
  rating: z.number().min(0).max(5).optional().nullable(),
  availability: z.enum(['available', 'busy', 'unavailable', 'part_time']).default('available'),
  
  // Preferences
  preferred_language: z.enum(['en', 'ar', 'both']).default('en'),
  timezone: z.string().max(100).optional().nullable(),
  
  // Additional Information
  special_requirements: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  
  // Relations
  employer_id: z.string().uuid('Invalid employer ID').optional().nullable(),
  
  // Notification Settings
  notify_days_before_id_expiry: z.number().int().min(1).max(365).default(100),
  notify_days_before_passport_expiry: z.number().int().min(1).max(365).default(210),
}).refine((data) => {
  // If passport number is provided, passport expiry date should be provided
  if (data.passport_number && !data.passport_expiry_date) {
    return false;
  }
  return true;
}, {
  message: 'Passport expiry date is required when passport number is provided',
  path: ['passport_expiry_date'],
}).refine((data) => {
  // If work permit number is provided, work permit expiry date should be provided
  if (data.work_permit_number && !data.work_permit_expiry_date) {
    return false;
  }
  return true;
}, {
  message: 'Work permit expiry date is required when work permit number is provided',
  path: ['work_permit_expiry_date'],
}).refine((data) => {
  // If visa number is provided, visa expiry date should be provided
  if (data.visa_number && !data.visa_expiry_date) {
    return false;
  }
  return true;
}, {
  message: 'Visa expiry date is required when visa number is provided',
  path: ['visa_expiry_date'],
}).refine((data) => {
  // Validate passport expiry is in the future if provided
  if (data.passport_expiry_date && data.passport_expiry_date < new Date()) {
    return false;
  }
  return true;
}, {
  message: 'Passport expiry date must be in the future',
  path: ['passport_expiry_date'],
}).refine((data) => {
  // Validate date of birth is in the past
  if (data.date_of_birth && data.date_of_birth > new Date()) {
    return false;
  }
  return true;
}, {
  message: 'Date of birth cannot be in the future',
  path: ['date_of_birth'],
}).refine((data) => {
  // If IBAN is provided, validate format (basic check)
  if (data.iban && data.iban.length > 0) {
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
    return ibanRegex.test(data.iban.replace(/\s/g, ''));
  }
  return true;
}, {
  message: 'Invalid IBAN format',
  path: ['iban'],
});

export type PromoterFormData = z.infer<typeof promoterFormSchema>;

// Form sections for progressive disclosure
export const FORM_SECTIONS = {
  basic: {
    title: 'Basic Information',
    description: 'Personal details and name',
    fields: ['name_en', 'name_ar', 'first_name', 'last_name', 'profile_picture_url'],
  },
  contact: {
    title: 'Contact Information',
    description: 'Email, phone, and address',
    fields: ['email', 'phone', 'mobile_number', 'address', 'city', 'state', 'country', 'postal_code'],
  },
  personal: {
    title: 'Personal Information',
    description: 'Nationality, date of birth, and gender',
    fields: ['nationality', 'date_of_birth', 'gender', 'marital_status'],
  },
  documents: {
    title: 'Identity Documents',
    description: 'ID card, passport, visa, and work permit',
    fields: [
      'id_card_number', 
      'id_card_expiry_date',
      'passport_number', 
      'passport_expiry_date',
      'visa_number',
      'visa_expiry_date',
      'work_permit_number',
      'work_permit_expiry_date',
    ],
  },
  emergency: {
    title: 'Emergency Contact',
    description: 'Contact person in case of emergency',
    fields: ['emergency_contact', 'emergency_phone'],
  },
  employment: {
    title: 'Employment Information',
    description: 'Job details and experience',
    fields: ['job_title', 'company', 'department', 'specialization', 'experience_years', 'employer_id'],
  },
  education: {
    title: 'Education',
    description: 'Educational background',
    fields: ['education_level', 'university', 'graduation_year', 'skills', 'certifications'],
  },
  banking: {
    title: 'Banking Information',
    description: 'Bank account and tax details',
    fields: ['bank_name', 'account_number', 'iban', 'swift_code', 'tax_id'],
  },
  status: {
    title: 'Status & Availability',
    description: 'Current status and availability',
    fields: ['status', 'overall_status', 'rating', 'availability', 'preferred_language', 'timezone'],
  },
  additional: {
    title: 'Additional Information',
    description: 'Notes and special requirements',
    fields: ['special_requirements', 'notes', 'notify_days_before_id_expiry', 'notify_days_before_passport_expiry'],
  },
} as const;

export type FormSection = keyof typeof FORM_SECTIONS;

