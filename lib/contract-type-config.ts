// Enhanced Contract Type Configuration with 9 Comprehensive Contract Types
import { enhancedTemplates } from './enhanced-google-docs-templates';

export interface ContractTypeConfig {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category:
    | 'employment'
    | 'service'
    | 'freelance'
    | 'consulting'
    | 'partnership'
    | 'nda'
    | 'custom'
    | 'vendor'
    | 'lease';
  isActive: boolean;
  requiresApproval: boolean;
  makecomTemplateId?: string;
  googleDocsTemplateId?: string;
  fields: ContractField[];
  validation: ContractValidation;
  pricing?: ContractPricing;
  metadata?: Record<string, any>;
  businessRules?: BusinessRules;
}

export interface ContractField {
  id: string;
  name: string;
  nameAr: string;
  type:
    | 'text'
    | 'email'
    | 'phone'
    | 'date'
    | 'number'
    | 'select'
    | 'textarea'
    | 'file'
    | 'boolean';
  required: boolean;
  placeholder?: string;
  placeholderAr?: string;
  options?: { value: string; label: string; labelAr: string }[];
  validation?: FieldValidation;
  defaultValue?: any;
  conditional?: {
    field: string;
    value: any;
    operator:
      | 'equals'
      | 'not_equals'
      | 'contains'
      | 'greater_than'
      | 'less_than';
  };
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean;
}

export interface ContractValidation {
  requiredFields: string[];
  optionalFields: string[];
  customValidation?: (data: any) => { isValid: boolean; errors: string[] };
}

export interface ContractPricing {
  basePrice: number;
  currency: string;
  pricingModel: 'fixed' | 'hourly' | 'monthly' | 'project-based';
  features: string[];
}

export interface BusinessRules {
  autoApproval?: boolean;
  requiresLegalReview?: boolean;
  requiresFinancialApproval?: boolean;
  maxContractValue?: number;
  minContractValue?: number;
  allowedCurrencies?: string[];
  restrictedParties?: string[];
  specialConditions?: string[];
  complianceChecks?: string[];
}

