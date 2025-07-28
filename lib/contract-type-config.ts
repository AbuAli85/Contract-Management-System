// Enhanced Contract Type Configuration with Additional Contract Types
import { enhancedTemplates } from './enhanced-google-docs-templates'

export interface ContractTypeConfig {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  category: 'employment' | 'service' | 'freelance' | 'consulting' | 'partnership' | 'nda' | 'custom'
  isActive: boolean
  requiresApproval: boolean
  makecomTemplateId?: string
  googleDocsTemplateId?: string
  fields: ContractField[]
  validation: ContractValidation
  pricing?: ContractPricing
  metadata?: Record<string, any>
}

export interface ContractField {
  id: string
  name: string
  nameAr: string
  type: 'text' | 'email' | 'phone' | 'date' | 'number' | 'select' | 'textarea' | 'file' | 'boolean'
  required: boolean
  placeholder?: string
  placeholderAr?: string
  options?: { value: string; label: string; labelAr: string }[]
  validation?: FieldValidation
  defaultValue?: any
}

export interface FieldValidation {
  minLength?: number
  maxLength?: number
  pattern?: string
  min?: number
  max?: number
  custom?: (value: any) => boolean
}

export interface ContractValidation {
  requiredFields: string[]
  optionalFields: string[]
  customValidation?: (data: any) => { isValid: boolean; errors: string[] }
}

export interface ContractPricing {
  basePrice: number
  currency: string
  pricingModel: 'fixed' | 'hourly' | 'monthly' | 'project-based'
  features: string[]
}

