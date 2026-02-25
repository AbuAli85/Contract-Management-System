/**
 * Unified Notification Service
 *
 * Central service for all notifications (Email, SMS, In-App)
 * Provides smart routing, retry logic, and delivery tracking
 */

import { sendEmail } from './email.service';
import { _sendSMS, formatPhoneNumber, isValidPhoneNumber } from './sms.service';
import {
  _sendWhatsApp,
  formatPhoneNumber as formatWhatsAppPhone,
  isValidPhoneNumber as isValidWhatsAppPhone,
  isWhatsAppConfigured,
} from './whatsapp.service';
import { createClient } from '@/lib/supabase/server';

export type NotificationChannel =
  | 'email'
  | 'sms'
  | 'whatsapp'
  | 'in_app'
  | 'push';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationRecipient {
  userId?: string;
  email?: string;
  phone?: string;
  name?: string;
}

export interface NotificationContent {
  title: string;
  message: string;
  html?: string; // For email
  priority?: NotificationPriority;
  category?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationOptions {
  recipients: NotificationRecipient[];
  content: NotificationContent;
  channels: NotificationChannel[];
  sendImmediately?: boolean;
  scheduledAt?: Date;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  sent: {
    email: number;
    sms: number;
    whatsapp: number;
    inApp: number;
  };
  failed: {
    email: number;
    sms: number;
    whatsapp: number;
    inApp: number;
  };
  errors: string[];
}

/**
 * Unified Notification Service
 */
export class UnifiedNotificationService {
  private async getSupabase() {
    return await createClient();
  }

  /**
   * Send notification via multiple channels
   */
  async sendNotification(
    options: NotificationOptions
  ): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: true,
      sent: { email: 0, sms: 0, whatsapp: 0, inApp: 0 },
      failed: { email: 0, sms: 0, whatsapp: 0, inApp: 0 },
      errors: [],
    };

    // Determine which channels to use based on priority
    const channels = this.determineChannels(
      options.channels,
      options.content.priority || 'medium'
    );

    // Process each recipient
    for (const recipient of options.recipients) {
      // Email
      if (channels.includes('email') && recipient.email) {
        try {
          const emailResult = await this.sendEmailNotification(
            recipient,
            options.content
          );
          if (emailResult.success) {
            result.sent.email++;
          } else {
            result.failed.email++;
            result.errors.push(
              `Email to ${recipient.email}: ${emailResult.error}`
            );
          }
        } catch (error: any) {
          result.failed.email++;
          result.errors.push(`Email error: ${error.message}`);
        }
      }

      // SMS (only for high priority or urgent)
      if (
        channels.includes('sms') &&
        recipient.phone &&
        (options.content.priority === 'high' ||
          options.content.priority === 'urgent')
      ) {
        try {
          const smsResult = await this.sendSMSNotification(
            recipient,
            options.content
          );
          if (smsResult.success) {
            result.sent.sms++;
          } else {
            result.failed.sms++;
            result.errors.push(`SMS to ${recipient.phone}: ${smsResult.error}`);
          }
        } catch (error: any) {
          result.failed.sms++;
          result.errors.push(`SMS error: ${error.message}`);
        }
      }

      // WhatsApp (for high priority or urgent, if configured)
      if (
        channels.includes('whatsapp') &&
        recipient.phone &&
        isWhatsAppConfigured() &&
        (options.content.priority === 'high' ||
          options.content.priority === 'urgent')
      ) {
        try {
          const whatsappResult = await this.sendWhatsAppNotification(
            recipient,
            options.content
          );
          if (whatsappResult.success) {
            result.sent.whatsapp++;
          } else {
            result.failed.whatsapp++;
            result.errors.push(
              `WhatsApp to ${recipient.phone}: ${whatsappResult.error}`
            );
          }
        } catch (error: any) {
          result.failed.whatsapp++;
          result.errors.push(`WhatsApp error: ${error.message}`);
        }
      }

      // In-App Notification
      if (channels.includes('in_app') && recipient.userId) {
        try {
          const inAppResult = await this.createInAppNotification(
            recipient.userId,
            options.content
          );
          if (inAppResult.success) {
            result.sent.inApp++;
            if (!result.notificationId) {
              result.notificationId = inAppResult.notificationId;
            }
          } else {
            result.failed.inApp++;
            result.errors.push(`In-app notification: ${inAppResult.error}`);
          }
        } catch (error: any) {
          result.failed.inApp++;
          result.errors.push(`In-app error: ${error.message}`);
        }
      }
    }

