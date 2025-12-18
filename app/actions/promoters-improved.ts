/**
 * Improved Promoter Actions
 *
 * Enhanced server actions with:
 * - Granular cache invalidation using tags
 * - Better error handling with detailed responses
 * - Bulk operations support
 * - Manual cache revalidation option
 * - Structured response types
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import type { Promoter } from '@/lib/types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BulkResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: Array<{ id: string; error: string }>;
}

// ============================================================================
// CACHE TAGS
// ============================================================================
// These tags allow granular cache invalidation

const CACHE_TAGS = {
  PROMOTERS_LIST: 'promoters-list',
  PROMOTERS_COUNT: 'promoters-count',
  PROMOTERS_ANALYTICS: 'promoters-analytics',
  getPromoterDetail: (id: string) => `promoter-${id}`,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Invalidate all promoter-related caches
 */
function invalidateAllPromoterCaches() {
  revalidateTag(CACHE_TAGS.PROMOTERS_LIST);
  revalidateTag(CACHE_TAGS.PROMOTERS_COUNT);
  revalidateTag(CACHE_TAGS.PROMOTERS_ANALYTICS);
  revalidatePath('/manage-promoters');
  revalidatePath('/dashboard');
}

/**
 * Invalidate specific promoter detail cache
 */
function invalidatePromoterDetail(promoterId: string) {
  revalidateTag(CACHE_TAGS.getPromoterDetail(promoterId));
  revalidatePath(`/manage-promoters/${promoterId}`);
}

/**
 * Invalidate list and count caches (but not analytics)
 */
function invalidateListCaches() {
  revalidateTag(CACHE_TAGS.PROMOTERS_LIST);
  revalidateTag(CACHE_TAGS.PROMOTERS_COUNT);
  revalidatePath('/manage-promoters');
}

/**
 * Invalidate analytics cache
 */
function invalidateAnalytics() {
  revalidateTag(CACHE_TAGS.PROMOTERS_ANALYTICS);
  revalidatePath('/dashboard');
}

// ============================================================================
// READ ACTIONS
// ============================================================================

/**
 * Get all promoters with optional filtering
 */
export async function getPromoters(filters?: {
  status?: string;
  employerId?: string;
  workLocation?: string;
}): Promise<ActionResult<Promoter[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('promoters')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters if provided
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.employerId) {
      query = query.eq('employer_id', filters.employerId);
    }
    if (filters?.workLocation) {
      query = query.eq('work_location', filters.workLocation);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching promoters:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch promoters',
      };
    }

    return {
      success: true,
      data: data || [],
      message: `Retrieved ${data?.length || 0} promoters`,
    };
  } catch (error) {
    console.error('Unexpected error fetching promoters:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to fetch promoters',
    };
  }
}

/**
 * Get a single promoter by ID
 */
export async function getPromoterById(
  id: string
): Promise<ActionResult<Promoter>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('promoters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching promoter:', error);
      return {
        success: false,
        error: error.message,
        message: 'Promoter not found',
      };
    }

    return {
      success: true,
      data,
      message: 'Promoter retrieved successfully',
    };
  } catch (error) {
    console.error('Unexpected error fetching promoter:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to fetch promoter',
    };
  }
}

/**
 * Get promoters count
 */
export async function getPromotersCount(filters?: {
  status?: string;
  employerId?: string;
}): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.employerId) {
      query = query.eq('employer_id', filters.employerId);
    }

    const { count, error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to count promoters',
      };
    }

    return {
      success: true,
      data: count || 0,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to count promoters',
    };
  }
}

// ============================================================================
// CREATE ACTION
// ============================================================================

/**
 * Create a new promoter with proper cache invalidation
 */
export async function createPromoter(
  promoterData: Omit<Promoter, 'id' | 'created_at'>
): Promise<ActionResult<Promoter>> {
  try {
    const supabase = await createClient();

    // Validate required fields
    if (!promoterData.name_en && !promoterData.name_ar) {
      return {
        success: false,
        error: 'Name is required',
        message: 'Please provide promoter name (English or Arabic)',
      };
    }

    const { data, error } = await supabase
      .from('promoters')
      .insert(promoterData)
      .select()
      .single();

    if (error) {
      console.error('Error creating promoter:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create promoter',
      };
    }

    // Invalidate list, count, and analytics caches
    invalidateListCaches();
    invalidateAnalytics();

    return {
      success: true,
      data,
      message: 'Promoter created successfully',
    };
  } catch (error) {
    console.error('Unexpected error creating promoter:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create promoter',
    };
  }
}

// ============================================================================
// UPDATE ACTION
// ============================================================================

/**
 * Update an existing promoter with granular cache invalidation
 */