// Enhanced Contract Types Configuration
export const enhancedContractTypes: ContractTypeConfig[] = [
  // Employment Contracts
  {
    id: 'full-time-permanent',
    name: 'Full-Time Permanent Employment',
    nameAr: 'توظيف بدوام كامل دائم',
    description: 'Standard full-time permanent employment contract with comprehensive benefits',
    descriptionAr: 'عقد توظيف بدوام كامل دائم مع مزايا شاملة',
    category: 'employment',
    isActive: true,
    requiresApproval: true,
    makecomTemplateId: '1AbCdEfGhIjKlMnOpQrStUvWxYz123456789',
    googleDocsTemplateId: '1AbCdEfGhIjKlMnOpQrStUvWxYz123456789',
    fields: [
      {
        id: 'job_title',
        name: 'Job Title',
        nameAr: 'المسمى الوظيفي',
        type: 'text',
        required: true,
        placeholder: 'e.g., Software Engineer',
        placeholderAr: 'مثال: مهندس برمجيات'
      },
      {
        id: 'department',
        name: 'Department',
        nameAr: 'القسم',
        type: 'text',
        required: true,
        placeholder: 'e.g., IT Department',
        placeholderAr: 'مثال: قسم تقنية المعلومات'
      },
      {
        id: 'basic_salary',
        name: 'Basic Salary',
        nameAr: 'الراتب الأساسي',
        type: 'number',
        required: true,
        validation: { min: 0 }
      },
      {
        id: 'housing_allowance',
        name: 'Housing Allowance',
        nameAr: 'بدل السكن',
        type: 'number',
        required: false,
        defaultValue: 0
      },
      {
        id: 'transport_allowance',
        name: 'Transportation Allowance',
        nameAr: 'بدل النقل',
        type: 'number',
        required: false,
        defaultValue: 0
      },
      {
        id: 'probation_period',
        name: 'Probation Period',
        nameAr: 'فترة التجربة',
        type: 'select',
        required: true,
        options: [
          { value: '3_months', label: '3 Months', labelAr: '3 أشهر' },
          { value: '6_months', label: '6 Months', labelAr: '6 أشهر' },
          { value: '12_months', label: '12 Months', labelAr: '12 شهر' }
        ]
      },
      {
        id: 'notice_period',
        name: 'Notice Period',
        nameAr: 'فترة الإشعار',
        type: 'select',
        required: true,
        options: [
          { value: '30_days', label: '30 Days', labelAr: '30 يوم' },
          { value: '60_days', label: '60 Days', labelAr: '60 يوم' },
          { value: '90_days', label: '90 Days', labelAr: '90 يوم' }
        ]
      }
    ],
    validation: {
      requiredFields: ['job_title', 'department', 'basic_salary', 'probation_period', 'notice_period'],
      optionalFields: ['housing_allowance', 'transport_allowance']
    },
    pricing: {
      basePrice: 500,
      currency: 'OMR',
      pricingModel: 'fixed',
      features: ['Professional template', 'Legal compliance', 'Digital signatures', 'PDF generation']
    }
  },
  {
    id: 'part-time-contract',
    name: 'Part-Time Contract',
    nameAr: 'عقد بدوام جزئي',
    description: 'Part-time employment contract for flexible work arrangements',
    descriptionAr: 'عقد توظيف بدوام جزئي لترتيبات العمل المرنة',
    category: 'employment',
    isActive: true,
    requiresApproval: false,
    makecomTemplateId: '1AbCdEfGhIjKlMnOpQrStUvWxYz123456789',
    fields: [
      {
        id: 'job_title',
        name: 'Job Title',
        nameAr: 'المسمى الوظيفي',
        type: 'text',
        required: true
      },
      {
        id: 'weekly_hours',
        name: 'Weekly Hours',
        nameAr: 'الساعات الأسبوعية',
        type: 'number',
        required: true,
        validation: { min: 1, max: 40 }
      },
      {
        id: 'hourly_rate',
        name: 'Hourly Rate',
        nameAr: 'المعدل بالساعة',
        type: 'number',
        required: true,
        validation: { min: 0 }
      }
    ],
    validation: {
      requiredFields: ['job_title', 'weekly_hours', 'hourly_rate'],
      optionalFields: []
    }
  },
  {
    id: 'fixed-term-contract',
    name: 'Fixed-Term Contract',
    nameAr: 'عقد محدد المدة',
    description: 'Fixed-term employment contract for specific projects or periods',
    descriptionAr: 'عقد توظيف محدد المدة لمشاريع أو فترات محددة',
    category: 'employment',
    isActive: true,
    requiresApproval: true,
    makecomTemplateId: '1AbCdEfGhIjKlMnOpQrStUvWxYz123456789',
    fields: [
      {
        id: 'job_title',
        name: 'Job Title',
        nameAr: 'المسمى الوظيفي',
        type: 'text',
        required: true
      },
      {
        id: 'contract_duration',
        name: 'Contract Duration',
        nameAr: 'مدة العقد',
        type: 'select',
        required: true,
        options: [
          { value: '3_months', label: '3 Months', labelAr: '3 أشهر' },
          { value: '6_months', label: '6 Months', labelAr: '6 أشهر' },
          { value: '12_months', label: '12 Months', labelAr: '12 شهر' },
          { value: '24_months', label: '24 Months', labelAr: '24 شهر' }
        ]
      },
      {
        id: 'project_description',
        name: 'Project Description',
        nameAr: 'وصف المشروع',
        type: 'textarea',
        required: true
      }
    ],
    validation: {
      requiredFields: ['job_title', 'contract_duration', 'project_description'],
      optionalFields: []
    }
  },

  // Service Contracts
  {
    id: 'business-service-contract',
    name: 'Business Service Contract',
    nameAr: 'عقد خدمة تجارية',
    description: 'Professional service contract for business-to-business services',
    descriptionAr: 'عقد خدمة احترافي للخدمات بين الشركات',
    category: 'service',
    isActive: true,
    requiresApproval: true,
    makecomTemplateId: '1AbCdEfGhIjKlMnOpQrStUvWxYz123456789',
    fields: [
      {
        id: 'service_provider',
        name: 'Service Provider',
        nameAr: 'مقدم الخدمة',
        type: 'text',
        required: true
      },
      {
        id: 'service_recipient',
        name: 'Service Recipient',
        nameAr: 'مستلم الخدمة',
        type: 'text',
        required: true
      },
      {
        id: 'service_description',
        name: 'Service Description',
        nameAr: 'وصف الخدمة',
        type: 'textarea',
        required: true
      },
      {
        id: 'service_duration',
        name: 'Service Duration',
        nameAr: 'مدة الخدمة',
        type: 'select',
        required: true,
        options: [
          { value: '1_month', label: '1 Month', labelAr: 'شهر واحد' },
          { value: '3_months', label: '3 Months', labelAr: '3 أشهر' },
          { value: '6_months', label: '6 Months', labelAr: '6 أشهر' },
          { value: '12_months', label: '12 Months', labelAr: '12 شهر' }
        ]
      },
      {
        id: 'service_fee',
        name: 'Service Fee',
        nameAr: 'رسوم الخدمة',
        type: 'number',
        required: true,
        validation: { min: 0 }
      },
      {
        id: 'payment_terms',
        name: 'Payment Terms',
        nameAr: 'شروط الدفع',
        type: 'select',
        required: true,
        options: [
          { value: 'monthly', label: 'Monthly', labelAr: 'شهري' },
          { value: 'quarterly', label: 'Quarterly', labelAr: 'ربع سنوي' },
          { value: 'annually', label: 'Annually', labelAr: 'سنوي' },
          { value: 'upon_completion', label: 'Upon Completion', labelAr: 'عند الانتهاء' }
        ]
      }
    ],
    validation: {
      requiredFields: ['service_provider', 'service_recipient', 'service_description', 'service_duration', 'service_fee', 'payment_terms'],
      optionalFields: []
    },
    pricing: {
      basePrice: 300,
      currency: 'OMR',
      pricingModel: 'fixed',
      features: ['Professional template', 'Service terms', 'Payment schedules', 'Liability clauses']
    }
  },
  {
    id: 'consulting-agreement',
    name: 'Consulting Agreement',
    nameAr: 'اتفاقية استشارية',
    description: 'Professional consulting services agreement',
    descriptionAr: 'اتفاقية خدمات استشارية احترافية',
    category: 'consulting',
    isActive: true,
    requiresApproval: true,
    fields: [
      {
        id: 'consultant_name',
        name: 'Consultant Name',
        nameAr: 'اسم المستشار',
        type: 'text',
        required: true
      },
      {
        id: 'client_name',
        name: 'Client Name',
        nameAr: 'اسم العميل',
        type: 'text',
        required: true
      },
      {
        id: 'consulting_scope',
        name: 'Consulting Scope',
        nameAr: 'نطاق الاستشارة',
        type: 'textarea',
        required: true
      },
      {
        id: 'consulting_duration',
        name: 'Consulting Duration',
        nameAr: 'مدة الاستشارة',
        type: 'select',
        required: true,
        options: [
          { value: '1_week', label: '1 Week', labelAr: 'أسبوع واحد' },
          { value: '1_month', label: '1 Month', labelAr: 'شهر واحد' },
          { value: '3_months', label: '3 Months', labelAr: '3 أشهر' },
          { value: '6_months', label: '6 Months', labelAr: '6 أشهر' }
        ]
      },
      {
        id: 'hourly_rate',
        name: 'Hourly Rate',
        nameAr: 'المعدل بالساعة',
        type: 'number',
        required: true,
        validation: { min: 0 }
      },
      {
        id: 'estimated_hours',
        name: 'Estimated Hours',
        nameAr: 'الساعات المقدرة',
        type: 'number',
        required: true,
        validation: { min: 1 }
      }
    ],
    validation: {
      requiredFields: ['consultant_name', 'client_name', 'consulting_scope', 'consulting_duration', 'hourly_rate', 'estimated_hours'],
      optionalFields: []
    }
  },

  // Freelance Contracts
  {
    id: 'freelance-service-agreement',
    name: 'Freelance Service Agreement',
    nameAr: 'اتفاقية خدمة مستقلة',
    description: 'Freelance service agreement for independent contractors',
    descriptionAr: 'اتفاقية خدمة مستقلة للمقاولين المستقلين',
    category: 'freelance',
    isActive: true,
    requiresApproval: false,
    makecomTemplateId: '1AbCdEfGhIjKlMnOpQrStUvWxYz123456789',
    fields: [
      {
        id: 'freelancer_name',
        name: 'Freelancer Name',
        nameAr: 'اسم المستقل',
        type: 'text',
        required: true
      },
      {
        id: 'client_name',
        name: 'Client Name',
        nameAr: 'اسم العميل',
        type: 'text',
        required: true
      },
      {
        id: 'project_description',
        name: 'Project Description',
        nameAr: 'وصف المشروع',
        type: 'textarea',
        required: true
      },
      {
        id: 'project_duration',
        name: 'Project Duration',
        nameAr: 'مدة المشروع',
        type: 'select',
        required: true,
        options: [
          { value: '1_week', label: '1 Week', labelAr: 'أسبوع واحد' },
          { value: '2_weeks', label: '2 Weeks', labelAr: 'أسبوعان' },
          { value: '1_month', label: '1 Month', labelAr: 'شهر واحد' },
          { value: '3_months', label: '3 Months', labelAr: '3 أشهر' }
        ]
      },
      {
        id: 'project_fee',
        name: 'Project Fee',
        nameAr: 'رسوم المشروع',
        type: 'number',
        required: true,
        validation: { min: 0 }
      },
      {
        id: 'payment_schedule',
        name: 'Payment Schedule',
        nameAr: 'جدول الدفع',
        type: 'select',
        required: true,
        options: [
          { value: 'upfront', label: 'Upfront Payment', labelAr: 'دفع مقدم' },
          { value: 'milestone', label: 'Milestone Payments', labelAr: 'دفعات مراحل' },
          { value: 'upon_completion', label: 'Upon Completion', labelAr: 'عند الانتهاء' }
        ]
      }
    ],
    validation: {
      requiredFields: ['freelancer_name', 'client_name', 'project_description', 'project_duration', 'project_fee', 'payment_schedule'],
      optionalFields: []
    }
  },

  // Partnership Agreements
  {
    id: 'business-partnership-agreement',
    name: 'Business Partnership Agreement',
    nameAr: 'اتفاقية شراكة تجارية',
    description: 'Partnership agreement for business collaboration',
    descriptionAr: 'اتفاقية شراكة للتعاون التجاري',
    category: 'partnership',
    isActive: true,
    requiresApproval: true,
    fields: [
      {
        id: 'partner1_name',
        name: 'Partner 1 Name',
        nameAr: 'اسم الشريك الأول',
        type: 'text',
        required: true
      },
      {
        id: 'partner2_name',
        name: 'Partner 2 Name',
        nameAr: 'اسم الشريك الثاني',
        type: 'text',
        required: true
      },
      {
        id: 'partnership_name',
        name: 'Partnership Name',
        nameAr: 'اسم الشراكة',
        type: 'text',
        required: true
      },
      {
        id: 'business_description',
        name: 'Business Description',
        nameAr: 'وصف العمل',
        type: 'textarea',
        required: true
      },
      {
        id: 'partnership_duration',
        name: 'Partnership Duration',
        nameAr: 'مدة الشراكة',
        type: 'select',
        required: true,
        options: [
          { value: '1_year', label: '1 Year', labelAr: 'سنة واحدة' },
          { value: '3_years', label: '3 Years', labelAr: '3 سنوات' },
          { value: '5_years', label: '5 Years', labelAr: '5 سنوات' },
          { value: 'indefinite', label: 'Indefinite', labelAr: 'غير محدد' }
        ]
      },
      {
        id: 'profit_sharing',
        name: 'Profit Sharing',
        nameAr: 'توزيع الأرباح',
        type: 'select',
        required: true,
        options: [
          { value: '50_50', label: '50/50 Split', labelAr: 'تقسيم 50/50' },
          { value: '60_40', label: '60/40 Split', labelAr: 'تقسيم 60/40' },
          { value: '70_30', label: '70/30 Split', labelAr: 'تقسيم 70/30' },
          { value: 'custom', label: 'Custom Split', labelAr: 'تقسيم مخصص' }
        ]
      }
    ],
    validation: {
      requiredFields: ['partner1_name', 'partner2_name', 'partnership_name', 'business_description', 'partnership_duration', 'profit_sharing'],
      optionalFields: []
    }
  },

  // NDA Contracts
  {
    id: 'non-disclosure-agreement',
    name: 'Non-Disclosure Agreement',
    nameAr: 'اتفاقية عدم الإفصاح',
    description: 'Confidentiality agreement for protecting sensitive information',
    descriptionAr: 'اتفاقية سرية لحماية المعلومات الحساسة',
    category: 'nda',
    isActive: true,
    requiresApproval: true,
    fields: [
      {
        id: 'disclosing_party',
        name: 'Disclosing Party',
        nameAr: 'الطرف المكشف',
        type: 'text',
        required: true
      },
      {
        id: 'receiving_party',
        name: 'Receiving Party',
        nameAr: 'الطرف المتلقي',
        type: 'text',
        required: true
      },
      {
        id: 'confidential_information',
        name: 'Confidential Information',
        nameAr: 'المعلومات السرية',
        type: 'textarea',
        required: true
      },
      {
        id: 'nda_duration',
        name: 'NDA Duration',
        nameAr: 'مدة اتفاقية عدم الإفصاح',
        type: 'select',
        required: true,
        options: [
          { value: '1_year', label: '1 Year', labelAr: 'سنة واحدة' },
          { value: '2_years', label: '2 Years', labelAr: 'سنتان' },
          { value: '3_years', label: '3 Years', labelAr: '3 سنوات' },
          { value: '5_years', label: '5 Years', labelAr: '5 سنوات' }
        ]
      },
      {
        id: 'purpose',
        name: 'Purpose of Disclosure',
        nameAr: 'غرض الإفصاح',
        type: 'textarea',
        required: true
      }
    ],
    validation: {
      requiredFields: ['disclosing_party', 'receiving_party', 'confidential_information', 'nda_duration', 'purpose'],
      optionalFields: []
    }
  },

  // Custom Contract
  {
    id: 'custom-contract',
    name: 'Custom Contract',
    nameAr: 'عقد مخصص',
    description: 'Custom contract template for specific business needs',
    descriptionAr: 'قالب عقد مخصص للاحتياجات التجارية المحددة',
    category: 'custom',
    isActive: true,
    requiresApproval: true,
    fields: [
      {
        id: 'contract_title',
        name: 'Contract Title',
        nameAr: 'عنوان العقد',
        type: 'text',
        required: true
      },
      {
        id: 'party1_name',
        name: 'First Party Name',
        nameAr: 'اسم الطرف الأول',
        type: 'text',
        required: true
      },
      {
        id: 'party2_name',
        name: 'Second Party Name',
        nameAr: 'اسم الطرف الثاني',
        type: 'text',
        required: true
      },
      {
        id: 'contract_terms',
        name: 'Contract Terms',
        nameAr: 'شروط العقد',
        type: 'textarea',
        required: true
      },
      {
        id: 'contract_value',
        name: 'Contract Value',
        nameAr: 'قيمة العقد',
        type: 'number',
        required: false,
        validation: { min: 0 }
      },
      {
        id: 'special_terms',
        name: 'Special Terms',
        nameAr: 'شروط خاصة',
        type: 'textarea',
        required: false
      }
    ],
    validation: {
      requiredFields: ['contract_title', 'party1_name', 'party2_name', 'contract_terms'],
      optionalFields: ['contract_value', 'special_terms']
    }
  }
]

