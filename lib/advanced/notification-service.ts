import { createClient } from '@/lib/supabase/client';

interface NotificationData {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  metadata?: any;
  send_email?: boolean;
  send_sms?: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

interface NotificationInsert {
  user_id: string;
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  metadata?: any;
  send_email?: boolean;
  send_sms?: boolean;
}

export interface NotificationDetails extends NotificationData {
  user_name?: string;
}

export interface NotificationFilters {
  userId?: string;
  type?: string;
  status?: 'read' | 'unread';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dateFrom?: string;
  dateTo?: string;
}

export interface NotificationStats {
  total_notifications: number;
  unread_count: number;
  read_count: number;
  urgent_count: number;
  notification_types: Array<{
    type: string;
    count: number;
    unread_count: number;
  }>;
  recent_activity: Array<{
    date: string;
    count: number;
  }>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject_template: string;
  body_template: string;
  email_template?: string;
  sms_template?: string;
  variables: string[];
}

export interface BulkNotificationJob {
  id: string;
  title: string;
  recipients: string[];
  template_id: string;
  variables: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduled_at?: string;
  sent_count: number;
  failed_count: number;
  errors: string[];
}

export class NotificationService {
  private supabase = createClient();

  // Create notification
  async createNotification(
    notification: NotificationInsert
  ): Promise<{ data: NotificationData | null; error: string | null }> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_notifications')
        .insert([
          {
            ...notification,
            priority: notification.priority || 'medium',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return { data: null, error: error.message };
      }

      // Send real-time notification
      await this.sendRealTimeNotification(data as NotificationData);

      // Send email if enabled
      if (notification.send_email) {
        await this.sendEmailNotification(data as NotificationData);
      }

      // Send SMS if enabled
      if (notification.send_sms) {
        await this.sendSMSNotification(data as NotificationData);
      }

      return { data: data as NotificationData, error: null };
    } catch (error) {
      console.error('Error in createNotification:', error);
      return { data: null, error: 'Failed to create notification' };
    }
  }

  // Get notifications with filters
  async getNotifications(
    filters: NotificationFilters = {}
  ): Promise<{ data: NotificationDetails[]; error: string | null }> {
    try {
      let query = this.supabase
        .from('notifications')
        .select(
          `
          *,
          users(full_name)
        `
        )
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.status === 'read') {
        query = query.not('read_at', 'is', null);
      }
      if (filters.status === 'unread') {
        query = query.is('read_at', null);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return { data: [], error: 'Failed to fetch notifications' };
    }
  }

  // Mark notification as read
  async markAsRead(
    notificationId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(
    userId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return {
        success: false,
        error: 'Failed to mark all notifications as read',
      };
    }
  }

  // Delete notification
  async deleteNotification(
    notificationId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      return { success: false, error: 'Failed to delete notification' };
    }
  }

