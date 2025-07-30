// lib/makecom-template-config.ts
// Enhanced Make.com Template Configuration for 9 Contract Types

export interface MakecomTemplateConfig {
  id: string
  name: string
  description: string
  category: string
  isActive: boolean
  makecomModuleConfig: {
    webhookUrl: string
    webhookTriggerFields: string[]
    templateVariables: Record<string, any>
    googleDriveSettings?: {
      folderId: string
      naming: string
      permissions: string[]
    }
    outputFormat: "pdf" | "docx" | "html"
    automationSteps: string[]
    errorHandling: string[]
  }
  googleDocsTemplateId: string
  businessRules: {
    autoApproval: boolean
    requiresLegalReview: boolean
    requiresFinancialApproval: boolean
    maxContractValue: number
    minContractValue: number
    allowedCurrencies: string[]
    complianceChecks: string[]
  }
}

// Enhanced Make.com Template Configurations for 9 Contract Types
export const MAKECOM_TEMPLATE_CONFIGS: Record<string, MakecomTemplateConfig> = {
  // 1. Full-Time Permanent Employment
  full_time_permanent_employment_v2: {
    id: "full_time_permanent_employment_v2",
    name: "Full-Time Permanent Employment Contract",
    description: "Automated employment contract generation with legal compliance checks",
    category: "employment",
    isActive: true,
    makecomModuleConfig: {
      webhookUrl: process.env.MAKE_WEBHOOK_URL || "",
      webhookTriggerFields: [
        "job_title",
        "department",
        "basic_salary",
        "probation_period",
        "notice_period",
        "work_location",
        "working_hours",
      ],
      templateVariables: {
        contract_type: "full_time_permanent",
        template_version: "v2.0",
        legal_compliance: true,
        auto_approval: false,
      },
      googleDriveSettings: {
        folderId: process.env.GOOGLE_DRIVE_EMPLOYMENT_FOLDER || "",
        naming: "Employment_Contract_{contract_number}_{employee_name}_{date}",
        permissions: ["view", "edit", "comment"],
      },
      outputFormat: "pdf",
      automationSteps: [
        "validate_contract_data",
        "check_legal_compliance",
        "generate_google_docs",
        "apply_digital_signatures",
        "send_notifications",
        "store_in_database",
      ],
      errorHandling: [
        "retry_on_failure",
        "notify_admin_on_error",
        "log_error_details",
        "fallback_to_manual_process",
      ],
    },
    googleDocsTemplateId: "1AbCdEfGhIjKlMnOpQrStUvWxYz123456789",
    businessRules: {
      autoApproval: false,
      requiresLegalReview: true,
      requiresFinancialApproval: true,
      maxContractValue: 50000,
      minContractValue: 1000,
      allowedCurrencies: ["OMR", "USD"],
      complianceChecks: ["labor_law_compliance", "visa_requirements", "tax_obligations"],
    },
  },

  // 2. Part-Time Contract
  part_time_contract_v2: {
    id: "part_time_contract_v2",
    name: "Part-Time Contract",
    description: "Automated part-time contract generation with flexible terms",
    category: "employment",
    isActive: true,
    makecomModuleConfig: {
      webhookUrl: process.env.MAKE_WEBHOOK_URL || "",
      webhookTriggerFields: ["job_title", "weekly_hours", "hourly_rate", "work_schedule"],
      templateVariables: {
        contract_type: "part_time",
        template_version: "v2.0",
        legal_compliance: true,
        auto_approval: true,
      },
      googleDriveSettings: {
        folderId: process.env.GOOGLE_DRIVE_PARTTIME_FOLDER || "",
        naming: "PartTime_Contract_{contract_number}_{employee_name}_{date}",
        permissions: ["view", "edit"],
      },
      outputFormat: "pdf",
      automationSteps: [
        "validate_contract_data",
        "check_hourly_rate_compliance",
        "generate_google_docs",
        "apply_digital_signatures",
        "send_notifications",
      ],
      errorHandling: ["retry_on_failure", "notify_admin_on_error", "log_error_details"],
    },
    googleDocsTemplateId: "2BcDeFgHiJkLmNoPqRsTuVwXyZ234567890",
    businessRules: {
      autoApproval: true,
      requiresLegalReview: false,
      requiresFinancialApproval: false,
      maxContractValue: 15000,
      minContractValue: 500,
      allowedCurrencies: ["OMR", "USD"],
      complianceChecks: ["hourly_rate_compliance", "working_hours_validation"],
    },
  },

  // 3. Fixed-Term Contract
  fixed_term_contract_v2: {
    id: "fixed_term_contract_v2",
    name: "Fixed-Term Contract",
    description: "Automated fixed-term contract generation for project-based employment",
    category: "employment",
    isActive: true,
    makecomModuleConfig: {
      webhookUrl: process.env.MAKE_WEBHOOK_URL || "",
      webhookTriggerFields: [
        "job_title",
        "contract_duration",
        "project_description",
        "start_date",
        "end_date",
      ],
      templateVariables: {
        contract_type: "fixed_term",
        template_version: "v2.0",
        legal_compliance: true,
        auto_approval: false,
      },
      googleDriveSettings: {
        folderId: process.env.GOOGLE_DRIVE_FIXEDTERM_FOLDER || "",
        naming: "FixedTerm_Contract_{contract_number}_{project_name}_{date}",
        permissions: ["view", "edit", "comment"],
      },
      outputFormat: "pdf",
      automationSteps: [
        "validate_contract_data",
        "check_project_scope",
        "validate_dates",
        "generate_google_docs",
        "apply_digital_signatures",
        "send_notifications",
        "schedule_reminders",
      ],
      errorHandling: [
        "retry_on_failure",
        "notify_admin_on_error",
        "log_error_details",
        "validate_project_dates",
      ],
    },
    googleDocsTemplateId: "3CdEfGhIjKlMnOpQrStUvWxYzA345678901",
    businessRules: {
      autoApproval: false,
      requiresLegalReview: true,
      requiresFinancialApproval: true,
      maxContractValue: 100000,
      minContractValue: 2000,
      allowedCurrencies: ["OMR", "USD"],
      complianceChecks: ["project_scope_validation", "budget_approval", "date_validation"],
    },
  },

  // 4. Business Service Contract
  business_service_contract_v2: {
    id: "business_service_contract_v2",
    name: "Business Service Contract",
    description: "Automated B2B service contract generation with comprehensive terms",
    category: "service",
    isActive: true,
    makecomModuleConfig: {
      webhookUrl: process.env.MAKE_WEBHOOK_URL || "",
      webhookTriggerFields: [
        "service_provider",
        "service_recipient",
        "service_description",
        "service_duration",
        "service_fee",
        "payment_terms",
      ],
      templateVariables: {
        contract_type: "business_service",
        template_version: "v2.0",
        legal_compliance: true,
        auto_approval: false,
      },
      googleDriveSettings: {
        folderId: process.env.GOOGLE_DRIVE_SERVICE_FOLDER || "",
        naming: "Service_Contract_{contract_number}_{service_provider}_{date}",
        permissions: ["view", "edit", "comment"],
      },
      outputFormat: "pdf",
      automationSteps: [
        "validate_contract_data",
        "check_vendor_registration",
        "validate_service_terms",
        "generate_google_docs",
        "apply_digital_signatures",
        "send_notifications",
        "create_payment_schedule",
      ],
      errorHandling: [
        "retry_on_failure",
        "notify_admin_on_error",
        "log_error_details",
        "validate_vendor_status",
      ],
    },
    googleDocsTemplateId: "4DeFgHiJkLmNoPqRsTuVwXyZAb456789012",
    businessRules: {
      autoApproval: false,
      requiresLegalReview: true,
      requiresFinancialApproval: true,
      maxContractValue: 500000,
      minContractValue: 1000,
      allowedCurrencies: ["OMR", "USD", "EUR"],
      complianceChecks: ["vendor_registration", "tax_compliance", "insurance_requirements"],
    },
  },

  // 5. Consulting Agreement
  consulting_agreement_v2: {
    id: "consulting_agreement_v2",
    name: "Consulting Agreement",
    description: "Automated consulting agreement generation with expertise validation",
    category: "consulting",
    isActive: true,
    makecomModuleConfig: {
      webhookUrl: process.env.MAKE_WEBHOOK_URL || "",
      webhookTriggerFields: [
        "consultant_name",
        "client_name",
        "consulting_scope",
        "consulting_duration",
        "hourly_rate",
        "estimated_hours",
        "expertise_area",
      ],
      templateVariables: {
        contract_type: "consulting",
        template_version: "v2.0",
        legal_compliance: true,
        auto_approval: false,
      },
      googleDriveSettings: {
        folderId: process.env.GOOGLE_DRIVE_CONSULTING_FOLDER || "",
        naming: "Consulting_Agreement_{contract_number}_{consultant_name}_{date}",
        permissions: ["view", "edit", "comment"],
      },
      outputFormat: "pdf",
      automationSteps: [
        "validate_contract_data",
        "check_consultant_credentials",
        "validate_expertise_area",
        "generate_google_docs",
        "apply_digital_signatures",
        "send_notifications",
        "create_invoice_schedule",
      ],
      errorHandling: [
        "retry_on_failure",
        "notify_admin_on_error",
        "log_error_details",
        "validate_consultant_credentials",
      ],
    },
    googleDocsTemplateId: "5EfGhIjKlMnOpQrStUvWxYzAbC567890123",
    businessRules: {
      autoApproval: false,
      requiresLegalReview: true,
      requiresFinancialApproval: false,
      maxContractValue: 200000,
      minContractValue: 5000,
      allowedCurrencies: ["OMR", "USD", "EUR"],
      complianceChecks: [
        "consultant_credentials",
        "conflict_of_interest",
        "confidentiality_agreement",
      ],
    },
  },

  // 6. Freelance Service Agreement
  freelance_service_agreement_v2: {
    id: "freelance_service_agreement_v2",
    name: "Freelance Service Agreement",
    description: "Automated freelance agreement generation for independent contractors",
    category: "freelance",
    isActive: true,
    makecomModuleConfig: {
      webhookUrl: process.env.MAKE_WEBHOOK_URL || "",
      webhookTriggerFields: [
        "freelancer_name",
        "client_name",
        "project_description",
        "project_duration",
        "project_fee",
        "payment_schedule",
        "deliverables",
      ],
      templateVariables: {
        contract_type: "freelance",
        template_version: "v2.0",
        legal_compliance: true,
        auto_approval: true,
      },
      googleDriveSettings: {
        folderId: process.env.GOOGLE_DRIVE_FREELANCE_FOLDER || "",
        naming: "Freelance_Agreement_{contract_number}_{freelancer_name}_{date}",
        permissions: ["view", "edit"],
      },
      outputFormat: "pdf",
      automationSteps: [
        "validate_contract_data",
        "check_freelancer_registration",
        "validate_project_scope",
        "generate_google_docs",
        "apply_digital_signatures",
        "send_notifications",
        "create_milestone_schedule",
      ],
      errorHandling: ["retry_on_failure", "notify_admin_on_error", "log_error_details"],
    },
    googleDocsTemplateId: "6FgHiJkLmNoPqRsTuVwXyZAbCd678901234",
    businessRules: {
      autoApproval: true,
      requiresLegalReview: false,
      requiresFinancialApproval: false,
      maxContractValue: 50000,
      minContractValue: 1000,
      allowedCurrencies: ["OMR", "USD"],
      complianceChecks: ["freelancer_registration", "tax_obligations"],
    },
  },

  // 7. Business Partnership Agreement
  business_partnership_agreement_v2: {
    id: "business_partnership_agreement_v2",
    name: "Business Partnership Agreement",
    description: "Automated partnership agreement generation with governance structure",
    category: "partnership",
    isActive: true,
    makecomModuleConfig: {
      webhookUrl: process.env.MAKE_WEBHOOK_URL || "",
      webhookTriggerFields: [
        "partner1_name",
        "partner2_name",
        "partnership_name",
        "business_description",
        "partnership_duration",
        "profit_sharing",
        "capital_contribution",
        "governance_structure",
      ],
      templateVariables: {
        contract_type: "partnership",
        template_version: "v2.0",
        legal_compliance: true,
        auto_approval: false,
      },
      googleDriveSettings: {
        folderId: process.env.GOOGLE_DRIVE_PARTNERSHIP_FOLDER || "",
        naming: "Partnership_Agreement_{contract_number}_{partnership_name}_{date}",
        permissions: ["view", "edit", "comment"],
      },
      outputFormat: "pdf",
      automationSteps: [
        "validate_contract_data",
        "check_partner_registration",
        "validate_governance_structure",
        "generate_google_docs",
        "apply_digital_signatures",
        "send_notifications",
        "create_governance_schedule",
      ],
      errorHandling: [
        "retry_on_failure",
        "notify_admin_on_error",
        "log_error_details",
        "validate_partner_legal_status",
      ],
    },
    googleDocsTemplateId: "7GhIjKlMnOpQrStUvWxYzAbCdE789012345",
    businessRules: {
      autoApproval: false,
      requiresLegalReview: true,
      requiresFinancialApproval: true,
      maxContractValue: 1000000,
      minContractValue: 10000,
      allowedCurrencies: ["OMR", "USD", "EUR"],
      complianceChecks: ["partnership_registration", "tax_obligations", "regulatory_compliance"],
    },
  },

  // 8. Non-Disclosure Agreement
  non_disclosure_agreement_v2: {
    id: "non_disclosure_agreement_v2",
    name: "Non-Disclosure Agreement",
    description: "Automated NDA generation with confidentiality protection",
    category: "nda",
    isActive: true,
    makecomModuleConfig: {
      webhookUrl: process.env.MAKE_WEBHOOK_URL || "",
      webhookTriggerFields: [
        "disclosing_party",
        "receiving_party",
        "confidential_information",
        "nda_duration",
        "purpose",
        "penalty_clause",
      ],
      templateVariables: {
        contract_type: "nda",
        template_version: "v2.0",
        legal_compliance: true,
        auto_approval: false,
      },
      googleDriveSettings: {
        folderId: process.env.GOOGLE_DRIVE_NDA_FOLDER || "",
        naming: "NDA_{contract_number}_{disclosing_party}_{date}",
        permissions: ["view", "edit", "comment"],
      },
      outputFormat: "pdf",
      automationSteps: [
        "validate_contract_data",
        "check_confidentiality_requirements",
        "validate_penalty_clause",
        "generate_google_docs",
        "apply_digital_signatures",
        "send_notifications",
        "create_confidentiality_schedule",
      ],
      errorHandling: [
        "retry_on_failure",
        "notify_admin_on_error",
        "log_error_details",
        "validate_legal_enforceability",
      ],
    },
    googleDocsTemplateId: "8HiJkLmNoPqRsTuVwXyZAbCdEf890123456",
    businessRules: {
      autoApproval: false,
      requiresLegalReview: true,
      requiresFinancialApproval: false,
      maxContractValue: 100000,
      minContractValue: 0,
      allowedCurrencies: ["OMR", "USD"],
      complianceChecks: ["confidentiality_requirements", "legal_enforceability"],
    },
  },

  // 9. Vendor Service Agreement
  vendor_service_agreement_v2: {
    id: "vendor_service_agreement_v2",
    name: "Vendor Service Agreement",
    description: "Automated vendor agreement generation with quality standards",
    category: "vendor",
    isActive: true,
    makecomModuleConfig: {
      webhookUrl: process.env.MAKE_WEBHOOK_URL || "",
      webhookTriggerFields: [
        "vendor_name",
        "client_name",
        "service_category",
        "service_description",
        "contract_value",
        "payment_terms",
        "service_level_agreement",
        "quality_standards",
      ],
      templateVariables: {
        contract_type: "vendor_service",
        template_version: "v2.0",
        legal_compliance: true,
        auto_approval: false,
      },
      googleDriveSettings: {
        folderId: process.env.GOOGLE_DRIVE_VENDOR_FOLDER || "",
        naming: "Vendor_Agreement_{contract_number}_{vendor_name}_{date}",
        permissions: ["view", "edit", "comment"],
      },
      outputFormat: "pdf",
      automationSteps: [
        "validate_contract_data",
        "check_vendor_registration",
        "validate_quality_standards",
        "generate_google_docs",
        "apply_digital_signatures",
        "send_notifications",
        "create_quality_monitoring_schedule",
      ],
      errorHandling: [
        "retry_on_failure",
        "notify_admin_on_error",
        "log_error_details",
        "validate_vendor_certifications",
      ],
    },
    googleDocsTemplateId: "9IjKlMnOpQrStUvWxYzAbCdEfG901234567",
    businessRules: {
      autoApproval: false,
      requiresLegalReview: true,
      requiresFinancialApproval: true,
      maxContractValue: 1000000,
      minContractValue: 5000,
      allowedCurrencies: ["OMR", "USD", "EUR"],
      complianceChecks: [
        "vendor_registration",
        "quality_certification",
        "insurance_coverage",
        "tax_compliance",
      ],
    },
  },
}

