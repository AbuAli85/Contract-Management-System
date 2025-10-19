// lib/contract-data-mapping.ts
// Comprehensive data mapping validation for contract generation

import { z } from 'zod';
import type { ContractGeneratorFormData } from '@/lib/schema-generator';
import type { ContractTypeConfig } from '@/lib/contract-type-config';

// Template placeholder mapping interface
export interface TemplatePlaceholder {
  key: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  validation?: string;
  sourceField?: keyof ContractGeneratorFormData | undefined;
  transform?: (value: any) => string;
}

// Data mapping validation result
export interface DataMappingValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  unmappedFields: string[];
  missingRequiredFields: string[];
  mappedFields: Record<string, any>;
  templatePlaceholders: TemplatePlaceholder[];
}

// Standard template placeholders for Google Docs templates
export const STANDARD_TEMPLATE_PLACEHOLDERS: TemplatePlaceholder[] = [
  // Contract information
  {
    key: 'contract_number',
    description: 'Unique contract identifier',
    required: true,
    sourceField: undefined, // Generated automatically
    transform: (value: string) => value?.replace(/[^A-Z0-9-]/g, '') || '',
  },
  {
    key: 'contract_date',
    description: 'Contract signing date',
    required: true,
    defaultValue: new Date().toLocaleDateString('en-GB'),
    transform: (value: Date) =>
      value
        ? new Date(value).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB'),
  },
  {
    key: 'contract_type',
    description: 'Type of contract',
    required: true,
    sourceField: 'contract_type',
  },

  // First party (Client) information
  {
    key: 'first_party_name_en',
    description: 'First party name (English)',
    required: true,
    sourceField: 'first_party_name_en',
  },
  {
    key: 'first_party_name_ar',
    description: 'First party name (Arabic)',
    required: true,
    sourceField: 'first_party_name_ar',
  },
  {
    key: 'first_party_crn',
    description: 'First party commercial registration number',
    required: false,
    sourceField: 'first_party_crn',
  },
  {
    key: 'first_party_address_en',
    description: 'First party address (English)',
    required: false,
    sourceField: undefined, // From parties table
  },
  {
    key: 'first_party_address_ar',
    description: 'First party address (Arabic)',
    required: false,
    sourceField: undefined, // From parties table
  },
  {
    key: 'first_party_contact_person',
    description: 'First party contact person',
    required: false,
    sourceField: undefined, // From parties table
  },
  {
    key: 'first_party_contact_email',
    description: 'First party contact email',
    required: false,
    sourceField: undefined, // From parties table
  },
  {
    key: 'first_party_contact_phone',
    description: 'First party contact phone',
    required: false,
    sourceField: undefined, // From parties table
  },
  {
    key: 'first_party_logo',
    description: 'First party logo URL',
    required: false,
    sourceField: undefined, // From parties table
  },
  {
    key: 'first_party_logo_url',
    description: 'First party logo URL (alias)',
    required: false,
    sourceField: undefined, // From parties table
  },

  // Second party (Employer) information
  {
    key: 'second_party_name_en',
    description: 'Second party name (English)',
    required: true,
    sourceField: 'second_party_name_en',
  },
  {
    key: 'second_party_name_ar',
    description: 'Second party name (Arabic)',
    required: true,
    sourceField: 'second_party_name_ar',
  },
  {
    key: 'second_party_crn',
    description: 'Second party commercial registration number',
    required: false,
    sourceField: 'second_party_crn',
  },
  {
    key: 'second_party_address_en',
    description: 'Second party address (English)',
    required: false,
    sourceField: undefined, // From parties table
  },
  {
    key: 'second_party_address_ar',
    description: 'Second party address (Arabic)',
    required: false,
    sourceField: undefined, // From parties table
  },
  {
    key: 'second_party_contact_person',
    description: 'Second party contact person',
    required: false,
    sourceField: undefined, // From parties table
  },
  {
    key: 'second_party_contact_email',
    description: 'Second party contact email',
    required: false,
    sourceField: undefined, // From parties table
  },
  {
    key: 'second_party_contact_phone',
    description: 'Second party contact phone',
    required: false,
    sourceField: undefined, // From parties table
  },
  {
    key: 'second_party_logo',
    description: 'Second party logo URL',
    required: false,
    sourceField: undefined, // From parties table
  },
  {
    key: 'second_party_logo_url',
    description: 'Second party logo URL (alias)',
    required: false,
    sourceField: undefined, // From parties table
  },

  // Promoter/Employee information
  {
    key: 'promoter_name_en',
    description: 'Promoter name (English)',
    required: true,
    sourceField: 'promoter_name_en',
  },
  {
    key: 'promoter_name_ar',
    description: 'Promoter name (Arabic)',
    required: true,
    sourceField: 'promoter_name_ar',
  },
  {
    key: 'promoter_id_card_number',
    description: 'Promoter ID card number',
    required: true,
    sourceField: 'id_card_number',
  },
  {
    key: 'promoter_mobile_number',
    description: 'Promoter mobile number',
    required: false,
    sourceField: undefined, // From promoters table
  },
  {
    key: 'promoter_email',
    description: 'Promoter email address',
    required: false,
    sourceField: 'email',
  },
  {
    key: 'promoter_id_card_url',
    description: 'Promoter ID card image URL',
    required: false,
    sourceField: 'promoter_id_card_url',
  },
  {
    key: 'promoter_passport_url',
    description: 'Promoter passport image URL',
    required: false,
    sourceField: 'promoter_passport_url',
  },

  // Contract details
  {
    key: 'job_title',
    description: 'Job title/position',
    required: true,
    sourceField: 'job_title',
  },
  {
    key: 'department',
    description: 'Department/division',
    required: true,
    sourceField: 'department',
  },
  {
    key: 'work_location',
    description: 'Primary work location',
    required: true,
    sourceField: 'work_location',
  },
  {
    key: 'contract_start_date',
    description: 'Contract start date',
    required: true,
    sourceField: 'contract_start_date',
    transform: (value: Date) =>
      value ? new Date(value).toLocaleDateString('en-GB') : '',
  },
  {
    key: 'contract_end_date',
    description: 'Contract end date',
    required: false,
    sourceField: 'contract_end_date',
    transform: (value: Date) =>
      value ? new Date(value).toLocaleDateString('en-GB') : '',
  },
  {
    key: 'basic_salary',
    description: 'Monthly basic salary',
    required: false,
    sourceField: 'basic_salary',
    transform: (value: number) => (value ? value.toString() : '0'),
  },
  {
    key: 'allowances',
    description: 'Monthly allowances',
    required: false,
    sourceField: 'allowances',
    transform: (value: number) => (value ? value.toString() : '0'),
  },
  {
    key: 'currency',
    description: 'Currency code',
    required: true,
    sourceField: 'currency',
  },
  {
    key: 'total_salary',
    description: 'Total monthly compensation',
    required: false,
    sourceField: undefined, // Calculated field
    transform: (data: any) => {
      const basic = data.basic_salary || 0;
      const allowances = data.allowances || 0;
      return (basic + allowances).toString();
    },
  },
  {
    key: 'special_terms',
    description: 'Special terms and conditions',
    required: false,
    sourceField: 'special_terms',
  },
  {
    key: 'probation_period_months',
    description: 'Probation period in months',
    required: false,
    sourceField: 'probation_period_months',
    transform: (value: number) => (value ? value.toString() : '3'),
  },
  {
    key: 'notice_period_days',
    description: 'Notice period in days',
    required: false,
    sourceField: 'notice_period_days',
    transform: (value: number) => (value ? value.toString() : '30'),
  },
  {
    key: 'working_hours_per_week',
    description: 'Working hours per week',
    required: false,
    sourceField: 'working_hours_per_week',
    transform: (value: number) => (value ? value.toString() : '40'),
  },
];

