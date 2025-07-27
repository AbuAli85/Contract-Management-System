// Enhanced Google Docs Templates for Professional Contract Generation
// These templates provide better formatting and comprehensive contract sections

export interface EnhancedTemplateConfig {
  id: string
  name: string
  description: string
  googleDocsTemplateId: string
  sections: TemplateSection[]
  styling: TemplateStyling
  placeholders: TemplatePlaceholder[]
}

export interface TemplateSection {
  id: string
  name: string
  required: boolean
  content: string
  placeholders: string[]
}

export interface TemplateStyling {
  fontFamily: string
  fontSize: number
  lineHeight: number
  margins: {
    top: number
    bottom: number
    left: number
    right: number
  }
  colors: {
    primary: string
    secondary: string
    accent: string
    text: string
  }
}

export interface TemplatePlaceholder {
  key: string
  description: string
  required: boolean
  defaultValue?: string
  validation?: string
}

// Enhanced Employment Contract Template
export const enhancedEmploymentTemplate: EnhancedTemplateConfig = {
  id: 'enhanced-employment',
  name: 'Enhanced Employment Contract',
  description: 'Professional employment contract with comprehensive sections and modern formatting',
  googleDocsTemplateId: '1AbCdEfGhIjKlMnOpQrStUvWxYz123456789',
  styling: {
    fontFamily: 'Arial',
    fontSize: 11,
    lineHeight: 1.5,
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
    colors: {
      primary: '#2c3e50',
      secondary: '#34495e',
      accent: '#3498db',
      text: '#2c3e50'
    }
  },
  sections: [
    {
      id: 'header',
      name: 'Document Header',
      required: true,
      content: `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; font-size: 24px; margin-bottom: 10px;">EMPLOYMENT CONTRACT</h1>
          <p style="color: #7f8c8d; font-size: 14px;">Professional Employment Agreement</p>
          <hr style="border: 2px solid #3498db; margin: 20px 0;">
        </div>
      `,
      placeholders: []
    },
    {
      id: 'contract-info',
      name: 'Contract Information',
      required: true,
      content: `
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="color: #2c3e50; margin-bottom: 10px;">Contract Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px; font-weight: bold; color: #34495e;">Contract Number:</td>
              <td style="padding: 5px;">{{contract_number}}</td>
            </tr>
            <tr>
              <td style="padding: 5px; font-weight: bold; color: #34495e;">Date:</td>
              <td style="padding: 5px;">{{contract_date}}</td>
            </tr>
            <tr>
              <td style="padding: 5px; font-weight: bold; color: #34495e;">Contract Type:</td>
              <td style="padding: 5px;">{{contract_type}}</td>
            </tr>
          </table>
        </div>
      `,
      placeholders: ['contract_number', 'contract_date', 'contract_type']
    },
    {
      id: 'parties',
      name: 'Contracting Parties',
      required: true,
      content: `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">CONTRACTING PARTIES</h3>
          
          <div style="display: flex; gap: 20px; margin-top: 15px;">
            <div style="flex: 1; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
              <h4 style="color: #e74c3c; margin-bottom: 10px;">FIRST PARTY (EMPLOYER)</h4>
              <p><strong>Company Name:</strong> {{first_party_name_en}}</p>
              <p><strong>Arabic Name:</strong> {{first_party_name_ar}}</p>
              <p><strong>CRN:</strong> {{first_party_crn}}</p>
              <p><strong>Address:</strong> {{first_party_address}}</p>
              <p><strong>Contact Person:</strong> {{first_party_contact_person}}</p>
              <p><strong>Email:</strong> {{first_party_contact_email}}</p>
              <p><strong>Phone:</strong> {{first_party_contact_phone}}</p>
            </div>
            
            <div style="flex: 1; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
              <h4 style="color: #27ae60; margin-bottom: 10px;">SECOND PARTY (EMPLOYEE)</h4>
              <p><strong>Name:</strong> {{second_party_name_en}}</p>
              <p><strong>Arabic Name:</strong> {{second_party_name_ar}}</p>
              <p><strong>ID Number:</strong> {{second_party_id_number}}</p>
              <p><strong>Email:</strong> {{employee_email}}</p>
              <p><strong>Phone:</strong> {{second_party_contact_phone}}</p>
            </div>
          </div>
        </div>
      `,
      placeholders: [
        'first_party_name_en', 'first_party_name_ar', 'first_party_crn', 'first_party_address',
        'first_party_contact_person', 'first_party_contact_email', 'first_party_contact_phone',
        'second_party_name_en', 'second_party_name_ar', 'second_party_id_number',
        'employee_email', 'second_party_contact_phone'
      ]
    },
    {
      id: 'job-details',
      name: 'Job Details',
      required: true,
      content: `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">JOB DETAILS</h3>
          
          <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e; width: 30%;">Position Title:</td>
                <td style="padding: 8px;">{{job_title}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e;">Department:</td>
                <td style="padding: 8px;">{{department}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e;">Work Location:</td>
                <td style="padding: 8px;">{{work_location}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e;">Reporting To:</td>
                <td style="padding: 8px;">{{reporting_to}}</td>
              </tr>
            </table>
          </div>
        </div>
      `,
      placeholders: ['job_title', 'department', 'work_location', 'reporting_to']
    },
    {
      id: 'contract-terms',
      name: 'Contract Terms',
      required: true,
      content: `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">CONTRACT TERMS</h3>
          
          <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e; width: 30%;">Start Date:</td>
                <td style="padding: 8px;">{{start_date}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e;">End Date:</td>
                <td style="padding: 8px;">{{end_date}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e;">Probation Period:</td>
                <td style="padding: 8px;">{{probation_period}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e;">Notice Period:</td>
                <td style="padding: 8px;">{{notice_period}}</td>
              </tr>
            </table>
          </div>
        </div>
      `,
      placeholders: ['start_date', 'end_date', 'probation_period', 'notice_period']
    },
    {
      id: 'compensation',
      name: 'Compensation & Benefits',
      required: true,
      content: `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">COMPENSATION & BENEFITS</h3>
          
          <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #3498db; color: white;">
                <th style="padding: 10px; text-align: left;">Component</th>
                <th style="padding: 10px; text-align: right;">Amount</th>
                <th style="padding: 10px; text-align: center;">Currency</th>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Basic Salary</td>
                <td style="padding: 8px; text-align: right;">{{basic_salary}}</td>
                <td style="padding: 8px; text-align: center;">{{currency}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Housing Allowance</td>
                <td style="padding: 8px; text-align: right;">{{housing_allowance}}</td>
                <td style="padding: 8px; text-align: center;">{{currency}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Transportation Allowance</td>
                <td style="padding: 8px; text-align: right;">{{transport_allowance}}</td>
                <td style="padding: 8px; text-align: center;">{{currency}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Other Allowances</td>
                <td style="padding: 8px; text-align: right;">{{other_allowances}}</td>
                <td style="padding: 8px; text-align: center;">{{currency}}</td>
              </tr>
              <tr style="background-color: #2c3e50; color: white; font-weight: bold;">
                <td style="padding: 10px;">Total Monthly Compensation</td>
                <td style="padding: 10px; text-align: right;">{{total_compensation}}</td>
                <td style="padding: 10px; text-align: center;">{{currency}}</td>
              </tr>
            </table>
          </div>
        </div>
      `,
      placeholders: [
        'basic_salary', 'housing_allowance', 'transport_allowance', 'other_allowances',
        'total_compensation', 'currency'
      ]
    },
    {
      id: 'working-hours',
      name: 'Working Hours & Conditions',
      required: true,
      content: `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">WORKING HOURS & CONDITIONS</h3>
          
          <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e; width: 30%;">Working Days:</td>
                <td style="padding: 8px;">{{working_days}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e;">Daily Hours:</td>
                <td style="padding: 8px;">{{daily_hours}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e;">Weekly Hours:</td>
                <td style="padding: 8px;">{{weekly_hours}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e;">Overtime Policy:</td>
                <td style="padding: 8px;">{{overtime_policy}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e;">Leave Entitlement:</td>
                <td style="padding: 8px;">{{leave_entitlement}}</td>
              </tr>
            </table>
          </div>
        </div>
      `,
      placeholders: ['working_days', 'daily_hours', 'weekly_hours', 'overtime_policy', 'leave_entitlement']
    },
    {
      id: 'promoter-info',
      name: 'Promoter Information',
      required: false,
      content: `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">PROMOTER INFORMATION</h3>
          
          <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e; width: 30%;">Promoter Name:</td>
                <td style="padding: 8px;">{{promoter_name_en}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e;">Arabic Name:</td>
                <td style="padding: 8px;">{{promoter_name_ar}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e;">ID Number:</td>
                <td style="padding: 8px;">{{promoter_id_number}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e;">Contact:</td>
                <td style="padding: 8px;">{{promoter_contact}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #34495e;">Email:</td>
                <td style="padding: 8px;">{{promoter_email}}</td>
              </tr>
            </table>
          </div>
        </div>
      `,
      placeholders: ['promoter_name_en', 'promoter_name_ar', 'promoter_id_number', 'promoter_contact', 'promoter_email']
    },
    {
      id: 'terms-conditions',
      name: 'Terms and Conditions',
      required: true,
      content: `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">TERMS AND CONDITIONS</h3>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <ol style="color: #2c3e50; line-height: 1.6;">
              <li><strong>Employment Relationship:</strong> This contract establishes a legal employment relationship between the Employer and Employee in accordance with applicable labor laws.</li>
              <li><strong>Duties and Responsibilities:</strong> The Employee agrees to perform all duties and responsibilities associated with the position of {{job_title}} to the best of their abilities.</li>
              <li><strong>Compensation:</strong> The Employer agrees to provide the compensation and benefits as outlined in this contract, payable on a monthly basis.</li>
              <li><strong>Confidentiality:</strong> The Employee agrees to maintain strict confidentiality regarding all business information, trade secrets, and proprietary data.</li>
              <li><strong>Non-Competition:</strong> During employment and for a period of {{non_compete_period}} after termination, the Employee shall not engage in competing activities.</li>
              <li><strong>Intellectual Property:</strong> All work products, inventions, and intellectual property created during employment belong to the Employer.</li>
              <li><strong>Termination:</strong> Either party may terminate this contract with {{notice_period}} written notice, subject to applicable labor laws.</li>
              <li><strong>Dispute Resolution:</strong> Any disputes arising from this contract will be resolved through appropriate legal channels and mediation if required.</li>
            </ol>
          </div>
        </div>
      `,
      placeholders: ['job_title', 'non_compete_period', 'notice_period']
    },
    {
      id: 'signatures',
      name: 'Signatures',
      required: true,
      content: `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px;">SIGNATURES</h3>
          
          <div style="margin-top: 30px;">
            <div style="display: flex; gap: 40px; margin-bottom: 30px;">
              <div style="flex: 1; text-align: center;">
                <p style="font-weight: bold; color: #34495e; margin-bottom: 10px;">FIRST PARTY (EMPLOYER)</p>
                <div style="border: 1px solid #bdc3c7; height: 60px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #7f8c8d;">Signature</span>
                </div>
                <p style="font-weight: bold;">{{first_party_name_en}}</p>
                <p style="color: #7f8c8d; font-size: 12px;">Date: _________________</p>
              </div>
              
              <div style="flex: 1; text-align: center;">
                <p style="font-weight: bold; color: #34495e; margin-bottom: 10px;">SECOND PARTY (EMPLOYEE)</p>
                <div style="border: 1px solid #bdc3c7; height: 60px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #7f8c8d;">Signature</span>
                </div>
                <p style="font-weight: bold;">{{second_party_name_en}}</p>
                <p style="color: #7f8c8d; font-size: 12px;">Date: _________________</p>
              </div>
            </div>
            
            {{#if promoter_name_en}}
            <div style="text-align: center;">
              <p style="font-weight: bold; color: #34495e; margin-bottom: 10px;">PROMOTER</p>
              <div style="border: 1px solid #bdc3c7; height: 60px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; max-width: 300px; margin-left: auto; margin-right: auto;">
                <span style="color: #7f8c8d;">Signature</span>
              </div>
              <p style="font-weight: bold;">{{promoter_name_en}}</p>
              <p style="color: #7f8c8d; font-size: 12px;">Date: _________________</p>
            </div>
            {{/if}}
          </div>
        </div>
      `,
      placeholders: ['first_party_name_en', 'second_party_name_en', 'promoter_name_en']
    },
    {
      id: 'footer',
      name: 'Document Footer',
      required: true,
      content: `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #bdc3c7; text-align: center;">
          <p style="color: #7f8c8d; font-size: 12px; margin-bottom: 5px;">
            This contract is generated electronically and is legally binding under applicable labor laws.
          </p>
          <p style="color: #7f8c8d; font-size: 12px; margin-bottom: 5px;">
            Generated on: {{generation_date}} | Contract ID: {{contract_id}}
          </p>
          <p style="color: #7f8c8d; font-size: 12px;">
            Page 1 of 1 | {{contract_number}}
          </p>
        </div>
      `,
      placeholders: ['generation_date', 'contract_id', 'contract_number']
    }
  ],
  placeholders: [
    { key: 'contract_number', description: 'Unique contract identifier', required: true },
    { key: 'contract_date', description: 'Contract creation date', required: true },
    { key: 'contract_type', description: 'Type of employment contract', required: true },
    { key: 'first_party_name_en', description: 'Employer company name (English)', required: true },
    { key: 'first_party_name_ar', description: 'Employer company name (Arabic)', required: false },
    { key: 'first_party_crn', description: 'Employer commercial registration number', required: false },
    { key: 'second_party_name_en', description: 'Employee name (English)', required: true },
    { key: 'second_party_name_ar', description: 'Employee name (Arabic)', required: false },
    { key: 'job_title', description: 'Position title', required: true },
    { key: 'department', description: 'Department or division', required: true },
    { key: 'work_location', description: 'Primary work location', required: true },
    { key: 'start_date', description: 'Contract start date', required: true },
    { key: 'end_date', description: 'Contract end date', required: false },
    { key: 'basic_salary', description: 'Monthly basic salary', required: true },
    { key: 'currency', description: 'Currency code', required: true, defaultValue: 'OMR' },
    { key: 'promoter_name_en', description: 'Promoter name (English)', required: false },
    { key: 'promoter_name_ar', description: 'Promoter name (Arabic)', required: false }
  ]
}

