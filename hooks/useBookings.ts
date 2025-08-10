import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  fetchRecentBookings, 
  fetchBucketKpis, 
  fetchBookingsPage,
  fetchBookingsWithFilters,
  getBookingsCount,
  refreshBucketKpis
} from '@/lib/booking-service';
import { 
  subscribeBookings, 
  subscribeKpiRefreshed,
  subscribeBookingSystem 
} from '@/lib/booking-realtime';
import type { 
  BookingWithDetails, 
  BucketKPI, 
  BookingFilters, 
  PaginationParams 
} from '@/types/booking';

interface UseBookingsOptions {
  enableRealtime?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseBookingsReturn {
  // Data
  bookings: BookingWithDetails[];
  kpis: BucketKPI[];
  loading: boolean;
  error: string | null;
  count: number;
  
  // Actions
  refreshBookings: () => Promise<void>;
  refreshKpis: () => Promise<void>;
  loadMore: (page: PaginationParams) => Promise<void>;
  applyFilters: (filters: BookingFilters) => Promise<void>;
  
  // State
  hasMore: boolean;
  currentPage: number;
  filters: BookingFilters;
}

export function useBookings(options: UseBookingsOptions = {}): UseBookingsReturn {
  const { 
    enableRealtime = true, 
    autoRefresh = false, 
    refreshInterval = 30000 
  } = options;

  // State
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [kpis, setKpis] = useState<BucketKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState<BookingFilters>({ limit: 50 });
  const [hasMore, setHasMore] = useState(true);

  // Refs for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load bookings and KPIs in parallel
      const [bookingsResult, kpisData] = await Promise.all([
        fetchRecentBookings(filters),
        fetchBucketKpis()
      ]);

      setBookings(bookingsResult.data);
      setCount(bookingsResult.count);
      setKpis(kpisData);
      setHasMore(bookingsResult.data.length < bookingsResult.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Refresh bookings
  const refreshBookings = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchRecentBookings(filters);
      setBookings(result.data);
      setCount(result.count);
      setHasMore(result.data.length < result.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh bookings');
    }
  }, [filters]);