// Enhanced Contract Types Configuration - 9 Comprehensive Types
export const enhancedContractTypes: ContractTypeConfig[] = [
  // 1. Full-Time Permanent Employment
  {
    id: 'full-time-permanent',
    name: 'Full-Time Permanent Employment',
    nameAr: 'توظيف بدوام كامل دائم',
    description:
      'Standard full-time permanent employment contract with comprehensive benefits and legal compliance',
    descriptionAr:
      'عقد توظيف بدوام كامل دائم مع مزايا شاملة والامتثال القانوني',
    category: 'employment',
    isActive: true,
    requiresApproval: true,
    makecomTemplateId: 'full_time_permanent_employment_v2',
    googleDocsTemplateId: '1dzYQ_MDstiErG9O1yP87_bVXvDPQbe8V', // Extra Contracts Template
    fields: [
      {
        id: 'job_title',
        name: 'Job Title',
        nameAr: 'المسمى الوظيفي',
        type: 'text',
        required: true,
        placeholder: 'e.g., Software Engineer',
        placeholderAr: 'مثال: مهندس برمجيات',
      },
      {
        id: 'department',
        name: 'Department',
        nameAr: 'القسم',
        type: 'text',
        required: true,
        placeholder: 'e.g., IT Department',
        placeholderAr: 'مثال: قسم تقنية المعلومات',
      },
      {
        id: 'basic_salary',
        name: 'Basic Salary',
        nameAr: 'الراتب الأساسي',
        type: 'number',
        required: true,
        validation: { min: 0 },
      },
      {
        id: 'housing_allowance',
        name: 'Housing Allowance',
        nameAr: 'بدل السكن',
        type: 'number',
        required: false,
        defaultValue: 0,
      },
      {
        id: 'transport_allowance',
        name: 'Transportation Allowance',
        nameAr: 'بدل النقل',
        type: 'number',
        required: false,
        defaultValue: 0,
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
          { value: '12_months', label: '12 Months', labelAr: '12 شهر' },
        ],
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
          { value: '90_days', label: '90 Days', labelAr: '90 يوم' },
        ],
      },
      {
        id: 'work_location',
        name: 'Work Location',
        nameAr: 'موقع العمل',
        type: 'text',
        required: true,
      },
      {
        id: 'working_hours',
        name: 'Working Hours',
        nameAr: 'ساعات العمل',
        type: 'select',
        required: true,
        options: [
          {
            value: '40_hours',
            label: '40 Hours/Week',
            labelAr: '40 ساعة/أسبوع',
          },
          {
            value: '45_hours',
            label: '45 Hours/Week',
            labelAr: '45 ساعة/أسبوع',
          },
          {
            value: '48_hours',
            label: '48 Hours/Week',
            labelAr: '48 ساعة/أسبوع',
          },
        ],
      },
    ],
    validation: {
      requiredFields: [
        'job_title',
        'department',
        'basic_salary',
        'probation_period',
        'notice_period',
        'work_location',
        'working_hours',
      ],
      optionalFields: ['housing_allowance', 'transport_allowance'],
    },
    pricing: {
      basePrice: 500,
      currency: 'OMR',
      pricingModel: 'fixed',
      features: [
        'Professional template',
        'Legal compliance',
        'Digital signatures',
        'PDF generation',
        'Make.com automation',
      ],
    },
    businessRules: {
      autoApproval: false,
      requiresLegalReview: true,
      requiresFinancialApproval: true,
      maxContractValue: 50000,
      minContractValue: 1000,
      allowedCurrencies: ['OMR', 'USD'],
      complianceChecks: [
        'labor_law_compliance',
        'visa_requirements',
        'tax_obligations',
      ],
    },
  },

  // 2. Part-Time Contract
  {
    id: 'part-time-contract',
    name: 'Part-Time Contract',
    nameAr: 'عقد بدوام جزئي',
    description:
      'Part-time employment contract for flexible work arrangements with reduced benefits',
    descriptionAr: 'عقد توظيف بدوام جزئي لترتيبات العمل المرنة مع مزايا مخفضة',
    category: 'employment',
    isActive: true,
    requiresApproval: false,
    makecomTemplateId: 'part_time_contract_v2',
    googleDocsTemplateId: '2BcDeFgHiJkLmNoPqRsTuVwXyZ234567890',
    fields: [
      {
        id: 'job_title',
        name: 'Job Title',
        nameAr: 'المسمى الوظيفي',
        type: 'text',
        required: true,
      },
      {
        id: 'weekly_hours',
        name: 'Weekly Hours',
        nameAr: 'الساعات الأسبوعية',
        type: 'number',
        required: true,
        validation: { min: 1, max: 40 },
      },
      {
        id: 'hourly_rate',
        name: 'Hourly Rate',
        nameAr: 'المعدل بالساعة',
        type: 'number',
        required: true,
        validation: { min: 0 },
      },
      {
        id: 'work_schedule',
        name: 'Work Schedule',
        nameAr: 'جدول العمل',
        type: 'select',
        required: true,
        options: [
          { value: 'flexible', label: 'Flexible', labelAr: 'مرن' },
          {
            value: 'fixed_schedule',
            label: 'Fixed Schedule',
            labelAr: 'جدول ثابت',
          },
          { value: 'remote', label: 'Remote', labelAr: 'عن بعد' },
        ],
      },
    ],
    validation: {
      requiredFields: [
        'job_title',
        'weekly_hours',
        'hourly_rate',
        'work_schedule',
      ],
      optionalFields: [],
    },
    businessRules: {
      autoApproval: true,
      requiresLegalReview: false,
      maxContractValue: 15000,
      minContractValue: 500,
      allowedCurrencies: ['OMR', 'USD'],
    },
  },

  // 3. Fixed-Term Contract
  {
    id: 'fixed-term-contract',
    name: 'Fixed-Term Contract',
    nameAr: 'عقد محدد المدة',
    description:
      'Fixed-term employment contract for specific projects or periods with clear end dates',
    descriptionAr:
      'عقد توظيف محدد المدة لمشاريع أو فترات محددة مع تواريخ انتهاء واضحة',
    category: 'employment',
    isActive: true,
    requiresApproval: true,
    makecomTemplateId: 'fixed_term_contract_v2',
    googleDocsTemplateId: '3CdEfGhIjKlMnOpQrStUvWxYzA345678901',
    fields: [
      {
        id: 'job_title',
        name: 'Job Title',
        nameAr: 'المسمى الوظيفي',
        type: 'text',
        required: true,
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
          { value: '24_months', label: '24 Months', labelAr: '24 شهر' },
        ],
      },
      {
        id: 'project_description',
        name: 'Project Description',
        nameAr: 'وصف المشروع',
        type: 'textarea',
        required: true,
      },
      {
        id: 'start_date',
        name: 'Start Date',
        nameAr: 'تاريخ البدء',
        type: 'date',
        required: true,
      },
      {
        id: 'end_date',
        name: 'End Date',
        nameAr: 'تاريخ الانتهاء',
        type: 'date',
        required: true,
      },
    ],
    validation: {
      requiredFields: [
        'job_title',
        'contract_duration',
        'project_description',
        'start_date',
        'end_date',
      ],
      optionalFields: [],
    },
    businessRules: {
      autoApproval: false,
      requiresLegalReview: true,
      maxContractValue: 100000,
      minContractValue: 2000,
      allowedCurrencies: ['OMR', 'USD'],
      complianceChecks: ['project_scope_validation', 'budget_approval'],
    },
  },

  // 4. Business Service Contract
  {
    id: 'business-service-contract',
    name: 'Business Service Contract',
    nameAr: 'عقد خدمة تجارية',
    description:
      'Professional service contract for business-to-business services with comprehensive terms',
    descriptionAr: 'عقد خدمة احترافي للخدمات بين الشركات مع شروط شاملة',
    category: 'service',
    isActive: true,
    requiresApproval: true,
    makecomTemplateId: 'business_service_contract_v2',
    googleDocsTemplateId: '4DeFgHiJkLmNoPqRsTuVwXyZAb456789012',
    fields: [
      {
        id: 'service_provider',
        name: 'Service Provider',
        nameAr: 'مقدم الخدمة',
        type: 'text',
        required: true,
      },
      {
        id: 'service_recipient',
        name: 'Service Recipient',
        nameAr: 'مستلم الخدمة',
        type: 'text',
        required: true,
      },
      {
        id: 'service_description',
        name: 'Service Description',
        nameAr: 'وصف الخدمة',
        type: 'textarea',
        required: true,
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
          { value: '12_months', label: '12 Months', labelAr: '12 شهر' },
        ],
      },
      {
        id: 'service_fee',
        name: 'Service Fee',
        nameAr: 'رسوم الخدمة',
        type: 'number',
        required: true,
        validation: { min: 0 },
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
          {
            value: 'upon_completion',
            label: 'Upon Completion',
            labelAr: 'عند الانتهاء',
          },
        ],
      },
      {
        id: 'service_level_agreement',
        name: 'Service Level Agreement',
        nameAr: 'اتفاقية مستوى الخدمة',
        type: 'textarea',
        required: false,
      },
    ],
    validation: {
      requiredFields: [
        'service_provider',
        'service_recipient',
        'service_description',
        'service_duration',
        'service_fee',
        'payment_terms',
      ],
      optionalFields: ['service_level_agreement'],
    },
    pricing: {
      basePrice: 300,
      currency: 'OMR',
      pricingModel: 'fixed',
      features: [
        'Professional template',
        'Service terms',
        'Payment schedules',
        'Liability clauses',
        'Make.com automation',
      ],
    },
    businessRules: {
      autoApproval: false,
      requiresLegalReview: true,
      requiresFinancialApproval: true,
      maxContractValue: 500000,
      minContractValue: 1000,
      allowedCurrencies: ['OMR', 'USD', 'EUR'],
      complianceChecks: [
        'vendor_registration',
        'tax_compliance',
        'insurance_requirements',
      ],
    },
  },

  // 5. Consulting Agreement
  {
    id: 'consulting-agreement',
    name: 'Consulting Agreement',
    nameAr: 'اتفاقية استشارية',
    description:
      'Professional consulting services agreement with expertise-based terms',
    descriptionAr: 'اتفاقية خدمات استشارية احترافية مع شروط قائمة على الخبرة',
    category: 'consulting',
    isActive: true,
    requiresApproval: true,
    makecomTemplateId: 'consulting_agreement_v2',
    googleDocsTemplateId: '5EfGhIjKlMnOpQrStUvWxYzAbC567890123',
    fields: [
      {
        id: 'consultant_name',
        name: 'Consultant Name',
        nameAr: 'اسم المستشار',
        type: 'text',
        required: true,
      },
      {
        id: 'client_name',
        name: 'Client Name',
        nameAr: 'اسم العميل',
        type: 'text',
        required: true,
      },
      {
        id: 'consulting_scope',
        name: 'Consulting Scope',
        nameAr: 'نطاق الاستشارة',
        type: 'textarea',
        required: true,
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
          { value: '6_months', label: '6 Months', labelAr: '6 أشهر' },
        ],
      },
      {
        id: 'hourly_rate',
        name: 'Hourly Rate',
        nameAr: 'المعدل بالساعة',
        type: 'number',
        required: true,
        validation: { min: 0 },
      },
      {
        id: 'estimated_hours',
        name: 'Estimated Hours',
        nameAr: 'الساعات المقدرة',
        type: 'number',
        required: true,
        validation: { min: 1 },
      },
      {
        id: 'expertise_area',
        name: 'Area of Expertise',
        nameAr: 'مجال الخبرة',
        type: 'select',
        required: true,
        options: [
          {
            value: 'management',
            label: 'Management Consulting',
            labelAr: 'استشارات إدارية',
          },
          {
            value: 'technology',
            label: 'Technology Consulting',
            labelAr: 'استشارات تقنية',
          },
          {
            value: 'financial',
            label: 'Financial Consulting',
            labelAr: 'استشارات مالية',
          },
          {
            value: 'legal',
            label: 'Legal Consulting',
            labelAr: 'استشارات قانونية',
          },
          {
            value: 'marketing',
            label: 'Marketing Consulting',
            labelAr: 'استشارات تسويقية',
          },
        ],
      },
    ],
    validation: {
      requiredFields: [
        'consultant_name',
        'client_name',
        'consulting_scope',
        'consulting_duration',
        'hourly_rate',
        'estimated_hours',
        'expertise_area',
      ],
      optionalFields: [],
    },
    businessRules: {
      autoApproval: false,
      requiresLegalReview: true,
      maxContractValue: 200000,
      minContractValue: 5000,
      allowedCurrencies: ['OMR', 'USD', 'EUR'],
      complianceChecks: [
        'consultant_credentials',
        'conflict_of_interest',
        'confidentiality_agreement',
      ],
    },
  },

  // 6. Freelance Service Agreement
  {
    id: 'freelance-service-agreement',
    name: 'Freelance Service Agreement',
    nameAr: 'اتفاقية خدمة مستقلة',
    description:
      'Freelance service agreement for independent contractors with project-based terms',
    descriptionAr:
      'اتفاقية خدمة مستقلة للمقاولين المستقلين مع شروط قائمة على المشروع',
    category: 'freelance',
    isActive: true,
    requiresApproval: false,
    makecomTemplateId: 'freelance_service_agreement_v2',
    googleDocsTemplateId: '6FgHiJkLmNoPqRsTuVwXyZAbCd678901234',
    fields: [
      {
        id: 'freelancer_name',
        name: 'Freelancer Name',
        nameAr: 'اسم المستقل',
        type: 'text',
        required: true,
      },
      {
        id: 'client_name',
        name: 'Client Name',
        nameAr: 'اسم العميل',
        type: 'text',
        required: true,
      },
      {
        id: 'project_description',
        name: 'Project Description',
        nameAr: 'وصف المشروع',
        type: 'textarea',
        required: true,
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
          { value: '3_months', label: '3 Months', labelAr: '3 أشهر' },
        ],
      },
      {
        id: 'project_fee',
        name: 'Project Fee',
        nameAr: 'رسوم المشروع',
        type: 'number',
        required: true,
        validation: { min: 0 },
      },
      {
        id: 'payment_schedule',
        name: 'Payment Schedule',
        nameAr: 'جدول الدفع',
        type: 'select',
        required: true,
        options: [
          { value: 'upfront', label: 'Upfront Payment', labelAr: 'دفع مقدم' },
          {
            value: 'milestone',
            label: 'Milestone Payments',
            labelAr: 'دفعات مراحل',
          },
          {
            value: 'upon_completion',
            label: 'Upon Completion',
            labelAr: 'عند الانتهاء',
          },
        ],
      },
      {
        id: 'deliverables',
        name: 'Deliverables',
        nameAr: 'المنتجات المطلوبة',
        type: 'textarea',
        required: true,
      },
    ],
    validation: {
      requiredFields: [
        'freelancer_name',
        'client_name',
        'project_description',
        'project_duration',
        'project_fee',
        'payment_schedule',
        'deliverables',
      ],
      optionalFields: [],
    },
    businessRules: {
      autoApproval: true,
      requiresLegalReview: false,
      maxContractValue: 50000,
      minContractValue: 1000,
      allowedCurrencies: ['OMR', 'USD'],
      complianceChecks: ['freelancer_registration', 'tax_obligations'],
    },
  },

  // 7. Business Partnership Agreement
  {
    id: 'business-partnership-agreement',
    name: 'Business Partnership Agreement',
    nameAr: 'اتفاقية شراكة تجارية',
    description:
      'Partnership agreement for business collaboration with profit-sharing and governance terms',
    descriptionAr:
      'اتفاقية شراكة للتعاون التجاري مع شروط تقاسم الأرباح والحوكمة',
    category: 'partnership',
    isActive: true,
    requiresApproval: true,
    makecomTemplateId: 'business_partnership_agreement_v2',
    googleDocsTemplateId: '7GhIjKlMnOpQrStUvWxYzAbCdE789012345',
    fields: [
      {
        id: 'partner1_name',
        name: 'Partner 1 Name',
        nameAr: 'اسم الشريك الأول',
        type: 'text',
        required: true,
      },
      {
        id: 'partner2_name',
        name: 'Partner 2 Name',
        nameAr: 'اسم الشريك الثاني',
        type: 'text',
        required: true,
      },
      {
        id: 'partnership_name',
        name: 'Partnership Name',
        nameAr: 'اسم الشراكة',
        type: 'text',
        required: true,
      },
      {
        id: 'business_description',
        name: 'Business Description',
        nameAr: 'وصف العمل',
        type: 'textarea',
        required: true,
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
          { value: 'indefinite', label: 'Indefinite', labelAr: 'غير محدد' },
        ],
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
          { value: 'custom', label: 'Custom Split', labelAr: 'تقسيم مخصص' },
        ],
      },
      {
        id: 'capital_contribution',
        name: 'Capital Contribution',
        nameAr: 'المساهمة الرأسمالية',
        type: 'number',
        required: true,
        validation: { min: 0 },
      },
      {
        id: 'governance_structure',
        name: 'Governance Structure',
        nameAr: 'هيكل الحوكمة',
        type: 'textarea',
        required: true,
      },
    ],
    validation: {
      requiredFields: [
        'partner1_name',
        'partner2_name',
        'partnership_name',
        'business_description',
        'partnership_duration',
        'profit_sharing',
        'capital_contribution',
        'governance_structure',
      ],
      optionalFields: [],
    },
    businessRules: {
      autoApproval: false,
      requiresLegalReview: true,
      requiresFinancialApproval: true,
      maxContractValue: 1000000,
      minContractValue: 10000,
      allowedCurrencies: ['OMR', 'USD', 'EUR'],
      complianceChecks: [
        'partnership_registration',
        'tax_obligations',
        'regulatory_compliance',
      ],
    },
  },

  // 8. Non-Disclosure Agreement
  {
    id: 'non-disclosure-agreement',
    name: 'Non-Disclosure Agreement',
    nameAr: 'اتفاقية عدم الإفصاح',
    description:
      'Confidentiality agreement for protecting sensitive information and trade secrets',
    descriptionAr: 'اتفاقية سرية لحماية المعلومات الحساسة والأسرار التجارية',
    category: 'nda',
    isActive: true,
    requiresApproval: true,
    makecomTemplateId: 'non_disclosure_agreement_v2',
    googleDocsTemplateId: '8HiJkLmNoPqRsTuVwXyZAbCdEf890123456',
    fields: [
      {
        id: 'disclosing_party',
        name: 'Disclosing Party',
        nameAr: 'الطرف المكشف',
        type: 'text',
        required: true,
      },
      {
        id: 'receiving_party',
        name: 'Receiving Party',
        nameAr: 'الطرف المتلقي',
        type: 'text',
        required: true,
      },
      {
        id: 'confidential_information',
        name: 'Confidential Information',
        nameAr: 'المعلومات السرية',
        type: 'textarea',
        required: true,
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
          { value: '5_years', label: '5 Years', labelAr: '5 سنوات' },
        ],
      },
      {
        id: 'purpose',
        name: 'Purpose of Disclosure',
        nameAr: 'غرض الإفصاح',
        type: 'textarea',
        required: true,
      },
      {
        id: 'penalty_clause',
        name: 'Penalty for Breach',
        nameAr: 'العقوبة على الإخلال',
        type: 'textarea',
        required: true,
      },
    ],
    validation: {
      requiredFields: [
        'disclosing_party',
        'receiving_party',
        'confidential_information',
        'nda_duration',
        'purpose',
        'penalty_clause',
      ],
      optionalFields: [],
    },
    businessRules: {
      autoApproval: false,
      requiresLegalReview: true,
      requiresFinancialApproval: false,
      maxContractValue: 100000,
      minContractValue: 0,
      allowedCurrencies: ['OMR', 'USD'],
      complianceChecks: [
        'confidentiality_requirements',
        'legal_enforceability',
      ],
    },
  },

  // 9. Vendor Service Agreement
  {
    id: 'vendor-service-agreement',
    name: 'Vendor Service Agreement',
    nameAr: 'اتفاقية خدمة المورد',
    description:
      'Comprehensive vendor service agreement for supplier relationships and procurement',
    descriptionAr: 'اتفاقية خدمة شاملة للمورد لعلاقات الموردين والمشتريات',
    category: 'vendor',
    isActive: true,
    requiresApproval: true,
    makecomTemplateId: 'vendor_service_agreement_v2',
    googleDocsTemplateId: '9IjKlMnOpQrStUvWxYzAbCdEfG901234567',
    fields: [
      {
        id: 'vendor_name',
        name: 'Vendor Name',
        nameAr: 'اسم المورد',
        type: 'text',
        required: true,
      },
      {
        id: 'client_name',
        name: 'Client Name',
        nameAr: 'اسم العميل',
        type: 'text',
        required: true,
      },
      {
        id: 'service_category',
        name: 'Service Category',
        nameAr: 'فئة الخدمة',
        type: 'select',
        required: true,
        options: [
          {
            value: 'it_services',
            label: 'IT Services',
            labelAr: 'خدمات تقنية المعلومات',
          },
          { value: 'consulting', label: 'Consulting', labelAr: 'استشارات' },
          { value: 'maintenance', label: 'Maintenance', labelAr: 'صيانة' },
          { value: 'supply', label: 'Supply', labelAr: 'توريد' },
          { value: 'logistics', label: 'Logistics', labelAr: 'لوجستيات' },
        ],
      },
      {
        id: 'service_description',
        name: 'Service Description',
        nameAr: 'وصف الخدمة',
        type: 'textarea',
        required: true,
      },
      {
        id: 'contract_value',
        name: 'Contract Value',
        nameAr: 'قيمة العقد',
        type: 'number',
        required: true,
        validation: { min: 0 },
      },
      {
        id: 'payment_terms',
        name: 'Payment Terms',
        nameAr: 'شروط الدفع',
        type: 'select',
        required: true,
        options: [
          { value: 'net_30', label: 'Net 30', labelAr: 'صافي 30' },
          { value: 'net_60', label: 'Net 60', labelAr: 'صافي 60' },
          {
            value: 'upon_delivery',
            label: 'Upon Delivery',
            labelAr: 'عند التسليم',
          },
          { value: 'monthly', label: 'Monthly', labelAr: 'شهري' },
        ],
      },
      {
        id: 'service_level_agreement',
        name: 'Service Level Agreement',
        nameAr: 'اتفاقية مستوى الخدمة',
        type: 'textarea',
        required: true,
      },
      {
        id: 'quality_standards',
        name: 'Quality Standards',
        nameAr: 'معايير الجودة',
        type: 'textarea',
        required: true,
      },
    ],
    validation: {
      requiredFields: [
        'vendor_name',
        'client_name',
        'service_category',
        'service_description',
        'contract_value',
        'payment_terms',
        'service_level_agreement',
        'quality_standards',
      ],
      optionalFields: [],
    },
    businessRules: {
      autoApproval: false,
      requiresLegalReview: true,
      requiresFinancialApproval: true,
      maxContractValue: 1000000,
      minContractValue: 5000,
      allowedCurrencies: ['OMR', 'USD', 'EUR'],
      complianceChecks: [
        'vendor_registration',
        'quality_certification',
        'insurance_coverage',
        'tax_compliance',
      ],
    },
  },
];

