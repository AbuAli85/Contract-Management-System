import { supabase } from './supabaseClient';
import type { BookingChangeEvent, KpiRefreshEvent } from '@/types/booking';

// 5) Live updates (Realtime)

// A) Stream table changes to refresh lists
export function subscribeBookings(onChange: () => void) {
  const channel = supabase
    .channel('bookings_changes')
    .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => onChange())
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// B) (Optional) MV refresh notifications
// If you added pg_notify('mv_bucket_kpis_refreshed', ...) in your refresh function, listen for it:
export function subscribeKpiRefreshed(onPing: () => void) {
  const ch = supabase
    .channel('kpi_notify')
    .on('broadcast', { event: 'mv_bucket_kpis_refreshed' }, onPing)
    .subscribe();
  return () => supabase.removeChannel(ch);
}

// Enhanced subscription functions with more granular control

export function subscribeBookingsWithDetails(
  onChange: (payload: BookingChangeEvent) => void,
  options?: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    filter?: string; // RLS filter
  }
) {
  const { event = '*', filter } = options ?? {};
  
  const channel = supabase
    .channel('bookings_detailed_changes')
    .on('postgres_changes',
        { 
          event, 
          schema: 'public', 
          table: 'bookings',
          filter
        },
        (payload) => {
          const changeEvent: BookingChangeEvent = {
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            table: 'bookings',
            record: payload.new || {},
            oldRecord: payload.old || {}
          };
          onChange(changeEvent);
        })
    .subscribe();
    
  return () => { supabase.removeChannel(channel); };
}

export function subscribeBucketKpisRefresh(
  onRefresh: (event: KpiRefreshEvent) => void,
  onError?: (error: Error) => void
) {
  const channel = supabase
    .channel('bucket_kpis_refresh')
    .on('broadcast', 
        { event: 'mv_bucket_kpis_refreshed' }, 
        (payload) => {
          const refreshEvent: KpiRefreshEvent = {
            event: 'mv_bucket_kpis_refreshed',
            data: payload.payload as string
          };
          onRefresh(refreshEvent);
        })
    .on('system', { event: 'error' }, (payload) => {
      if (onError) {
        onError(new Error(`Subscription error: ${payload.error}`));
      }
    })
    .subscribe();
    
  return () => { supabase.removeChannel(channel); };
}

// Combined subscription for both bookings and KPIs
export function subscribeBookingSystem(
  onBookingsChange: () => void,
  onKpisRefresh: () => void,
  options?: {
    enableKpiNotifications?: boolean;
  }
) {
  const { enableKpiNotifications = true } = options ?? {};
  
  const channels: string[] = [];
  
  // Subscribe to booking changes
  const bookingsChannel = supabase
    .channel('bookings_system_changes')
    .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => onBookingsChange())
    .subscribe();
  
  channels.push(bookingsChannel);
  
  // Optionally subscribe to KPI refresh notifications
  if (enableKpiNotifications) {
    const kpiChannel = supabase
      .channel('kpi_system_notify')
      .on('broadcast', { event: 'mv_bucket_kpis_refreshed' }, () => onKpisRefresh())
      .subscribe();
    
    channels.push(kpiChannel);
  }
  
  // Return cleanup function
  return () => {
    channels.forEach(channelId => {
      supabase.removeChannel(channelId);
    });
  };
}

// Utility function to check if real-time is available
export function isRealtimeAvailable(): boolean {
  try {
    return supabase.channel('test').subscribe() !== null;
  } catch {
    return false;
  }
}

// Debounced subscription for performance
export function createDebouncedSubscription(
  callback: () => void,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout;
  
  const debouncedCallback = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
  
  return debouncedCallback;
}

// Example usage with debouncing for KPI updates
export function subscribeBookingsWithDebouncedKpiRefresh(
  onBookingsChange: () => void,
  onKpisRefresh: () => void,
  debounceDelay: number = 1000
) {
  const debouncedKpiRefresh = createDebouncedSubscription(onKpisRefresh, debounceDelay);
  
  return subscribeBookingSystem(
    onBookingsChange,
    debouncedKpiRefresh,
    { enableKpiNotifications: true }
  );
} 