// Service Contract Template
export const serviceContractTemplate: EnhancedTemplateConfig = {
  id: 'service-contract',
  name: 'Service Contract',
  description: 'Professional service contract for business-to-business services',
  googleDocsTemplateId: '2BcDeFgHiJkLmNoPqRsTuVwXyZ234567890',
  styling: {
    fontFamily: 'Arial',
    fontSize: 11,
    lineHeight: 1.5,
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
    colors: {
      primary: '#2c3e50',
      secondary: '#34495e',
      accent: '#e67e22',
      text: '#2c3e50'
    }
  },
  sections: [
    // Similar structure but adapted for service contracts
    // ... (implement service contract specific sections)
  ],
  placeholders: [
    { key: 'service_provider', description: 'Service provider company name', required: true },
    { key: 'service_recipient', description: 'Service recipient company name', required: true },
    { key: 'service_description', description: 'Detailed service description', required: true },
    { key: 'service_duration', description: 'Service duration period', required: true },
    { key: 'service_fee', description: 'Service fee amount', required: true }
  ]
}

// Freelance Contract Template
export const freelanceContractTemplate: EnhancedTemplateConfig = {
  id: 'freelance-contract',
  name: 'Freelance Contract',
  description: 'Freelance service agreement for independent contractors',
  googleDocsTemplateId: '3CdEfGhIjKlMnOpQrStUvWxYzA345678901',
  styling: {
    fontFamily: 'Arial',
    fontSize: 11,
    lineHeight: 1.5,
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
    colors: {
      primary: '#2c3e50',
      secondary: '#34495e',
      accent: '#9b59b6',
      text: '#2c3e50'
    }
  },
  sections: [
    // Similar structure but adapted for freelance contracts
    // ... (implement freelance contract specific sections)
  ],
  placeholders: [
    { key: 'client_name', description: 'Client company or individual name', required: true },
    { key: 'freelancer_name', description: 'Freelancer name', required: true },
    { key: 'project_description', description: 'Project or service description', required: true },
    { key: 'project_duration', description: 'Project duration', required: true },
    { key: 'project_fee', description: 'Project fee or hourly rate', required: true }
  ]
}

