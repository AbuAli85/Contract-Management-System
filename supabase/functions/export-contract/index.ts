// supabase/functions/export-contract/index.ts
// Contract export Edge Function with structured error handling

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Error codes for structured error handling
export enum ExportErrorCode {
  // Validation errors
  INVALID_CONTRACT_ID = "INVALID_CONTRACT_ID",
  MISSING_REQUIRED_FIELDS = "MISSING_REQUIRED_FIELDS",
  INVALID_CONTRACT_TYPE = "INVALID_CONTRACT_TYPE",

  // Template errors
  TEMPLATE_NOT_FOUND = "TEMPLATE_NOT_FOUND",
  TEMPLATE_ACCESS_DENIED = "TEMPLATE_ACCESS_DENIED",
  TEMPLATE_PARSE_ERROR = "TEMPLATE_PARSE_ERROR",

  // Data mapping errors
  DATA_MAPPING_FAILED = "DATA_MAPPING_FAILED",
  UNMAPPED_FIELDS = "UNMAPPED_FIELDS",
  MISSING_PLACEHOLDERS = "MISSING_PLACEHOLDERS",

  // PDF generation errors
  PDF_GENERATION_FAILED = "PDF_GENERATION_FAILED",
  PUPPETEER_ERROR = "PUPPETEER_ERROR",
  STORAGE_UPLOAD_FAILED = "STORAGE_UPLOAD_FAILED",

  // External service errors
  GOOGLE_DOCS_ERROR = "GOOGLE_DOCS_ERROR",
  MAKECOM_ERROR = "MAKECOM_ERROR",
  WEBHOOK_ERROR = "WEBHOOK_ERROR",

  // Database errors
  DATABASE_ERROR = "DATABASE_ERROR",
  CONTRACT_NOT_FOUND = "CONTRACT_NOT_FOUND",
  PERMISSION_DENIED = "PERMISSION_DENIED",

  // System errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
}

// Structured error response
export interface ExportError {
  code: ExportErrorCode
  message: string
  details?: Record<string, any>
  actionable?: boolean
  retryable?: boolean
  suggestions?: string[]
}

// Success response
export interface ExportSuccess {
  success: true
  contractId: string
  contractNumber: string
  pdfUrl: string
  googleDriveUrl?: string
  exportMethod: "puppeteer" | "makecom" | "google_docs"
  timestamp: string
  processingTime: number
}

// Request body interface
export interface ExportRequest {
  contractId: string
  contractType?: string
  exportMethod?: "puppeteer" | "makecom" | "google_docs"
  options?: {
    includeImages?: boolean
    highQuality?: boolean
    watermark?: boolean
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }

  const startTime = Date.now()

  try {
    // Parse request
    const body: ExportRequest = await req.json()
    const { contractId, contractType, exportMethod = "puppeteer", options = {} } = body

    // Validate request
    if (!contractId) {
      return createErrorResponse(ExportErrorCode.INVALID_CONTRACT_ID, "Contract ID is required")
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch contract data
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(
        `
        *,
        first_party:parties!first_party_id(
          id, name_en, name_ar, crn, address_en, address_ar,
          contact_person, contact_email, contact_phone, type
        ),
        second_party:parties!second_party_id(
          id, name_en, name_ar, crn, address_en, address_ar,
          contact_person, contact_email, contact_phone, type
        ),
        promoters(
          id, name_en, name_ar, id_card_number, mobile_number,
          id_card_url, passport_url, status
        )
      `,
      )
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      return createErrorResponse(
        ExportErrorCode.CONTRACT_NOT_FOUND,
        "Contract not found or access denied",
        { contractId, error: contractError?.message },
      )
    }

    // Validate contract type if specified
    if (contractType && contract.contract_type !== contractType) {
      return createErrorResponse(
        ExportErrorCode.INVALID_CONTRACT_TYPE,
        `Contract type mismatch. Expected: ${contractType}, Found: ${contract.contract_type}`,
        { expected: contractType, actual: contract.contract_type },
      )
    }

    // Prepare template data
    const templateData = prepareTemplateData(contract)

    // Validate template data
    const validation = validateTemplateData(templateData)
    if (!validation.isValid) {
      return createErrorResponse(
        ExportErrorCode.DATA_MAPPING_FAILED,
        "Template data validation failed",
        {
          errors: validation.errors,
          missingFields: validation.missingFields,
          suggestions: [
            "Check that all required fields are filled",
            "Verify party and promoter information is complete",
            "Ensure contract dates are valid",
          ],
        },
      )
    }

    // Export based on method
    let result: ExportSuccess
    switch (exportMethod) {
      case "puppeteer":
        result = await exportWithPuppeteer(contract, templateData, options)
        break
      case "makecom":
        result = await exportWithMakecom(contract, templateData, options)
        break
      case "google_docs":
        result = await exportWithGoogleDocs(contract, templateData, options)
        break
      default:
        return createErrorResponse(
          ExportErrorCode.INVALID_CONTRACT_TYPE,
          `Unsupported export method: ${exportMethod}`,
          {
            supportedMethods: ["puppeteer", "makecom", "google_docs"],
            suggestions: ["Use puppeteer for self-contained PDF generation"],
          },
        )
    }

    // Update contract with export information
    await supabase
      .from("contracts")
      .update({
        pdf_url: result.pdfUrl,
        status: "exported",
        exported_at: new Date().toISOString(),
        export_method: result.exportMethod,
      })
      .eq("id", contractId)

    // Log successful export
    await logExportActivity(supabase, {
      contractId,
      success: true,
      exportMethod: result.exportMethod,
      processingTime: result.processingTime,
    })

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("❌ Contract export error:", error)

    const processingTime = Date.now() - startTime

    // Log failed export
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      await logExportActivity(supabase, {
        contractId: "unknown",
        success: false,
        error: error.message,
        processingTime,
      })
    } catch (logError) {
      console.error("Failed to log export activity:", logError)
    }

