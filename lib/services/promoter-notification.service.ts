/**
 * Promoter Notification Service
 *
 * Handles sending notifications and reminders to promoters
 *
 * Features:
 * - Document expiry reminders
 * - Document requests
 * - Bulk notifications
 * - Multi-channel support (email, SMS, in-app)
 * - Automatic expiry checking
 * - Notification tracking and status
 */

import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type NotificationType =
  | 'document_expiry_reminder'
  | 'document_request'
  | 'bulk_notification'
  | 'contract_update'
  | 'general_message'
  | 'urgent_alert';

export type NotificationStatus =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'read'
  | 'archived';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type DocumentType = 'id_card' | 'passport' | 'contract' | 'other';

export interface NotificationConfig {
  promoterId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority | undefined;
  sendEmail?: boolean | undefined;
  sendSms?: boolean | undefined;
  sendInApp?: boolean | undefined;
  documentType?: string | undefined;
  documentUrl?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface DocumentExpiryReminderConfig {
  promoterId: string;
  documentType: DocumentType;
  expiryDate: string;
  daysBeforeExpiry: number;
  documentUrl?: string;
}

export interface DocumentRequestConfig {
  promoterId: string;
  documentType: DocumentType;
  reason?: string;
  deadline?: string;
  priority?: NotificationPriority;
}

export interface BulkNotificationConfig {
  promoterIds: string[];
  title: string;
  message: string;
  priority?: NotificationPriority;
  sendEmail?: boolean;
  sendSms?: boolean;
  sendInApp?: boolean;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
  sent?: {
    email?: boolean;
    sms?: boolean;
    inApp?: boolean;
  };
}

export interface BulkNotificationResult {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  results: Array<{
    promoterId: string;
    success: boolean;
    notificationId?: string | undefined;
    error?: string | undefined;
  }>;
}

// ============================================================================
// EMAIL & SMS INTEGRATION
// ============================================================================
// Email: Resend.io (configured)
// SMS: Twilio (placeholder - add if needed)
// ============================================================================

import { sendEmail as sendResendEmail } from '@/lib/services/email.service';

/**
 * Send email notification via Resend
 */
async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  return await sendResendEmail({
    to,
    subject,
    html: body,
    text: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
  });
}

/**
 * Send SMS notification (PLACEHOLDER - Integrate with your SMS service)
 */
async function sendSMS(
  to: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  // TODO: Replace with actual SMS service integration

  // Simulate success
  return { success: true };

  // Example with Twilio:
  // const twilio = require('twilio');
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // try {
  //   await client.messages.create({
  //     body: message,
  //     from: process.env.TWILIO_PHONE_NUMBER,
  //     to: to
  //   });
  //   return { success: true };
  // } catch (error) {
  //   return { success: false, error: error.message };
  // }
}

// ============================================================================
// CORE NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Create notification record in database
 */
