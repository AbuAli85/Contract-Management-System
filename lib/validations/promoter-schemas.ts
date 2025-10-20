import { z } from 'zod';

// Basic promoter profile schema
export const promoterProfileSchema = z.object({
  id: z.number().optional(),
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  date_of_birth: z.date().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),

  // Address information
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),

  // Professional information
  job_title: z.string().optional(),
  department: z.string().optional(),
  work_location: z.string().optional(),
  employment_type: z
    .enum(['full_time', 'part_time', 'contract', 'freelance', 'internship'])
    .optional(),

  // Status and availability
  status: z
    .enum(['active', 'inactive', 'pending', 'suspended'])
    .default('pending'),
  availability: z
    .enum(['available', 'busy', 'unavailable', 'part_time'])
    .default('available'),
  overall_status: z
    .enum(['excellent', 'good', 'fair', 'warning', 'critical'])
    .default('good'),

  // Documents
  id_card_number: z.string().optional(),
  id_card_expiry_date: z.date().optional(),
  passport_number: z.string().optional(),
  passport_expiry_date: z.date().optional(),

  // Additional information
  bio: z.string().max(1000, 'Bio is too long').optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  tags: z.array(z.string()).optional(),

  // Timestamps
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

// Promoter skills schema
export const promoterSkillSchema = z.object({
  id: z.number().optional(),
  promoter_id: z.number(),
  skill_name: z
    .string()
    .min(1, 'Skill name is required')
    .max(100, 'Skill name is too long'),
  proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  years_of_experience: z
    .number()
    .min(0, 'Years of experience must be positive')
    .optional(),
  certification: z.string().optional(),
  verified: z.boolean().default(false),
  verified_by: z.string().uuid('Invalid verifier ID').optional(),
  verified_at: z.date().optional(),
});

// Promoter experience schema
export const promoterExperienceSchema = z.object({
  id: z.number().optional(),
  promoter_id: z.number(),
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(255, 'Company name is too long'),
  job_title: z
    .string()
    .min(1, 'Job title is required')
    .max(255, 'Job title is too long'),
  start_date: z.date(),
  end_date: z.date().optional(),
  is_current: z.boolean().default(false),
  description: z.string().max(1000, 'Description is too long').optional(),
  achievements: z.array(z.string()).optional(),
  skills_used: z.array(z.string()).optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
});

// Promoter education schema
export const promoterEducationSchema = z.object({
  id: z.number().optional(),
  promoter_id: z.number(),
  institution_name: z
    .string()
    .min(1, 'Institution name is required')
    .max(255, 'Institution name is too long'),
  degree: z
    .string()
    .min(1, 'Degree is required')
    .max(255, 'Degree is required'),
  field_of_study: z
    .string()
    .min(1, 'Field of study is required')
    .max(255, 'Field of study is required'),
  start_date: z.date(),
  end_date: z.date().optional(),
  is_current: z.boolean().default(false),
  gpa: z
    .number()
    .min(0, 'GPA must be positive')
    .max(4, 'GPA cannot exceed 4')
    .optional(),
  honors: z.string().optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
  location: z.string().optional(),
});

// Promoter document schema
export const promoterDocumentSchema = z.object({
  id: z.number().optional(),
  promoter_id: z.number(),
  document_type: z.enum([
    'cv',
    'id_card',
    'passport',
    'certificate',
    'reference_letter',
    'other',
  ]),
  file_name: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name is too long'),
  file_path: z.string().min(1, 'File path is required'),
  file_size: z.number().positive('File size must be positive'),
  mime_type: z.string().min(1, 'MIME type is required'),
  uploaded_at: z.date().optional(),
  expires_at: z.date().optional(),
  is_verified: z.boolean().default(false),
  verified_by: z.string().uuid('Invalid verifier ID').optional(),
  verified_at: z.date().optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
});

