/**
 * Cron Job: Send Approval Reminders
 * Run daily to remind approvers about pending approvals
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApprovalWorkflowService } from '@/lib/services/approval-workflow-service';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Sending approval reminders...', new Date().toISOString());

    await ApprovalWorkflowService.sendOverdueReminders();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Approval reminders sent successfully',
    });
  } catch (error) {
    console.error('Error sending approval reminders:', error);
    return NextResponse.json(
      {
        error: 'Failed to send reminders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

