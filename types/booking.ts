// Booking System TypeScript Types
// Matches the database schema and views created in the migration

export interface Booking {
  id: string;
  booking_number: string;
  service_id: string;
  client_id: string;
  provider_company_id: string;
  status: BookingStatus;
  scheduled_at: string;
  scheduled_end: string;
  duration_minutes: number;
  participant_count: number;
  total_price: number | null;
  currency: string;
  notes: string | null;
  client_notes: string | null;
  provider_notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  // Service details
  service_name: string | null;
  service_category: string | null;
  service_subcategory: string | null;
  service_price: number | null;
  service_duration: number | null;
  
  // Client details
  client_email: string | null;
  client_first_name: string | null;
  client_last_name: string | null;
  client_name: string | null;
  
  // Provider details
  provider_name: string | null;
  provider_slug: string | null;
  provider_type: string | null;
  
  // Time-based calculations
  hours_until_booking: number | null;
  days_until_booking: number | null;
  is_upcoming: boolean;
  
  // Bucket ordering
  start_bucket_order: number;
  start_time_omt: number;
}

export interface BucketKPI {
  bucket_name: string;
  bucket_order: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  in_progress_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  refunded_bookings: number;
  no_show_bookings: number;
  total_revenue: number;
  confirmed_revenue: number;
  pending_revenue: number;
  avg_duration_minutes: number | null;
  total_duration_minutes: number;
  total_participants: number;
  avg_participants_per_booking: number | null;
  unique_providers: number;
  unique_clients: number;
  unique_services: number;
  bucket_start: string | null;
  bucket_end: string | null;
  last_calculated: string;
  pending_percentage: number | null;
  confirmed_percentage: number | null;
  completed_percentage: number | null;
  avg_revenue_per_booking: number | null;
  conversion_rate: number | null;
}

export type BookingStatus = 
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'no_show';

export interface BookingFilters {
  limit?: number;
  providerName?: string;
  clientName?: string;
  onlyUpcoming?: boolean;
  status?: BookingStatus;
  serviceCategory?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationParams {
  from: number;
  to: number;
}

export interface BookingPageResult {
  data: BookingWithDetails[];
  count: number;
}

export interface RecentBookingsResult {
  data: BookingWithDetails[];
  count: number;
}

export interface BucketKPIResult {
  data: BucketKPI[];
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

export interface BookingApiResponse extends ApiResponse<BookingWithDetails[]> {
  count: number;
}

export interface BucketKpiApiResponse extends ApiResponse<BucketKPI[]> {}

// Real-time update types
export interface BookingChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: 'bookings';
  record: Partial<Booking>;
  oldRecord?: Partial<Booking>;
}

export interface KpiRefreshEvent {
  event: 'mv_bucket_kpis_refreshed';
  data: string;
} 