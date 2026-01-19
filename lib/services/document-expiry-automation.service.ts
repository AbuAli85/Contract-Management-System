/**
 * Document Expiry Automation Service
 * 
 * Smart automation for document expiry tracking, alerts, and workflows
 * - Automatic expiry detection
 * - Smart alert scheduling (90, 60, 30, 14, 7 days before)
 * - Missing document detection
 * - Automated renewal workflows
 */

import { createAdminClient } from '@/lib/supabase/server';
import { notificationService, NotificationRecipient, NotificationContent } from './unified-notification.service';
import { differenceInDays, addDays, format } from 'date-fns';

export interface DocumentExpiryAlert {
  documentId: string;
  documentType: string;
  documentName: string;
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  employeePhone?: string;
  employerId: string;
  employerEmail?: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  status: 'expired' | 'expiring_soon' | 'warning' | 'info';
  lastAlertSent?: Date;
  alertLevel: 'info' | 'warning' | 'urgent' | 'critical';
}

export interface MissingDocumentAlert {
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  requiredDocumentType: string;
  requiredDocumentName: string;
  isMandatory: boolean;
  employerId: string;
  employerEmail?: string;
}

export interface DocumentComplianceReport {
  totalDocuments: number;
  expired: number;
  expiringSoon: number;
  missing: number;
  compliant: number;
  complianceRate: number;
  alerts: DocumentExpiryAlert[];
  missingDocuments: MissingDocumentAlert[];
}

/**
 * Document Expiry Automation Service
 */
export class DocumentExpiryAutomationService {
  private _supabase: ReturnType<typeof createAdminClient> | null = null;

  /**
   * Lazy initialization of Supabase admin client
   * Only creates the client when first accessed (at runtime, not build time)
   */
  private get supabase() {
    if (!this._supabase) {
      this._supabase = createAdminClient();
    }
    return this._supabase;
  }

