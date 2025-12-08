/**
 * Cron Job API Route: Automated Document Reminders
 *
 * This endpoint should be called daily by a cron job (e.g., Vercel Cron, GitHub Actions)
 * to automatically send document expiry reminders to promoters.
 *
 * Recommended schedule: Daily at 9:00 AM server time
 *
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/automated-reminders",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendAutomatedReminders,
  getReminderStatistics,
} from '@/lib/services/automated-reminder-scheduler';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key-here';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

/**
 * GET /api/cron/automated-reminders
 * Returns statistics about upcoming reminders without sending them
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const urlSecret = request.nextUrl.searchParams.get('secret');

    if (authHeader !== `Bearer ${CRON_SECRET}` && urlSecret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📊 Fetching reminder statistics...');

    const stats = await getReminderStatistics();

    return NextResponse.json({
      success: true,
      statistics: stats,
      message: 'Reminder statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching reminder statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/automated-reminders
 * Executes the automated reminder system
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const urlSecret = request.nextUrl.searchParams.get('secret');

    if (authHeader !== `Bearer ${CRON_SECRET}` && urlSecret !== CRON_SECRET) {
      console.warn('🚫 Unauthorized cron attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 Starting automated reminder cron job...');

    const startTime = Date.now();
    const result = await sendAutomatedReminders();
    const duration = Date.now() - startTime;

    console.log(`✅ Cron job completed in ${duration}ms`);

    // Return detailed results
    return NextResponse.json({
      success: result.success,
      execution: {
        startTime: new Date(startTime).toISOString(),
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
      results: {
        totalProcessed: result.totalProcessed,
        remindersSent: result.remindersSent,
        successRate:
          result.totalProcessed > 0
            ? `${((result.remindersSent / result.totalProcessed) * 100).toFixed(1)}%`
            : '0%',
        details: result.details,
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error('❌ Error in automated reminder cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
