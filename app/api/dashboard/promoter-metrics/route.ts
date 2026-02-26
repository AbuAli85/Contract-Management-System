import { NextRequest, NextResponse } from 'next/server';
import { getEnhancedPromoterMetrics } from '@/lib/services/promoter-metrics.service';
import { createClient, createAdminClient } from '@/lib/supabase/server';

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

    // ✅ COMPANY SCOPE: Get active company's party_id
    let partyId: string | null = null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (profile?.active_company_id) {
      // Get company's party_id
      let adminClient;
      try {
        adminClient = createAdminClient();
      } catch (e) {
        adminClient = supabase;
      }

      const { data: company } = await adminClient
        .from('companies')
        .select('party_id')
        .eq('id', profile.active_company_id)
        .single();

      if (company?.party_id) {
        partyId = company.party_id;
      }
    }

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
