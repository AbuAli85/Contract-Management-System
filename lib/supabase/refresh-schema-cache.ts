import { createClient } from '@/lib/supabase/client';

/**
 * Force refresh the Supabase client schema cache
 * This helps resolve schema cache issues when the database is correct but client cache is stale
 */
export async function refreshSupabaseSchemaCache() {
  try {
    const supabase = createClient();

    // Step 1: Force a query to refresh the cache
    const { data: promoters, error: promotersError } = await supabase
      .from('promoters')
      .select(
        'id, name_en, employer_id, outsourced_to_id, job_title, work_location, contract_valid_until, notify_days_before_contract_expiry'
      )
      .limit(1);

    if (promotersError) {
      console.error('❌ Error querying promoters table:', promotersError);
      return { success: false, error: promotersError };
    }

    // Step 2: Test foreign key relationships
    const { data: relationships, error: relationshipsError } = await supabase
      .from('promoters')
      .select(
        `
        id,
        name_en,
        employer_id,
        parties!promoters_employer_id_fkey(name)
      `
      )
      .limit(1);

    if (relationshipsError) {
      console.error(
        '❌ Error testing foreign key relationships:',
        relationshipsError
      );
      return { success: false, error: relationshipsError };
    }

    // Step 3: Test all columns to ensure cache is refreshed
    const { data: allColumns, error: allColumnsError } = await supabase
      .from('promoters')
      .select('*')
      .limit(1);

    if (allColumnsError) {
      console.error('❌ Error testing all columns:', allColumnsError);
      return { success: false, error: allColumnsError };
    }

    return {
      success: true,
      data: {
        promoters,
        relationships,
        allColumns,
      },
    };
  } catch (error) {
    console.error('❌ Error refreshing schema cache:', error);
    return { success: false, error };
  }
}

/**
 * Check if the schema cache is working correctly
 */
export async function checkSchemaCacheStatus() {
  try {
    const supabase = createClient();

    // Test if employer_id column is accessible
    const { data, error } = await supabase
      .from('promoters')
      .select('employer_id')
      .limit(1);

    if (error) {
      console.error('❌ Schema cache issue detected:', error);
      return {
        status: 'error',
        error: error.message,
        needsRefresh: true,
      };
    }

    return {
      status: 'ok',
      data,
      needsRefresh: false,
    };
  } catch (error) {
    console.error('❌ Error checking schema cache:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      needsRefresh: true,
    };
  }
}

/**
 * Comprehensive schema cache refresh with retry logic
 */
export async function refreshSchemaCacheWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await refreshSupabaseSchemaCache();

    if (result.success) {
      return result;
    }

    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.error(`❌ Schema cache refresh failed after ${maxRetries} attempts`);
  return { success: false, error: 'Max retries exceeded' };
}
