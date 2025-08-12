import { createClient } from '@/lib/supabase/client';

interface SimpleNotification {
  id?: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  metadata?: any;
  is_read?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface NotificationStats {
  total_notifications: number;
  unread_count: number;
  read_count: number;
  urgent_count: number;
  notification_types: Array<{
    type: string;
    count: number;
    unread_count: number;
  }>;
}

export class SimpleNotificationService {
  private supabase = createClient();

  // Create notification
  async createNotification(
    notification: Omit<SimpleNotification, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase.from('user_notifications').insert([
        {
          user_id: notification.user_id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority || 'medium',
          action_url: notification.action_url,
          metadata: notification.metadata,
          is_read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
      }

      console.log('Notification created successfully');
      return { success: true, error: null };
    } catch (error) {
      console.error('Error in createNotification:', error);
      return { success: false, error: 'Failed to create notification' };
    }
  }

  // Get notifications for user
  async getUserNotifications(
    userId: string,
    limit?: number
  ): Promise<{ data: SimpleNotification[]; error: string | null }> {
    try {
      let query = this.supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getUserNotifications:', error);
      return { data: [], error: 'Failed to fetch notifications' };
    }
  }

  // Mark notification as read
  async markAsRead(
    notificationId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('user_notifications')
        .update({
          is_read: true,
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
        .from('user_notifications')
        .update({
          is_read: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false);

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

  // Get notification statistics
  async getNotificationStats(
    userId?: string
  ): Promise<{ data: NotificationStats | null; error: string | null }> {
    try {
      let query = this.supabase.from('user_notifications').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: notifications, error } = await query;

      if (error) {
        console.error('Error fetching notification stats:', error);
        return { data: null, error: error.message };
      }

      const totalNotifications = notifications?.length || 0;
      const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
      const readCount = notifications?.filter(n => n.is_read).length || 0;
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
          if (!notification.is_read) {
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

      return {
        data: {
          total_notifications: totalNotifications,
          unread_count: unreadCount,
          read_count: readCount,
          urgent_count: urgentCount,
          notification_types: notificationTypes,
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
      const title = this.getContractNotificationTitle(type, contractId);
      const message =
        customMessage || this.getContractNotificationMessage(type);
      const priority = type === 'expired' ? 'urgent' : 'medium';

      for (const userId of recipientIds) {
        await this.createNotification({
          user_id: userId,
          type: 'contract_update',
          title,
          message,
          priority: priority as 'urgent' | 'medium',
          action_url: `/contracts/${contractId}`,
          metadata: {
            contract_id: contractId,
            notification_type: type,
          },
        });
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

      const title =
        daysUntilExpiry <= 0 ? 'Document Expired' : 'Document Expiring Soon';
      const message =
        daysUntilExpiry <= 0
          ? 'A document has expired and requires immediate attention.'
          : `A document will expire in ${daysUntilExpiry} days.`;

      const priority =
        daysUntilExpiry <= 0
          ? 'urgent'
          : daysUntilExpiry <= 7
            ? 'high'
            : 'medium';

      for (const userId of recipientIds) {
        await this.createNotification({
          user_id: userId,
          type: 'document_expiry',
          title,
          message,
          priority: priority as 'urgent' | 'high' | 'medium',
          action_url: `/documents/${documentId}`,
          metadata: {
            document_id: documentId,
            expiry_date: expiryDate,
            days_until_expiry: daysUntilExpiry,
          },
        });
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
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      for (const userId of recipientIds) {
        await this.createNotification({
          user_id: userId,
          type: 'system_announcement',
          title,
          message,
          priority,
          action_url: '/announcements',
          metadata: {
            announcement_type: 'system',
          },
        });
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in sendSystemAnnouncement:', error);
      return { success: false, error: 'Failed to send system announcement' };
    }
  }

  // Helper methods
  private getContractNotificationTitle(
    type: string,
    contractId: string
  ): string {
    switch (type) {
      case 'created':
        return `New Contract Created`;
      case 'updated':
        return `Contract Updated`;
      case 'signed':
        return `Contract Signed`;
      case 'expired':
        return `Contract Expired`;
      case 'reminder':
        return `Contract Reminder`;
      default:
        return `Contract Notification`;
    }
  }

  private getContractNotificationMessage(type: string): string {
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
}
