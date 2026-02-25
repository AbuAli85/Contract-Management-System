import { createClient } from '@/lib/supabase/client';

export interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type:
    | 'booking_created'
    | 'booking_updated'
    | 'payment_received'
    | 'review_received'
    | 'system'
    | 'reminder';
  metadata?: Record<string, any>;
  expires_hours?: number;
}

export class NotificationService {
  private supabase = createClient();

  /**
   * Create a notification for a specific user
   */
  async createNotification(data: NotificationData) {
    try {
      const { data: notification, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          title: data.title,
          message: data.message,
          type: data.type,
          metadata: data.metadata || {},
          expires_at: data.expires_hours
            ? new Date(
                Date.now() + data.expires_hours * 60 * 60 * 1000
              ).toISOString()
            : null,
        })
        .select()
        .single();

      if (error) throw error;

      return notification;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create booking-related notifications
   */
  async createBookingNotification(
    providerId: string,
    booking: {
      id: string;
      booking_number: string;
      client_name: string;
      service_title: string;
      scheduled_start: string;
      quoted_price: number;
      status: string;
    },
    type: 'created' | 'updated' | 'cancelled' | 'confirmed' | 'completed'
  ) {
    const titles = {
      created: '🆕 New Booking Request',
      updated: '📝 Booking Updated',
      cancelled: '❌ Booking Cancelled',
      confirmed: '✅ Booking Confirmed',
      completed: '🎉 Booking Completed',
    };

    const messages = {
      created: `New booking for "${booking.service_title}" from ${booking.client_name} on ${new Date(booking.scheduled_start).toLocaleDateString()}`,
      updated: `Booking ${booking.booking_number} has been updated`,
      cancelled: `Booking ${booking.booking_number} has been cancelled`,
      confirmed: `Booking ${booking.booking_number} has been confirmed`,
      completed: `Booking ${booking.booking_number} has been completed`,
    };

    return this.createNotification({
      user_id: providerId,
      title: titles[type],
      message: messages[type],
      type: type === 'created' ? 'booking_created' : 'booking_updated',
      metadata: {
        booking_id: booking.id,
        booking_number: booking.booking_number,
        client_name: booking.client_name,
        service_title: booking.service_title,
        quoted_price: booking.quoted_price,
        status: booking.status,
        scheduled_start: booking.scheduled_start,
      },
      expires_hours: type === 'created' ? 72 : 48, // New bookings expire in 3 days, updates in 2 days
    });
  }

  /**
   * Create payment notification
   */
  async createPaymentNotification(
    providerId: string,
    payment: {
      amount: number;
      booking_number: string;
      status: 'completed' | 'failed';
      payment_method: string;
    }
  ) {
    const isSuccess = payment.status === 'completed';

    return this.createNotification({
      user_id: providerId,
      title: isSuccess ? '💰 Payment Received' : '⚠️ Payment Failed',
      message: isSuccess
        ? `Payment of $${payment.amount} received for booking ${payment.booking_number}`
        : `Payment failed for booking ${payment.booking_number} - please contact the client`,
      type: 'payment_received',
      metadata: {
        amount: payment.amount,
        booking_number: payment.booking_number,
        status: payment.status,
        payment_method: payment.payment_method,
      },
      expires_hours: isSuccess ? null : 24, // Failed payments expire in 24 hours
    });
  }

  /**
   * Create reminder notification
   */
  async createReminderNotification(
    userId: string,
    reminder: {
      title: string;
      message: string;
      booking_id?: string;
      booking_number?: string;
      scheduled_start?: string;
    }
  ) {
    return this.createNotification({
      user_id: userId,
      title: `⏰ ${reminder.title}`,
      message: reminder.message,
      type: 'reminder',
      metadata: {
        booking_id: reminder.booking_id,
        booking_number: reminder.booking_number,
        scheduled_start: reminder.scheduled_start,
      },
      expires_hours: 48,
    });
  }

  /**
   * Create system notification
   */
  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ) {
    return this.createNotification({
      user_id: userId,
      title,
      message,
      type: 'system',
      metadata,
      expires_hours: 168, // 1 week
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string, limit: number = 20) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string) {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications() {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }
}

// Create a singleton instance
export const notificationService = new NotificationService();

// Helper hooks for React components
export function useNotificationService() {
  return notificationService;
}

// Test functions for development
export const createTestNotifications = async (userId: string) => {
  const service = notificationService;

  try {
    // Test booking notification
    await service.createBookingNotification(
      userId,
      {
        id: 'test-booking-1',
        booking_number: 'BK20250107001',
        client_name: 'John Doe',
        service_title: 'Business Consultation',
        scheduled_start: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString(),
        quoted_price: 150,
        status: 'pending',
      },
      'created'
    );

    // Test payment notification
    await service.createPaymentNotification(userId, {
      amount: 250,
      booking_number: 'BK20250106001',
      status: 'completed',
      payment_method: 'credit_card',
    });

    // Test reminder notification
    await service.createReminderNotification(userId, {
      title: 'Upcoming Booking Tomorrow',
      message: 'You have a consultation with Jane Smith tomorrow at 2:00 PM',
      booking_number: 'BK20250108001',
      scheduled_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    // Test system notification
    await service.createSystemNotification(
      userId,
      'Platform Update Available',
      'New features have been added to your dashboard. Check out the updated booking management tools!'
    );
  } catch (error) {
  }
};
