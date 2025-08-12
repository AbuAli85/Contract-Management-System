import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type BookingPayload, type BookingResult } from '@/lib/booking-service';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface UseBookingUpsertOptions {
  onSuccess?: (data: BookingResult) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

export function useBookingUpsert(options: UseBookingUpsertOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, showToast = true } = options;

  return useMutation({
    mutationFn: async (payload: BookingPayload): Promise<BookingResult> => {
      const supabase = createClient();

      // Validate required fields
      if (!payload.booking_number) {
        throw new Error('booking_number is required for upsert operations');
      }

      if (
        !payload.service_id ||
        !payload.provider_company_id ||
        !payload.client_id
      ) {
        throw new Error(
          'service_id, provider_company_id, and client_id are required'
        );
      }

      // Ensure we have the required unique constraint field
      const cleanPayload = {
        ...payload,
        // Ensure metadata is valid JSON
        metadata: payload.metadata || {},
      };

      const { data, error } = await supabase
        .from('bookings')
        .upsert(cleanPayload, {
          onConflict: 'booking_number',
          ignoreDuplicates: false,
        })
        .select(
          'id, booking_number, status, scheduled_start, scheduled_end, created_at, updated_at'
        )
        .single();

      if (error) {
        console.error('❌ Booking upsert error:', error);
        throw new Error(`Failed to upsert booking: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from booking upsert');
      }

      return data;
    },
    onSuccess: data => {
      // Invalidate and refetch booking-related queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({
        queryKey: ['booking', data.booking_number],
      });

      if (showToast) {
        toast.success(`Booking ${data.booking_number} saved successfully!`, {
          description: `Status: ${data.status}`,
        });
      }

      onSuccess?.(data);
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error('Failed to save booking', {
          description: error.message,
        });
      }

      onError?.(error);
    },
  });
}

// Hook for API-based upsert (alternative approach)
export function useBookingUpsertAPI(options: UseBookingUpsertOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, showToast = true } = options;

  return useMutation({
    mutationFn: async (
      payload: Partial<BookingPayload> &
        Pick<BookingPayload, 'service_id' | 'provider_company_id' | 'client_id'>
    ): Promise<BookingResult> => {
      const response = await fetch('/api/bookings/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to upsert booking');
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: data => {
      // Invalidate and refetch booking-related queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({
        queryKey: ['booking', data.booking_number],
      });

      if (showToast) {
        toast.success(`Booking ${data.booking_number} saved successfully!`, {
          description: `Status: ${data.status}`,
        });
      }

      onSuccess?.(data);
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error('Failed to save booking', {
          description: error.message,
        });
      }

      onError?.(error);
    },
  });
}
