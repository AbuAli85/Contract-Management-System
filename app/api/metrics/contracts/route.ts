import { NextRequest, NextResponse } from 'next/server';
import { getContractMetrics } from '@/lib/metrics';
import { createClient } from '@/lib/supabase/server';

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
      // Try users table first
      const { data: userData } = await supabase
        .from('users')
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

    // Get force refresh from query params
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Calculate metrics using centralized service with caching
    const metrics = await getContractMetrics({
      ...(user?.id && { userId: user.id }),
      userRole,
      includeExpiringSoon: true,
      expiryDaysThreshold: 30,
      forceRefresh,
    });

    const scope = userRole === 'admin' ? 'system-wide' : 'user-specific';
    const scopeLabel = userRole === 'admin' 
      ? 'All contracts in system' 
      : 'Your contracts only';

    console.log('📊 Metrics API: Metrics calculated successfully:', {
      total: metrics.total,
      active: metrics.active,
      pending: metrics.pending,
      scope,
    });

    return NextResponse.json({
      success: true,
      metrics,
      scope,
      scopeLabel,
      timestamp: new Date().toISOString(),
      cacheHit: !forceRefresh,
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

