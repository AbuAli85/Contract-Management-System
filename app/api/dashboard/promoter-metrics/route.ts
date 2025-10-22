import { NextRequest, NextResponse } from 'next/server';
import { getPromoterMetrics } from '@/lib/metrics';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/promoter-metrics
 * Returns promoter metrics using centralized service
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
      console.warn('Promoter metrics: User error:', userError.message);
    }

    // Get user role
    let userRole = 'user';
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role) {
        userRole = userData.role;
      }
    }

    // Get force refresh from query params
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Get promoter metrics
    const metrics = await getPromoterMetrics({
      ...(user?.id && { userId: user.id }),
      userRole,
      forceRefresh,
    });

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Promoter metrics error:', error);
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
