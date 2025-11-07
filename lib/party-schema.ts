import { z } from 'zod';

// Phone number validation regex (supports international formats)
const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

export const partyFormSchema = z.object({
  name_en: z
    .string()
    .min(2, { message: 'English name must be at least 2 characters' })
    .max(255, { message: 'English name must be less than 255 characters' }),
  
  name_ar: z
    .string()
    .min(2, { message: 'Arabic name must be at least 2 characters' })
    .max(255, { message: 'Arabic name must be less than 255 characters' })
    .optional()
    .or(z.literal('')),
  
  crn: z
    .string()
    .min(5, { message: 'CRN must be at least 5 characters' })
    .max(50, { message: 'CRN must be less than 50 characters' })
    .optional()
    .or(z.literal('')),
  
  type: z.enum(['Employer', 'Client'], {
    required_error: 'Please select a party type',
  }),
  
  role: z
    .string()
    .max(100, { message: 'Role must be less than 100 characters' })
    .optional()
    .or(z.literal('')),
  
  designation_id: z
    .string()
    .uuid({ message: 'Please select a valid designation' })
    .optional()
    .or(z.literal('')),
  
  signatory_name_en: z
    .string()
    .min(2, { message: 'Signatory name (English) must be at least 2 characters' })
    .max(255, { message: 'Signatory name (English) must be less than 255 characters' })
    .optional()
    .or(z.literal('')),
  
  signatory_name_ar: z
    .string()
    .min(2, { message: 'Signatory name (Arabic) must be at least 2 characters' })
    .max(255, { message: 'Signatory name (Arabic) must be less than 255 characters' })
    .optional()
    .or(z.literal('')),
  
  status: z.enum(['Active', 'Inactive', 'Suspended'], {
    required_error: 'Please select a status',
  }),
  
  cr_expiry_date: z.date().optional(),
  
  tax_number: z
    .string()
    .max(50, { message: 'Tax number must be less than 50 characters' })
    .optional()
    .or(z.literal('')),
  
  license_number: z
    .string()
    .max(50, { message: 'License number must be less than 50 characters' })
    .optional()
    .or(z.literal('')),
  
  license_expiry_date: z.date().optional(),
  
  contact_person: z
    .string()
    .min(2, { message: 'Contact person name must be at least 2 characters' })
    .max(100, { message: 'Contact person name must be less than 100 characters' })
    .optional()
    .or(z.literal('')),
  
  contact_phone: z
    .string()
    .regex(phoneRegex, { message: 'Please enter a valid phone number' })
    .optional()
    .or(z.literal('')),
  
  contact_email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .optional()
    .or(z.literal('')),
  
  address_en: z
    .string()
    .max(500, { message: 'Address must be less than 500 characters' })
    .optional()
    .or(z.literal('')),
  
  notes: z
    .string()
    .max(2000, { message: 'Notes must be less than 2000 characters' })
    .optional()
    .or(z.literal('')),
}).refine((data) => {
  // If CR number is provided, CR expiry date should be in the future
  if (data.crn && data.cr_expiry_date) {
    return data.cr_expiry_date > new Date();
  }
  return true;
}, {
  message: 'CR expiry date must be in the future',
  path: ['cr_expiry_date'],
}).refine((data) => {
  // If license number is provided, license expiry date should be in the future
  if (data.license_number && data.license_expiry_date) {
    return data.license_expiry_date > new Date();
  }
  return true;
}, {
  message: 'License expiry date must be in the future',
  path: ['license_expiry_date'],
});

export type PartyFormData = z.infer<typeof partyFormSchema>;
