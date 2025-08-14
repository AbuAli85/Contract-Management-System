import { z } from 'zod';

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email is too long');

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password is too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
  .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])/, 'Password must contain at least one special character');

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Registration form schema
export const registrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  role: z.enum(['user', 'manager', 'admin']).default('user'),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  acceptPrivacy: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().max(500, 'Bio is too long').optional(),
});

// User creation schema (admin only)
export const userCreationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  role: z.enum(['user', 'manager', 'admin']),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']).default('pending'),
});

// User update schema
export const userUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  role: z.enum(['user', 'manager', 'admin']),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']),
  permissions: z.array(z.string()).optional(),
});

// Role assignment schema
export const roleAssignmentSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['user', 'manager', 'admin']),
  permissions: z.array(z.string()).optional(),
  reason: z.string().max(500, 'Reason is too long').optional(),
});

// Permission schema
export const permissionSchema = z.object({
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required'),
  scope: z.enum(['own', 'provider', 'organization', 'public', 'all']),
});

// Session validation schema
export const sessionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  expiresAt: z.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  isActive: z.boolean(),
});

// MFA setup schema
export const mfaSetupSchema = z.object({
  method: z.enum(['totp', 'sms', 'email']),
  phone: z.string().optional(),
  backupCodes: z.array(z.string()).optional(),
});

// MFA verification schema
export const mfaVerificationSchema = z.object({
  code: z.string().min(6, 'Verification code must be at least 6 characters').max(8, 'Verification code is too long'),
  method: z.enum(['totp', 'sms', 'email']),
  rememberDevice: z.boolean().optional(),
});

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type PasswordResetRequestData = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetData = z.infer<typeof passwordResetSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type UserCreationData = z.infer<typeof userCreationSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;
export type RoleAssignmentData = z.infer<typeof roleAssignmentSchema>;
export type PermissionData = z.infer<typeof permissionSchema>;
export type SessionData = z.infer<typeof sessionSchema>;
export type MfaSetupData = z.infer<typeof mfaSetupSchema>;
export type MfaVerificationData = z.infer<typeof mfaVerificationSchema>;
