/**
 * Cron Job: Generate Contract Alerts
 * Run daily to create expiry, renewal, and obligation alerts
 *
 * Configure in Vercel:
 * - Add CRON_SECRET to environment variables
 * - Set up cron trigger: 0 9 * * * (daily at 9 AM)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ContractAlertsService } from '@/lib/services/contract-alerts-service';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron job attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting alert generation...', new Date().toISOString());

    // Generate all alerts
    const results = await ContractAlertsService.generateAllAlerts();

    console.log('Alert generation complete:', results);

    // Process and send pending alerts
    const sentCount = await ContractAlertsService.processPendingAlerts();

    console.log(`Sent ${sentCount} alerts`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        ...results,
        alerts_sent: sentCount,
      },
      message: `Generated ${results.total} new alerts and sent ${sentCount} pending alerts`,
    });
  } catch (error) {
    console.error('Error in alert generation cron:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate alerts',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Allow manual triggering with authentication
  return GET(request);
}
