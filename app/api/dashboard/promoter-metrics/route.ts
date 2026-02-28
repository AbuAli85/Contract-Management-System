import { NextRequest, NextResponse } from 'next/server';
import { getEnhancedPromoterMetrics } from '@/lib/services/promoter-metrics.service';
import { createClient } from '@/lib/supabase/server';
import { resolveActiveCompanyToPartyId } from '@/lib/company-scope';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/promoter-metrics
 * Returns promoter metrics using centralized service (company-scoped)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ COMPANY SCOPE: Get active company's party_id (handles company + party-as-company)
    const partyId = await resolveActiveCompanyToPartyId(supabase, user.id);

    // Get force refresh from query params
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // ✅ COMPANY SCOPE: Get promoter metrics filtered by company
    const enhancedMetrics = await getEnhancedPromoterMetrics(
      forceRefresh,
      partyId
    );

    // Transform to match expected format
    // active = activeOnContracts + availableForWork (all active promoters)
    const activeCount =
      (enhancedMetrics.activeOnContracts || 0) +
      (enhancedMetrics.availableForWork || 0);

    const metrics = {
      total: enhancedMetrics.totalWorkforce || 0,
      active: activeCount,
      critical: enhancedMetrics.expiredDocuments || 0, // Includes missing docs (fixed in service)
      expiring: enhancedMetrics.expiringDocuments || 0,
      unassigned: enhancedMetrics.availableForWork || 0, // Promoters available (not on contract)
      complianceRate: enhancedMetrics.complianceRate || 0,
    };

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch promoter metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