  // Refresh KPIs
  const refreshKpis = useCallback(async () => {
    try {
      setError(null);
      const kpisData = await fetchBucketKpis();
      setKpis(kpisData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh KPIs');
    }
  }, []);

  // Load more bookings (pagination)
  const loadMore = useCallback(async (page: PaginationParams) => {
    try {
      setError(null);
      const result = await fetchBookingsPage(page);
      
      if (page.from === 0) {
        // First page, replace all
        setBookings(result.data);
      } else {
        // Append to existing
        setBookings(prev => [...prev, ...result.data]);
      }
      
      setCount(result.count);
      setHasMore(result.data.length < result.count);
      setCurrentPage(Math.floor(page.to / (page.to - page.from + 1)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more bookings');
    }
  }, []);

  // Apply filters
  const applyFilters = useCallback(async (newFilters: BookingFilters) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await fetchBookingsWithFilters(newFilters);
      setBookings(result.data);
      setCount(result.count);
      setHasMore(result.data.length < result.count);
      setFilters(newFilters);
      setCurrentPage(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply filters');
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!enableRealtime) return;

    // Subscribe to both bookings and KPIs
    const unsubscribe = subscribeBookingSystem(
      () => {
        // Refresh bookings when they change
        refreshBookings();
      },
      () => {
        // Refresh KPIs when they're updated
        refreshKpis();
      },
      { enableKpiNotifications: true }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enableRealtime, refreshBookings, refreshKpis]);

  // Setup auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !enableRealtime) return;

    refreshIntervalRef.current = setInterval(() => {
      refreshBookings();
      refreshKpis();
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, enableRealtime, refreshInterval, refreshBookings, refreshKpis]);

  // Load initial data on mount and when filters change
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    // Data
    bookings,
    kpis,
    loading,
    error,
    count,
    
    // Actions
    refreshBookings,
    refreshKpis,
    loadMore,
    applyFilters,
    
    // State
    hasMore,
    currentPage,
    filters
  };
}

// Specialized hook for just the KPIs
export function useBucketKpis(options: { enableRealtime?: boolean } = {}) {
  const { enableRealtime = true } = options;
  
  const [kpis, setKpis] = useState<BucketKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadKpis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBucketKpis();
      setKpis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KPIs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  useEffect(() => {
    if (!enableRealtime) return;

    const unsubscribe = subscribeKpiRefreshed(() => {
      loadKpis();
    });

    return unsubscribe;
  }, [enableRealtime, loadKpis]);

  return {
    kpis,
    loading,
    error,
    refresh: loadKpis
  };
}

// Hook for paginated bookings
export function usePaginatedBookings(
  initialFilters: BookingFilters = { limit: 20 },
  options: { enableRealtime?: boolean } = {}
) {
  const { enableRealtime = true } = options;
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState<BookingFilters>(initialFilters);
  const [hasMore, setHasMore] = useState(true);

  // Refs for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchBookingsPageWithFilters({ from: 0, to: filters.limit! - 1 }, filters);
      setBookings(result.data);
      setCount(result.count);
      setHasMore(result.data.length < result.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load more data
  const loadMore = useCallback(async (page: PaginationParams) => {
    try {
      setError(null);
      const result = await fetchBookingsPageWithFilters(page, filters);
      setBookings(prev => [...prev, ...result.data]);
      setHasMore(result.data.length < result.count);
      setCurrentPage(page.from / filters.limit!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more bookings');
    }
  }, [filters]);

  // Apply filters
  const applyFilters = useCallback(async (newFilters: BookingFilters) => {
    setFilters(newFilters);
    setCurrentPage(0);
    setHasMore(true);
    await loadInitialData();
  }, [loadInitialData]);

  // Refresh data
  const refreshBookings = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // Set up realtime subscription
  useEffect(() => {
    if (!enableRealtime) return;

    const unsubscribe = subscribeBookings((event) => {
      if (event.eventType === 'INSERT') {
        setBookings(prev => [event.record as BookingWithDetails, ...prev]);
        setCount(prev => prev + 1);
      } else if (event.eventType === 'UPDATE') {
        setBookings(prev => prev.map(booking => 
          booking.id === event.record.id 
            ? { ...booking, ...event.record } 
            : booking
        ));
      } else if (event.eventType === 'DELETE') {
        setBookings(prev => prev.filter(booking => booking.id !== event.record.id));
        setCount(prev => Math.max(0, prev - 1));
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enableRealtime]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    bookings,
    loading,
    error,
    count,
    hasMore,
    currentPage,
    filters,
    loadMore,
    applyFilters,
    refreshBookings
  };
}

// New hook for booking operations (status changes, creation, etc.)
export function useBookingOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update booking status
  const updateStatus = useCallback(async (id: string, status: string) => {
    try {
      setLoading(true);
      setError(null);
      await setBookingStatus(id, status);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update booking status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new booking
  const create = useCallback(async (params: {
    serviceId: string;
    clientId: string;
    scheduledAt: string;
    durationMinutes?: number;
    participantCount?: number;
    totalPrice?: number;
    currency?: string;
    notes?: string;
    clientNotes?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const bookingId = await createBooking(params);
      return bookingId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Convenience functions for common operations
  const cancel = useCallback(async (id: string) => {
    return updateStatus(id, 'cancelled');
  }, [updateStatus]);

  const confirm = useCallback(async (id: string) => {
    return updateStatus(id, 'confirmed');
  }, [updateStatus]);

  const start = useCallback(async (id: string) => {
    return updateStatus(id, 'in_progress');
  }, [updateStatus]);

  const complete = useCallback(async (id: string) => {
    return updateStatus(id, 'completed');
  }, [updateStatus]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    
    // Actions
    updateStatus,
    create,
    cancel,
    confirm,
    start,
    complete,
    clearError
  };
} 