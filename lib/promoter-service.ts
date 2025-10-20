import { createClient } from '@/lib/supabase/client';
import type { Promoter } from '@/lib/types';

// Enhanced type definitions for better type safety
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  error?: ServiceError;
}

export interface ServiceError {
  message: string;
  code?: string;
  details?: any;
  retryable: boolean;
}

export interface PromoterFilters {
  status?: string;
  documentStatus?: string;
  hasContracts?: boolean;
  overallStatus?: string;
  workLocation?: string;
}

export interface PromoterAnalyticsFilters {
  status?: string;
  overallStatus?: string;
  workLocation?: string;
}

export interface PromoterPerformanceStats {
  total_promoters: number;
  active_promoters: number;
  inactive_promoters: number;
  critical_status_count: number;
  warning_status_count: number;
  total_contracts: number;
  total_contract_value: number;
  avg_contract_duration: number;
  avg_completion_rate: number;
  expiring_documents_count: number;
  expired_documents_count: number;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  total: number;
}

// Retry configuration with enhanced type safety
const RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
};

// Enhanced retry helper with better error handling
async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on the last attempt
      if (attempt === finalConfig.maxAttempts) {
        throw lastError;
      }

      // Check if error is retryable
      const isRetryable = isRetryableError(error);
      if (!isRetryable) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(2, attempt - 1),
        finalConfig.maxDelay
      );

      console.log(`Retry attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Check if an error is retryable
function isRetryableError(error: any): boolean {
  if (!error) return false;

  // Network errors are retryable
  if (
    error.message?.includes('network') ||
    error.message?.includes('timeout')
  ) {
    return true;
  }

  // Supabase connection errors are retryable
  if (error.code === 'PGRST301' || error.code === 'PGRST302') {
    return true;
  }

  // Rate limiting errors are retryable
  if (error.status === 429 || error.status === 503) {
    return true;
  }

  return false;
}

// Create Supabase client
function createSupabaseClient() {
  try {
    return createClient();
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw new Error('Database connection failed');
  }
}

// Fetch promoters with pagination
export async function fetchPromotersWithPagination(
  page: number = 1,
  limit: number = 10,
  filters?: PromoterFilters
): Promise<PaginatedResult<Promoter>> {
  try {
    const supabase = createSupabaseClient();
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase.from('promoters').select('*', { count: 'exact' });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.workLocation) {
      query = query.eq('work_location', filters.workLocation);
    }

    // Execute query with pagination
    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data || [],
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  } catch (error) {
    console.error('Error fetching promoters:', error);
    return {
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'FETCH_ERROR',
        retryable: isRetryableError(error),
      },
    };
  }
}

// Fetch promoter by ID
export async function fetchPromoterById(id: string): Promise<Promoter | null> {
  try {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('promoters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching promoter ${id}:`, error);
    return null;
  }
}

// Create new promoter
export async function createPromoter(
  promoterData: Partial<Promoter>
): Promise<Promoter | null> {
  try {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('promoters')
      .insert(promoterData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating promoter:', error);
    return null;
  }
}

// Update promoter
export async function updatePromoter(
  id: string,
  updates: Partial<Promoter>
): Promise<Promoter | null> {
  try {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('promoters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Error updating promoter ${id}:`, error);
    return null;
  }
}

// Delete promoter
export async function deletePromoter(id: string): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();

    const { error } = await supabase.from('promoters').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error(`Error deleting promoter ${id}:`, error);
    return false;
  }
}

// Search promoters
export async function searchPromoters(
  searchTerm: string,
  filters?: PromoterFilters
): Promise<Promoter[]> {
  try {
    if (!searchTerm?.trim()) {
      return [];
    }

    const supabase = createSupabaseClient();

    let query = supabase
      .from('promoters')
      .select('*')
      .or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
      );

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.workLocation) {
      query = query.eq('work_location', filters.workLocation);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error searching promoters:', error);
    return [];
  }
}