// Helper functions
export function getMakecomTemplateConfig(contractTypeId: string): MakecomTemplateConfig | null {
  return MAKECOM_TEMPLATE_CONFIGS[contractTypeId] || null
}

export function getAllMakecomTemplateConfigs(): MakecomTemplateConfig[] {
  return Object.values(MAKECOM_TEMPLATE_CONFIGS)
}

export function getMakecomTemplatesByCategory(category: string): MakecomTemplateConfig[] {
  return Object.values(MAKECOM_TEMPLATE_CONFIGS).filter((config) => config.category === category)
}

// Generate Make.com webhook payload
export function generateMakecomWebhookPayload(
  contractTypeId: string,
  contractData: Record<string, any>,
): any {
  const config = getMakecomTemplateConfig(contractTypeId)

  if (!config) {
    return null
  }

  const payload: any = {
    contract_type: contractTypeId,
    template_config: config.id,
    contract_data: contractData,
    automation_settings: {
      auto_approval: config.businessRules.autoApproval,
      requires_legal_review: config.businessRules.requiresLegalReview,
      requires_financial_approval: config.businessRules.requiresFinancialApproval,
    },
    compliance_checks: config.businessRules.complianceChecks,
    currency_limits: {
      min: config.businessRules.minContractValue,
      max: config.businessRules.maxContractValue,
      allowed_currencies: config.businessRules.allowedCurrencies,
    },
  }

  if (config.makecomModuleConfig.googleDriveSettings) {
    payload.google_drive_folder_id = config.makecomModuleConfig.googleDriveSettings.folderId
    payload.file_naming_pattern = config.makecomModuleConfig.googleDriveSettings.naming
  }

  payload.output_format = config.makecomModuleConfig.outputFormat

  return payload
}