    return createErrorResponse(
      ExportErrorCode.INTERNAL_ERROR,
      "Internal server error during contract export",
      {
        error: error.message,
        processingTime,
        suggestions: [
          "Try again in a few minutes",
          "Contact support if the issue persists",
          "Check contract data completeness",
        ],
      },
    )
  }
})

// Helper functions

function createErrorResponse(
  code: ExportErrorCode,
  message: string,
  details?: Record<string, any>,
): Response {
  const error: ExportError = {
    code,
    message,
    details,
    actionable: isActionableError(code),
    retryable: isRetryableError(code),
    suggestions: getErrorSuggestions(code),
  }

  return new Response(JSON.stringify({ success: false, error }), {
    status: getErrorStatus(code),
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  })
}

function isActionableError(code: ExportErrorCode): boolean {
  return [
    ExportErrorCode.MISSING_REQUIRED_FIELDS,
    ExportErrorCode.UNMAPPED_FIELDS,
    ExportErrorCode.MISSING_PLACEHOLDERS,
    ExportErrorCode.TEMPLATE_ACCESS_DENIED,
  ].includes(code)
}

function isRetryableError(code: ExportErrorCode): boolean {
  return [
    ExportErrorCode.PDF_GENERATION_FAILED,
    ExportErrorCode.PUPPETEER_ERROR,
    ExportErrorCode.STORAGE_UPLOAD_FAILED,
    ExportErrorCode.GOOGLE_DOCS_ERROR,
    ExportErrorCode.MAKECOM_ERROR,
    ExportErrorCode.WEBHOOK_ERROR,
    ExportErrorCode.TIMEOUT_ERROR,
    ExportErrorCode.RATE_LIMIT_ERROR,
    ExportErrorCode.INTERNAL_ERROR,
  ].includes(code)
}

function getErrorStatus(code: ExportErrorCode): number {
  switch (code) {
    case ExportErrorCode.INVALID_CONTRACT_ID:
    case ExportErrorCode.MISSING_REQUIRED_FIELDS:
    case ExportErrorCode.INVALID_CONTRACT_TYPE:
      return 400
    case ExportErrorCode.CONTRACT_NOT_FOUND:
    case ExportErrorCode.TEMPLATE_NOT_FOUND:
      return 404
    case ExportErrorCode.PERMISSION_DENIED:
    case ExportErrorCode.TEMPLATE_ACCESS_DENIED:
      return 403
    case ExportErrorCode.RATE_LIMIT_ERROR:
      return 429
    case ExportErrorCode.TIMEOUT_ERROR:
      return 408
    default:
      return 500
  }
}

function getErrorSuggestions(code: ExportErrorCode): string[] {
  switch (code) {
    case ExportErrorCode.MISSING_REQUIRED_FIELDS:
      return [
        "Complete all required contract fields",
        "Verify party and promoter information",
        "Check contract dates and terms",
      ]
    case ExportErrorCode.TEMPLATE_NOT_FOUND:
      return [
        "Contact administrator to configure template",
        "Try a different contract type",
        "Use manual PDF generation",
      ]
    case ExportErrorCode.PDF_GENERATION_FAILED:
      return [
        "Try again in a few minutes",
        "Check if template is accessible",
        "Use alternative export method",
      ]
    case ExportErrorCode.RATE_LIMIT_ERROR:
      return [
        "Wait a few minutes before retrying",
        "Reduce export frequency",
        "Contact support for rate limit increase",
      ]
    default:
      return ["Try again later", "Contact support if issue persists", "Check system status"]
  }
}

