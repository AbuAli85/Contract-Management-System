import { z } from 'zod';

// Party information schema
export const partySchema = z.object({
  id: z.string().uuid('Invalid party ID').optional(),
  name: z
    .string()
    .min(1, 'Party name is required')
    .max(255, 'Party name is too long'),
  type: z.enum(['client', 'employer', 'promoter', 'vendor', 'partner']),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  contactPerson: z.string().optional(),
});

// Contract terms schema
export const contractTermsSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  renewalTerms: z.string().optional(),
  terminationClause: z.string().optional(),
  noticePeriod: z.number().min(0, 'Notice period must be positive').optional(),
  autoRenewal: z.boolean().default(false),
});

// Financial terms schema
export const financialTermsSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z
    .string()
    .length(3, 'Currency must be 3 characters')
    .default('USD'),
  paymentSchedule: z.enum([
    'monthly',
    'quarterly',
    'annually',
    'milestone',
    'upon_completion',
  ]),
  paymentTerms: z.string().optional(),
  latePaymentPenalty: z
    .number()
    .min(0, 'Late payment penalty must be positive')
    .optional(),
  advancePayment: z
    .number()
    .min(0, 'Advance payment must be positive')
    .optional(),
});

// Contract schema
export const contractSchema = z
  .object({
    id: z.string().uuid('Invalid contract ID').optional(),
    contractNumber: z
      .string()
      .min(1, 'Contract number is required')
      .max(50, 'Contract number is too long'),
    title: z
      .string()
      .min(1, 'Contract title is required')
      .max(255, 'Contract title is too long'),
    description: z.string().max(1000, 'Description is too long').optional(),

    // Parties
    client: partySchema,
    employer: partySchema,
    promoter: partySchema.optional(),

    // Contract details
    type: z.enum([
      'employment',
      'service',
      'partnership',
      'vendor',
      'consulting',
      'other',
    ]),
    status: z
      .enum([
        'draft',
        'pending',
        'active',
        'completed',
        'terminated',
        'expired',
      ])
      .default('draft'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),

    // Terms and conditions
    terms: contractTermsSchema,
    financialTerms: financialTermsSchema,

    // Additional fields
    tags: z.array(z.string()).optional(),
    attachments: z.array(z.string()).optional(),
    notes: z.string().max(1000, 'Notes are too long').optional(),

    // Metadata
    createdBy: z.string().uuid('Invalid creator ID').optional(),
    approvedBy: z.string().uuid('Invalid approver ID').optional(),
    approvedAt: z.date().optional(),

    // Timestamps
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  })
  .refine(
    data => {
      // Ensure end date is after start date
      return data.terms.endDate > data.terms.startDate;
    },
    {
      message: 'End date must be after start date',
      path: ['terms', 'endDate'],
    }
  );

// Contract update schema (for editing existing contracts)
export const contractUpdateSchema = contractSchema.partial().omit({
  id: true,
  contractNumber: true,
  createdAt: true,
});

// Contract approval schema
export const contractApprovalSchema = z.object({
  contractId: z.string().uuid('Invalid contract ID'),
  approved: z.boolean(),
  comments: z.string().max(1000, 'Comments are too long').optional(),
  conditions: z.array(z.string()).optional(),
  nextReviewDate: z.date().optional(),
});

// Contract search/filter schema
export const contractSearchSchema = z.object({
  query: z.string().optional(),
  status: z
    .enum(['draft', 'pending', 'active', 'completed', 'terminated', 'expired'])
    .optional(),
  type: z
    .enum([
      'employment',
      'service',
      'partnership',
      'vendor',
      'consulting',
      'other',
    ])
    .optional(),
  clientId: z.string().uuid('Invalid client ID').optional(),
  employerId: z.string().uuid('Invalid employer ID').optional(),
  promoterId: z.string().uuid('Invalid promoter ID').optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  minAmount: z.number().min(0, 'Minimum amount must be positive').optional(),
  maxAmount: z.number().min(0, 'Maximum amount must be positive').optional(),
  tags: z.array(z.string()).optional(),
  createdBy: z.string().uuid('Invalid creator ID').optional(),
  approvedBy: z.string().uuid('Invalid approver ID').optional(),
});

// Contract template schema
export const contractTemplateSchema = z.object({
  id: z.string().uuid('Invalid template ID').optional(),
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(255, 'Template name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  type: z.enum([
    'employment',
    'service',
    'partnership',
    'vendor',
    'consulting',
    'other',
  ]),
  content: z.string().min(1, 'Template content is required'),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  createdBy: z.string().uuid('Invalid creator ID').optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Contract clause schema
export const contractClauseSchema = z.object({
  id: z.string().uuid('Invalid clause ID').optional(),
  title: z
    .string()
    .min(1, 'Clause title is required')
    .max(255, 'Clause title is too long'),
  content: z.string().min(1, 'Clause content is required'),
  type: z.enum(['standard', 'custom', 'regulatory', 'optional']),
  category: z.enum([
    'payment',
    'termination',
    'liability',
    'confidentiality',
    'intellectual_property',
    'other',
  ]),
  isRequired: z.boolean().default(true),
  order: z.number().min(0, 'Order must be positive').optional(),
  templateId: z.string().uuid('Invalid template ID').optional(),
});

// Contract amendment schema
export const contractAmendmentSchema = z.object({
  id: z.string().uuid('Invalid amendment ID').optional(),
  contractId: z.string().uuid('Invalid contract ID'),
  version: z.string().min(1, 'Version is required'),
  description: z
    .string()
    .min(1, 'Amendment description is required')
    .max(1000, 'Description is too long'),
  changes: z.string().min(1, 'Changes description is required'),
  effectiveDate: z.date(),
  approvedBy: z.string().uuid('Invalid approver ID').optional(),
  approvedAt: z.date().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  comments: z.string().max(1000, 'Comments are too long').optional(),
});

// Export types
export type Party = z.infer<typeof partySchema>;
export type ContractTerms = z.infer<typeof contractTermsSchema>;
export type FinancialTerms = z.infer<typeof financialTermsSchema>;
export type Contract = z.infer<typeof contractSchema>;
export type ContractUpdate = z.infer<typeof contractUpdateSchema>;
export type ContractApproval = z.infer<typeof contractApprovalSchema>;
export type ContractSearch = z.infer<typeof contractSearchSchema>;
export type ContractTemplate = z.infer<typeof contractTemplateSchema>;
export type ContractClause = z.infer<typeof contractClauseSchema>;
export type ContractAmendment = z.infer<typeof contractAmendmentSchema>;
