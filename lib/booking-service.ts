import { supabase } from './supabaseClient';
import type { 
  BookingWithDetails, 
  BucketKPI, 
  BookingFilters, 
  PaginationParams,
  RecentBookingsResult,
  BucketKPIResult,
  BookingPageResult
} from '@/types/booking';

// 4) Read patterns (frontend)

// A) Recent bookings (ordered by bucket then time)
export async function fetchRecentBookings(params?: {
  limit?: number;
  providerName?: string;
  clientName?: string;
  onlyUpcoming?: boolean;
}): Promise<RecentBookingsResult> {
  const { limit = 50, providerName, clientName, onlyUpcoming } = params ?? {};
  
  let q = supabase
    .from('v_bookings_recent_omt')
    .select('*', { count: 'exact' })
    .order('start_bucket_order', { ascending: true })
    .order('start_time_omt', { ascending: true })
    .order('id', { ascending: true })
    .limit(limit);

  if (providerName) q = q.eq('provider_name', providerName);
  if (clientName)   q = q.eq('client_name', clientName);
  if (onlyUpcoming) q = q.eq('is_upcoming', true);

  const { data, error, count } = await q;
  if (error) throw error;
  
  return { 
    data: data as BookingWithDetails[], 
    count: count || 0 
  };
}

// B) KPI widget (stable buckets)
export async function fetchBucketKpis(): Promise<BucketKPI[]> {
  const { data, error } = await supabase
    .from('mv_bucket_kpis_full')
    .select('*')
    .order('bucket_order', { ascending: true });
    
  if (error) throw error;
  return data as BucketKPI[];
}

// C) Pagination (keyset or range)
export async function fetchBookingsPage({ from = 0, to = 49 }: PaginationParams): Promise<BookingPageResult> {
  const { data, error, count } = await supabase
    .from('v_bookings_recent_omt')
    .select('*', { count: 'exact' })
    .order('start_bucket_order', { ascending: true })
    .order('start_time_omt', { ascending: true })
    .range(from, to);
    
  if (error) throw error;
  
  return { 
    data: data as BookingWithDetails[], 
    count: count || 0 
  };
}

// Enhanced functions using the database functions we created

export async function fetchBookingsWithFilters(filters: BookingFilters): Promise<RecentBookingsResult> {
  const { 
    limit = 50, 
    providerName, 
    clientName, 
    onlyUpcoming, 
    status, 
    serviceCategory, 
    dateFrom, 
    dateTo 
  } = filters;

  let q = supabase
    .rpc('get_recent_bookings', {
      limit_count: limit,
      provider_name_filter: providerName || null,
      client_name_filter: clientName || null,
      only_upcoming_filter: onlyUpcoming || null,
      status_filter: status || null,
      service_category_filter: serviceCategory || null,
      date_from_filter: dateFrom || null,
      date_to_filter: dateTo || null
    })
    .select('*', { count: 'exact' });

  const { data, error, count } = await q;
  if (error) throw error;
  
  return { 
    data: data as BookingWithDetails[], 
    count: count || 0 
  };
}

export async function fetchBookingsPageWithFilters(
  pagination: PaginationParams, 
  filters: Omit<BookingFilters, 'limit'>
): Promise<BookingPageResult> {
  const { from = 0, to = 49 } = pagination;
  const { 
    providerName, 
    clientName, 
    onlyUpcoming, 
    status, 
    serviceCategory, 
    dateFrom, 
    dateTo 
  } = filters;

  let q = supabase
    .rpc('get_bookings_page', {
      page_from: from,
      page_to: to,
      provider_name_filter: providerName || null,
      client_name_filter: clientName || null,
      only_upcoming_filter: onlyUpcoming || null,
      status_filter: status || null,
      service_category_filter: serviceCategory || null,
      date_from_filter: dateFrom || null,
      date_to_filter: dateTo || null
    })
    .select('*', { count: 'exact' });

  const { data, error, count } = await q;
  if (error) throw error;
  
  return { 
    data: data as BookingWithDetails[], 
    count: count || 0 
  };
}

export async function getBookingsCount(filters: Omit<BookingFilters, 'limit'>): Promise<number> {
  const { 
    providerName, 
    clientName, 
    onlyUpcoming, 
    status, 
    serviceCategory, 
    dateFrom, 
    dateTo 
  } = filters;

  const { data, error } = await supabase
    .rpc('get_bookings_count', {
      provider_name_filter: providerName || null,
      client_name_filter: clientName || null,
      only_upcoming_filter: onlyUpcoming || null,
      status_filter: status || null,
      service_category_filter: serviceCategory || null,
      date_from_filter: dateFrom || null,
      date_to_filter: dateTo || null
    });

  if (error) throw error;
  return data || 0;
}

export async function getBucketKpisWithFilters(filters?: {
  providerFilter?: string;
  clientFilter?: string;
  serviceFilter?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<BucketKPI[]> {
  const { data, error } = await supabase
    .rpc('get_bucket_kpis', {
      provider_filter: filters?.providerFilter || null,
      client_filter: filters?.clientFilter || null,
      service_filter: filters?.serviceFilter || null,
      date_from: filters?.dateFrom || null,
      date_to: filters?.dateTo || null
    });

  if (error) throw error;
  return data as BucketKPI[];
}

export async function refreshBucketKpis(): Promise<void> {
  const { error } = await supabase.rpc('refresh_bucket_kpis_concurrently');
  if (error) throw error;
}

// 5) Write patterns (frontend)

// A) Update booking status
export async function setBookingStatus(id: string, status: string) {
  const { error } = await supabase.rpc('update_booking_status', { 
    p_id: id, 
    p_status: status 
  });
  if (error) throw error;
}

// B) Create new booking
export async function createBooking(params: {
  serviceId: string;
  clientId: string;
  scheduledAt: string;
  durationMinutes?: number;
  participantCount?: number;
  totalPrice?: number;
  currency?: string;
  notes?: string;
  clientNotes?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_booking', {
    p_service_id: params.serviceId,
    p_client_id: params.clientId,
    p_scheduled_at: params.scheduledAt,
    p_duration_minutes: params.durationMinutes || null,
    p_participant_count: params.participantCount || 1,
    p_total_price: params.totalPrice || null,
    p_currency: params.currency || 'USD',
    p_notes: params.notes || null,
    p_client_notes: params.clientNotes || null
  });
  
  if (error) throw error;
  return data;
}

// C) Cancel booking (convenience function)
export async function cancelBooking(id: string): Promise<void> {
  await setBookingStatus(id, 'cancelled');
}

// D) Confirm booking (convenience function)
export async function confirmBooking(id: string): Promise<void> {
  await setBookingStatus(id, 'confirmed');
}

// E) Mark booking as in progress
export async function startBooking(id: string): Promise<void> {
  await setBookingStatus(id, 'in_progress');
}

// F) Complete booking
export async function completeBooking(id: string): Promise<void> {
  await setBookingStatus(id, 'completed');
} 