// Helper functions
export function getEnhancedContractTypeConfig(
  contractTypeId: string
): ContractTypeConfig | null {
  // Try direct match first
  let config = enhancedContractTypes.find(type => type.id === contractTypeId);
  
  // If not found, try legacy type mapping for backward compatibility
  if (!config) {
    const legacyTypeMapping: Record<string, string> = {
      // Legacy database types
      'employment': 'full-time-permanent',
      'service': 'service-contract',
      'consultancy': 'consulting-agreement',
      'partnership': 'partnership-agreement',
      // Make.com automated types (map to equivalent enhanced types)
      'oman-unlimited-makecom': 'full-time-permanent',
      'oman-fixed-term-makecom': 'part-time-fixed',
      'oman-part-time-makecom': 'part-time-fixed',
    };
    
    const mappedId = legacyTypeMapping[contractTypeId];
    if (mappedId) {
      config = enhancedContractTypes.find(type => type.id === mappedId);
    }
  }
  
  return config || null;
}

export function getAllEnhancedContractTypes(): ContractTypeConfig[] {
  return enhancedContractTypes.filter(type => type.isActive);
}

export function getContractTypesByCategory(
  category: string
): ContractTypeConfig[] {
  return enhancedContractTypes.filter(
    type => type.category === category && type.isActive
  );
}

