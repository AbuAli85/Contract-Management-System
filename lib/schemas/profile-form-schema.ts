import * as z from 'zod';

// Phone number validation regex (supports international formats)
const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

export const profileFormSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  
  email: z.string().email('Please enter a valid email address'),
  
  phone: z
    .string()
    .regex(phoneRegex, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  
  department: z
    .string()
    .min(2, 'Department must be at least 2 characters')
    .max(100, 'Department must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  
  position: z
    .string()
    .min(2, 'Position must be at least 2 characters')
    .max(100, 'Position must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  
  avatar_url: z.string().url().optional().or(z.literal('')),
  
  preferences: z.object({
    language: z.enum(['en', 'ar']),
    timezone: z.string(),
    email_notifications: z.boolean(),
    sms_notifications: z.boolean(),
  }).optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;
export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;