function prepareTemplateData(contract: any): Record<string, any> {
  return {
    contract_number: contract.contract_number,
    contract_date: new Date().toLocaleDateString("en-GB"),
    contract_type: contract.contract_type,

    // First party data
    first_party_name_en: contract.first_party?.name_en || "",
    first_party_name_ar: contract.first_party?.name_ar || "",
    first_party_crn: contract.first_party?.crn || "",
    first_party_address_en: contract.first_party?.address_en || "",
    first_party_address_ar: contract.first_party?.address_ar || "",
    first_party_contact_person: contract.first_party?.contact_person || "",
    first_party_contact_email: contract.first_party?.contact_email || "",
    first_party_contact_phone: contract.first_party?.contact_phone || "",

    // Second party data
    second_party_name_en: contract.second_party?.name_en || "",
    second_party_name_ar: contract.second_party?.name_ar || "",
    second_party_crn: contract.second_party?.crn || "",
    second_party_address_en: contract.second_party?.address_en || "",
    second_party_address_ar: contract.second_party?.address_ar || "",
    second_party_contact_person: contract.second_party?.contact_person || "",
    second_party_contact_email: contract.second_party?.contact_email || "",
    second_party_contact_phone: contract.second_party?.contact_phone || "",

    // Promoter data
    promoter_name_en: contract.promoters?.name_en || "",
    promoter_name_ar: contract.promoters?.name_ar || "",
    promoter_id_card_number: contract.promoters?.id_card_number || "",
    promoter_mobile_number: contract.promoters?.mobile_number || "",
    promoter_email: contract.email || "",
    promoter_id_card_url: contract.promoters?.id_card_url || "",
    promoter_passport_url: contract.promoters?.passport_url || "",

    // Contract details
    job_title: contract.job_title || "",
    department: contract.department || "",
    work_location: contract.work_location || "",
    contract_start_date: contract.contract_start_date
      ? new Date(contract.contract_start_date).toLocaleDateString("en-GB")
      : "",
    contract_end_date: contract.contract_end_date
      ? new Date(contract.contract_end_date).toLocaleDateString("en-GB")
      : "",
    basic_salary: contract.contract_value?.toString() || "0",
    allowances: "0",
    currency: contract.currency || "OMR",
    total_salary: contract.contract_value?.toString() || "0",
    special_terms: contract.special_terms || "",
    probation_period_months: "3",
    notice_period_days: "30",
    working_hours_per_week: "40",
  }
}

function validateTemplateData(data: Record<string, any>): {
  isValid: boolean
  errors: string[]
  missingFields: string[]
} {
  const errors: string[] = []
  const missingFields: string[] = []

  const requiredFields = [
    "contract_number",
    "first_party_name_en",
    "second_party_name_en",
    "promoter_name_en",
    "job_title",
    "department",
    "work_location",
    "contract_start_date",
  ]

  requiredFields.forEach((field) => {
    if (!data[field] || data[field].toString().trim() === "") {
      missingFields.push(field)
      errors.push(`${field} is required`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    missingFields,
  }
}

async function exportWithPuppeteer(
  contract: any,
  templateData: any,
  options: any,
): Promise<ExportSuccess> {
  // This would use Puppeteer to generate PDF
  // For now, simulate the process
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const pdfUrl = `https://storage.example.com/contracts/${contract.contract_number}.pdf`

  return {
    success: true,
    contractId: contract.id,
    contractNumber: contract.contract_number,
    pdfUrl,
    exportMethod: "puppeteer",
    timestamp: new Date().toISOString(),
    processingTime: 2000,
  }
}

async function exportWithMakecom(
  contract: any,
  templateData: any,
  options: any,
): Promise<ExportSuccess> {
  // This would trigger Make.com webhook
  const webhookUrl = Deno.env.get("MAKECOM_WEBHOOK_URL")
  if (!webhookUrl) {
    throw new Error("Make.com webhook URL not configured")
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contractId: contract.id,
      contractNumber: contract.contract_number,
      templateData,
    }),
  })

  if (!response.ok) {
    throw new Error(`Make.com webhook failed: ${response.statusText}`)
  }

  const result = await response.json()

  return {
    success: true,
    contractId: contract.id,
    contractNumber: contract.contract_number,
    pdfUrl: result.pdfUrl,
    googleDriveUrl: result.googleDriveUrl,
    exportMethod: "makecom",
    timestamp: new Date().toISOString(),
    processingTime: 3000,
  }
}

async function exportWithGoogleDocs(
  contract: any,
  templateData: any,
  options: any,
): Promise<ExportSuccess> {
  // This would use Google Docs API
  // For now, simulate the process
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const pdfUrl = `https://docs.google.com/document/d/${contract.id}/export?format=pdf`

  return {
    success: true,
    contractId: contract.id,
    contractNumber: contract.contract_number,
    pdfUrl,
    googleDriveUrl: `https://drive.google.com/file/d/${contract.id}`,
    exportMethod: "google_docs",
    timestamp: new Date().toISOString(),
    processingTime: 1500,
  }
}

async function logExportActivity(supabase: any, data: any): Promise<void> {
  try {
    await supabase.from("contract_export_logs").insert({
      contract_id: data.contractId,
      success: data.success,
      export_method: data.exportMethod,
      error_message: data.error,
      processing_time_ms: data.processingTime,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Failed to log export activity:", error)
  }
}