// Export all templates
export const enhancedTemplates: Record<string, EnhancedTemplateConfig> = {
  'enhanced-employment': enhancedEmploymentTemplate,
  'service-contract': serviceContractTemplate,
  'freelance-contract': freelanceContractTemplate
}

// Helper function to get template by ID
export function getEnhancedTemplate(templateId: string): EnhancedTemplateConfig | null {
  return enhancedTemplates[templateId] || null
}

// Helper function to get all available templates
export function getAllEnhancedTemplates(): EnhancedTemplateConfig[] {
  return Object.values(enhancedTemplates)
}

// Helper function to validate template data
export function validateTemplateData(templateId: string, data: Record<string, any>): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const template = getEnhancedTemplate(templateId)
  if (!template) {
    return {
      isValid: false,
      errors: [`Template '${templateId}' not found`],
      warnings: []
    }
  }

  const errors: string[] = []
  const warnings: string[] = []

  // Check required placeholders
  template.placeholders.forEach(placeholder => {
    if (placeholder.required && !data[placeholder.key]) {
      errors.push(`Required field '${placeholder.key}' is missing`)
    } else if (!placeholder.required && !data[placeholder.key] && placeholder.defaultValue) {
      warnings.push(`Optional field '${placeholder.key}' is missing, will use default value`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
} 