import { NextRequest, NextResponse } from 'next/server';
import { getDashboardMetrics } from '@/lib/metrics';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics using centralized metrics service
 * CONSISTENT with all other pages in the application
 */
export async function GET(request: NextRequest) {
  try {

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
    }

    // Get user role
    let userRole = 'user';
    if (user) {
      const { data: userData, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (roleError) {
      }

      if (userData?.role) {
        userRole = userData.role;
      }
    }


    // Get force refresh from query params
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Get all metrics using centralized service
    const metrics = await getDashboardMetrics({
      ...(user?.id && { userId: user.id }),
      userRole,
      forceRefresh,
    });

    // Get previous month metrics for growth calculations
    const now = new Date();
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const previousMetrics = await getDashboardMetrics({
      ...(user?.id && { userId: user.id }),
      userRole,
      forceRefresh: true, // Always get fresh data for comparison
      dateRange: {
        start: previousMonthStart,
        end: previousMonthEnd,
      },
    }).catch(error => {
      return null;
    });

    // Build stats object compatible with existing dashboard
    const stats = {
      // Core metrics from centralized service
      totalContracts: metrics.contracts.total,
      activeContracts: metrics.contracts.active,
      pendingContracts: metrics.contracts.pending,
      completedContracts: metrics.contracts.completed,
      totalPromoters: metrics.promoters.total,
      activePromoters: metrics.promoters.active,
      totalParties: metrics.parties.total,
      pendingApprovals: metrics.contracts.pending,
      recentActivity: (metrics.contracts as any).recentlyUpdated ?? 0,

      // Status breakdown
      contractsByStatus: metrics.contracts.byStatus,

      // Expiring contracts
      expiringDocuments: metrics.contracts.expiringSoon,

      // Scope information
      scope: metrics.scope,
      scopeLabel: metrics.scopeLabel,

      // Metadata
      timestamp: metrics.timestamp,
      cacheHit: !forceRefresh,

      // Previous month data for growth calculations
      previousMonth: previousMetrics
        ? {
            totalContracts: previousMetrics.contracts.total,
            activeContracts: previousMetrics.contracts.active,
            pendingContracts: previousMetrics.contracts.pending,
            completedContracts: previousMetrics.contracts.completed,
            totalPromoters: previousMetrics.promoters.total,
            activePromoters: previousMetrics.promoters.active,
          }
        : null,

      // Debug info
      debug: {
        userAuthenticated: !!user,
        userRole,
        isAdmin: userRole === 'admin',
        scope: metrics.scope,
        timestamp: new Date().toISOString(),
      },
    };


    return NextResponse.json(stats);
  } catch (error) {

    // Handle different error types
    let errorMessage = 'Unknown error';
    let errorType = 'Unknown';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorType = error.constructor.name;
    } else if (error && typeof error === 'object') {
      // Handle Supabase error objects
      errorMessage = (error as any).message || JSON.stringify(error);
      errorType = 'SupabaseError';
    } else if (typeof error === 'string') {
      errorMessage = error;
      errorType = 'StringError';
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard statistics',
        details: errorMessage,
        debug: {
          timestamp: new Date().toISOString(),
          errorType,
          fullError: process.env.NODE_ENV === 'development' ? error : undefined,
        },
      },
      { status: 500 }
    );
  }
}
