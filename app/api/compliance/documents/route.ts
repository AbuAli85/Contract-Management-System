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
    console.log('📋 Compliance check: Starting document review...');

    const monitor = new DocumentMonitor();
    const report = await monitor.checkExpirations();

    console.log('📋 Compliance check completed:', {
      total: report.summary.total,
      expired: report.summary.expired,
      expiring7days: report.summary.expiring7days,
      expiring30days: report.summary.expiring30days,
      complianceRate: `${report.summary.complianceRate}%`,
    });

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
    console.error('❌ Error checking document compliance:', error);
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
    console.log('📧 Sending compliance alerts...');

    const monitor = new DocumentMonitor();
    const report = await monitor.checkExpirations();
    const alertResults = await monitor.sendAlerts(report);

    console.log('📧 Alerts sent successfully:', alertResults);

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
    console.error('❌ Error sending compliance alerts:', error);
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

