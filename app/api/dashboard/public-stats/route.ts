import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  extractApiKey,
  validateApiKey,
} from '@/lib/api-key-auth';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/public-stats
 * Returns public platform statistics
 * Supports both public access (no auth) and API key authentication
 */
export async function GET(request: NextRequest) {
  // Check if API key is provided
  const apiKey = extractApiKey(request);

  // If API key is provided, validate it (but don't require it)
  if (apiKey) {
    const validation = await validateApiKey(apiKey);
    if (validation.isValid && validation.apiKey) {
      // API key is valid - return enhanced stats
      return getEnhancedStats(request, validation.apiKey);
    }
    // Invalid API key - continue with public stats
  }

  // No API key or invalid key - return basic public stats
  return getBasicStats(request);
}

async function getBasicStats(_request: NextRequest) {
  try {
    console.log('🔍 Public stats: Starting request...');

    const supabase = await createClient();

    console.log('🔍 Public stats: Fetching data without authentication...');

    // Simple queries without authentication
    const queries = [
      // Total contracts
      supabase.from('contracts').select('*', { count: 'exact', head: true }),

      // Total promoters
      supabase.from('promoters').select('*', { count: 'exact', head: true }),

      // Total parties
      supabase.from('parties').select('*', { count: 'exact', head: true }),
    ];

    console.log('🔍 Public stats: Executing queries...');
    const results = await Promise.all(
      queries.map(async (query, index) => {
        try {
          const result = await query;
          console.log(`🔍 Public stats: Query ${index} result:`, {
            count: result.count,
            error: result.error?.message,
          });
          return result;
        } catch (error) {
          console.error(`🔍 Public stats: Query ${index} failed:`, error);
          return {
            count: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    // Extract results with null safety
    const contractsResult = results[0] || { count: 0 };
    const promotersResult = results[1] || { count: 0 };
    const partiesResult = results[2] || { count: 0 };

    // Check for errors
    const errors = results
      .filter((r: any) => r?.error)
      .map((r: any) => r.error);
    if (errors.length > 0) {
      console.warn('🔍 Public stats: Some database errors:', errors);
    }

    // Build simple stats object
    const stats = {
      totalContracts: contractsResult?.count || 0,
      totalPromoters: promotersResult?.count || 0,
      totalParties: partiesResult?.count || 0,
      debug: {
        queryErrors: errors,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('🔍 Public stats: Final stats:', stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('🔍 Public stats: Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch public statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          timestamp: new Date().toISOString(),
          errorType:
            error instanceof Error ? error.constructor.name : 'Unknown',
        },
      },
      { status: 500 }
    );
  }
}

async function getEnhancedStats(request: NextRequest, apiKey: any) {
  try {
    console.log('🔍 Enhanced stats: Starting request with API key...');

    const supabase = await createClient();

    // Get more detailed stats for authenticated API keys
    const queries = [
      // Total contracts
      supabase.from('contracts').select('*', { count: 'exact', head: true }),
      // Active contracts
      supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      // Pending contracts
      supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      // Total promoters
      supabase.from('promoters').select('*', { count: 'exact', head: true }),
      // Active promoters
      supabase
        .from('promoters')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      // Total parties
      supabase.from('parties').select('*', { count: 'exact', head: true }),
    ];

    const results = await Promise.all(
      queries.map(async (query, index) => {
        try {
          const result = await query;
          return result;
        } catch (error) {
          console.error(`🔍 Enhanced stats: Query ${index} failed:`, error);
          return {
            count: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    // Extract results with null safety
    const contractsResult = results[0] || { count: 0 };
    const activeContractsResult = results[1] || { count: 0 };
    const pendingContractsResult = results[2] || { count: 0 };
    const promotersResult = results[3] || { count: 0 };
    const activePromotersResult = results[4] || { count: 0 };
    const partiesResult = results[5] || { count: 0 };

    // Build enhanced stats object
    const stats = {
      totalContracts: contractsResult?.count || 0,
      activeContracts: activeContractsResult?.count || 0,
      pendingContracts: pendingContractsResult?.count || 0,
      totalPromoters: promotersResult?.count || 0,
      activePromoters: activePromotersResult?.count || 0,
      totalParties: partiesResult?.count || 0,
      apiKey: {
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('🔍 Enhanced stats: Final stats:', stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('🔍 Enhanced stats: Unexpected error:', error);
    // Fallback to basic stats on error
    return getBasicStats(request);
  }
}
