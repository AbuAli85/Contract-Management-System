import { NextRequest, NextResponse } from 'next/server';
import {
  runFullDataIntegrityCheck,
  validateMetrics,
  getDashboardMetrics,
} from '@/lib/metrics';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/metrics/validate
 * Runs comprehensive data integrity checks and returns validation report
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role - only admins can run full checks
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = userData?.role || 'user';

    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can run data integrity checks' },
        { status: 403 }
      );
    }

    // Run full data integrity check
    const report = await runFullDataIntegrityCheck();

    // Log results
    console.log('📊 Data Integrity Check:', {
      status: report.overallStatus,
      errors: report.metricsValidation.errors.length,
      warnings: report.metricsValidation.warnings.length,
      checks: report.consistencyChecks.length,
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error running data integrity check:', error);
    return NextResponse.json(
      {
        error: 'Failed to run data integrity check',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/metrics/validate
 * Validates specific metrics provided in the request body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metrics } = body;

    if (!metrics) {
      return NextResponse.json(
        { error: 'Metrics data required' },
        { status: 400 }
      );
    }

    // Validate the provided metrics
    const validation = validateMetrics(metrics);

    return NextResponse.json({
      success: true,
      validation,
    });
  } catch (error) {
    console.error('Error validating metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to validate metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

