import { NextRequest, NextResponse } from 'next/server';
import { getContractMetrics } from '@/lib/metrics/contracts';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/metrics/contracts
 * Returns comprehensive contract metrics
 * Ensures consistent data across Dashboard and Contracts pages
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

    // Get user role (you may need to adjust this based on your user profile structure)
    let userRole = 'user'; // default role
    
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role) {
        userRole = profile.role;
      }
    }

    console.log('📊 Metrics API: Calculating metrics for user:', {
      userId: user?.id,
      userRole,
    });

    // Calculate metrics using centralized function
    const metrics = await getContractMetrics({
      ...(user?.id && { userId: user.id }), // Only include userId if it exists
      userRole,
      includeExpiringSoon: true,
      expiryDaysThreshold: 30,
    });

    console.log('📊 Metrics API: Metrics calculated successfully:', {
      total: metrics.total,
      active: metrics.active,
      pending: metrics.pending,
    });

    return NextResponse.json({
      success: true,
      metrics,
      scope: userRole === 'admin' ? 'system-wide' : 'user-specific',
      timestamp: new Date().toISOString(),
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