async function createNotificationRecord(
  config: NotificationConfig
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const supabase = createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize client' };
    }

    const { data, error } = await supabase
      .from('promoter_notifications')
      .insert({
        promoter_id: config.promoterId,
        type: config.type,
        title: config.title,
        message: config.message,
        priority: config.priority || 'medium',
        send_email: config.sendEmail || false,
        send_sms: config.sendSms || false,
        send_in_app: config.sendInApp !== false, // Default true
        document_type: config.documentType,
        document_url: config.documentUrl,
        metadata: config.metadata || {},
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating notification record:', error);
      return { success: false, error: error.message };
    }

    return { success: true, notificationId: data.id };
  } catch (error) {
    console.error('Unexpected error creating notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update notification status
 */
async function updateNotificationStatus(
  notificationId: string,
  status: NotificationStatus,
  failedReason?: string
): Promise<void> {
  try {
    const supabase = createClient();
    if (!supabase) {
      console.error('Failed to initialize client');
      return;
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }

    if (status === 'failed' && failedReason) {
      updateData.failed_reason = failedReason;
      // Increment retry count by fetching current value
      const { data: current } = await supabase
        .from('promoter_notifications')
        .select('retry_count')
        .eq('id', notificationId)
        .single();
      updateData.retry_count = (current?.retry_count || 0) + 1;
    }

    await supabase
      .from('promoter_notifications')
      .update(updateData)
      .eq('id', notificationId);
  } catch (error) {
    console.error('Error updating notification status:', error);
  }
}

/**
 * Get promoter contact information
 */
async function getPromoterContact(promoterId: string): Promise<{
  email?: string;
  phone?: string;
  name?: string;
}> {
  try {
    const supabase = createClient();
    if (!supabase) return {};

    const { data, error } = await supabase
      .from('promoters')
      .select('email, phone, mobile_number, name_en, name_ar')
      .eq('id', promoterId)
      .single();

    if (error || !data) {
      return {};
    }

    return {
      email: data.email,
      phone: data.phone || data.mobile_number,
      name: data.name_en || data.name_ar || 'Promoter',
    };
  } catch (error) {
    console.error('Error fetching promoter contact:', error);
    return {};
  }
}

/**
 * Send notification via configured channels
 */
async function sendNotificationViaChannels(
  config: NotificationConfig,
  contact: { email?: string; phone?: string; name?: string }
): Promise<{ email: boolean; sms: boolean; inApp: boolean }> {
  const results = {
    email: false,
    sms: false,
    inApp: true, // In-app is always successful as it's stored in DB
  };

  // Send email if configured and email available
  if (config.sendEmail && contact.email) {
    const emailSubject = config.title;
    const emailBody = `
      <h2>${config.title}</h2>
      <p>Dear ${contact.name},</p>
      <p>${config.message}</p>
      ${config.documentUrl ? `<p><a href="${config.documentUrl}">View Document</a></p>` : ''}
      <p>Priority: ${config.priority?.toUpperCase()}</p>
      <hr>
      <p><small>This is an automated message from Contract Management System</small></p>
    `;

    const emailResult = await sendEmail(contact.email, emailSubject, emailBody);
    results.email = emailResult.success;
  }

  // Send SMS if configured and phone available
  if (config.sendSms && contact.phone) {
    const smsMessage = `${config.title}: ${config.message}`;
    const smsResult = await sendSMS(contact.phone, smsMessage);
    results.sms = smsResult.success;
  }

  return results;
}

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Send a generic notification
 */
export async function sendNotification(
  config: NotificationConfig
): Promise<NotificationResult> {
  try {
    // Create notification record
    const createResult = await createNotificationRecord(config);
    if (!createResult.success || !createResult.notificationId) {
      return {
        success: false,
        error: createResult.error || 'Failed to create notification',
      };
    }

    const notificationId = createResult.notificationId;

    // Get promoter contact information
    const contact = await getPromoterContact(config.promoterId);

    // Send via configured channels
    const sent = await sendNotificationViaChannels(config, contact);

    // Update status based on results
    const allChannelsFailed =
      config.sendEmail &&
      !sent.email &&
      config.sendSms &&
      !sent.sms &&
      !sent.inApp;

    if (allChannelsFailed) {
      await updateNotificationStatus(
        notificationId,
        'failed',
        'All channels failed'
      );
      return {
        success: false,
        notificationId,
        error: 'Failed to send via all channels',
        sent,
      };
    }

    await updateNotificationStatus(notificationId, 'sent');

    return {
      success: true,
      notificationId,
      sent,
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send document expiry reminder
 */
export async function sendDocumentExpiryReminder(
  config: DocumentExpiryReminderConfig
): Promise<NotificationResult> {
  const documentName = config.documentType.replace('_', ' ').toUpperCase();
  const expiryDate = new Date(config.expiryDate).toLocaleDateString();

  const title = `${documentName} Expiring Soon`;
  const message = `Your ${documentName} will expire on ${expiryDate} (in ${config.daysBeforeExpiry} days). Please renew it as soon as possible to avoid any service interruptions.`;

  return sendNotification({
    promoterId: config.promoterId,
    type: 'document_expiry_reminder',
    title,
    message,
    priority: config.daysBeforeExpiry <= 7 ? 'urgent' : 'high',
    sendEmail: true,
    sendSms: config.daysBeforeExpiry <= 7, // Send SMS only for urgent reminders
    sendInApp: true,
    documentType: config.documentType,
    documentUrl: config.documentUrl,
    metadata: {
      expiryDate: config.expiryDate,
      daysBeforeExpiry: config.daysBeforeExpiry,
    },
  });
}

/**
 * Send document request
 */
export async function sendDocumentRequest(
  config: DocumentRequestConfig
): Promise<NotificationResult> {
  const documentName = config.documentType.replace('_', ' ').toUpperCase();

  let message = `We need you to submit your ${documentName}.`;
  if (config.reason) {
    message += ` Reason: ${config.reason}`;
  }
  if (config.deadline) {
    const deadlineDate = new Date(config.deadline).toLocaleDateString();
    message += ` Please submit it by ${deadlineDate}.`;
  }

  return sendNotification({
    promoterId: config.promoterId,
    type: 'document_request',
    title: `${documentName} Required`,
    message,
    priority: config.priority || 'medium',
    sendEmail: true,
    sendSms: config.priority === 'urgent',
    sendInApp: true,
    documentType: config.documentType,
    metadata: {
      reason: config.reason,
      deadline: config.deadline,
    },
  });
}

/**
 * Send bulk notifications to multiple promoters
 */
export async function sendBulkNotifications(
  config: BulkNotificationConfig
): Promise<BulkNotificationResult> {
  const results: BulkNotificationResult['results'] = [];
  let totalSent = 0;
  let totalFailed = 0;

  for (const promoterId of config.promoterIds) {
    try {
      const result = await sendNotification({
        promoterId,
        type: 'bulk_notification',
        title: config.title,
        message: config.message,
        priority: config.priority || 'medium',
        sendEmail: config.sendEmail,
        sendSms: config.sendSms,
        sendInApp: config.sendInApp !== false,
      });

      if (result.success) {
        totalSent++;
        results.push({
          promoterId,
          success: true,
          notificationId: result.notificationId,
        });
      } else {
        totalFailed++;
        results.push({
          promoterId,
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      totalFailed++;
      results.push({
        promoterId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    success: totalSent > 0,
    totalSent,
    totalFailed,
    results,
  };
}

// ============================================================================
// AUTOMATED REMINDERS
// ============================================================================

/**
 * Check and send expiry reminders for all promoters
 * This function should be called periodically (e.g., daily cron job)
 */
export async function checkAndSendExpiryReminders(): Promise<{
  success: boolean;
  remindersSent: number;
  errors: string[];
}> {
  try {
    const supabase = createClient();
    if (!supabase) {
      return {
        success: false,
        remindersSent: 0,
        errors: ['Failed to initialize client'],
      };
    }
    const errors: string[] = [];
    let remindersSent = 0;

    // Calculate date thresholds
    const now = new Date();
    const sevenDays = new Date(now);
    sevenDays.setDate(now.getDate() + 7);
    const thirtyDays = new Date(now);
    thirtyDays.setDate(now.getDate() + 30);
    const ninetyDays = new Date(now);
    ninetyDays.setDate(now.getDate() + 90);

    // Fetch promoters with expiring documents
    const { data: promoters, error } = await supabase
      .from('promoters')
      .select(
        'id, id_card_expiry_date, passport_expiry_date, id_card_url, passport_url'
      )
      .or(
        `id_card_expiry_date.lte.${ninetyDays.toISOString()},passport_expiry_date.lte.${ninetyDays.toISOString()}`
      )
      .eq('status', 'active');

    if (error) {
      throw error;
    }

    // Send reminders for each promoter
    for (const promoter of promoters || []) {
      // Check ID card expiry
      if (promoter.id_card_expiry_date) {
        const idExpiryDate = new Date(promoter.id_card_expiry_date);
        const daysUntilExpiry = Math.floor(
          (idExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Send reminder at 7, 30, or 90 days before expiry
        if (
          daysUntilExpiry === 7 ||
          daysUntilExpiry === 30 ||
          daysUntilExpiry === 90
        ) {
          const result = await sendDocumentExpiryReminder({
            promoterId: promoter.id,
            documentType: 'id_card',
            expiryDate: promoter.id_card_expiry_date,
            daysBeforeExpiry: daysUntilExpiry,
            documentUrl: promoter.id_card_url,
          });

          if (result.success) {
            remindersSent++;
          } else {
            errors.push(
              `Failed to send ID card reminder for promoter ${promoter.id}: ${result.error}`
            );
          }
        }
      }

      // Check passport expiry
      if (promoter.passport_expiry_date) {
        const passportExpiryDate = new Date(promoter.passport_expiry_date);
        const daysUntilExpiry = Math.floor(
          (passportExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Send reminder at 7, 30, or 90 days before expiry
        if (
          daysUntilExpiry === 7 ||
          daysUntilExpiry === 30 ||
          daysUntilExpiry === 90
        ) {
          const result = await sendDocumentExpiryReminder({
            promoterId: promoter.id,
            documentType: 'passport',
            expiryDate: promoter.passport_expiry_date,
            daysBeforeExpiry: daysUntilExpiry,
            documentUrl: promoter.passport_url,
          });

          if (result.success) {
            remindersSent++;
          } else {
            errors.push(
              `Failed to send passport reminder for promoter ${promoter.id}: ${result.error}`
            );
          }
        }
      }
    }

    return {
      success: true,
      remindersSent,
      errors,
    };
  } catch (error) {
    console.error('Error checking and sending expiry reminders:', error);
    return {
      success: false,
      remindersSent: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// ============================================================================
// NOTIFICATION MANAGEMENT
// ============================================================================

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize client' };
    }

    const { error } = await supabase
      .from('promoter_notifications')
      .update({
        status: 'read',
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get unread notification count for a promoter
 */
export async function getUnreadNotificationCount(
  promoterId: string
): Promise<{ count: number; error?: string }> {
  try {
    const supabase = createClient();
    if (!supabase) {
      return { count: 0, error: 'Failed to initialize client' };
    }

    const { count, error } = await supabase
      .from('promoter_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('promoter_id', promoterId)
      .in('status', ['pending', 'sent'])
      .is('read_at', null);

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: count || 0 };
  } catch (error) {
    return {
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get recent notifications for a promoter
 */
export async function getRecentNotifications(
  promoterId: string,
  limit: number = 10
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const supabase = createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize client' };
    }

    const { data, error } = await supabase
      .from('promoter_notifications')
      .select('*')
      .eq('promoter_id', promoterId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
