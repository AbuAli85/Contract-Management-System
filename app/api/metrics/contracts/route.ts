import { NextRequest, NextResponse } from 'next/server';
import { getContractMetrics } from '@/lib/metrics';
import { createClient } from '@/lib/supabase/server';
import { validateContractMetrics } from '@/lib/validation/metrics-validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/metrics/contracts
 * Returns comprehensive contract metrics using centralized service
 * SINGLE SOURCE OF TRUTH for contract counts across the application
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Metrics API: Starting request...');

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.warn('📊 Metrics API: User error:', userError.message);
    }

    // Get user role from users table (proper source)
    let userRole = 'user'; // default role

    if (user) {
      // Try profiles table first
      const { data: userData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role) {
        userRole = userData.role;
      } else {
        // Fallback to user_roles table
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleData?.role) {
          userRole = roleData.role;
        }
      }
    }

    console.log('📊 Metrics API: Calculating metrics for user:', {
      userId: user?.id,
      userRole,
      isAdmin: userRole === 'admin',
    });

    // ✅ COMPANY SCOPE: Get active company's party_id
    let partyId: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id')
        .eq('id', user.id)
        .single();

      if (profile?.active_company_id) {
        const { createAdminClient } = await import('@/lib/supabase/server');
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
    }

    // Get force refresh from query params
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Get companyId
    let companyId: string | null = null;
    if (user && !partyId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id')
        .eq('id', user.id)
        .single();
      companyId = profile?.active_company_id || null;
    }

    // Calculate metrics using centralized service with caching
    const metrics = await getContractMetrics({
      ...(user?.id && { userId: user.id }),
      userRole,
      companyId,
      partyId,
      includeExpiringSoon: true,
      expiryDaysThreshold: 30,
      forceRefresh,
    });

    const scope = userRole === 'admin' ? 'system-wide' : 'user-specific';
    const scopeLabel =
      userRole === 'admin' ? 'All contracts in system' : 'Your contracts only';

    // Validate metrics before returning
    const validation = validateContractMetrics(metrics);

    if (!validation.isValid) {
      console.error('📊 Metrics API: Validation failed:', validation.errors);
    }

    if (validation.warnings.length > 0) {
      console.warn('📊 Metrics API: Validation warnings:', validation.warnings);
    }

    console.log('📊 Metrics API: Metrics calculated successfully:', {
      total: metrics.total,
      active: metrics.active,
      pending: metrics.pending,
      scope,
      valid: validation.isValid,
    });

    return NextResponse.json({
      success: true,
      metrics,
      scope,
      scopeLabel,
      timestamp: new Date().toISOString(),
      cacheHit: !forceRefresh,
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
    });
  } catch (error) {
    console.error('📊 Metrics API: Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate contract metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
