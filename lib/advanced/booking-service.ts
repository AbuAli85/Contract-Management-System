import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
type BookingUpdate = Database['public']['Tables']['bookings']['Update'];

export interface BookingDetails extends Booking {
  user_name?: string;
  resource_name?: string;
  attendees?: string[];
}

export interface BookingFilters {
  dateFrom?: string;
  dateTo?: string;
  resourceType?: string;
  status?: string;
  userId?: string;
}

export interface BookingStats {
  total_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  utilization_rate: number;
  popular_resources: Array<{
    resource_id: string;
    resource_name: string;
    booking_count: number;
  }>;
  peak_hours: Array<{
    hour: number;
    booking_count: number;
  }>;
}

export interface ResourceAvailability {
  resource_id: string;
  resource_name: string;
  is_available: boolean;
  next_available_slot?: string;
  conflicts?: Array<{
    start_time: string;
    end_time: string;
    booking_title: string;
  }>;
}

export class BookingService {
  private supabase = createClient();

  // Create a new booking
  async createBooking(
    booking: BookingInsert
  ): Promise<{ data: Booking | null; error: string | null }> {
    try {
      // Check for conflicts first
      const conflictCheck = await this.checkBookingConflicts(
        booking.resource_id!,
        booking.start_time!,
        booking.end_time!
      );

      if (conflictCheck.hasConflict) {
        return {
          data: null,
          error: `Booking conflict detected. Resource is already booked from ${conflictCheck.conflictingBooking?.start_time} to ${conflictCheck.conflictingBooking?.end_time}`,
        };
      }

      const { data, error } = await this.supabase
        .from('bookings')
        .insert([
          {
            ...booking,
            status: booking.status || 'confirmed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // Send notification about new booking
      await this.sendBookingNotification(data.id, 'created');

      return { data, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to create booking' };
    }
  }

  // Get bookings with filters
  async getBookings(
    filters: BookingFilters = {}
  ): Promise<{ data: BookingDetails[]; error: string | null }> {
    try {
      let query = this.supabase
        .from('bookings')
        .select(
          `
          *,
          user_name:users(full_name),
          resource_name:booking_resources(name)
        `
        )
        .order('start_time', { ascending: true });

      // Apply filters
      if (filters.dateFrom) {
        query = query.gte('start_time', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('end_time', filters.dateTo);
      }
      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: error.message };
      }

      // Process the data to include attendees
      const processedData = await Promise.all(
        (data || []).map(async booking => {
          const attendees = await this.getBookingAttendees(booking.id);
          return {
            ...booking,
            attendees: attendees.data,
          };
        })
      );

      return { data: processedData, error: null };
    } catch (error) {
      return { data: [], error: 'Failed to fetch bookings' };
    }
  }

  // Update booking
  async updateBooking(
    id: string,
    updates: BookingUpdate
  ): Promise<{ data: Booking | null; error: string | null }> {
    try {
      // If updating time, check for conflicts
      if (updates.start_time || updates.end_time) {
        const currentBooking = await this.getBookingById(id);
        if (currentBooking.data) {
          const startTime =
            updates.start_time || currentBooking.data.start_time;
          const endTime = updates.end_time || currentBooking.data.end_time;
          const resourceId =
            updates.resource_id || currentBooking.data.resource_id;

          const conflictCheck = await this.checkBookingConflicts(
            resourceId!,
            startTime!,
            endTime!,
            id
          );

          if (conflictCheck.hasConflict) {
            return {
              data: null,
              error: `Booking conflict detected. Resource is already booked from ${conflictCheck.conflictingBooking?.start_time} to ${conflictCheck.conflictingBooking?.end_time}`,
            };
          }
        }
      }

      const { data, error } = await this.supabase
        .from('bookings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // Send notification about updated booking
      await this.sendBookingNotification(id, 'updated');

      return { data, error: null };
    } catch (error) {
      return { data: null, error: 'Failed to update booking' };
    }
  }

  // Cancel booking
  async cancelBooking(
    id: string,
    reason?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Send notification about cancelled booking
      await this.sendBookingNotification(id, 'cancelled');

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Failed to cancel booking' };
    }
  }

  // Check booking conflicts
  async checkBookingConflicts(
    resourceId: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<{
    hasConflict: boolean;
    conflictingBooking?: Booking;
  }> {
    try {
      let query = this.supabase
        .from('bookings')
        .select('*')
        .eq('resource_id', resourceId)
        .neq('status', 'cancelled')
        .or(`and(start_time.lte.${endTime},end_time.gte.${startTime})`);

      if (excludeBookingId) {
        query = query.neq('id', excludeBookingId);
      }

      const { data, error } = await query.limit(1);

      if (error) {
        return { hasConflict: false };
      }

      return {
        hasConflict: data && data.length > 0,
        conflictingBooking: data?.[0],
      };
    } catch (error) {
      return { hasConflict: false };
    }
  }

  // Get resource availability
  async getResourceAvailability(
    resourceId: string,
    date: string
  ): Promise<{ data: ResourceAvailability | null; error: string | null }> {
    try {
      // Get resource details
      const { data: resource, error: resourceError } = await this.supabase
        .from('booking_resources')
        .select('*')
        .eq('id', resourceId)
        .single();

      if (resourceError || !resource) {
        return { data: null, error: 'Resource not found' };
      }

      // Get bookings for the date
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;

      const { data: bookings, error: bookingsError } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('resource_id', resourceId)
        .neq('status', 'cancelled')
        .gte('start_time', startOfDay)
        .lte('end_time', endOfDay)
        .order('start_time', { ascending: true });

      if (bookingsError) {
        return { data: null, error: bookingsError.message };
      }

      // Determine availability
      const now = new Date();
      const currentTime = now.toISOString();
      const conflicts = (bookings || []).map(booking => ({
        start_time: booking.start_time!,
        end_time: booking.end_time!,
        booking_title: booking.title || 'Booked',
      }));

      // Find next available slot
      let nextAvailableSlot: string | undefined;
      if (conflicts.length === 0) {
        nextAvailableSlot = startOfDay;
      } else {
        // Logic to find gaps between bookings
        for (let i = 0; i < conflicts.length - 1; i++) {
          const endCurrent = new Date(conflicts[i].end_time);
          const startNext = new Date(conflicts[i + 1].start_time);
          const gap = startNext.getTime() - endCurrent.getTime();

          // If gap is at least 30 minutes
          if (gap >= 30 * 60 * 1000) {
            nextAvailableSlot = endCurrent.toISOString();
            break;
          }
        }

        // Check after last booking
        if (!nextAvailableSlot && conflicts.length > 0) {
          const lastBookingEnd = new Date(
            conflicts[conflicts.length - 1].end_time
          );
          const endOfDayTime = new Date(endOfDay);
          if (
            endOfDayTime.getTime() - lastBookingEnd.getTime() >=
            30 * 60 * 1000
          ) {
            nextAvailableSlot = lastBookingEnd.toISOString();
          }
        }
      }

      const isCurrentlyAvailable = !conflicts.some(conflict => {
        const start = new Date(conflict.start_time);
        const end = new Date(conflict.end_time);
        return now >= start && now <= end;
      });

      return {
        data: {
          resource_id: resourceId,
          resource_name: resource.name,
          is_available: isCurrentlyAvailable,
          next_available_slot: nextAvailableSlot,
          conflicts,
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: 'Failed to check availability' };
    }
  }

  // Get booking statistics
  async getBookingStatistics(
    dateFrom?: string,
    dateTo?: string
  ): Promise<{ data: BookingStats | null; error: string | null }> {
    try {
      let query = this.supabase.from('bookings').select(`
          *,
          booking_resources(name)
        `);

      if (dateFrom) {
        query = query.gte('start_time', dateFrom);
      }
      if (dateTo) {
        query = query.lte('end_time', dateTo);
      }

      const { data: bookings, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      // Calculate statistics
      const totalBookings = bookings?.length || 0;
      const activeBookings =
        bookings?.filter(b => b.status === 'confirmed').length || 0;
      const completedBookings =
        bookings?.filter(b => b.status === 'completed').length || 0;
      const cancelledBookings =
        bookings?.filter(b => b.status === 'cancelled').length || 0;

      // Calculate utilization rate (simplified)
      const utilizationRate =
        totalBookings > 0
          ? ((activeBookings + completedBookings) / totalBookings) * 100
          : 0;

      // Popular resources
      const resourceCounts = (bookings || []).reduce(
        (acc, booking) => {
          const resourceId = booking.resource_id;
          if (resourceId) {
            acc[resourceId] = (acc[resourceId] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      const popularResources = Object.entries(resourceCounts)
        .map(([resourceId, count]) => {
          const booking = bookings?.find(b => b.resource_id === resourceId);
          return {
            resource_id: resourceId,
            resource_name:
              (booking as any)?.booking_resources?.name || 'Unknown',
            booking_count: count,
          };
        })
        .sort((a, b) => b.booking_count - a.booking_count)
        .slice(0, 5);

      // Peak hours analysis
      const hourCounts = (bookings || []).reduce(
        (acc, booking) => {
          const hour = new Date(booking.start_time!).getHours();
          acc[hour] = (acc[hour] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>
      );

      const peakHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({
          hour: parseInt(hour),
          booking_count: count,
        }))
        .sort((a, b) => b.booking_count - a.booking_count)
        .slice(0, 6);

      return {
        data: {
          total_bookings: totalBookings,
          active_bookings: activeBookings,
          completed_bookings: completedBookings,
          cancelled_bookings: cancelledBookings,
          utilization_rate: utilizationRate,
          popular_resources: popularResources,
          peak_hours: peakHours,
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: 'Failed to get statistics' };
    }
  }

  // Helper methods
  private async getBookingById(
    id: string
  ): Promise<{ data: Booking | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error: error?.message || null };
    } catch (error) {
      return { data: null, error: 'Failed to fetch booking' };
    }
  }

  private async getBookingAttendees(
    bookingId: string
  ): Promise<{ data: string[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('booking_attendees')
        .select('email')
        .eq('booking_id', bookingId);

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: (data || []).map(a => a.email), error: null };
    } catch (error) {
      return { data: [], error: 'Failed to fetch attendees' };
    }
  }

  private async sendBookingNotification(
    bookingId: string,
    action: 'created' | 'updated' | 'cancelled'
  ): Promise<void> {
    try {
      const { data: booking } = await this.supabase
        .from('bookings')
        .select('*, profiles:user_id(email, full_name)')
        .eq('id', bookingId)
        .single();
      const notificationService = new (await import('@/lib/advanced/notification-service')).NotificationService();
      const titles = { created: 'Booking Confirmed', updated: 'Booking Updated', cancelled: 'Booking Cancelled' };
      const messages = {
        created: 'Your booking has been confirmed.',
        updated: 'Your booking details have been updated.',
        cancelled: 'Your booking has been cancelled.',
      };
      await notificationService.createNotification({
        user_id: booking.user_id,
        type: 'booking_update',
        title: titles[action],
        message: messages[action],
        priority: action === 'cancelled' ? 'high' : 'medium',
        action_url: '/bookings/' + bookingId,
        send_email: true,
      });
    } catch {
      // Non-critical: notification failure should not block booking operation
    }
  }

  // Bulk operations
  async bulkCreateBookings(bookings: BookingInsert[]): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const booking of bookings) {
      const result = await this.createBooking(booking);
      if (result.error) {
        failed++;
        errors.push(`Booking for ${booking.title}: ${result.error}`);
      } else {
        success++;
      }
    }

    return { success, failed, errors };
  }

  // Recurring bookings
  async createRecurringBooking(
    booking: BookingInsert,
    recurrence: {
      type: 'daily' | 'weekly' | 'monthly';
      interval: number;
      endDate: string;
      excludeDates?: string[];
    }
  ): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const bookingsToCreate: BookingInsert[] = [];
    const startDate = new Date(booking.start_time!);
    const endDate = new Date(recurrence.endDate);
    const excludeDates = recurrence.excludeDates || [];

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      if (!excludeDates.includes(dateStr)) {
        const bookingStart = new Date(currentDate);
        const bookingEnd = new Date(currentDate);

        // Set time from original booking
        const originalStart = new Date(booking.start_time!);
        const originalEnd = new Date(booking.end_time!);

        bookingStart.setHours(
          originalStart.getHours(),
          originalStart.getMinutes()
        );
        bookingEnd.setHours(originalEnd.getHours(), originalEnd.getMinutes());

        bookingsToCreate.push({
          ...booking,
          start_time: bookingStart.toISOString(),
          end_time: bookingEnd.toISOString(),
          title: `${booking.title} (Recurring)`,
        });
      }

      // Calculate next date
      switch (recurrence.type) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + recurrence.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7 * recurrence.interval);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + recurrence.interval);
          break;
      }
    }

    return await this.bulkCreateBookings(bookingsToCreate);
  }
}