// Zod schema for validating template data mapping
export const templateDataMappingSchema = z.object({
  contract_number: z.string().min(1, 'Contract number is required'),
  contract_date: z.string().min(1, 'Contract date is required'),
  contract_type: z.string().min(1, 'Contract type is required'),

  // First party fields
  first_party_name_en: z
    .string()
    .min(1, 'First party name (English) is required'),
  first_party_name_ar: z
    .string()
    .min(1, 'First party name (Arabic) is required'),
  first_party_crn: z.string().optional(),
  first_party_address_en: z.string().optional(),
  first_party_address_ar: z.string().optional(),
  first_party_contact_person: z.string().optional(),
  first_party_contact_email: z.string().email().optional(),
  first_party_contact_phone: z.string().optional(),

  // Second party fields
  second_party_name_en: z
    .string()
    .min(1, 'Second party name (English) is required'),
  second_party_name_ar: z
    .string()
    .min(1, 'Second party name (Arabic) is required'),
  second_party_crn: z.string().optional(),
  second_party_address_en: z.string().optional(),
  second_party_address_ar: z.string().optional(),
  second_party_contact_person: z.string().optional(),
  second_party_contact_email: z.string().email().optional(),
  second_party_contact_phone: z.string().optional(),

  // Promoter fields
  promoter_name_en: z.string().min(1, 'Promoter name (English) is required'),
  promoter_name_ar: z.string().min(1, 'Promoter name (Arabic) is required'),
  promoter_id_card_number: z
    .string()
    .min(1, 'Promoter ID card number is required'),
  promoter_mobile_number: z.string().optional(),
  promoter_email: z.string().email().optional(),
  promoter_id_card_url: z.string().url().optional(),
  promoter_passport_url: z.string().url().optional(),

  // Contract details
  job_title: z.string().min(1, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
  work_location: z.string().min(1, 'Work location is required'),
  contract_start_date: z.string().min(1, 'Contract start date is required'),
  contract_end_date: z.string().optional(),
  basic_salary: z.string().optional(),
  allowances: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
  total_salary: z.string().optional(),
  special_terms: z.string().optional(),
  probation_period_months: z.string().optional(),
  notice_period_days: z.string().optional(),
  working_hours_per_week: z.string().optional(),
});

export type TemplateDataMapping = z.infer<typeof templateDataMappingSchema>;

/**
 * Validate and map form data to template placeholders
 */
export function validateAndMapContractData(
  formData: Partial<ContractGeneratorFormData>,
  contractTypeConfig?: ContractTypeConfig,
  additionalData?: Record<string, any>
): DataMappingValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const unmappedFields: string[] = [];
  const missingRequiredFields: string[] = [];
  const mappedFields: Record<string, any> = {};

  // Get template placeholders for this contract type
  const templatePlaceholders = STANDARD_TEMPLATE_PLACEHOLDERS;

  // Map form data to template placeholders
  templatePlaceholders.forEach((placeholder: TemplatePlaceholder) => {
    let value: any = undefined;

    if (placeholder.sourceField && placeholder.sourceField in formData) {
      // Get value from form data
      value =
        formData[placeholder.sourceField as keyof ContractGeneratorFormData];
    } else if (placeholder.sourceField === undefined) {
      // Handle calculated or external fields
      if (placeholder.key === 'contract_number') {
        value = generateContractNumber();
      } else if (placeholder.key === 'contract_date') {
        value = new Date();
      } else if (placeholder.key === 'total_salary') {
        const basic = formData.basic_salary || 0;
        const allowances = formData.allowances || 0;
        value = basic + allowances;
      } else if (additionalData && placeholder.key in additionalData) {
        value = additionalData[placeholder.key];
      }
    }

    // Apply transformation if defined
    if (value !== undefined && placeholder.transform) {
      try {
        if (placeholder.key === 'total_salary') {
          value = placeholder.transform({ ...formData, ...additionalData });
        } else {
          value = placeholder.transform(value);
        }
      } catch (error) {
        warnings.push(`Failed to transform field ${placeholder.key}: ${error}`);
      }
    }

    // Set default value if value is still undefined
    if (value === undefined && placeholder.defaultValue !== undefined) {
      value = placeholder.defaultValue;
    }

    // Validate required fields
    if (
      placeholder.required &&
      (value === undefined || value === null || value === '')
    ) {
      missingRequiredFields.push(placeholder.key);
      errors.push(`${placeholder.description} is required`);
    }

    // Add to mapped fields
    if (value !== undefined && value !== null && value !== '') {
      mappedFields[placeholder.key] = value;
    }
  });

  // Check for unmapped form fields
  const mappedSourceFields = new Set(
    templatePlaceholders
      .map((p: TemplatePlaceholder) => p.sourceField)
      .filter((field: keyof ContractGeneratorFormData | undefined): field is keyof ContractGeneratorFormData => field !== undefined)
  );

  Object.keys(formData).forEach(field => {
    if (!mappedSourceFields.has(field as keyof ContractGeneratorFormData)) {
      unmappedFields.push(field);
      warnings.push(
        `Form field '${field}' is not mapped to any template placeholder`
      );
    }
  });

  // Validate mapped data against schema
  try {
    templateDataMappingSchema.parse(mappedFields);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        errors.push(`${err.path.join('.')}: ${err.message}`);
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    unmappedFields,
    missingRequiredFields,
    mappedFields,
    templatePlaceholders,
  };
}