export async function updatePromoter(
  id: string,
  promoterData: Partial<Promoter>,
  options?: {
    invalidateAnalytics?: boolean; // Set to false if changes don't affect analytics
  }
): Promise<ActionResult<Promoter>> {
  try {
    const supabase = await createClient();

    // Convert date strings to proper format for database
    const updateData: Record<string, any> = { ...promoterData };

    // Convert ISO date strings to date format for date fields
    const dateFields = [
      'id_card_expiry_date',
      'passport_expiry_date',
      'visa_expiry_date',
      'work_permit_expiry_date',
      'date_of_birth',
    ];

    for (const field of dateFields) {
      if (updateData[field]) {
        if (typeof updateData[field] === 'string') {
          const date = new Date(updateData[field]);
          if (!isNaN(date.getTime())) {
            updateData[field] = date.toISOString().split('T')[0];
          } else {
            delete updateData[field];
          }
        } else if (updateData[field] instanceof Date) {
          updateData[field] = updateData[field].toISOString().split('T')[0];
        }
      }
    }

    // Remove null/undefined values to avoid constraint issues
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === null || updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabase
      .from('promoters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating promoter:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update promoter',
      };
    }

    // Always invalidate list and detail caches
    invalidateListCaches();
    invalidatePromoterDetail(id);

    // Optionally invalidate analytics (e.g., if status or document dates changed)
    if (options?.invalidateAnalytics !== false) {
      // Check if any analytics-relevant fields were updated
      const analyticsFields = [
        'status',
        'id_card_expiry_date',
        'passport_expiry_date',
        'work_location',
        'employer_id',
      ];

      const affectsAnalytics = analyticsFields.some(
        field => field in promoterData
      );

      if (affectsAnalytics) {
        invalidateAnalytics();
      }
    }

    return {
      success: true,
      data,
      message: 'Promoter updated successfully',
    };
  } catch (error) {
    console.error('Unexpected error updating promoter:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to update promoter',
    };
  }
}

// ============================================================================
// DELETE ACTION
// ============================================================================

/**
 * Delete a promoter with comprehensive cache invalidation
 */
export async function deletePromoter(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('promoters').delete().eq('id', id);

    if (error) {
      console.error('Error deleting promoter:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete promoter',
      };
    }

    // Invalidate all caches since deletion affects counts and analytics
    invalidateAllPromoterCaches();
    invalidatePromoterDetail(id);

    return {
      success: true,
      message: 'Promoter deleted successfully',
    };
  } catch (error) {
    console.error('Unexpected error deleting promoter:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to delete promoter',
    };
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk update promoters (e.g., assign to employer, change status)
 */
export async function bulkUpdatePromoters(
  promoterIds: string[],
  updateData: Partial<Promoter>
): Promise<BulkResult> {
  const errors: Array<{ id: string; error: string }> = [];
  let successCount = 0;
  let failureCount = 0;

  for (const id of promoterIds) {
    const result = await updatePromoter(id, updateData, {
      invalidateAnalytics: false, // We'll invalidate once at the end
    });

    if (result.success) {
      successCount++;
    } else {
      failureCount++;
      errors.push({ id, error: result.error || 'Unknown error' });
    }
  }

  // Invalidate analytics once after all updates
  if (successCount > 0) {
    invalidateAnalytics();
  }

  return {
    success: successCount > 0,
    successCount,
    failureCount,
    errors,
  };
}

/**
 * Bulk delete promoters
 */
export async function bulkDeletePromoters(
  promoterIds: string[]
): Promise<BulkResult> {
  const errors: Array<{ id: string; error: string }> = [];
  let successCount = 0;
  let failureCount = 0;

  for (const id of promoterIds) {
    const result = await deletePromoter(id);

    if (result.success) {
      successCount++;
    } else {
      failureCount++;
      errors.push({ id, error: result.error || 'Unknown error' });
    }
  }

  // Invalidate all caches once after all deletions
  if (successCount > 0) {
    invalidateAllPromoterCaches();
  }

  return {
    success: successCount > 0,
    successCount,
    failureCount,
    errors,
  };
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Manually revalidate all promoter caches
 * Useful for admin operations or after bulk external updates
 */
export async function revalidateAllPromoterCaches(): Promise<
  ActionResult<void>
> {
  try {
    invalidateAllPromoterCaches();

    return {
      success: true,
      message: 'All promoter caches revalidated successfully',
    };
  } catch (error) {
    console.error('Error revalidating caches:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to revalidate caches',
    };
  }
}

/**
 * Revalidate specific promoter cache
 */
export async function revalidatePromoterCache(
  promoterId: string
): Promise<ActionResult<void>> {
  try {
    invalidatePromoterDetail(promoterId);

    return {
      success: true,
      message: 'Promoter cache revalidated successfully',
    };
  } catch (error) {
    console.error('Error revalidating promoter cache:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to revalidate promoter cache',
    };
  }
}
