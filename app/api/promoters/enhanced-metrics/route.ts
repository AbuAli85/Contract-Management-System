/**
 * Enhanced Promoter Metrics API
 * GET /api/promoters/enhanced-metrics
 *
 * Returns comprehensive promoter workforce metrics with clear status categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEnhancedPromoterMetrics } from '@/lib/services/promoter-metrics.service';
import { validatePromoterMetrics } from '@/lib/validation/metrics-validation';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // ✅ COMPANY SCOPE: Get active company's party_id
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let partyId: string | null = null;

    if (user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('active_company_id')
          .eq('id', user.id)
          .single();
        if (profile?.active_company_id) {
          // Try to get party_id from companies table
          const { data: company } = await supabase
            .from('companies')
            .select('party_id')
            .eq('id', profile.active_company_id)
            .single();
          if (company?.party_id) {
            partyId = company.party_id;
          }
          // If no party_id in companies, try parties table directly
          if (!partyId) {
            const { data: party } = await supabase
              .from('parties')
              .select('id')
              .eq('company_id', profile.active_company_id)
              .limit(1)
              .single();
            if (party?.id) {
              partyId = party.id;
            }
          }
        }
      } catch (_) {
        // Non-critical: fall back to unfiltered query
      }
    }

    // Get force refresh from query params
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Get enhanced metrics (will be filtered by partyId in the service)
    const metrics = await getEnhancedPromoterMetrics(forceRefresh, partyId);

    // Validate metrics before returning
    const validation = validatePromoterMetrics(metrics);

    if (!validation.isValid) {
    }

    if (validation.warnings.length > 0) {
    }

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
      cached: !forceRefresh,
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch enhanced promoter metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