// Helper functions
export function getEnhancedContractTypeConfig(contractTypeId: string): ContractTypeConfig | null {
  return enhancedContractTypes.find(type => type.id === contractTypeId) || null
}

export function getAllEnhancedContractTypes(): ContractTypeConfig[] {
  return enhancedContractTypes.filter(type => type.isActive)
}

export function getContractTypesByCategory(category: string): ContractTypeConfig[] {
  return enhancedContractTypes.filter(type => type.category === category && type.isActive)
}

export function validateContractTypeData(contractTypeId: string, data: Record<string, any>): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const contractType = getEnhancedContractTypeConfig(contractTypeId)
  if (!contractType) {
    return {
      isValid: false,
      errors: [`Contract type '${contractTypeId}' not found`],
      warnings: []
    }
  }

  const errors: string[] = []
  const warnings: string[] = []

  // Check required fields
  contractType.fields.forEach(field => {
    if (field.required && !data[field.id]) {
      errors.push(`Required field '${field.name}' is missing`)
    } else if (!field.required && !data[field.id] && field.defaultValue !== undefined) {
      warnings.push(`Optional field '${field.name}' is missing, will use default value`)
    }
  })

  // Run custom validation if provided
  if (contractType.validation.customValidation) {
    const customValidation = contractType.validation.customValidation(data)
    if (!customValidation.isValid) {
      errors.push(...customValidation.errors)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Export the enhanced configuration
export { enhancedContractTypes as contractTypes }

// Helper function for Make.com enabled contract types
export function getMakecomEnabledContractTypes(): ContractTypeConfig[] {
  return enhancedContractTypes.filter(type => type.makecomTemplateId && type.isActive)
}

// Generate contract with Make.com integration
export function generateContractWithMakecom(
  contractTypeId: string,
  contractData: Record<string, unknown>
): { webhookPayload: any; templateConfig: any; validation: any } {
  const contractConfig = getEnhancedContractTypeConfig(contractTypeId)
  
  if (!contractConfig) {
    return {
      webhookPayload: null,
      templateConfig: null,
      validation: { isValid: false, errors: ["Contract type not found"], warnings: [] }
    }
  }

  // Validate data against contract type requirements
  const validation = validateContractTypeData(contractTypeId, contractData)

  // Generate webhook payload if validation passes
  const webhookPayload = validation.isValid ? {
    contract_type: contractTypeId,
    template_id: contractConfig.googleDocsTemplateId,
    makecom_template_id: contractConfig.makecomTemplateId,
    ...contractData
  } : null

  return {
    webhookPayload,
    templateConfig: contractConfig,
    validation
  }
}