    result.success =
      result.failed.email +
        result.failed.sms +
        result.failed.whatsapp +
        result.failed.inApp ===
      0;
    return result;
  }

  /**
   * Determine which channels to use based on priority
   */
  private determineChannels(
    requestedChannels: NotificationChannel[],
    priority: NotificationPriority
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = ['in_app']; // Always send in-app

    // Email for medium and above
    if (
      priority !== 'low' &&
      (requestedChannels.includes('email') || requestedChannels.length === 0)
    ) {
      channels.push('email');
    }

    // SMS for high priority and urgent
    if (
      (priority === 'high' || priority === 'urgent') &&
      requestedChannels.includes('sms')
    ) {
      channels.push('sms');
    }

    // WhatsApp for high priority and urgent (if configured)
    if (
      (priority === 'high' || priority === 'urgent') &&
      requestedChannels.includes('whatsapp') &&
      isWhatsAppConfigured()
    ) {
      channels.push('whatsapp');
    }

    return channels;
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    recipient: NotificationRecipient,
    content: NotificationContent
  ): Promise<{ success: boolean; error?: string }> {
    if (!recipient.email) {
      return { success: false, error: 'No email address' };
    }

    const emailHtml =
      content.html ||
      this.generateEmailTemplate(recipient.name || 'User', content);

    const result = await sendEmail({
      to: recipient.email,
      subject: content.title,
      html: emailHtml,
      text: content.message,
    });

    return result;
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(
    recipient: NotificationRecipient,
    content: NotificationContent
  ): Promise<{ success: boolean; error?: string }> {
    if (!recipient.phone) {
      return { success: false, error: 'No phone number' };
    }

    if (!isValidPhoneNumber(recipient.phone)) {
      return { success: false, error: 'Invalid phone number format' };
    }

    const formattedPhone = formatPhoneNumber(recipient.phone);
    const smsMessage = this.generateSMSMessage(content);

    const { sendSMS } = await import('./sms.service');
    const result = await sendSMS({
      to: formattedPhone,
      message: smsMessage,
    });

    return result;
  }

  /**
   * Send WhatsApp notification
   */
  private async sendWhatsAppNotification(
    recipient: NotificationRecipient,
    content: NotificationContent
  ): Promise<{ success: boolean; error?: string }> {
    if (!recipient.phone) {
      return { success: false, error: 'No phone number' };
    }

    if (!isValidWhatsAppPhone(recipient.phone)) {
      return { success: false, error: 'Invalid phone number format' };
    }

    const formattedPhone = formatWhatsAppPhone(recipient.phone);
    let whatsappMessage = this.generateSMSMessage(content); // Reuse SMS message format

    // Add business branding to message
    const businessName =
      process.env.WHATSAPP_BUSINESS_NAME || 'SmartPRO Business Hub';
    if (!whatsappMessage.includes(businessName)) {
      whatsappMessage = `${businessName}\n\n${whatsappMessage}`;
    }

    // Use default template if available, otherwise use free-form message
    const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;

    const { sendWhatsApp } = await import('./whatsapp.service');
    const result = await sendWhatsApp({
      to: formattedPhone,
      message: templateSid ? undefined : whatsappMessage, // Use message if no template
      templateSid: templateSid || undefined,
      templateVariables: templateSid
        ? this.generateWhatsAppTemplateVariables(content)
        : undefined,
    });

    return result;
  }

  /**
   * Generate WhatsApp template variables from content
   */
  private generateWhatsAppTemplateVariables(
    content: NotificationContent
  ): Record<string, string> {
    // Default template variables (adjust based on your Twilio template)
    // Template: "Your appointment is coming up on {{1}} at {{2}}..."
    // For notifications, we'll use: {{1}} = title, {{2}} = message preview
    return {
      '1': content.title,
      '2':
        content.message.substring(0, 50) +
        (content.message.length > 50 ? '...' : ''),
    };
  }

  /**
   * Create in-app notification
   */
  private async createInAppNotification(
    userId: string,
    content: NotificationContent
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      // Check if notifications table exists
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: content.category || 'general',
          title: content.title,
          message: content.message,
          priority: content.priority || 'medium',
          action_url: content.actionUrl,
          metadata: content.metadata || {},
          read: false,
        })
        .select('id')
        .single();

      if (error) {
        // If notifications table doesn't exist, log and continue
        return { success: false, error: 'Notifications table not available' };
      }

      return {
        success: true,
        notificationId: data?.id,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate email HTML template
   */
  private generateEmailTemplate(
    recipientName: string,
    content: NotificationContent
  ): string {
    const priorityColor =
      content.priority === 'urgent'
        ? '#dc2626'
        : content.priority === 'high'
          ? '#ea580c'
          : content.priority === 'medium'
            ? '#f59e0b'
            : '#6b7280';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="border-left: 4px solid ${priorityColor}; padding-left: 20px; margin-bottom: 20px;">
            <h2 style="color: ${priorityColor}; margin-top: 0;">${content.title}</h2>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0;">${content.message}</p>
          </div>
          ${
            content.actionUrl
              ? `<div style="text-align: center; margin-top: 30px;">
                <a href="${content.actionUrl}" style="background-color: ${priorityColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Take Action</a>
              </div>`
              : ''
          }
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p>This is an automated notification from your HR Management System.</p>
            <p>If you have any questions, please contact your administrator.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate SMS message (concise)
   */
  private generateSMSMessage(content: NotificationContent): string {
    // SMS has 160 character limit, keep it concise
    let message = content.title;
    if (content.message && message.length + content.message.length < 150) {
      message += `: ${content.message}`;
    }
    if (content.actionUrl) {
      // Shorten URL if possible
      message += ` - View: ${content.actionUrl}`;
    }
    return message.substring(0, 160);
  }
}

// Export singleton instance
export const notificationService = new UnifiedNotificationService();
