/**
 * Automated Reminder Scheduler for Document Expirations
 *
 * This service automatically sends reminders at strategic intervals:
 * - 90 days before expiry (early warning)
 * - 30 days before expiry (standard reminder)
 * - 14 days before expiry (urgent reminder)
 * - 7 days before expiry (critical reminder)
 * - 3 days before expiry (emergency reminder)
 * - On expiry day (final alert)
 * - After expiry (overdue alert every 7 days)
 */

import { createClient } from '@/lib/supabase/server';
import {
  sendDocumentExpiryReminder,
  sendBulkNotifications,
} from './promoter-notification.service';
import type { BulkNotificationConfig } from './promoter-notification.service';

export interface ReminderSchedule {
  daysBeforeExpiry: number;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  sendEmail: boolean;
  sendSms: boolean;
  description: string;
}

// Reminder schedule configuration
export const REMINDER_SCHEDULES: ReminderSchedule[] = [
  {
    daysBeforeExpiry: 90,
    priority: 'low',
    sendEmail: true,
    sendSms: false,
    description: 'Early warning - 3 months notice',
  },
  {
    daysBeforeExpiry: 30,
    priority: 'medium',
    sendEmail: true,
    sendSms: false,
    description: 'Standard reminder - 1 month notice',
  },
  {
    daysBeforeExpiry: 14,
    priority: 'high',
    sendEmail: true,
    sendSms: false,
    description: 'Urgent reminder - 2 weeks notice',
  },
  {
    daysBeforeExpiry: 7,
    priority: 'urgent',
    sendEmail: true,
    sendSms: true,
    description: 'Critical reminder - 1 week notice',
  },
  {
    daysBeforeExpiry: 3,
    priority: 'critical',
    sendEmail: true,
    sendSms: true,
    description: 'Emergency reminder - 3 days notice',
  },
  {
    daysBeforeExpiry: 1,
    priority: 'critical',
    sendEmail: true,
    sendSms: true,
    description: 'Final alert - expires tomorrow',
  },
  {
    daysBeforeExpiry: 0,
    priority: 'critical',
    sendEmail: true,
    sendSms: true,
    description: 'Expiry day alert',
  },
];

export interface PromoterDocument {
  promoterId: string;
  promoterName: string;
  promoterEmail: string | null;
  promoterPhone: string | null;
  documentType: 'id_card' | 'passport';
  expiryDate: string;
  daysUntilExpiry: number;
  status: 'valid' | 'expiring' | 'expired' | 'critical';
}

