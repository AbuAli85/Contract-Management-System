/**
 * Real-time Updates Hook
 *
 * Uses Supabase Realtime to subscribe to database changes
 * Automatically updates data when changes occur
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeOptions {
  table: string;
  schema?: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: (payload: any) => void;
}

/**
 * Hook for real-time database updates
 *
 * @example
 * ```tsx
 * useRealtimeUpdates({
 *   table: 'contracts',
 *   filter: 'status=eq.active',
 *   onChange: (payload) => {
 *     console.log('Contract changed:', payload);
 *     refetchData();
 *   }
 * });
 * ```
 */
export function useRealtimeUpdates(options: RealtimeOptions) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const channelName = `${options.table}-changes-${Math.random()}`;

    const channelBuilder = supabase.channel(channelName).on(
      'postgres_changes' as any,
      {
        event: options.event || '*',
        schema: options.schema || 'public',
        table: options.table,
        filter: options.filter,
      },
      payload => {

        // Call specific event handler
        switch (payload.eventType) {
          case 'INSERT':
            options.onInsert?.(payload);
            break;
          case 'UPDATE':
            options.onUpdate?.(payload);
            break;
          case 'DELETE':
            options.onDelete?.(payload);
            break;
        }

        // Always call general onChange handler
        options.onChange?.(payload);
      }
    );

    const newChannel = channelBuilder.subscribe();
    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [options.table, options.schema, options.filter, options.event]);

  return { channel };
}

/**
 * Hook for real-time metrics updates
 * Refetches metrics when relevant tables change
 */
export function useRealtimeMetrics(onUpdate: () => void) {
  // Subscribe to contracts changes
  useRealtimeUpdates({
    table: 'contracts',
    onChange: () => {
      onUpdate();
    },
  });

  // Subscribe to promoters changes
  useRealtimeUpdates({
    table: 'promoters',
    onChange: () => {
      onUpdate();
    },
  });

  // Subscribe to parties changes
  useRealtimeUpdates({
    table: 'parties',
    onChange: () => {
      onUpdate();
    },
  });
}

/**
 * Hook for real-time data fetching
 * Combines data fetching with real-time updates
 */
export function useRealtimeData<T>(
  fetchFn: () => Promise<T>,
  options: Omit<RealtimeOptions, 'onChange'>
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to real-time updates
  useRealtimeUpdates({
    ...options,
    onChange: payload => {
      fetchData();
    },
  });

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Hook for real-time presence (who's online)
 */
export function useRealtimePresence(roomName: string) {
  const [presenceState, setPresenceState] = useState<Record<string, any>>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(roomName);

    // Listen for presence changes
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setPresenceState(state);

        // Extract online user IDs
        const users = Object.keys(state);
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          // Track this user's presence
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomName]);

  return {
    presenceState,
    onlineUsers,
    count: onlineUsers.length,
  };
}

/**
 * Hook for real-time notifications
 */
export function useRealtimeNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useRealtimeUpdates({
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
    onInsert: payload => {
      setNotifications(prev => [payload.new, ...prev]);
      if (!payload.new.read) {
        setUnreadCount(prev => prev + 1);
      }
    },
    onUpdate: payload => {
      setNotifications(prev =>
        prev.map(n => (n.id === payload.new.id ? payload.new : n))
      );
      // Recalculate unread count
      setUnreadCount(notifications.filter(n => !n.read).length);
    },
    onDelete: payload => {
      setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
      if (!payload.old.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    },
  });

  const markAsRead = useCallback(async (notificationId: string) => {
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    setUnreadCount(0);
  }, [userId]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