// Get promoter performance statistics
export async function getPromoterPerformanceStats(
  filters?: PromoterAnalyticsFilters
): Promise<{ data: PromoterPerformanceStats | null; error: string | null }> {
  try {
    const supabase = createSupabaseClient();

    // Build base query
    let query = supabase.from('promoters').select('*');

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.workLocation) {
      query = query.eq('work_location', filters.workLocation);
    }

    const { data: promoters, error } = await query;

    if (error) {
      throw error;
    }

    if (!promoters) {
      return { data: null, error: 'No promoters found' };
    }

    // Calculate statistics
    const stats: PromoterPerformanceStats = {
      total_promoters: promoters.length,
      active_promoters: promoters.filter(p => p.status === 'active').length,
      inactive_promoters: promoters.filter(p => p.status === 'inactive').length,
      critical_status_count: promoters.filter(
        p => p.overall_status === 'critical'
      ).length,
      warning_status_count: promoters.filter(
        p => p.overall_status === 'warning'
      ).length,
      total_contracts: 0, // This would need to be calculated from contracts table
      total_contract_value: 0, // This would need to be calculated from contracts table
      avg_contract_duration: 0, // This would need to be calculated from contracts table
      avg_completion_rate: 0, // This would need to be calculated from contracts table
      expiring_documents_count: 0, // This would need to be calculated from documents table
      expired_documents_count: 0, // This would need to be calculated from documents table
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error getting promoter performance stats:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export promoters to CSV
export async function exportPromotersToCSV(
  filters?: PromoterFilters
): Promise<string> {
  try {
    const supabase = createSupabaseClient();

    let query = supabase.from('promoters').select('*');

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.workLocation) {
      query = query.eq('work_location', filters.workLocation);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return '';
    }

    // Convert to CSV
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(promoter =>
      Object.values(promoter)
        .map(value =>
          typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value
        )
        .join(',')
    );

    return [headers, ...rows].join('\n');
  } catch (error) {
    console.error('Error exporting promoters to CSV:', error);
    throw new Error(
      `Failed to export promoters to CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Import promoters from CSV
export async function importPromotersFromCSV(
  csvData: string
): Promise<ImportResult> {
  try {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const dataRows = lines.slice(1);

    const promoters: Partial<Promoter>[] = [];
    const errors: string[] = [];

    dataRows.forEach((row, index) => {
      try {
        const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const promoter: any = {};

        headers.forEach((header, i) => {
          if (values[i] !== undefined) {
            promoter[header] = values[i];
          }
        });

        // Basic validation
        if (!promoter.email || !promoter.first_name || !promoter.last_name) {
          errors.push(
            `Row ${index + 2}: Missing required fields (email, first_name, last_name)`
          );
          return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(promoter.email)) {
          errors.push(`Row ${index + 2}: Invalid email format`);
          return;
        }

        promoters.push(promoter);
      } catch (rowError) {
        errors.push(
          `Row ${index + 2}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`
        );
      }
    });

    if (promoters.length === 0) {
      throw new Error('No valid promoters found in CSV');
    }

    // Insert promoters into database
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('promoters')
      .insert(promoters)
      .select();

    if (error) {
      throw error;
    }

    return {
      success: true,
      imported: data?.length || 0,
      errors,
      total: promoters.length,
    };
  } catch (error) {
    console.error('Error importing promoters from CSV:', error);
    throw new Error(
      `Failed to import promoters from CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Get promoter CV data
export async function getPromoterCVData(promoterId: string) {
  try {
    const supabase = createSupabaseClient();

    // Fetch all CV-related data in parallel
    const [skillsResult, experienceResult, educationResult] = await Promise.all(
      [
        supabase
          .from('promoter_skills')
          .select('*')
          .eq('promoter_id', promoterId),
        supabase
          .from('promoter_experience')
          .select('*')
          .eq('promoter_id', promoterId)
          .order('start_date', { ascending: false }),
        supabase
          .from('promoter_education')
          .select('*')
          .eq('promoter_id', promoterId)
          .order('start_date', { ascending: false }),
      ]
    );

    // Check for errors
    if (skillsResult.error) throw skillsResult.error;
    if (experienceResult.error) throw experienceResult.error;
    if (educationResult.error) throw educationResult.error;

    return {
      skills: skillsResult.data || [],
      experience: experienceResult.data || [],
      education: educationResult.data || [],
    };
  } catch (error) {
    console.error(`Error fetching CV data for promoter ${promoterId}:`, error);
    throw error;
  }
}

// Fetch promoter analytics
export async function fetchPromotersAnalytics(
  filters: PromoterAnalyticsFilters = {}
): Promise<{ data: PromoterPerformanceStats; error: ServiceError | null }> {
  try {
    const supabase = createSupabaseClient();

    // Build query based on filters
    let query = supabase.from('promoters').select('*');

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.overallStatus) {
      query = query.eq('overall_status', filters.overallStatus);
    }
    if (filters.workLocation) {
      query = query.eq('work_location', filters.workLocation);
    }

    const { data: promoters, error } = await query;

    if (error) {
      return {
        data: {
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
          expired_documents_count: 0,
        },
        error: {
          message: error.message,
          code: error.code || 'ANALYTICS_ERROR',
          details: error,
          retryable: true,
        },
      };
    }

    // Calculate analytics
    const totalPromoters = promoters?.length || 0;
    const activePromoters =
      promoters?.filter(p => p.status === 'active').length || 0;
    const inactivePromoters =
      promoters?.filter(p => p.status === 'inactive').length || 0;
    const criticalStatusCount =
      promoters?.filter(p => p.overall_status === 'critical').length || 0;
    const warningStatusCount =
      promoters?.filter(p => p.overall_status === 'warning').length || 0;

    // Mock contract data for now (in real implementation, this would come from contracts table)
    const totalContracts = 150;
    const totalContractValue = 5000000;
    const avgContractDuration = 180;
    const avgCompletionRate = 0.85;
    const expiringDocumentsCount = 25;
    const expiredDocumentsCount = 5;

    return {
      data: {
        total_promoters: totalPromoters,
        active_promoters: activePromoters,
        inactive_promoters: inactivePromoters,
        critical_status_count: criticalStatusCount,
        warning_status_count: warningStatusCount,
        total_contracts: totalContracts,
        total_contract_value: totalContractValue,
        avg_contract_duration: avgContractDuration,
        avg_completion_rate: avgCompletionRate,
        expiring_documents_count: expiringDocumentsCount,
        expired_documents_count: expiredDocumentsCount,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching promoter analytics:', error);
    return {
      data: {
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
        expired_documents_count: 0,
      },
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'ANALYTICS_ERROR',
        details: error,
        retryable: true,
      },
    };
  }
}

// Get promoter individual performance stats
export async function getPromoterIndividualPerformanceStats(
  promoterId: string
): Promise<{ data: any; error: ServiceError | null }> {
  try {
    const supabase = createSupabaseClient();

    // Fetch performance data
    const { data: performance, error } = await supabase
      .from('promoter_performance')
      .select('*')
      .eq('promoter_id', promoterId)
      .order('metric_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code || 'PERFORMANCE_ERROR',
          details: error,
          retryable: true,
        },
      };
    }

    // Mock performance data for now
    const mockPerformance = {
      total_contracts: 50,
      success_rate: 0.9,
      total_earnings: 50000,
      average_rating: 4.5,
      on_time_delivery_rate: 95.0,
      customer_satisfaction_score: 8.5,
    };

    return {
      data: mockPerformance,
      error: null,
    };
  } catch (error) {
    console.error(
      `Error fetching performance stats for promoter ${promoterId}:`,
      error
    );
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'PERFORMANCE_ERROR',
        details: error,
        retryable: true,
      },
    };
  }
}
