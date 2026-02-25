import { NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac/guard';
import { DocumentMonitor } from '@/lib/document-monitor';

export const dynamic = 'force-dynamic';

/**
 * GET /api/compliance/documents
 *
 * Returns comprehensive document compliance report including:
 * - Summary statistics (expired, expiring, compliant)
 * - Detailed alerts categorized by severity
 * - Breakdown by document type (ID cards vs passports)
 * - Compliance rate percentage
 *
 * Used for:
 * - Compliance dashboard
 * - Proactive monitoring
 * - Alert management
 */
export const GET = withRBAC('promoter:read:own', async () => {
  try {

    const monitor = new DocumentMonitor();
    const report = await monitor.checkExpirations();


    return NextResponse.json({
      success: true,
      report,
      meta: {
        totalAlerts:
          report.alerts.critical.length +
          report.alerts.urgent.length +
          report.alerts.warning.length,
        requiresImmediateAction:
          report.alerts.critical.length + report.alerts.urgent.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check document compliance',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/compliance/documents/send-alerts
 *
 * Manually trigger alerts for urgent documents
 * Should be called by cron job or admin action
 */
export async function POST() {
  try {

    const monitor = new DocumentMonitor();
    const report = await monitor.checkExpirations();
    const alertResults = await monitor.sendAlerts(report);


    return NextResponse.json({
      success: true,
      alertResults,
      report: {
        critical: report.alerts.critical.length,
        urgent: report.alerts.urgent.length,
        warning: report.alerts.warning.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send compliance alerts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
