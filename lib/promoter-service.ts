import { getSupabaseClient } from "./supabase"
import type { Promoter } from "./types"

// Enhanced type definitions for better type safety
export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
}

export interface PaginationParams {
  page: number
  limit: number
  offset?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  error?: ServiceError
}

export interface ServiceError {
  message: string
  code?: string
  details?: any
  retryable: boolean
}

export interface PromoterFilters {
  status?: string
  documentStatus?: string
  hasContracts?: boolean
  overallStatus?: string
  workLocation?: string
}

export interface PromoterAnalyticsFilters {
  status?: string
  overallStatus?: string
  workLocation?: string
}

export interface PromoterPerformanceStats {
  total_promoters: number
  active_promoters: number
  inactive_promoters: number
  critical_status_count: number
  warning_status_count: number
  total_contracts: number
  total_contract_value: number
  avg_contract_duration: number
  avg_completion_rate: number
  expiring_documents_count: number
  expired_documents_count: number
}

export interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
  total: number
}

// Retry configuration with enhanced type safety
const RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
}

// Enhanced retry helper with better error handling
async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...RETRY_CONFIG, ...config }
  let lastError: Error
  
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on the last attempt
      if (attempt === finalConfig.maxAttempts) {
        throw lastError
      }
      
      // Check if error is retryable
      const isRetryable = isRetryableError(error)
      if (!isRetryable) {
        throw lastError
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(2, attempt - 1), 
        finalConfig.maxDelay
      )
      console.warn(`Retry attempt ${attempt}/${finalConfig.maxAttempts} after ${delay}ms due to:`, error)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

// Enhanced error classification with better type safety
function isRetryableError(error: any): boolean {
  if (!error) return false
  
  const message = error.message?.toLowerCase() || ""
  const code = error.code?.toString() || ""
  
  // Network errors
  const networkErrors = [
    "network", "fetch", "connection", "econnrefused", 
    "etimedout", "dns", "ssl", "timeout", "timed out"
  ]
  
  if (networkErrors.some(term => message.includes(term))) {
    return true
  }
  
  // HTTP 5xx errors (server errors)
  if (code.startsWith("5")) {
    return true
  }
  
  // Supabase specific retryable errors
  const retryableCodes = ["PGRST301", "PGRST302"] // Rate limiting
  if (retryableCodes.includes(code)) {
    return true
  }
  
  // Check for specific error types that are not retryable
  const nonRetryablePatterns = [
    "invalid input", "validation error", "unauthorized", 
    "forbidden", "not found", "bad request"
  ]
  
  if (nonRetryablePatterns.some(pattern => message.includes(pattern))) {
    return false
  }

  return false
}

// Enhanced error creation utility
function createServiceError(error: any, context: string): ServiceError {
  const message = error?.message || 'Unknown error'
  const code = error?.code || 'UNKNOWN'
  
  return {
    message: `${context}: ${message}`,
    code,
    details: error,
    retryable: isRetryableError(error)
  }
}

// Enhanced query builder with type safety
function buildPromoterQuery(
  supabaseClient: any,
  searchTerm?: string,
  filters?: PromoterFilters
) {
  let query = supabaseClient
    .from("promoters")
    .select("*", { count: "exact" })
  
  // Apply search filter
  if (searchTerm?.trim()) {
    query = query.or(
      `name_en.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%,id_card_number.ilike.%${searchTerm}%`
    )
  }
  
  // Apply status filter
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status)
  }
  
  // Apply document status filter
  if (filters?.documentStatus && filters.documentStatus !== "all") {
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    switch (filters.documentStatus) {
      case "expired":
        query = query.or(
          `id_card_expiry_date.lt.${today.toISOString()},passport_expiry_date.lt.${today.toISOString()}`
        )
        break
      case "expiring":
        query = query.or(
          `id_card_expiry_date.lte.${thirtyDaysFromNow.toISOString()},passport_expiry_date.lte.${thirtyDaysFromNow.toISOString()}`
        )
        break
      case "valid":
        query = query.and(
          `id_card_expiry_date.gt.${thirtyDaysFromNow.toISOString()},passport_expiry_date.gt.${thirtyDaysFromNow.toISOString()}`
        )
        break
    }
  }
  
  return query
}

/**
 * Fetch promoters with pagination and contract counts
 */