// Promoter reference schema
export const promoterReferenceSchema = z.object({
  id: z.number().optional(),
  promoter_id: z.number(),
  reference_name: z
    .string()
    .min(1, 'Reference name is required')
    .max(255, 'Reference name is too long'),
  reference_title: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  relationship: z.string().optional(),
  reference_text: z.string().max(1000, 'Reference text is too long').optional(),
  is_verified: z.boolean().default(false),
  verified_at: z.date().optional(),
  created_at: z.date().optional(),
});

// Promoter availability schema
export const promoterAvailabilitySchema = z.object({
  id: z.number().optional(),
  promoter_id: z.number(),
  day_of_week: z.enum([
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]),
  start_time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  end_time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  is_available: z.boolean().default(true),
  notes: z.string().max(500, 'Notes are too long').optional(),
});

// Promoter performance metrics schema
export const promoterPerformanceSchema = z.object({
  id: z.number().optional(),
  promoter_id: z.number(),
  metric_date: z.date(),
  contracts_completed: z
    .number()
    .min(0, 'Contracts completed must be positive'),
  contracts_cancelled: z
    .number()
    .min(0, 'Contracts cancelled must be positive'),
  total_earnings: z.number().min(0, 'Total earnings must be positive'),
  average_rating: z
    .number()
    .min(0, 'Average rating must be positive')
    .max(5, 'Average rating cannot exceed 5'),
  on_time_delivery_rate: z
    .number()
    .min(0, 'On-time delivery rate must be positive')
    .max(100, 'On-time delivery rate cannot exceed 100'),
  customer_satisfaction_score: z
    .number()
    .min(0, 'Customer satisfaction score must be positive')
    .max(10, 'Customer satisfaction score cannot exceed 10'),
  notes: z.string().max(500, 'Notes are too long').optional(),
});

// Promoter search/filter schema
export const promoterSearchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional(),
  availability: z
    .enum(['available', 'busy', 'unavailable', 'part_time'])
    .optional(),
  overall_status: z
    .enum(['excellent', 'good', 'fair', 'warning', 'critical'])
    .optional(),
  skills: z.array(z.string()).optional(),
  experience_level: z
    .enum(['beginner', 'intermediate', 'advanced', 'expert'])
    .optional(),
  min_experience_years: z
    .number()
    .min(0, 'Minimum experience years must be positive')
    .optional(),
  max_experience_years: z
    .number()
    .min(0, 'Maximum experience years must be positive')
    .optional(),
  location: z.string().optional(),
  department: z.string().optional(),
  job_title: z.string().optional(),
  nationality: z.string().optional(),
  min_rating: z
    .number()
    .min(0, 'Minimum rating must be positive')
    .max(5, 'Minimum rating cannot exceed 5')
    .optional(),
  max_rating: z
    .number()
    .min(0, 'Maximum rating must be positive')
    .max(5, 'Maximum rating cannot exceed 5')
    .optional(),
  tags: z.array(z.string()).optional(),
});

// Promoter import schema (for CSV import)
export const promoterImportSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  work_location: z.string().optional(),
  skills: z.string().optional(), // Comma-separated skills
  experience_years: z
    .number()
    .min(0, 'Experience years must be positive')
    .optional(),
  education_level: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']).default('pending'),
});

// Export types
export type PromoterProfile = z.infer<typeof promoterProfileSchema>;
export type PromoterSkill = z.infer<typeof promoterSkillSchema>;
export type PromoterExperience = z.infer<typeof promoterExperienceSchema>;
export type PromoterEducation = z.infer<typeof promoterEducationSchema>;
export type PromoterDocument = z.infer<typeof promoterDocumentSchema>;
export type PromoterReference = z.infer<typeof promoterReferenceSchema>;
export type PromoterAvailability = z.infer<typeof promoterAvailabilitySchema>;
export type PromoterPerformance = z.infer<typeof promoterPerformanceSchema>;
export type PromoterSearch = z.infer<typeof promoterSearchSchema>;
export type PromoterImport = z.infer<typeof promoterImportSchema>;
