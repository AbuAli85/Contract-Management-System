/**
 * Enhanced Promoter Metrics API
 * GET /api/promoters/enhanced-metrics
 * 
 * Returns comprehensive promoter workforce metrics with clear status categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEnhancedPromoterMetrics } from '@/lib/services/promoter-metrics.service';
import { validatePromoterMetrics } from '@/lib/validation/metrics-validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Get force refresh from query params
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Get enhanced metrics
    const metrics = await getEnhancedPromoterMetrics(forceRefresh);

    // Validate metrics before returning
    const validation = validatePromoterMetrics(metrics);
    
    if (!validation.isValid) {
      console.error('❌ Promoter metrics validation failed:', validation.errors);
    }
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Promoter metrics validation warnings:', validation.warnings);
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
    console.error('❌ Enhanced promoter metrics error:', error);
    
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