export async function fetchPromotersWithPagination(
  params: PaginationParams,
  searchTerm?: string,
  filters?: PromoterFilters
): Promise<PaginatedResult<Promoter>> {
  try {
    return await withRetry(async () => {
      const supabaseClient = getSupabaseClient()
      const { page, limit, offset = 0 } = params
      
      // Build query using the enhanced builder
      let query = buildPromoterQuery(supabaseClient, searchTerm, filters)
      
      // Apply pagination
      const actualOffset = offset || (page - 1) * limit
      query = query.range(actualOffset, actualOffset + limit - 1)
      
      // Apply ordering
      query = query.order("name_en", { ascending: true })
      
      const { data: promotersData, error: promotersError, count } = await query
      
      if (promotersError) {
        throw new Error(`Error fetching promoters: ${promotersError.message}`)
      }
      
      // Fetch contract counts for promoters (lazy loading)
      const promotersWithCounts = await Promise.all(
        (promotersData || []).map(async (promoter) => {
          try {
            const { count: contractCount, error: contractError } = await supabaseClient
              .from("contracts")
              .select("*", { count: "exact", head: true })
              .eq("promoter_id", promoter.id)
              .eq("status", "active")
            
            if (contractError) {
              console.warn(`Error fetching contracts for promoter ${promoter.id}:`, contractError)
            }
            
            return {
              ...promoter,
              active_contracts_count: contractCount || 0
            }
          } catch (error) {
            console.warn(`Error processing promoter ${promoter.id}:`, error)
            return {
              ...promoter,
              active_contracts_count: 0
            }
          }
        })
      )
      
      const total = count || 0
      const totalPages = Math.ceil(total / limit)
      
      return {
        data: promotersWithCounts,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error: any) {
    return {
      data: [],
      total: 0,
      page: params.page,
      limit: params.limit,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
      error: createServiceError(error, "Error fetching promoters")
    }
  }
}

/**
 * Fetch promoters using materialized view for better performance
 */
export async function fetchPromotersAnalytics(
  params: PaginationParams,
  searchTerm?: string,
  filters?: PromoterAnalyticsFilters
): Promise<PaginatedResult<any>> {
  try {
    return await withRetry(async () => {
      const supabaseClient = getSupabaseClient()
      const { page, limit } = params
      
      // Use the RPC function for analytics
      const { data, error } = await supabaseClient.rpc(`get_promoter_analytics_paginated`, {
        p_page: page,
        p_limit: limit,
        p_search: searchTerm || null,
        p_status: filters?.status || null,
        p_overall_status: filters?.overallStatus || null,
        p_work_location: filters?.workLocation || null,
        p_sort_by: `name_en`,
        p_sort_order: `asc`
      })
      
      if (error) {
        throw new Error(`Error fetching promoter analytics: ${error.message}`)
      }
      
      if (!data || data.length === 0) {
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      }
      
      const result = data[0]
      return {
        data: result.data || [],
        total: result.total_count || 0,
        page: result.page || page,
        limit: result.limit || limit,
        totalPages: result.total_pages || 0,
        hasNext: result.total_pages > result.page,
        hasPrev: result.page > 1
      }
    })
  } catch (error: any) {
    return {
      data: [],
      total: 0,
      page: params.page,
      limit: params.limit,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
      error: createServiceError(error, "Error fetching promoter analytics")
    }
  }
}

/**
 * Get promoter performance statistics
 */
export async function getPromoterPerformanceStats(): Promise<PromoterPerformanceStats> {
  try {
    return await withRetry(async () => {
      const supabaseClient = getSupabaseClient()
      
      const { data, error } = await supabaseClient.rpc(`get_promoter_performance_stats`)
      
      if (error) {
        throw new Error(`Error fetching performance stats: ${error.message}`)
      }
      
      return data?.[0] || {
        total_promoters: 0,
        active_promoters: 0,
        inactive_promoters: 0,
        critical_status_count: 0,
        warning_status_count: 0,
        total_contracts: 0,
        total_contract_value: 0,
        avg_contract_duration: 0,
        avg_completion_rate: 0,
        expiring_documents_count: 0,
        expired_documents_count: 0
      }
    })
  } catch (error: any) {
    throw new Error(`Failed to get promoter performance stats: ${error.message}`)
  }
}

/**
 * Export promoters to CSV
 */
export async function exportPromotersToCSV(
  searchTerm?: string,
  filters?: PromoterFilters
): Promise<string> {
  try {
    return await withRetry(async () => {
      const supabaseClient = getSupabaseClient()
      
      // Build query to get all promoters for export
      let query = buildPromoterQuery(supabaseClient, searchTerm, filters)
      
      // Apply ordering
      query = query.order("name_en", { ascending: true })
      
      const { data: promotersData, error: promotersError } = await query
      
      if (promotersError) {
        throw new Error(`Error fetching promoters for export: ${promotersError.message}`)
      }
      
      // Convert to CSV format
      const csvHeaders = [
        'First Name',
        'Last Name',
        'Email',
        'Mobile Number',
        'Nationality',
        'ID Card Number',
        'Passport Number',
        'Job Title',
        'Work Location',
        'Status',
        'ID Card Expiry Date',
        'Passport Expiry Date',
        'Notes',
        'Created At'
      ]
      
      const csvRows = promotersData.map(promoter => [
        promoter.firstName || '',
        promoter.lastName || '',
        promoter.email || '',
        promoter.mobile_number || '',
        promoter.nationality || '',
        promoter.id_card_number || '',
        promoter.passport_number || '',
        promoter.job_title || '',
        promoter.work_location || '',
        promoter.status || '',
        promoter.id_card_expiry_date || '',
        promoter.passport_expiry_date || '',
        promoter.notes || '',
        promoter.created_at || ''
      ])
      
      // Combine headers and rows
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')
      
      return csvContent
    })
  } catch (error: any) {
    throw new Error(`Failed to export promoters to CSV: ${error.message}`)
  }
}

/**
 * Import promoters from CSV data
 */
export async function importPromotersFromCSV(
  csvData: any[],
  userId: string
): Promise<ImportResult> {
  try {
    return await withRetry(async () => {
      const supabaseClient = getSupabaseClient()
      
      // Call the Edge Function for CSV import
      const { data, error } = await supabaseClient.functions.invoke(`import-promoters-csv`, {
        body: {
          csvData,
          userId
        }
      })
      
      if (error) {
        throw new Error(`Error importing promoters: ${error.message}`)
      }
      
      return data
    })
  } catch (error: any) {
    throw new Error(`Failed to import promoters from CSV: ${error.message}`)
  }
}

/**
 * Fetch promoters with their active contract counts (legacy function for backward compatibility)
 */
export async function fetchPromotersWithContractCount(): Promise<Promoter[]> {
  try {
    return await withRetry(async () => {
      const supabaseClient = getSupabaseClient()
      // Fetch promoters
      const { data: promotersData, error: promotersError } = await supabaseClient
        .from("promoters")
        .select("*")
        .order("name_en")

      if (promotersError) {
        throw new Error(`Error fetching promoters: ${promotersError.message}`)
      }

      // Fetch contract counts for each promoter
      const enhancedData = await Promise.all(
        (promotersData || []).map(async (promoter) => {
          try {
            const { count: contractCount, error: contractError } = await supabaseClient
              .from("contracts")
              .select("*", { count: "exact", head: true })
              .eq("promoter_id", promoter.id)
              .eq("status", "active")

            if (contractError) {
              console.warn(`Error fetching contracts for promoter ${promoter.id}:`, contractError)
            }

            return {
              ...promoter,
              active_contracts_count: contractCount || 0
            }
          } catch (error) {
            console.warn(`Error processing promoter ${promoter.id}:`, error)
            return {
              ...promoter,
              active_contracts_count: 0
            }
          }
        })
      )

      return enhancedData
    })
  } catch (error: any) {
    throw new Error(`Failed to fetch promoters with contract count: ${error.message}`)
  }
}

/**
 * Delete multiple promoters by IDs
 */
export async function deletePromoters(promoterIds: string[]): Promise<void> {
  try {
    return await withRetry(async () => {
      const supabaseClient = getSupabaseClient()
      const { error } = await supabaseClient
        .from("promoters")
        .delete()
        .in("id", promoterIds)

      if (error) {
        throw new Error(`Error deleting promoters: ${error.message}`)
      }
    })
  } catch (error: any) {
    throw new Error(`Failed to delete promoters: ${error.message}`)
  }
}

/**
 * Update promoter status
 */
export async function updatePromoterStatus(
  promoterId: string, 
  status: string
): Promise<void> {
  try {
    return await withRetry(async () => {
      const supabaseClient = getSupabaseClient()
      const { error } = await supabaseClient
        .from("promoters")
        .update({ status })
        .eq("id", promoterId)

      if (error) {
        throw new Error(`Error updating promoter status: ${error.message}`)
      }
    })
  } catch (error: any) {
    throw new Error(`Failed to update promoter status: ${error.message}`)
  }
}

/**
 * Bulk update promoter statuses
 */
export async function bulkUpdatePromoterStatus(
  promoterIds: string[], 
  status: string
): Promise<void> {
  try {
    return await withRetry(async () => {
      const supabaseClient = getSupabaseClient()
      const { error } = await supabaseClient
        .from("promoters")
        .update({ status })
        .in("id", promoterIds)

      if (error) {
        throw new Error(`Error bulk updating promoter status: ${error.message}`)
      }
    })
  } catch (error: any) {
    throw new Error(`Failed to bulk update promoter status: ${error.message}`)
  }
}

/**
 * Get promoters with expiring documents
 */
export async function getPromotersWithExpiringDocuments(
  daysAhead: number = 30
): Promise<Promoter[]> {
  try {
    return await withRetry(async () => {
      const supabaseClient = getSupabaseClient()
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + daysAhead)
      
      const { data, error } = await supabaseClient
        .from("promoters")
        .select("*")
        .or(`id_card_expiry_date.lte.${futureDate.toISOString()},passport_expiry_date.lte.${futureDate.toISOString()}`)
        .order("id_card_expiry_date", { ascending: true })

      if (error) {
        throw new Error(`Error fetching promoters with expiring documents: ${error.message}`)
      }

      return data || []
    })
  } catch (error: any) {
    throw new Error(`Failed to get promoters with expiring documents: ${error.message}`)
  }
}

/**
 * Search promoters by text
 */
export async function searchPromoters(searchTerm: string): Promise<Promoter[]> {
  try {
    return await withRetry(async () => {
      const supabaseClient = getSupabaseClient()
      const { data, error } = await supabaseClient
        .from("promoters")
        .select("*")
        .or(`name_en.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%,id_card_number.ilike.%${searchTerm}%`)
        .order("name_en")

      if (error) {
        throw new Error(`Error searching promoters: ${error.message}`)
      }

      return data || []
    })
  } catch (error: any) {
    throw new Error(`Failed to search promoters: ${error.message}`)
  }
}

/**
 * Get promoter activity summary
 */
export async function getPromoterActivitySummary(promoterId: string) {
  return withRetry(async () => {
    const supabaseClient = getSupabaseClient()
    // Get contracts count
    const { count: contractsCount, error: contractsError } = await supabaseClient
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("promoter_id", promoterId)

    if (contractsError) {
      console.warn("Error fetching contracts count:", contractsError)
    }

    // Get recent contracts
    const { data: recentContracts, error: recentError } = await supabaseClient
      .from("contracts")
      .select("id, created_at, status, first_party_name_en, second_party_name_en")
      .eq("promoter_id", promoterId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (recentError) {
      console.warn("Error fetching recent contracts:", recentError)
    }

    return {
      contracts_count: contractsCount || 0,
      recent_contracts: recentContracts || [],
    }
  })
}

/**
 * Get promoter CV data (lazy loading)
 */
export async function getPromoterCVData(promoterId: string) {
  return withRetry(async () => {
    const supabaseClient = getSupabaseClient()
    
    // Fetch CV-related data only when needed
    const [skillsResult, experienceResult, educationResult, documentsResult] = await Promise.all([
      supabaseClient.from("promoter_skills").select("*").eq("promoter_id", promoterId),
      supabaseClient.from("promoter_experience").select("*").eq("promoter_id", promoterId).order("start_date", { ascending: false }),
      supabaseClient.from("promoter_education").select("*").eq("promoter_id", promoterId).order("year", { ascending: false }),
      supabaseClient.from("promoter_documents").select("*").eq("promoter_id", promoterId).order("uploaded_on", { ascending: false })
    ])
    
    return {
      skills: skillsResult.data || [],
      experience: experienceResult.data || [],
      education: educationResult.data || [],
      documents: documentsResult.data || []
    }
  })
}
