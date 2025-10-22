/**
 * Document Compliance Monitoring System
 * Proactive monitoring and alerting for promoter document expirations
 */

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types';

type Promoter = Database['public']['Tables']['promoters']['Row'];

export interface DocumentAlert {
  promoterId: string;
  promoterName: string;
  promoterEmail: string | null;
  documentType: 'id_card' | 'passport';
  expiryDate: string;
  daysUntilExpiry: number;
  severity: 'critical' | 'urgent' | 'warning';
  status: 'expired' | 'expiring_7days' | 'expiring_30days';
}

export interface ComplianceReport {
  timestamp: string;
  summary: {
    total: number;
    compliant: number;
    expired: number;
    expiring7days: number;
    expiring30days: number;
    complianceRate: number;
  };
  alerts: {
    critical: DocumentAlert[]; // Expired
    urgent: DocumentAlert[];   // Expiring within 7 days
    warning: DocumentAlert[];  // Expiring within 30 days
  };
  byDocumentType: {
    idCards: {
      expired: number;
      expiring: number;
      valid: number;
    };
    passports: {
      expired: number;
      expiring: number;
      valid: number;
    };
  };
}

export class DocumentMonitor {
  /**
   * Check all promoter documents for expirations and generate alerts
   */
  async checkExpirations(): Promise<ComplianceReport> {
    const supabase = await createClient();
    
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    try {
      // Fetch all promoters with document info
      const { data: promoters, error } = await supabase
        .from('promoters')
        .select('id, name_en, name_ar, email, id_card_expiry_date, passport_expiry_date, status');

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
            const alreadyCounted = promoter.id_card_expiry_date && 
              new Date(promoter.id_card_expiry_date) <= new Date(promoter.passport_expiry_date);

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
      const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;

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
      console.error('Error checking document expirations:', error);
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
    console.log(`📋 ${report.alerts.warning.length} documents expiring within 30 days`);

    return { emailsSent, notificationsCreated };
  }

  /**
   * Send individual alert
   * TODO: Integrate with email service (SendGrid, AWS SES, etc.)
   * TODO: Integrate with notification system
   * TODO: Integrate with SMS service for critical alerts
   */
  private async sendAlert(alert: DocumentAlert): Promise<void> {
    const docName = alert.documentType === 'id_card' ? 'ID Card' : 'Passport';
    
    console.log(`🚨 ${alert.severity.toUpperCase()} Alert:`, {
      promoter: alert.promoterName,
      document: docName,
      status: alert.status,
      daysUntilExpiry: alert.daysUntilExpiry,
    });

    // TODO: Implement actual notification sending
    // Examples:
    
    // 1. Email notification
    // await sendEmail({
    //   to: [alert.promoterEmail, process.env.ADMIN_EMAIL],
    //   subject: `${alert.severity === 'critical' ? 'URGENT: ' : ''}${docName} ${alert.status === 'expired' ? 'Expired' : 'Expiring Soon'}`,
    //   template: 'document-expiry',
    //   data: { alert }
    // });

    // 2. In-app notification
    // await supabase.from('notifications').insert({
    //   user_id: alert.promoterId,
    //   type: 'DOCUMENT_EXPIRY',
    //   title: `${docName} ${alert.status === 'expired' ? 'Expired' : 'Expiring Soon'}`,
    //   message: `Your ${docName} ${alert.status === 'expired' ? 'expired' : `expires in ${alert.daysUntilExpiry} days`}`,
    //   severity: alert.severity,
    //   action_url: `/en/promoters/${alert.promoterId}/documents`
    // });

    // 3. SMS for critical documents
    // if (alert.severity === 'critical') {
    //   await sendSMS({
    //     to: alert.promoterPhone,
    //     message: `URGENT: Your ${docName} has expired. Please renew immediately.`
    //   });
    // }
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
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data: expired } = await supabase
      .from('promoters')
      .select('id, name_en, name_ar, email, id_card_expiry_date, passport_expiry_date')
      .or(`id_card_expiry_date.lt.${now.toISOString()},passport_expiry_date.lt.${now.toISOString()}`);

    const { data: expiringSoon } = await supabase
      .from('promoters')
      .select('id, name_en, name_ar, email, id_card_expiry_date, passport_expiry_date')
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
  console.log('🔍 Starting scheduled document compliance check...');
  
  const monitor = new DocumentMonitor();
  const report = await monitor.checkExpirations();
  
  console.log('📊 Document monitoring completed:', {
    timestamp: report.timestamp,
    total: report.summary.total,
    expired: report.summary.expired,
    expiring7days: report.summary.expiring7days,
    expiring30days: report.summary.expiring30days,
    complianceRate: `${report.summary.complianceRate}%`,
  });

  // Send alerts for urgent issues
  if (report.alerts.critical.length > 0 || report.alerts.urgent.length > 0) {
    const alertResults = await monitor.sendAlerts(report);
    console.log('📧 Alerts sent:', alertResults);
  }

  return report;
}

/**
 * Format document type for display
 */
export function formatDocumentType(type: 'id_card' | 'passport'): string {
  return type === 'id_card' ? 'ID Card' : 'Passport';
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity: 'critical' | 'urgent' | 'warning'): string {
  switch (severity) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'urgent':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  }
}