  /**
   * Check all documents and generate compliance report
   */
  async checkAllDocuments(companyId?: string): Promise<DocumentComplianceReport> {
    const now = new Date();
    const alerts: DocumentExpiryAlert[] = [];
    const missingDocuments: MissingDocumentAlert[] = [];

    // Get all employee documents
    let query = this.supabase
      .from('employee_documents')
      .select(`
        id,
        document_type,
        document_name,
        expiry_date,
        status,
        employer_employee:employer_employees!inner(
          id,
          employee_id,
          employer_id,
          employee:profiles!employer_employees_employee_id_fkey(
            id,
            email,
            full_name,
            phone
          ),
          employer:profiles!employer_employees_employer_id_fkey(
            id,
            email
          )
        )
      `)
      .eq('status', 'verified')
      .not('expiry_date', 'is', null);

    if (companyId) {
      // Filter by company if provided
      query = query.eq('employer_employee.company_id', companyId);
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Failed to fetch documents');
    }

    let expired = 0;
    let expiringSoon = 0;
    let compliant = 0;

    // Process each document
    for (const doc of documents || []) {
      if (!doc.expiry_date) continue;

      const expiryDate = new Date(doc.expiry_date);
      const daysUntilExpiry = differenceInDays(expiryDate, now);

      const employee = doc.employer_employee?.employee;
      const employer = doc.employer_employee?.employer;

      if (daysUntilExpiry < 0) {
        // Expired
        expired++;
        alerts.push({
          documentId: doc.id,
          documentType: doc.document_type,
          documentName: doc.document_name,
          employeeId: doc.employer_employee?.employee_id || '',
          employeeName: employee?.full_name || 'Unknown',
          employeeEmail: employee?.email,
          employeePhone: employee?.phone,
          employerId: doc.employer_employee?.employer_id || '',
          employerEmail: employer?.email,
          expiryDate,
          daysUntilExpiry,
          status: 'expired',
          alertLevel: 'critical',
        });
      } else if (daysUntilExpiry <= 7) {
        // Expiring within 7 days
        expiringSoon++;
        alerts.push({
          documentId: doc.id,
          documentType: doc.document_type,
          documentName: doc.document_name,
          employeeId: doc.employer_employee?.employee_id || '',
          employeeName: employee?.full_name || 'Unknown',
          employeeEmail: employee?.email,
          employeePhone: employee?.phone,
          employerId: doc.employer_employee?.employer_id || '',
          employerEmail: employer?.email,
          expiryDate,
          daysUntilExpiry,
          status: 'expiring_soon',
          alertLevel: 'urgent',
        });
      } else if (daysUntilExpiry <= 30) {
        // Expiring within 30 days
        expiringSoon++;
        alerts.push({
          documentId: doc.id,
          documentType: doc.document_type,
          documentName: doc.document_name,
          employeeId: doc.employer_employee?.employee_id || '',
          employeeName: employee?.full_name || 'Unknown',
          employeeEmail: employee?.email,
          employeePhone: employee?.phone,
          employerId: doc.employer_employee?.employer_id || '',
          employerEmail: employer?.email,
          expiryDate,
          daysUntilExpiry,
          status: 'warning',
          alertLevel: 'warning',
        });
      } else if (daysUntilExpiry <= 60) {
        // Expiring within 60 days
        alerts.push({
          documentId: doc.id,
          documentType: doc.document_type,
          documentName: doc.document_name,
          employeeId: doc.employer_employee?.employee_id || '',
          employeeName: employee?.full_name || 'Unknown',
          employeeEmail: employee?.email,
          employeePhone: employee?.phone,
          employerId: doc.employer_employee?.employer_id || '',
          employerEmail: employer?.email,
          expiryDate,
          daysUntilExpiry,
          status: 'info',
          alertLevel: 'info',
        });
      } else {
        compliant++;
      }
    }

    // Check for missing documents
    const missingDocs = await this.checkMissingDocuments(companyId);
    missingDocuments.push(...missingDocs);

    const totalDocuments = documents?.length || 0;
    const complianceRate = totalDocuments > 0 
      ? ((compliant / totalDocuments) * 100).toFixed(1)
      : '100.0';

    return {
      totalDocuments,
      expired,
      expiringSoon,
      missing: missingDocuments.length,
      compliant,
      complianceRate: parseFloat(complianceRate),
      alerts,
      missingDocuments,
    };
  }

  /**
   * Check for missing required documents
   */
  async checkMissingDocuments(companyId?: string): Promise<MissingDocumentAlert[]> {
    const missing: MissingDocumentAlert[] = [];

    // Get compliance requirements
    let requirementsQuery = this.supabase
      .from('compliance_requirements')
      .select('*')
      .eq('is_mandatory', true)
      .eq('requirement_type', 'document');

    if (companyId) {
      requirementsQuery = requirementsQuery.eq('company_id', companyId);
    }

    const { data: requirements } = await requirementsQuery;

    if (!requirements || requirements.length === 0) {
      return missing;
    }

    // Get all employees
    let employeesQuery = this.supabase
      .from('employer_employees')
      .select(`
        id,
        employee_id,
        employer_id,
        employee:profiles!employer_employees_employee_id_fkey(
          id,
          email,
          full_name,
          phone
        ),
        employer:profiles!employer_employees_employer_id_fkey(
          id,
          email
        )
      `)
      .eq('employment_status', 'active');

    if (companyId) {
      employeesQuery = employeesQuery.eq('company_id', companyId);
    }

    const { data: employees } = await employeesQuery;

    // Check each employee for missing documents
    for (const employee of employees || []) {
      // Get employee's documents
      const { data: documents } = await this.supabase
        .from('employee_documents')
        .select('document_type, status')
        .eq('employer_employee_id', employee.id)
        .eq('status', 'verified');

      const existingDocTypes = new Set(
        documents?.map(d => d.document_type) || []
      );

      // Check which required documents are missing
      for (const requirement of requirements) {
        if (
          requirement.document_type &&
          !existingDocTypes.has(requirement.document_type)
        ) {
          missing.push({
            employeeId: employee.employee_id,
            employeeName: employee.employee?.full_name || 'Unknown',
            employeeEmail: employee.employee?.email,
            requiredDocumentType: requirement.document_type,
            requiredDocumentName: requirement.requirement_name,
            isMandatory: requirement.is_mandatory,
            employerId: employee.employer_id,
            employerEmail: employee.employer?.email,
          });
        }
      }
    }

    return missing;
  }