export function validateContractTypeData(
  contractTypeId: string,
  data: Record<string, any>
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const contractType = getEnhancedContractTypeConfig(contractTypeId);
  if (!contractType) {
    return {
      isValid: false,
      errors: [`Contract type '${contractTypeId}' not found`],
      warnings: [],
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  contractType.fields.forEach(field => {
    if (field.required && !data[field.id]) {
      errors.push(`Required field '${field.name}' is missing`);
    } else if (
      !field.required &&
      !data[field.id] &&
      field.defaultValue !== undefined
    ) {
      warnings.push(
        `Optional field '${field.name}' is missing, will use default value`
      );
    }
  });

  // Check business rules
  if (contractType.businessRules) {
    if (
      contractType.businessRules.minContractValue &&
      data.contract_value < contractType.businessRules.minContractValue
    ) {
      errors.push(
        `Contract value must be at least ${contractType.businessRules.minContractValue} ${contractType.businessRules.allowedCurrencies?.[0] || 'OMR'}`
      );
    }
    if (
      contractType.businessRules.maxContractValue &&
      data.contract_value > contractType.businessRules.maxContractValue
    ) {
      errors.push(
        `Contract value cannot exceed ${contractType.businessRules.maxContractValue} ${contractType.businessRules.allowedCurrencies?.[0] || 'OMR'}`
      );
    }
  }

  // Run custom validation if provided
  if (contractType.validation.customValidation) {
    const customValidation = contractType.validation.customValidation(data);
    if (!customValidation.isValid) {
      errors.push(...customValidation.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Export the enhanced configuration
export { enhancedContractTypes as contractTypes };

// Helper function for Make.com enabled contract types
export function getMakecomEnabledContractTypes(): ContractTypeConfig[] {
  return enhancedContractTypes.filter(
    type => type.makecomTemplateId && type.isActive
  );
}

// Generate contract with Make.com integration
export function generateContractWithMakecom(
  contractTypeId: string,
  contractData: Record<string, unknown>
): { webhookPayload: any; templateConfig: any; validation: any } {
  const contractConfig = getEnhancedContractTypeConfig(contractTypeId);

  if (!contractConfig) {
    return {
      webhookPayload: null,
      templateConfig: null,
      validation: {
        isValid: false,
        errors: ['Contract type not found'],
        warnings: [],
      },
    };
  }

  // Validate data against contract type requirements
  const validation = validateContractTypeData(contractTypeId, contractData);

  // Derive a normalized contract_value if absent, for business rules
  const normalizedData: Record<string, unknown> = { ...contractData };
  if (normalizedData.contract_value == null) {
    // Heuristics per type
    if (contractTypeId === 'full-time-permanent') {
      // Use basic_salary as base value when available
      if (typeof normalizedData.basic_salary === 'number') {
        normalizedData.contract_value = normalizedData.basic_salary;
      }
    } else if (
      contractTypeId === 'part-time-contract' ||
      contractTypeId === 'consulting-agreement'
    ) {
      // Use hourly_rate when present
      if (typeof normalizedData.hourly_rate === 'number') {
        normalizedData.contract_value = normalizedData.hourly_rate;
      }
    } else if (contractTypeId === 'vendor-service-agreement') {
      if (typeof normalizedData.contract_value !== 'number' &&
          typeof normalizedData['contract_value'] === 'number') {
        // keep as is
      }
    }
  }

  // Generate webhook payload if validation passes
  const webhookPayload = validation.isValid
    ? {
        contract_type: contractTypeId,
        template_id: contractConfig.googleDocsTemplateId,
        makecom_template_id: contractConfig.makecomTemplateId,
        business_rules: contractConfig.businessRules,
        ...normalizedData,
      }
    : null;

  return {
    webhookPayload,
    templateConfig: contractConfig,
    validation,
  };
}
