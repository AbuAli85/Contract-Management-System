import { getSupabaseClient } from './supabaseClient';
import type {
  BookingWithDetails,
  BucketKPI,
  BookingFilters,
  PaginationParams,
  RecentBookingsResult,
  BucketKPIResult,
  BookingPageResult,
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

  let q = getSupabaseClient()
    .from('v_bookings_recent_omt')
    .select('*', { count: 'exact' })
    .order('start_bucket_order', { ascending: true })
    .order('start_time_omt', { ascending: true })
    .order('id', { ascending: true })
    .limit(limit);

  if (providerName) q = q.eq('provider_name', providerName);
  if (clientName) q = q.eq('client_name', clientName);
  if (onlyUpcoming) q = q.eq('is_upcoming', true);

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    data: data as BookingWithDetails[],
    count: count || 0,
  };
}

// B) KPI widget (stable buckets)
export async function fetchBucketKpis(): Promise<BucketKPI[]> {
  const { data, error } = await getSupabaseClient()
    .from('mv_bucket_kpis_full')
    .select('*')
    .order('bucket_order', { ascending: true });

  if (error) throw error;
  return data as BucketKPI[];
}

// C) Pagination (keyset or range)
export async function fetchBookingsPage({
  from = 0,
  to = 49,
}: PaginationParams): Promise<BookingPageResult> {
  const { data, error, count } = await getSupabaseClient()
    .from('v_bookings_recent_omt')
    .select('*', { count: 'exact' })
    .order('start_bucket_order', { ascending: true })
    .order('start_time_omt', { ascending: true })
    .range(from, to);

  if (error) throw error;

  return {
    data: data as BookingWithDetails[],
    count: count || 0,
  };
}

// Enhanced functions using the database functions we created

export async function fetchBookingsWithFilters(
  filters: BookingFilters
): Promise<RecentBookingsResult> {
  const {
    limit = 50,
    providerName,
    clientName,
    onlyUpcoming,
    status,
    serviceCategory,
    dateFrom,
    dateTo,
  } = filters;

  const q = getSupabaseClient()
    .rpc('get_recent_bookings', {
      limit_count: limit,
      provider_name_filter: providerName || null,
      client_name_filter: clientName || null,
      only_upcoming_filter: onlyUpcoming || null,
      status_filter: status || null,
      service_category_filter: serviceCategory || null,
      date_from_filter: dateFrom || null,
      date_to_filter: dateTo || null,
    })
    .select('*', { count: 'exact' });

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    data: data as BookingWithDetails[],
    count: count || 0,
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
    dateTo,
  } = filters;

  const q = supabase
    .rpc('get_bookings_page', {
      page_from: from,
      page_to: to,
      provider_name_filter: providerName || null,
      client_name_filter: clientName || null,
      only_upcoming_filter: onlyUpcoming || null,
      status_filter: status || null,
      service_category_filter: serviceCategory || null,
      date_from_filter: dateFrom || null,
      date_to_filter: dateTo || null,
    })
    .select('*', { count: 'exact' });

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    data: data as BookingWithDetails[],
    count: count || 0,
  };
}

export async function getBookingsCount(
  filters: Omit<BookingFilters, 'limit'>
): Promise<number> {
  const {
    providerName,
    clientName,
    onlyUpcoming,
    status,
    serviceCategory,
    dateFrom,
    dateTo,
  } = filters;

  const { data, error } = await (supabase as any).rpc('get_bookings_count', {
    provider_name_filter: providerName || null,
    client_name_filter: clientName || null,
    only_upcoming_filter: onlyUpcoming || null,
    status_filter: status || null,
    service_category_filter: serviceCategory || null,
    date_from_filter: dateFrom || null,
    date_to_filter: dateTo || null,
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
  const { data, error } = await (supabase as any).rpc('get_bucket_kpis', {
    provider_filter: filters?.providerFilter || null,
    client_filter: filters?.clientFilter || null,
    service_filter: filters?.serviceFilter || null,
    date_from: filters?.dateFrom || null,
    date_to: filters?.dateTo || null,
  });

  if (error) throw error;
  return data as BucketKPI[];
}

export async function refreshBucketKpis(): Promise<void> {
  const { error } = await (supabase as any).rpc(
    'refresh_bucket_kpis_concurrently'
  );
  if (error) throw error;
}

// 5) Write patterns (frontend)

// A) Update booking status
export async function setBookingStatus(id: string, status: string) {
  const { error } = await (supabase as any).rpc('update_booking_status', {
    p_id: id,
    p_status: status,
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
  const { data, error } = await (supabase as any).rpc('create_booking', {
    p_service_id: params.serviceId,
    p_client_id: params.clientId,
    p_scheduled_at: params.scheduledAt,
    p_duration_minutes: params.durationMinutes || null,
    p_participant_count: params.participantCount || 1,
    p_total_price: params.totalPrice || null,
    p_currency: params.currency || 'USD',
    p_notes: params.notes || null,
    p_client_notes: params.clientNotes || null,
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

// Utility functions for booking operations

/**
 * Generate a unique booking number
 */
export function generateBookingNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `BK-${timestamp}-${random}`.toUpperCase();
}

/**
 * Create a booking payload from partial data
 */
export function createBookingPayload(
  data: Partial<BookingWithDetails> &
    Pick<BookingWithDetails, 'service_id' | 'provider_company_id' | 'client_id'>
): BookingWithDetails {
  const now = new Date().toISOString();

  return {
    id: data.id || crypto.randomUUID(),
    booking_number: data.booking_number || generateBookingNumber(),
    service_id: data.service_id,
    provider_company_id: data.provider_company_id,
    client_id: data.client_id,
    status: data.status || 'pending',
    start_time: data.start_time || now,
    end_time: data.end_time || now,
    notes: data.notes || '',
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    // Add other required fields with defaults
    provider_name: data.provider_name || '',
    client_name: data.client_name || '',
    service_name: data.service_name || '',
    service_category: data.service_category || '',
    start_bucket_order: data.start_bucket_order || 0,
    start_time_omt: data.start_time_omt || now,
    is_upcoming: data.is_upcoming || false,
    total_amount: data.total_amount || 0,
    currency: data.currency || 'USD',
  };
}

/**
 * Upsert a booking (create or update)
 */
export async function upsertBooking(
  bookingData: Partial<BookingWithDetails> &
    Pick<BookingWithDetails, 'service_id' | 'provider_company_id' | 'client_id'>
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const payload = createBookingPayload(bookingData);

    const { data, error } = await getSupabaseClient()
      .from('bookings')
      .upsert(payload, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting booking:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception in upsertBooking:', error);
    return { success: false, error };
  }
}