// Validate Make.com template data
export function validateMakecomTemplateData(
  contractTypeId: string,
  contractData: Record<string, any>,
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const config = getMakecomTemplateConfig(contractTypeId)

  if (!config) {
    return {
      isValid: false,
      errors: [`Make.com template configuration for '${contractTypeId}' not found`],
      warnings: [],
    }
  }

  const errors: string[] = []
  const warnings: string[] = []

  // Check required webhook trigger fields
  config.makecomModuleConfig.webhookTriggerFields.forEach((field) => {
    if (!contractData[field]) {
      errors.push(`Required field '${field}' is missing for Make.com automation`)
    }
  })

  // Check business rules
  if (
    config.businessRules.minContractValue &&
    contractData.contract_value < config.businessRules.minContractValue
  ) {
    errors.push(
      `Contract value must be at least ${config.businessRules.minContractValue} ${config.businessRules.allowedCurrencies[0]}`,
    )
  }

  if (
    config.businessRules.maxContractValue &&
    contractData.contract_value > config.businessRules.maxContractValue
  ) {
    errors.push(
      `Contract value cannot exceed ${config.businessRules.maxContractValue} ${config.businessRules.allowedCurrencies[0]}`,
    )
  }

  // Check currency compliance
  if (
    contractData.currency &&
    !config.businessRules.allowedCurrencies.includes(contractData.currency)
  ) {
    errors.push(
      `Currency '${contractData.currency}' is not allowed. Allowed currencies: ${config.businessRules.allowedCurrencies.join(", ")}`,
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// Generate Make.com blueprint for automation setup
export function generateMakecomBlueprint(contractTypeId: string): any {
  const config = getMakecomTemplateConfig(contractTypeId)

  if (!config) {
    return null
  }

  return {
    blueprint_name: `${config.name} Automation`,
    description: config.description,
    category: config.category,
    webhook_configuration: {
      url: config.makecomModuleConfig.webhookUrl,
      trigger_fields: config.makecomModuleConfig.webhookTriggerFields,
      authentication: "api_key",
      retry_policy: "exponential_backoff",
    },
    google_docs_integration: {
      template_id: config.googleDocsTemplateId,
      variables: config.makecomModuleConfig.templateVariables,
      output_format: config.makecomModuleConfig.outputFormat,
    },
    automation_steps: config.makecomModuleConfig.automationSteps,
    error_handling: config.makecomModuleConfig.errorHandling,
    business_rules: config.businessRules,
    compliance_checks: config.businessRules.complianceChecks,
  }
}