/**
 * Generate a contract number
 */
function generateContractNumber(): string {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAC-${day}${month}${year}-${random}`;
}

/**
 * Get template placeholders for a specific contract type
 */
export function getTemplatePlaceholders(
  contractTypeId: string
): TemplatePlaceholder[] {
  // This would typically fetch from contract type configuration
  // For now, return standard placeholders
  return STANDARD_TEMPLATE_PLACEHOLDERS;
}

/**
 * Validate template placeholders against actual template
 */
export function validateTemplatePlaceholders(
  placeholders: TemplatePlaceholder[],
  templateContent?: string
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!templateContent) {
    warnings.push('No template content provided for validation');
    return { isValid: true, errors, warnings };
  }

  // Check if all required placeholders are present in template
  placeholders.forEach(placeholder => {
    const placeholderPattern = `{{${placeholder.key}}}`;
    if (!templateContent.includes(placeholderPattern)) {
      if (placeholder.required) {
        errors.push(
          `Required placeholder '${placeholder.key}' not found in template`
        );
      } else {
        warnings.push(
          `Optional placeholder '${placeholder.key}' not found in template`
        );
      }
    }
  });

  // Check for unknown placeholders in template
  const knownPlaceholders = new Set(placeholders.map(p => p.key));
  const templatePlaceholderRegex = /\{\{([^}]+)\}\}/g;
  
  const matches = templateContent.matchAll(templatePlaceholderRegex);
  for (const match of matches) {
    if (match.length > 1 && match[1]) {
      const placeholderKey = match[1];
      const trimmedKey = placeholderKey.trim();
      if (!knownPlaceholders.has(trimmedKey)) {
        warnings.push(
          `Unknown placeholder '${trimmedKey}' found in template`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
