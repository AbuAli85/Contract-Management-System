/**
 * Document Compliance Monitoring System
 * Proactive monitoring and alerting for promoter document expirations
 * Server-side functions only - use document-monitor-types.ts for shared types
 */

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types';
import type { DocumentAlert, ComplianceReport } from './document-monitor-types';

type Promoter = Database['public']['Tables']['promoters']['Row'];

// Re-export types for backward compatibility
export type { DocumentAlert, ComplianceReport } from './document-monitor-types';

export class DocumentMonitor {
  /**
   * Check all promoter documents for expirations and generate alerts
   */
  async checkExpirations(): Promise<ComplianceReport> {
    const supabase = await createClient();

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    try {
      // Fetch all promoters with document info
      const { data: promoters, error } = await supabase
        .from('promoters')
        .select(
          'id, name_en, name_ar, email, id_card_expiry_date, passport_expiry_date, status'
        );

      if (error) throw error;

      const alerts: ComplianceReport['alerts'] = {
        critical: [],
        urgent: [],
        warning: [],
      };

      let expiredCount = 0;
      let expiring7daysCount = 0;
      let expiring30daysCount = 0;
      let idCardsExpired = 0;
      let idCardsExpiring = 0;
      let idCardsValid = 0;
      let passportsExpired = 0;
      let passportsExpiring = 0;
      let passportsValid = 0;

      // Process each promoter's documents
      for (const promoter of promoters || []) {
        // Check ID Card
        if (promoter.id_card_expiry_date) {
          const alert = this.checkDocument(
            promoter,
            'id_card',
            promoter.id_card_expiry_date,
            now,
            sevenDaysFromNow,
            thirtyDaysFromNow
          );

          if (alert) {
            if (alert.severity === 'critical') {
              alerts.critical.push(alert);
              expiredCount++;
              idCardsExpired++;
            } else if (alert.severity === 'urgent') {
              alerts.urgent.push(alert);
              expiring7daysCount++;
              idCardsExpiring++;
            } else {
              alerts.warning.push(alert);
              expiring30daysCount++;
              idCardsExpiring++;
            }
          } else {
            idCardsValid++;
          }
        }

        // Check Passport
        if (promoter.passport_expiry_date) {
          const alert = this.checkDocument(
            promoter,
            'passport',
            promoter.passport_expiry_date,
            now,
            sevenDaysFromNow,
            thirtyDaysFromNow
          );

          if (alert) {
            // Only add to main counts if ID wasn't already counted
            const alreadyCounted =
              promoter.id_card_expiry_date &&
              new Date(promoter.id_card_expiry_date) <=
                new Date(promoter.passport_expiry_date);

            if (alert.severity === 'critical') {
              alerts.critical.push(alert);
              if (!alreadyCounted) expiredCount++;
              passportsExpired++;
            } else if (alert.severity === 'urgent') {
              alerts.urgent.push(alert);
              if (!alreadyCounted) expiring7daysCount++;
              passportsExpiring++;
            } else {
              alerts.warning.push(alert);
              if (!alreadyCounted) expiring30daysCount++;
              passportsExpiring++;
            }
          } else {
            passportsValid++;
          }
        }
      }

      const total = promoters?.length || 0;
      const compliant = total - expiredCount - expiring30daysCount;
      const complianceRate =
        total > 0 ? Math.round((compliant / total) * 100) : 0;

      return {
        timestamp: new Date().toISOString(),
        summary: {
          total,
          compliant,
          expired: expiredCount,
          expiring7days: expiring7daysCount,
          expiring30days: expiring30daysCount,
          complianceRate,
        },
        alerts,
        byDocumentType: {
          idCards: {
            expired: idCardsExpired,
            expiring: idCardsExpiring,
            valid: idCardsValid,
          },
          passports: {
            expired: passportsExpired,
            expiring: passportsExpiring,
            valid: passportsValid,
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check individual document and create alert if needed
   */
  private checkDocument(
    promoter: any,
    documentType: 'id_card' | 'passport',
    expiryDate: string,
    now: Date,
    sevenDaysFromNow: Date,
    thirtyDaysFromNow: Date
  ): DocumentAlert | null {
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Document expired
    if (expiry < now) {
      return {
        promoterId: promoter.id,
        promoterName: promoter.name_en || promoter.name_ar || 'Unknown',
        promoterEmail: promoter.email,
        documentType,
        expiryDate,
        daysUntilExpiry,
        severity: 'critical',
        status: 'expired',
      };
    }

    // Expiring within 7 days
    if (expiry <= sevenDaysFromNow) {
      return {
        promoterId: promoter.id,
        promoterName: promoter.name_en || promoter.name_ar || 'Unknown',
        promoterEmail: promoter.email,
        documentType,
        expiryDate,
        daysUntilExpiry,
        severity: 'urgent',
        status: 'expiring_7days',
      };
    }

    // Expiring within 30 days
    if (expiry <= thirtyDaysFromNow) {
      return {
        promoterId: promoter.id,
        promoterName: promoter.name_en || promoter.name_ar || 'Unknown',
        promoterEmail: promoter.email,
        documentType,
        expiryDate,
        daysUntilExpiry,
        severity: 'warning',
        status: 'expiring_30days',
      };
    }

    return null;
  }

  /**
   * Send alerts for urgent documents
   * This is a placeholder - integrate with your notification system
   */
  async sendAlerts(report: ComplianceReport): Promise<{
    emailsSent: number;
    notificationsCreated: number;
  }> {
    let emailsSent = 0;
    let notificationsCreated = 0;

    // Send critical alerts (expired documents)
    for (const alert of report.alerts.critical) {
      await this.sendAlert(alert);
      emailsSent++;
      notificationsCreated++;
    }

    // Send urgent alerts (expiring within 7 days)
    for (const alert of report.alerts.urgent) {
      await this.sendAlert(alert);
      emailsSent++;
      notificationsCreated++;
    }

    // Log warning alerts (expiring within 30 days) but don't spam

    return { emailsSent, notificationsCreated };
  }

  /**
   * Send individual alert via email
   */
  private async sendAlert(alert: DocumentAlert): Promise<void> {
    const docName = alert.documentType === 'id_card' ? 'ID Card' : 'Passport';

    try {
      // Check if email address is available
      if (!alert.promoterEmail) {
        return;
      }

      // Import email service and template
      const { sendEmail } = await import('@/lib/services/email.service');
      const { documentExpiryEmail } =
        await import('@/lib/email-templates/document-expiry');

      // Generate email content
      const emailContent = documentExpiryEmail({
        promoterName: alert.promoterName,
        documentType: docName as 'ID Card' | 'Passport',
        expiryDate: alert.expiryDate,
        daysRemaining: alert.daysUntilExpiry,
        urgent: alert.severity === 'critical',
      });

      // Send email notification
      const result = await sendEmail({
        to: alert.promoterEmail,
        ...emailContent,
      });

      if (result.success) {
      } else {
      }

      // Add in-app notification
      try {
        const { createClient: createSupabaseClient } = await import('@/lib/supabase/server');
        const supabase = await createSupabaseClient();
        await supabase.from('notifications').insert({
          user_id: alert.promoterId,
          type: 'DOCUMENT_EXPIRY',
          title: `${docName} ${alert.status === 'expired' ? 'Expired' : 'Expiring Soon'}`,
          message: `Your ${docName} ${alert.status === 'expired' ? 'expired' : `expires in ${alert.daysUntilExpiry} days`}`,
          severity: alert.severity,
          action_url: `/en/promoters/${alert.promoterId}/documents`,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      } catch {
        // Non-critical
      }
    } catch (error) {
    }
  }

  /**
   * Get promoters with document issues
   */
  async getPromotersNeedingAttention(): Promise<{
    expired: any[];
    expiringSoon: any[];
  }> {
    const supabase = await createClient();
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const { data: expired } = await supabase
      .from('promoters')
      .select(
        'id, name_en, name_ar, email, id_card_expiry_date, passport_expiry_date'
      )
      .or(
        `id_card_expiry_date.lt.${now.toISOString()},passport_expiry_date.lt.${now.toISOString()}`
      );

    const { data: expiringSoon } = await supabase
      .from('promoters')
      .select(
        'id, name_en, name_ar, email, id_card_expiry_date, passport_expiry_date'
      )
      .or(
        `and(id_card_expiry_date.gte.${now.toISOString()},id_card_expiry_date.lte.${thirtyDaysFromNow.toISOString()}),` +
          `and(passport_expiry_date.gte.${now.toISOString()},passport_expiry_date.lte.${thirtyDaysFromNow.toISOString()})`
      );

    return {
      expired: expired || [],
      expiringSoon: expiringSoon || [],
    };
  }
}

/**
 * Scheduled document check (for cron jobs)
 * Run daily at 9 AM or as needed
 */
export async function scheduledDocumentCheck(): Promise<ComplianceReport> {
  const monitor = new DocumentMonitor();
  const report = await monitor.checkExpirations();

  // Send alerts for urgent issues
  if (report.alerts.critical.length > 0 || report.alerts.urgent.length > 0) {
    const alertResults = await monitor.sendAlerts(report);
  }

  return report;
}

// Re-export utility functions for backward compatibility
export { formatDocumentType, getSeverityColor } from './document-monitor-types';
