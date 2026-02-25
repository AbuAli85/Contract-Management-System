'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Types for booking events
export interface BookingEventPayload {
  id: string;
  booking_id: string;
  event_type: string;
  old_value?: any;
  new_value?: any;
  description: string;
  created_by?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface BookingEventCallback {
  (payload: BookingEventPayload): void;
}

// Booking subscription manager
export class BookingSubscriptionManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private supabase = createClient();

  /**
   * Subscribe to booking events for a specific booking
   */
  subscribeToBookingEvents(
    bookingId: string,
    onEvent: BookingEventCallback
  ): () => void {
    const channelId = `booking_events:${bookingId}`;

    // Unsubscribe existing channel if it exists
    this.unsubscribeFromBooking(bookingId);

    const channel = this.supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_events',
          filter: `booking_id=eq.${bookingId}`,
        },
        payload => {
          onEvent(payload.new as BookingEventPayload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        payload => {
          // Create a synthetic event for booking updates
          const syntheticEvent: BookingEventPayload = {
            id: `synthetic_${Date.now()}`,
            booking_id: bookingId,
            event_type: 'booking_updated',
            old_value: payload.old,
            new_value: payload.new,
            description: 'Booking details updated',
            created_at: new Date().toISOString(),
          };
          onEvent(syntheticEvent);
        }
      )
      .subscribe(status => {});

    this.channels.set(bookingId, channel);

    // Return unsubscribe function
    return () => this.unsubscribeFromBooking(bookingId);
  }

  /**
   * Subscribe to all booking events for a user (provider or client)
   */
  subscribeToUserBookingEvents(
    userId: string,
    onEvent: BookingEventCallback
  ): () => void {
    const channelId = `user_bookings:${userId}`;

    // Unsubscribe existing channel if it exists
    if (this.channels.has(userId)) {
      this.channels.get(userId)?.unsubscribe();
      this.channels.delete(userId);
    }

    const channel = this.supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_events',
          filter: `created_by=eq.${userId}`,
        },
        payload => {
          onEvent(payload.new as BookingEventPayload);
        }
      )
      .subscribe(status => {});

    this.channels.set(userId, channel);

    return () => {
      if (this.channels.has(userId)) {
        this.channels.get(userId)?.unsubscribe();
        this.channels.delete(userId);
      }
    };
  }

  /**
   * Subscribe to provider's booking events (all bookings for services they provide)
   */
  subscribeToProviderBookingEvents(
    providerId: string,
    onEvent: BookingEventCallback
  ): () => void {
    const channelId = `provider_bookings:${providerId}`;

    if (this.channels.has(channelId)) {
      this.channels.get(channelId)?.unsubscribe();
      this.channels.delete(channelId);
    }

    // We'll need to filter on the client side since RLS handles the security
    const channel = this.supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_events',
        },
        async payload => {
          // Verify this event is for a booking related to this provider
          const bookingId = payload.new?.booking_id;
          if (bookingId) {
            const { data: booking } = await this.supabase
              .from('bookings')
              .select('provider_id')
              .eq('id', bookingId)
              .single();

            if (booking?.provider_id === providerId) {
              onEvent(payload.new as BookingEventPayload);
            }
          }
        }
      )
      .subscribe(status => {});

    this.channels.set(channelId, channel);

    return () => {
      if (this.channels.has(channelId)) {
        this.channels.get(channelId)?.unsubscribe();
        this.channels.delete(channelId);
      }
    };
  }

  /**
   * Unsubscribe from booking events for a specific booking
   */
  unsubscribeFromBooking(bookingId: string): void {
    const channel = this.channels.get(bookingId);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(bookingId);
    }
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel, id) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }

  /**
   * Get active subscription count
   */
  getActiveSubscriptionCount(): number {
    return this.channels.size;
  }

  /**
   * Get list of active subscription IDs
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.channels.keys());
  }
}

// Singleton instance
export const bookingSubscriptionManager = new BookingSubscriptionManager();

// Convenient functions for direct use
export function subscribeToBookingEvents(
  bookingId: string,
  onEvent: BookingEventCallback
): () => void {
  return bookingSubscriptionManager.subscribeToBookingEvents(
    bookingId,
    onEvent
  );
}

export function subscribeToUserBookingEvents(
  userId: string,
  onEvent: BookingEventCallback
): () => void {
  return bookingSubscriptionManager.subscribeToUserBookingEvents(
    userId,
    onEvent
  );
}

export function subscribeToProviderBookingEvents(
  providerId: string,
  onEvent: BookingEventCallback
): () => void {
  return bookingSubscriptionManager.subscribeToProviderBookingEvents(
    providerId,
    onEvent
  );
}

// React hook for booking events
export function useBookingEvents(bookingId: string | null) {
  const [events, setEvents] = React.useState<BookingEventPayload[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!bookingId) {
      setEvents([]);
      setIsConnected(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = subscribeToBookingEvents(bookingId, event => {
        setEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50 events
        setIsConnected(true);
        setError(null);
      });
    } catch (err: any) {
      setError(err.message);
      setIsConnected(false);
    }

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      setIsConnected(false);
    };
  }, [bookingId]);

  return {
    events,
    isConnected,
    error,
    clearEvents: () => setEvents([]),
  };
}

// React hook for user booking events
export function useUserBookingEvents(userId: string | null) {
  const [events, setEvents] = React.useState<BookingEventPayload[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    if (!userId) {
      setEvents([]);
      setIsConnected(false);
      return;
    }

    const unsubscribe = subscribeToUserBookingEvents(userId, event => {
      setEvents(prev => [event, ...prev].slice(0, 100)); // Keep last 100 events
      setIsConnected(true);
    });

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [userId]);

  return {
    events,
    isConnected,
    clearEvents: () => setEvents([]),
  };
}

// Helper function to format event descriptions
export function formatEventDescription(event: BookingEventPayload): string {
  switch (event.event_type) {
    case 'booking_created':
      return 'Booking request created';
    case 'booking_confirmed':
      return 'Booking confirmed by provider';
    case 'booking_cancelled':
      return 'Booking cancelled';
    case 'booking_completed':
      return 'Booking marked as completed';
    case 'booking_updated':
      return 'Booking details updated';
    case 'payment_received':
      return 'Payment received';
    case 'reminder_sent':
      return 'Reminder notification sent';
    default:
      return event.description || 'Booking event occurred';
  }
}
