import type { ValidationResult, ValidationError } from "@/lib/types/api"

export function validateCreateContractRequest(body: unknown): ValidationResult {
  const errors: ValidationError[] = []
  
  // Check for required IDs (either direct or nested)
  const hasFirstPartyId = (body as unknown as { first_party_id?: string; first_party?: { id?: string } }).first_party_id || (body as unknown as { first_party_id?: string; first_party?: { id?: string } }).first_party?.id
  const hasSecondPartyId = (body as unknown as { second_party_id?: string; second_party?: { id?: string } }).second_party_id || (body as unknown as { second_party_id?: string; second_party?: { id?: string } }).second_party?.id
  const hasPromoterId = (body as unknown as { promoter_id?: string; promoter?: { id?: string } }).promoter_id || (body as unknown as { promoter_id?: string; promoter?: { id?: string } }).promoter?.id
  
  if (!hasFirstPartyId) {
    errors.push({ field: "first_party_id", message: "Party A ID is required" })
  }
  
  if (!hasSecondPartyId) {
    errors.push({ field: "second_party_id", message: "Party B ID is required" })
  }
  
  if (!hasPromoterId) {
    errors.push({ field: "promoter_id", message: "Promoter ID is required" })
  }
  
  // Validate email format if provided
  const email = (body as unknown as { email?: string }).email;
  if (typeof email === "string" && email && !isValidEmail(email)) {
    errors.push({ field: "email", message: "Invalid email format" })
  }
  
  // Validate date formats if provided
  const contractStartDate = (body as unknown as { contract_start_date?: string }).contract_start_date;
  if (typeof contractStartDate === "string" && contractStartDate && !isValidDate(contractStartDate)) {
    errors.push({ field: "contract_start_date", message: "Invalid start date format" })
  }
  
  const contractEndDate = (body as unknown as { contract_end_date?: string }).contract_end_date;
  if (typeof contractEndDate === "string" && contractEndDate && !isValidDate(contractEndDate)) {
    errors.push({ field: "contract_end_date", message: "Invalid end date format" })
  }
  
  // Validate that end date is after start date if both are provided
  if (typeof contractStartDate === "string" && contractStartDate && typeof contractEndDate === "string" && contractEndDate) {
    const startDate = new Date(contractStartDate)
    const endDate = new Date(contractEndDate)
    
    if (endDate <= startDate) {
      errors.push({ 
        field: "contract_end_date", 
        message: "End date must be after start date" 
      })
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateUpdateContractRequest(body: unknown): ValidationResult {
  const errors: ValidationError[] = []
  
  // Check for required ID
  if (!body) {
    errors.push({ field: "id", message: "Contract ID is required" })
  }
  
  // Validate email format if provided
  const updateEmail = (body as unknown as { email?: string }).email;
  if (typeof updateEmail === "string" && updateEmail && !isValidEmail(updateEmail)) {
    errors.push({ field: "email", message: "Invalid email format" })
  }
  
  // Validate date formats if provided
  const updateContractStartDate = (body as unknown as { contract_start_date?: string }).contract_start_date;
  if (typeof updateContractStartDate === "string" && updateContractStartDate && !isValidDate(updateContractStartDate)) {
    errors.push({ field: "contract_start_date", message: "Invalid start date format" })
  }
  
  const updateContractEndDate = (body as unknown as { contract_end_date?: string }).contract_end_date;
  if (typeof updateContractEndDate === "string" && updateContractEndDate && !isValidDate(updateContractEndDate)) {
    errors.push({ field: "contract_end_date", message: "Invalid end date format" })
  }
  
  // Validate that end date is after start date if both are provided
  if (typeof updateContractStartDate === "string" && updateContractStartDate && typeof updateContractEndDate === "string" && updateContractEndDate) {
    const startDate = new Date(updateContractStartDate)
    const endDate = new Date(updateContractEndDate)
    
    if (endDate <= startDate) {
      errors.push({ 
        field: "contract_end_date", 
        message: "End date must be after start date" 
      })
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Utility functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

// Helper function to extract IDs from request body
export function extractIds(body: unknown): {
  clientId: string | undefined
  employerId: string | undefined
  promoterId: string | undefined
} {
  return {
    clientId: (body as any)?.first_party?.id || (body as any)?.first_party?.first_party_id,
    employerId: (body as any)?.second_party?.id || (body as any)?.second_party?.second_party_id,
    promoterId: (body as any)?.promoter?.id || (body as any)?.promoter?.promoter_id,
  }
} 