  /**
   * Send automated alerts for expiring documents
   */
  async sendExpiryAlerts(
    alerts: DocumentExpiryAlert[],
    options?: {
      sendToEmployee?: boolean;
      sendToEmployer?: boolean;
      channels?: ('email' | 'sms' | 'in_app')[];
    }
  ): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const sendToEmployee = options?.sendToEmployee !== false;
    const sendToEmployer = options?.sendToEmployer !== false;
    const channels = options?.channels || ['email', 'in_app'];

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const alert of alerts) {
      try {
        const recipients: NotificationRecipient[] = [];

        // Add employee as recipient
        if (sendToEmployee && alert.employeeEmail) {
          recipients.push({
            userId: alert.employeeId,
            email: alert.employeeEmail,
            phone: alert.employeePhone,
            name: alert.employeeName,
          });
        }

        // Add employer as recipient
        if (sendToEmployer && alert.employerEmail) {
          recipients.push({
            email: alert.employerEmail,
            name: 'Employer',
          });
        }

        if (recipients.length === 0) {
          failed++;
          errors.push(`No recipients for alert: ${alert.documentName}`);
          continue;
        }

        const content: NotificationContent = {
          title: this.getAlertTitle(alert),
          message: this.getAlertMessage(alert),
          html: this.getAlertEmailHtml(alert),
          priority: this.getPriority(alert.alertLevel),
          category: 'document_expiry',
          actionUrl: `/en/hr/documents/${alert.documentId}`,
          metadata: {
            documentId: alert.documentId,
            documentType: alert.documentType,
            expiryDate: alert.expiryDate.toISOString(),
            daysUntilExpiry: alert.daysUntilExpiry,
          },
        };

        const result = await notificationService.sendNotification({
          recipients,
          content,
          channels: channels as any,
        });

        if (result.success) {
          sent++;
          // Update last alert sent timestamp
          await this.updateLastAlertSent(alert.documentId);
        } else {
          failed++;
          errors.push(...result.errors);
        }
      } catch (error: any) {
        failed++;
        errors.push(`Error sending alert: ${error.message}`);
      }
    }

    return { sent, failed, errors };
  }

  /**
   * Send missing document alerts
   */
  async sendMissingDocumentAlerts(
    missing: MissingDocumentAlert[],
    options?: {
      sendToEmployee?: boolean;
      sendToEmployer?: boolean;
    }
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    const sendToEmployee = options?.sendToEmployee !== false;
    const sendToEmployer = options?.sendToEmployer !== false;

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const alert of missing) {
      try {
        const recipients: NotificationRecipient[] = [];

        if (sendToEmployee && alert.employeeEmail) {
          recipients.push({
            userId: alert.employeeId,
            email: alert.employeeEmail,
            name: alert.employeeName,
          });
        }

        if (sendToEmployer && alert.employerEmail) {
          recipients.push({
            email: alert.employerEmail,
            name: 'Employer',
          });
        }

        if (recipients.length === 0) {
          failed++;
          continue;
        }

        const content: NotificationContent = {
          title: `Missing Required Document: ${alert.requiredDocumentName}`,
          message: `You are required to upload ${alert.requiredDocumentName}. Please upload it as soon as possible.`,
          priority: alert.isMandatory ? 'high' : 'medium',
          category: 'missing_document',
          actionUrl: `/en/hr/documents/upload?type=${alert.requiredDocumentType}`,
          metadata: {
            employeeId: alert.employeeId,
            documentType: alert.requiredDocumentType,
            isMandatory: alert.isMandatory,
          },
        };

        const result = await notificationService.sendNotification({
          recipients,
          content,
          channels: ['email', 'in_app'],
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
          errors.push(...result.errors);
        }
      } catch (error: any) {
        failed++;
        errors.push(`Error: ${error.message}`);
      }
    }

    return { sent, failed, errors };
  }

  /**
   * Update last alert sent timestamp
   */
  private async updateLastAlertSent(documentId: string): Promise<void> {
    // Update document_reminders table if it exists
    try {
      await this.supabase
        .from('document_reminders')
        .upsert({
          document_id: documentId,
          last_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'document_id',
        });
    } catch (error) {
      // Table might not exist, that's okay
      console.warn('Could not update document_reminders:', error);
    }
  }

  /**
   * Get alert title based on status
   */
  private getAlertTitle(alert: DocumentExpiryAlert): string {
    if (alert.status === 'expired') {
      return `🚨 URGENT: ${alert.documentName} Has Expired`;
    } else if (alert.daysUntilExpiry <= 7) {
      return `⚠️ ${alert.documentName} Expiring Soon (${alert.daysUntilExpiry} days)`;
    } else if (alert.daysUntilExpiry <= 30) {
      return `📋 ${alert.documentName} Expiring in ${alert.daysUntilExpiry} days`;
    } else {
      return `ℹ️ ${alert.documentName} Expiring in ${alert.daysUntilExpiry} days`;
    }
  }

  /**
   * Get alert message
   */
  private getAlertMessage(alert: DocumentExpiryAlert): string {
    const expiryDate = format(alert.expiryDate, 'MMM dd, yyyy');
    
    if (alert.status === 'expired') {
      return `Your ${alert.documentName} expired on ${expiryDate}. Please renew it immediately to avoid compliance issues.`;
    } else {
      return `Your ${alert.documentName} will expire on ${expiryDate} (in ${alert.daysUntilExpiry} days). Please prepare for renewal.`;
    }
  }

  /**
   * Get alert email HTML
   */
  private getAlertEmailHtml(alert: DocumentExpiryAlert): string {
    const expiryDate = format(alert.expiryDate, 'MMM dd, yyyy');
    const color = alert.status === 'expired' 
      ? '#dc2626' 
      : alert.daysUntilExpiry <= 7 
        ? '#ea580c' 
        : alert.daysUntilExpiry <= 30 
          ? '#f59e0b' 
          : '#3b82f6';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="border-left: 4px solid ${color}; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
          <h2 style="color: ${color}; margin-top: 0;">${this.getAlertTitle(alert)}</h2>
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>Document:</strong> ${alert.documentName}<br>
            <strong>Type:</strong> ${alert.documentType}<br>
            <strong>Expiry Date:</strong> ${expiryDate}<br>
            <strong>Days Remaining:</strong> ${alert.daysUntilExpiry} ${alert.daysUntilExpiry === 1 ? 'day' : 'days'}
          </p>
          ${alert.status === 'expired' 
            ? '<p style="color: #dc2626; font-weight: bold;">⚠️ This document has expired. Immediate action is required.</p>' 
            : ''}
          <div style="margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/en/hr/documents/${alert.documentId}" 
               style="background-color: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Document
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Convert alert level to notification priority
   */
  private getPriority(level: string): NotificationPriority {
    switch (level) {
      case 'critical':
        return 'urgent';
      case 'urgent':
        return 'high';
      case 'warning':
        return 'medium';
      default:
        return 'low';
    }
  }
}

// Export singleton instance
export const documentExpiryAutomation = new DocumentExpiryAutomationService();