  // Get notification statistics
  async getNotificationStats(
    userId?: string
  ): Promise<{ data: NotificationStats | null; error: string | null }> {
    try {
      let query = this.supabase.from('notifications').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: notifications, error } = await query;

      if (error) {
        console.error('Error fetching notification stats:', error);
        return { data: null, error: error.message };
      }

      const totalNotifications = notifications?.length || 0;
      const unreadCount = notifications?.filter(n => !n.read_at).length || 0;
      const readCount = notifications?.filter(n => n.read_at).length || 0;
      const urgentCount =
        notifications?.filter(n => n.priority === 'urgent').length || 0;

      // Group by type
      const typeCounts = (notifications || []).reduce(
        (acc, notification) => {
          const type = notification.type || 'general';
          if (!acc[type]) {
            acc[type] = { count: 0, unread_count: 0 };
          }
          acc[type].count++;
          if (!notification.read_at) {
            acc[type].unread_count++;
          }
          return acc;
        },
        {} as Record<string, { count: number; unread_count: number }>
      );

      const notificationTypes = Object.entries(typeCounts).map(
        ([type, counts]) => ({
          type,
          count: counts.count,
          unread_count: counts.unread_count,
        })
      );

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentNotifications = (notifications || []).filter(
        n => new Date(n.created_at!) >= sevenDaysAgo
      );

      const activityByDate = recentNotifications.reduce(
        (acc, notification) => {
          const date = notification.created_at!.split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const recentActivity = Object.entries(activityByDate)
        .map(([date, count]) => ({ date, count }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      return {
        data: {
          total_notifications: totalNotifications,
          unread_count: unreadCount,
          read_count: readCount,
          urgent_count: urgentCount,
          notification_types: notificationTypes,
          recent_activity: recentActivity,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error in getNotificationStats:', error);
      return { data: null, error: 'Failed to get notification statistics' };
    }
  }

  // Send contract notification
  async sendContractNotification(
    contractId: string,
    type: 'created' | 'updated' | 'signed' | 'expired' | 'reminder',
    recipientIds: string[],
    customMessage?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get contract details
      const { data: contract, error: contractError } = await this.supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (contractError || !contract) {
        return { success: false, error: 'Contract not found' };
      }

      const notifications = recipientIds.map(userId => ({
        user_id: userId,
        type: 'contract_update',
        title: this.getContractNotificationTitle(type, contract),
        message:
          customMessage || this.getContractNotificationMessage(type, contract),
        priority:
          type === 'expired' ? ('urgent' as const) : ('medium' as const),
        action_url: `/contracts/${contractId}`,
        metadata: {
          contract_id: contractId,
          contract_number: contract.contract_number,
          notification_type: type,
        },
        send_email: type === 'expired' || type === 'signed',
        send_sms: type === 'expired',
      }));

      // Create all notifications
      let successCount = 0;
      const errors: string[] = [];

      for (const notification of notifications) {
        const result = await this.createNotification(notification);
        if (result.error) {
          errors.push(result.error);
        } else {
          successCount++;
        }
      }

      if (errors.length > 0 && successCount === 0) {
        return { success: false, error: errors[0] };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in sendContractNotification:', error);
      return { success: false, error: 'Failed to send contract notification' };
    }
  }

  // Send document expiry notification
  async sendDocumentExpiryNotification(
    documentId: string,
    expiryDate: string,
    recipientIds: string[]
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const daysUntilExpiry = Math.ceil(
        (new Date(expiryDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const notifications = recipientIds.map(userId => ({
        user_id: userId,
        type: 'document_expiry',
        title:
          daysUntilExpiry <= 0 ? 'Document Expired' : 'Document Expiring Soon',
        message:
          daysUntilExpiry <= 0
            ? 'A document has expired and requires immediate attention.'
            : `A document will expire in ${daysUntilExpiry} days.`,
        priority:
          daysUntilExpiry <= 0
            ? ('urgent' as const)
            : daysUntilExpiry <= 7
              ? ('high' as const)
              : ('medium' as const),
        action_url: `/documents/${documentId}`,
        metadata: {
          document_id: documentId,
          expiry_date: expiryDate,
          days_until_expiry: daysUntilExpiry,
        },
        send_email: daysUntilExpiry <= 7,
        send_sms: daysUntilExpiry <= 0,
      }));

      // Create notifications
      for (const notification of notifications) {
        await this.createNotification(notification);
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in sendDocumentExpiryNotification:', error);
      return {
        success: false,
        error: 'Failed to send document expiry notification',
      };
    }
  }

  // Send system announcement
  async sendSystemAnnouncement(
    title: string,
    message: string,
    recipientIds: string[],
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    scheduledAt?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const notifications = recipientIds.map(userId => ({
        user_id: userId,
        type: 'system_announcement',
        title,
        message,
        priority,
        action_url: '/announcements',
        metadata: {
          announcement_type: 'system',
          scheduled_at: scheduledAt,
        },
        send_email: priority === 'urgent' || priority === 'high',
        send_sms: priority === 'urgent',
      }));

      // If scheduled, store for later sending
      if (scheduledAt) {
        // TODO: Implement scheduled notifications
        console.log('Scheduled notification for:', scheduledAt);
      }

      // Create notifications
      for (const notification of notifications) {
        await this.createNotification(notification);
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in sendSystemAnnouncement:', error);
      return { success: false, error: 'Failed to send system announcement' };
    }
  }

  // Subscribe to real-time notifications for user
  async subscribeToUserNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): Promise<() => void> {
    try {
      const subscription = this.supabase
        .channel(`notifications:user:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          payload => {
            callback(payload.new as Notification);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up notification subscription:', error);
      return () => {};
    }
  }

  // Bulk notification operations
  async sendBulkNotifications(
    templateId: string,
    recipients: Array<{
      user_id: string;
      variables: Record<string, any>;
    }>,
    scheduledAt?: string
  ): Promise<BulkNotificationJob> {
    try {
      const jobId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const job: BulkNotificationJob = {
        id: jobId,
        title: `Bulk notification job ${jobId}`,
        recipients: recipients.map(r => r.user_id),
        template_id: templateId,
        variables: {},
        status: 'pending',
        scheduled_at: scheduledAt,
        sent_count: 0,
        failed_count: 0,
        errors: [],
      };

      // Process immediately if not scheduled
      if (!scheduledAt) {
        await this.processBulkNotificationJob(job, recipients);
      }

      return job;
    } catch (error) {
      console.error('Error in sendBulkNotifications:', error);
      throw new Error('Failed to create bulk notification job');
    }
  }

  // Helper methods
  private async sendRealTimeNotification(
    notification: Notification
  ): Promise<void> {
    try {
      // Send via WebSocket/SSE to connected clients
      console.log('Real-time notification sent:', notification.id);

      // TODO: Implement actual real-time sending
      // - WebSocket broadcast
      // - Server-sent events
      // - Push notifications for mobile
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }
  }

  private async sendEmailNotification(
    notification: Notification
  ): Promise<void> {
    try {
      // Get user email
      const { data: user } = await this.supabase
        .from('users')
        .select('email, full_name')
        .eq('id', notification.user_id)
        .single();

      if (!user?.email) {
        console.warn('User email not found for notification:', notification.id);
        return;
      }

      // TODO: Implement email sending
      console.log('Email notification sent to:', user.email);

      // Example email service integration:
      // await emailService.send({
      //   to: user.email,
      //   subject: notification.title,
      //   html: this.generateEmailTemplate(notification, user)
      // })
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  private async sendSMSNotification(notification: Notification): Promise<void> {
    try {
      // Get user phone number
      const { data: user } = await this.supabase
        .from('users')
        .select('phone_number, full_name')
        .eq('id', notification.user_id)
        .single();

      if (!user?.phone_number) {
        console.warn(
          'User phone number not found for notification:',
          notification.id
        );
        return;
      }

      // TODO: Implement SMS sending
      console.log('SMS notification sent to:', user.phone_number);

      // Example SMS service integration:
      // await smsService.send({
      //   to: user.phone_number,
      //   message: this.generateSMSMessage(notification)
      // })
    } catch (error) {
      console.error('Error sending SMS notification:', error);
    }
  }

  private getContractNotificationTitle(type: string, contract: any): string {
    switch (type) {
      case 'created':
        return `New Contract Created: ${contract.contract_number}`;
      case 'updated':
        return `Contract Updated: ${contract.contract_number}`;
      case 'signed':
        return `Contract Signed: ${contract.contract_number}`;
      case 'expired':
        return `Contract Expired: ${contract.contract_number}`;
      case 'reminder':
        return `Contract Reminder: ${contract.contract_number}`;
      default:
        return `Contract Notification: ${contract.contract_number}`;
    }
  }

  private getContractNotificationMessage(type: string, contract: any): string {
    switch (type) {
      case 'created':
        return `A new contract has been created and is ready for review.`;
      case 'updated':
        return `Contract details have been updated. Please review the changes.`;
      case 'signed':
        return `The contract has been successfully signed by all parties.`;
      case 'expired':
        return `This contract has expired and requires immediate attention.`;
      case 'reminder':
        return `This is a reminder about your contract that requires action.`;
      default:
        return `There has been an update to your contract.`;
    }
  }

  private async processBulkNotificationJob(
    job: BulkNotificationJob,
    recipients: Array<{ user_id: string; variables: Record<string, any> }>
  ): Promise<void> {
    try {
      job.status = 'processing';

      for (const recipient of recipients) {
        try {
          // Get template and process variables
          const processedNotification = await this.processNotificationTemplate(
            job.template_id,
            recipient.variables
          );

          await this.createNotification({
            user_id: recipient.user_id,
            type: processedNotification.type,
            title: processedNotification.title,
            message: processedNotification.message,
            priority: processedNotification.priority,
            action_url: processedNotification.action_url,
            metadata: {
              bulk_job_id: job.id,
              ...processedNotification.metadata,
            },
          });

          job.sent_count++;
        } catch (error) {
          job.failed_count++;
          job.errors.push(`Failed to send to ${recipient.user_id}: ${error}`);
        }
      }

      job.status = job.failed_count === 0 ? 'completed' : 'completed';
    } catch (error) {
      job.status = 'failed';
      job.errors.push(`Job processing failed: ${error}`);
    }
  }

  private async processNotificationTemplate(
    templateId: string,
    variables: Record<string, any>
  ): Promise<any> {
    // TODO: Implement template processing
    // This would fetch the template and replace variables
    return {
      type: 'general',
      title: 'Notification',
      message: 'You have a new notification',
      priority: 'medium',
      action_url: null,
      metadata: {},
    };
  }
}