export interface ReminderResult {
  success: boolean;
  totalProcessed: number;
  remindersSent: number;
  errors: string[];
  details: {
    byPriority: Record<string, number>;
    byDocumentType: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

/**
 * Get all documents that need reminders based on expiry dates
 */
export async function getDocumentsNeedingReminders(): Promise<
  PromoterDocument[]
> {
  const supabase = await createClient();

  // Get all active promoters with their document information
  const { data: promoters, error } = await supabase
    .from('promoters')
    .select(
      'id, full_name, email, phone_number, id_card_expiry_date, passport_expiry_date'
    )
    .eq('status', 'active')
    .not('id_card_expiry_date', 'is', null)
    .or('passport_expiry_date.not.is.null');

  if (error) {
    return [];
  }

  if (!promoters) {
    return [];
  }

  const documents: PromoterDocument[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const promoter of promoters) {
    // Process ID card
    if (promoter.id_card_expiry_date) {
      const expiryDate = new Date(promoter.id_card_expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine status
      let status: 'valid' | 'expiring' | 'expired' | 'critical' = 'valid';
      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 7) {
        status = 'critical';
      } else if (daysUntilExpiry <= 30) {
        status = 'expiring';
      }

      // Only include if it needs a reminder (within 90 days or expired)
      if (daysUntilExpiry <= 90) {
        documents.push({
          promoterId: promoter.id,
          promoterName: promoter.full_name,
          promoterEmail: promoter.email,
          promoterPhone: promoter.phone_number,
          documentType: 'id_card',
          expiryDate: promoter.id_card_expiry_date,
          daysUntilExpiry,
          status,
        });
      }
    }

    // Process Passport
    if (promoter.passport_expiry_date) {
      const expiryDate = new Date(promoter.passport_expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine status
      let status: 'valid' | 'expiring' | 'expired' | 'critical' = 'valid';
      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 7) {
        status = 'critical';
      } else if (daysUntilExpiry <= 30) {
        status = 'expiring';
      }

      // Only include if it needs a reminder (within 90 days or expired)
      if (daysUntilExpiry <= 90) {
        documents.push({
          promoterId: promoter.id,
          promoterName: promoter.full_name,
          promoterEmail: promoter.email,
          promoterPhone: promoter.phone_number,
          documentType: 'passport',
          expiryDate: promoter.passport_expiry_date,
          daysUntilExpiry,
          status,
        });
      }
    }
  }

  return documents;
}

/**
 * Determine if a document should receive a reminder today
 */
function shouldSendReminderToday(
  document: PromoterDocument
): ReminderSchedule | null {
  const { daysUntilExpiry } = document;

  // For expired documents, send reminder every 7 days
  if (daysUntilExpiry < 0) {
    const daysSinceExpiry = Math.abs(daysUntilExpiry);
    if (daysSinceExpiry % 7 === 0) {
      return {
        daysBeforeExpiry: daysUntilExpiry,
        priority: 'critical',
        sendEmail: true,
        sendSms: true,
        description: `Overdue by ${daysSinceExpiry} days`,
      };
    }
    return null;
  }

  // Check if today matches any reminder schedule
  return (
    REMINDER_SCHEDULES.find(
      schedule => schedule.daysBeforeExpiry === daysUntilExpiry
    ) || null
  );
}

/**
 * Send automated reminders for documents expiring soon
 */
export async function sendAutomatedReminders(): Promise<ReminderResult> {
  const result: ReminderResult = {
    success: true,
    totalProcessed: 0,
    remindersSent: 0,
    errors: [],
    details: {
      byPriority: {},
      byDocumentType: {},
      byStatus: {},
    },
  };

  try {
    // Get all documents that might need reminders
    const documents = await getDocumentsNeedingReminders();
    result.totalProcessed = documents.length;

    // Filter documents that should receive reminders today
    const documentsToRemind = documents.filter(doc => {
      const schedule = shouldSendReminderToday(doc);
      return schedule !== null && doc.promoterEmail; // Only if they have email
    });

    // Group documents by promoter to avoid duplicate emails
    const promoterDocuments = new Map<string, PromoterDocument[]>();
    for (const doc of documentsToRemind) {
      if (!promoterDocuments.has(doc.promoterId)) {
        promoterDocuments.set(doc.promoterId, []);
      }
      promoterDocuments.get(doc.promoterId)!.push(doc);
    }

    // Send reminders
    for (const [promoterId, docs] of promoterDocuments.entries()) {
      try {
        // Send individual reminders for each document
        for (const doc of docs) {
          const schedule = shouldSendReminderToday(doc);
          if (!schedule) continue;

          const reminderResult = await sendDocumentExpiryReminder({
            promoterId: doc.promoterId,
            documentType: doc.documentType,
            expiryDate: doc.expiryDate,
            daysBeforeExpiry: Math.max(0, doc.daysUntilExpiry),
          });

          if (reminderResult.success) {
            result.remindersSent++;

            // Update statistics
            result.details.byPriority[schedule.priority] =
              (result.details.byPriority[schedule.priority] || 0) + 1;
            result.details.byDocumentType[doc.documentType] =
              (result.details.byDocumentType[doc.documentType] || 0) + 1;
            result.details.byStatus[doc.status] =
              (result.details.byStatus[doc.status] || 0) + 1;
          } else {
            result.errors.push(
              `Failed to send reminder to ${doc.promoterName}: ${reminderResult.error}`
            );
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(
          `Error processing promoter ${promoterId}: ${errorMessage}`
        );
      }
    }

    // Log summary
  } catch (error) {
    result.success = false;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
  }

  return result;
}

/**
 * Send bulk critical reminders for all expired/expiring documents
 * Useful for manual trigger or emergency situations
 */
export async function sendBulkCriticalReminders(): Promise<ReminderResult> {
  const result: ReminderResult = {
    success: true,
    totalProcessed: 0,
    remindersSent: 0,
    errors: [],
    details: {
      byPriority: {},
      byDocumentType: {},
      byStatus: {},
    },
  };

  try {
    // Get all documents
    const documents = await getDocumentsNeedingReminders();

    // Filter only critical and expired documents
    const criticalDocuments = documents.filter(
      doc =>
        (doc.status === 'critical' || doc.status === 'expired') &&
        doc.promoterEmail
    );

    result.totalProcessed = criticalDocuments.length;

    // Group by promoter
    const promoterGroups = new Map<string, PromoterDocument[]>();
    for (const doc of criticalDocuments) {
      if (!promoterGroups.has(doc.promoterId)) {
        promoterGroups.set(doc.promoterId, []);
      }
      promoterGroups.get(doc.promoterId)!.push(doc);
    }

    // Send bulk notification
    const bulkConfig: BulkNotificationConfig = {
      promoterIds: Array.from(promoterGroups.keys()),
      title: 'URGENT: Document Action Required',
      message:
        'One or more of your documents have expired or are expiring very soon. Please take immediate action to renew them.',
      priority: 'urgent',
      sendEmail: true,
      sendSms: true,
      sendInApp: true,
    };

    const bulkResult = await sendBulkNotifications(bulkConfig);

    if (bulkResult.success) {
      result.remindersSent = bulkResult.results.filter(r => r.success).length;
      result.errors = bulkResult.results
        .filter(r => !r.success)
        .map(r => r.error || 'Unknown error');
    } else {
      result.success = false;
      const errorMsg = 'Bulk send failed';
      result.errors.push(errorMsg);
    }
  } catch (error) {
    result.success = false;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
  }

  return result;
}

/**
 * Get reminder statistics and upcoming reminders
 */
export async function getReminderStatistics() {
  const documents = await getDocumentsNeedingReminders();

  const stats = {
    total: documents.length,
    critical: documents.filter(d => d.status === 'critical').length,
    expiring: documents.filter(d => d.status === 'expiring').length,
    expired: documents.filter(d => d.status === 'expired').length,
    byDocumentType: {
      id_card: documents.filter(d => d.documentType === 'id_card').length,
      passport: documents.filter(d => d.documentType === 'passport').length,
    },
    upcomingReminders: {
      today: documents.filter(d => shouldSendReminderToday(d) !== null).length,
      thisWeek: documents.filter(
        d => d.daysUntilExpiry >= 0 && d.daysUntilExpiry <= 7
      ).length,
      thisMonth: documents.filter(
        d => d.daysUntilExpiry >= 0 && d.daysUntilExpiry <= 30
      ).length,
    },
    missingContact: documents.filter(d => !d.promoterEmail).length,
  };

  return stats;
}
