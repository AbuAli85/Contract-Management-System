import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';
import { documentExpiryAutomation } from '@/lib/services/document-expiry-automation.service';

/**
 * POST /api/automation/documents/check-expiry
 *
 * Check all documents for expiry and send automated alerts
 * This endpoint can be called:
 * - Manually by admins
 * - By cron job (daily)
 * - By scheduled task
 */
export const POST = withAnyRBAC(
  ['company:manage:all', 'admin:all'],
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get user's company context
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id, role')
        .eq('id', user.id)
        .single();

      const body = await request.json().catch(() => ({}));
      const {
        companyId,
        sendToEmployee = true,
        sendToEmployer = true,
        channels = ['email', 'in_app'],
        checkMissing = true,
      } = body;

      // Use provided companyId or user's active company
      const targetCompanyId = companyId || profile?.active_company_id;


      // Check all documents
      const report = await documentExpiryAutomation.checkAllDocuments(
        targetCompanyId || undefined
      );


      // Send expiry alerts
      const expiryAlertsResult =
        await documentExpiryAutomation.sendExpiryAlerts(report.alerts, {
          sendToEmployee,
          sendToEmployer,
          channels: channels as any,
        });


      // Send missing document alerts
      let missingAlertsResult = { sent: 0, failed: 0, errors: [] as string[] };
      if (checkMissing && report.missingDocuments.length > 0) {
        missingAlertsResult =
          await documentExpiryAutomation.sendMissingDocumentAlerts(
            report.missingDocuments,
            {
              sendToEmployee,
              sendToEmployer,
            }
          );

      }

      return NextResponse.json({
        success: true,
        report: {
          totalDocuments: report.totalDocuments,
          expired: report.expired,
          expiringSoon: report.expiringSoon,
          missing: report.missing,
          compliant: report.compliant,
          complianceRate: report.complianceRate,
        },
        alerts: {
          expiry: {
            total: report.alerts.length,
            sent: expiryAlertsResult.sent,
            failed: expiryAlertsResult.failed,
            errors: expiryAlertsResult.errors,
          },
          missing: {
            total: report.missingDocuments.length,
            sent: missingAlertsResult.sent,
            failed: missingAlertsResult.failed,
            errors: missingAlertsResult.errors,
          },
        },
        message: 'Document expiry check completed successfully',
      });
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Internal server error',
        },
        { status: 500 }
      );
    }
  }
);

/**
 * GET /api/automation/documents/check-expiry
 *
 * Get compliance report without sending alerts
 */
export const GET = withAnyRBAC(
  ['company:read:all', 'admin:all'],
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const companyId = searchParams.get('company_id');

      // Get user's company context
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id')
        .eq('id', user.id)
        .single();

      const targetCompanyId = companyId || profile?.active_company_id;

      // Get compliance report
      const report = await documentExpiryAutomation.checkAllDocuments(
        targetCompanyId || undefined
      );

      return NextResponse.json({
        success: true,
        report,
      });
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Internal server error',
        },
        { status: 500 }
      );
    }
  }
);
