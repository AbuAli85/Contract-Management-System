import { z } from 'zod';

// Enhanced user types for your Contract Management System
export type UserRole = 'admin' | 'client' | 'provider' | 'manager' | 'user';
export type UserType = 'individual' | 'company';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

// Company Profile Schema for validation
export const companyProfileSchema = z.object({
  // Basic Information
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  role: z.enum(['client', 'provider', 'admin', 'manager', 'user']),
  user_type: z.enum(['individual', 'company']),

  // Company Information
  company_name: z.string().min(2, 'Company name is required'),
  commercial_registration: z
    .string()
    .min(1, 'Commercial Registration number is required'),
  cr_expiry_date: z.date().nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  tax_number: z.string().nullable().optional(),
  license_number: z.string().nullable().optional(),
  license_expiry_date: z.date().nullable().optional(),

  // Contact Information
  contact_person: z.string().min(2, 'Contact person name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(8, 'Valid phone number is required'),
  mobile: z.string().nullable().optional(),
  address: z.string().min(10, 'Complete address is required'),
  city: z.string().nullable().optional(),
  country: z.string().default('Oman'),

  // Business Details
  business_category: z.string().nullable().optional(),
  services_offered: z.array(z.string()).nullable().optional(),
  employee_count: z.number().min(1).nullable().optional(),
  established_date: z.date().nullable().optional(),
  website: z.string().url().nullable().optional(),

  // Status & Verification
  verification_status: z
    .enum(['pending', 'verified', 'rejected'])
    .default('pending'),
  documents_uploaded: z.boolean().default(false),
  is_active: z.boolean().default(true),

  // Notification Preferences
  notify_days_before_cr_expiry: z.number().min(1).max(365).default(30),
  notify_days_before_license_expiry: z.number().min(1).max(365).default(30),

  // System fields
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

// Employee Management Schema
export const employeeSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  promoter_id: z.string().uuid().nullable().optional(),

  // Basic Information
  name_en: z.string().min(2, 'English name is required'),
  name_ar: z.string().min(2, 'Arabic name is required'),
  employee_id: z.string().min(1, 'Employee ID is required'),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),

  // Employment Details
  designation: z.string().min(1, 'Designation is required'),
  department: z.string().nullable().optional(),
  employee_type: z.enum(['permanent', 'contract', 'consultant', 'intern']),
  employment_status: z
    .enum(['active', 'inactive', 'terminated', 'on_leave'])
    .default('active'),
  joining_date: z.date(),
  termination_date: z.date().nullable().optional(),
  reporting_manager_id: z.string().uuid().nullable().optional(),

  // Compensation
  basic_salary: z.number().min(0).nullable().optional(),
  currency: z.string().default('OMR'),

  // Documents
  documents_uploaded: z.boolean().default(false),
  contract_signed: z.boolean().default(false),

  // System fields
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

// TypeScript types inferred from schemas
export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type Employee = z.infer<typeof employeeSchema>;

// Additional utility types
export interface UserProfile {
  id: string;
  role: UserRole;
  user_type: UserType;
  company_profile?: CompanyProfile;

  // Individual user fields
  full_name?: string;
  email: string;
  phone?: string;
  avatar_url?: string;

  // Status & Verification
  verification_status: VerificationStatus;
  is_active: boolean;

  // System
  created_at: Date;
  updated_at: Date;
}

// Document management types
export interface CompanyDocument {
  id: string;
  company_id: string;
  document_type:
    | 'commercial_registration'
    | 'business_license'
    | 'tax_certificate'
    | 'logo'
    | 'other';
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  expiry_date?: Date;
  uploaded_by: string;
  created_at: Date;
  updated_at: Date;
}

// Service types for API responses
export interface CompanyServiceResponse {
  data?: CompanyProfile | CompanyProfile[];
  error?: string;
  message?: string;
}

export interface EmployeeServiceResponse {
  data?: Employee | Employee[];
  error?: string;
  message?: string;
}

// Business categories for dropdowns
export const BUSINESS_CATEGORIES = [
  'Construction',
  'Technology',
  'Healthcare',
  'Education',
  'Finance',
  'Manufacturing',
  'Retail',
  'Hospitality',
  'Consulting',
  'Government',
  'Oil & Gas',
  'Transportation',
  'Other',
] as const;

// Services offered for providers
export const PROVIDER_SERVICES = [
  'Labor Supply',
  'Technical Services',
  'Consulting',
  'Training',
  'Maintenance',
  'Security',
  'Cleaning',
  'Catering',
  'Transportation',
  'IT Services',
  'Other',
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];
export type ProviderService = (typeof PROVIDER_SERVICES)[number];
