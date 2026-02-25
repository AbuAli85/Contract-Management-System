import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/database.types';

type TrackingEvent = Database['public']['Tables']['tracking_events']['Row'];
type TrackingEventInsert =
  Database['public']['Tables']['tracking_events']['Insert'];

export interface TrackingDetails extends TrackingEvent {
  user_name?: string;
  related_entity_name?: string;
}

export interface TrackingFilters {
  entityType?: string;
  entityId?: string;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  status?: string;
}

export interface TrackingStats {
  total_events: number;
  active_trackings: number;
  completed_trackings: number;
  overdue_trackings: number;
  average_completion_time: number;
  event_types: Array<{
    event_type: string;
    count: number;
    percentage: number;
  }>;
  status_distribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export interface ActivityTimeline {
  date: string;
  events: Array<{
    id: string;
    time: string;
    event_type: string;
    description: string;
    user_name: string;
    status: string;
    metadata?: any;
  }>;
}

export interface DeliveryTracking {
  tracking_number: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  carrier: string;
  estimated_delivery: string;
  actual_delivery?: string;
  tracking_url?: string;
  locations: Array<{
    location: string;
    timestamp: string;
    status: string;
    description: string;
  }>;
}

export class TrackingService {
  private supabase = createClient();

  // Create tracking event
  async createTrackingEvent(
    event: TrackingEventInsert
  ): Promise<{ data: TrackingEvent | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('tracking_events')
        .insert([
          {
            ...event,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating tracking event:', error);
        return { data: null, error: error.message };
      }

      // Send real-time notification
      await this.sendTrackingNotification(data);

      return { data, error: null };
    } catch (error) {
      console.error('Error in createTrackingEvent:', error);
      return { data: null, error: 'Failed to create tracking event' };
    }
  }

  // Get tracking events with filters
  async getTrackingEvents(
    filters: TrackingFilters = {}
  ): Promise<{ data: TrackingDetails[]; error: string | null }> {
    try {
      let query = this.supabase
        .from('tracking_events')
        .select(
          `
          *,
          user_name:users(full_name)
        `
        )
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }
      if (filters.entityId) {
        query = query.eq('entity_id', filters.entityId);
      }
      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tracking events:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getTrackingEvents:', error);
      return { data: [], error: 'Failed to fetch tracking events' };
    }
  }

  // Track contract lifecycle
  async trackContractStatus(
    contractId: string,
    status: string,
    details?: any,
    userId?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const event: TrackingEventInsert = {
        entity_type: 'contract',
        entity_id: contractId,
        event_type: 'status_change',
        description: `Contract status changed to ${status}`,
        status,
        metadata: details,
        user_id: userId || null,
      };

      const result = await this.createTrackingEvent(event);

      if (result.error) {
        return { success: false, error: result.error };
      }

      // Update contract tracking summary
      await this.updateContractTrackingSummary(contractId);

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in trackContractStatus:', error);
      return { success: false, error: 'Failed to track contract status' };
    }
  }

  // Track document delivery
  async trackDocumentDelivery(
    documentId: string,
    deliveryData: {
      tracking_number?: string;
      carrier?: string;
      recipient_email?: string;
      delivery_method: string;
      estimated_delivery?: string;
    },
    userId?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const event: TrackingEventInsert = {
        entity_type: 'document',
        entity_id: documentId,
        event_type: 'delivery_initiated',
        description: `Document delivery started via ${deliveryData.delivery_method}`,
        status: 'in_transit',
        metadata: deliveryData,
        user_id: userId || null,
      };

      const result = await this.createTrackingEvent(event);

      if (result.error) {
        return { success: false, error: result.error };
      }

      // Create delivery tracking record
      if (deliveryData.tracking_number) {
        await this.createDeliveryTracking(documentId, deliveryData);
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in trackDocumentDelivery:', error);
      return { success: false, error: 'Failed to track document delivery' };
    }
  }

  // Track project milestones
  async trackProjectMilestone(
    projectId: string,
    milestone: {
      name: string;
      description?: string;
      due_date?: string;
      completed_date?: string;
      status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    },
    userId?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const event: TrackingEventInsert = {
        entity_type: 'project',
        entity_id: projectId,
        event_type: 'milestone_update',
        description: `Milestone "${milestone.name}" ${milestone.status}`,
        status: milestone.status,
        metadata: milestone,
        user_id: userId || null,
      };

      const result = await this.createTrackingEvent(event);

      if (result.error) {
        return { success: false, error: result.error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in trackProjectMilestone:', error);
      return { success: false, error: 'Failed to track project milestone' };
    }
  }

  // Get entity tracking history
  async getEntityTrackingHistory(
    entityType: string,
    entityId: string
  ): Promise<{ data: ActivityTimeline[]; error: string | null }> {
    try {
      const { data: events, error } = await this.supabase
        .from('tracking_events')
        .select(
          `
          *,
          users(full_name)
        `
        )
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching entity tracking history:', error);
        return { data: [], error: error.message };
      }

      // Group events by date
      const groupedByDate = (events || []).reduce(
        (acc, event) => {
          const date = event.created_at!.split('T')[0];
          if (!acc[date]) {
            acc[date] = [];
          }

          acc[date].push({
            id: event.id,
            time: event.created_at!,
            event_type: event.event_type!,
            description: event.description!,
            user_name: (event as any).users?.full_name || 'System',
            status: event.status!,
            metadata: event.metadata,
          });

          return acc;
        },
        {} as Record<string, any[]>
      );

      // Convert to timeline format
      const timeline: ActivityTimeline[] = Object.entries(groupedByDate)
        .map(([date, events]) => ({
          date,
          events: events.sort(
            (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
          ),
        }))
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      return { data: timeline, error: null };
    } catch (error) {
      console.error('Error in getEntityTrackingHistory:', error);
      return { data: [], error: 'Failed to get tracking history' };
    }
  }

  // Get tracking statistics
  async getTrackingStatistics(
    entityType?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{ data: TrackingStats | null; error: string | null }> {
    try {
      let query = this.supabase.from('tracking_events').select('*');

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data: events, error } = await query;

      if (error) {
        console.error('Error fetching tracking statistics:', error);
        return { data: null, error: error.message };
      }

      const totalEvents = events?.length || 0;

      // Status counts
      const statusCounts = (events || []).reduce(
        (acc, event) => {
          const status = event.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const activeTrackings = statusCounts['in_progress'] || 0;
      const completedTrackings = statusCounts['completed'] || 0;
      const overdueTrackings = statusCounts['overdue'] || 0;

      // Event type distribution
      const eventTypeCounts = (events || []).reduce(
        (acc, event) => {
          const eventType = event.event_type || 'unknown';
          acc[eventType] = (acc[eventType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const eventTypes = Object.entries(eventTypeCounts).map(
        ([eventType, count]) => ({
          event_type: eventType,
          count,
          percentage: totalEvents > 0 ? (count / totalEvents) * 100 : 0,
        })
      );

      const statusDistribution = Object.entries(statusCounts).map(
        ([status, count]) => ({
          status,
          count,
          percentage: totalEvents > 0 ? (count / totalEvents) * 100 : 0,
        })
      );

      // Calculate average completion time (simplified)
      const completedEvents = (events || []).filter(
        e => e.status === 'completed'
      );
      let averageCompletionTime = 0;

      if (completedEvents.length > 0) {
        const totalTime = completedEvents.reduce((sum, event) => {
          const created = new Date(event.created_at!);
          const updated = new Date(event.updated_at!);
          return sum + (updated.getTime() - created.getTime());
        }, 0);

        averageCompletionTime =
          totalTime / completedEvents.length / (1000 * 60 * 60 * 24); // Convert to days
      }

      return {
        data: {
          total_events: totalEvents,
          active_trackings: activeTrackings,
          completed_trackings: completedTrackings,
          overdue_trackings: overdueTrackings,
          average_completion_time: averageCompletionTime,
          event_types: eventTypes,
          status_distribution: statusDistribution,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error in getTrackingStatistics:', error);
      return { data: null, error: 'Failed to get tracking statistics' };
    }
  }

  // Update tracking status
  async updateTrackingStatus(
    eventId: string,
    status: string,
    description?: string,
    metadata?: any
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase
        .from('tracking_events')
        .update({
          status,
          description: description || undefined,
          metadata: metadata || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (error) {
        console.error('Error updating tracking status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in updateTrackingStatus:', error);
      return { success: false, error: 'Failed to update tracking status' };
    }
  }

  // Get delivery tracking details
  async getDeliveryTracking(
    trackingNumber: string
  ): Promise<{ data: DeliveryTracking | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('delivery_tracking')
        .select('*')
        .eq('tracking_number', trackingNumber)
        .single();

      if (error) {
        console.error('Error fetching delivery tracking:', error);
        return { data: null, error: error.message };
      }

      // Get location history
      const { data: locations, error: locError } = await this.supabase
        .from('delivery_locations')
        .select('*')
        .eq('tracking_number', trackingNumber)
        .order('timestamp', { ascending: true });

      if (locError) {
        console.error('Error fetching delivery locations:', locError);
      }

      const deliveryTracking: DeliveryTracking = {
        tracking_number: data.tracking_number,
        status: data.status,
        carrier: data.carrier,
        estimated_delivery: data.estimated_delivery,
        actual_delivery: data.actual_delivery,
        tracking_url: data.tracking_url,
        locations: locations || [],
      };

      return { data: deliveryTracking, error: null };
    } catch (error) {
      console.error('Error in getDeliveryTracking:', error);
      return { data: null, error: 'Failed to get delivery tracking' };
    }
  }

  // Real-time tracking updates
  async subscribeToEntityTracking(
    entityType: string,
    entityId: string,
    callback: (event: TrackingEvent) => void
  ): Promise<() => void> {
    try {
      const subscription = this.supabase
        .channel(`tracking:${entityType}:${entityId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tracking_events',
            filter: `entity_type=eq.${entityType} AND entity_id=eq.${entityId}`,
          },
          payload => {
            callback(payload.new as TrackingEvent);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up tracking subscription:', error);
      return () => {};
    }
  }

  // Batch tracking operations
  async batchCreateEvents(events: TrackingEventInsert[]): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);

      try {
        const { data, error } = await this.supabase
          .from('tracking_events')
          .insert(batch)
          .select();

        if (error) {
          failed += batch.length;
          errors.push(
            `Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`
          );
        } else {
          success += data?.length || 0;
        }
      } catch (error) {
        failed += batch.length;
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error}`);
      }
    }

    return { success, failed, errors };
  }

  // Helper methods
  private async sendTrackingNotification(event: TrackingEvent): Promise<void> {
    try {
      // Send real-time notification via WebSocket/SSE
      // For now, we'll log the event
      // TODO: Implement actual notification sending
      // - Real-time notifications
      // - Email notifications for important events
      // - SMS notifications for critical events
    } catch (error) {
      console.error('Error sending tracking notification:', error);
    }
  }

  private async updateContractTrackingSummary(
    contractId: string
  ): Promise<void> {
    try {
      // Update contract tracking summary in contracts table
      const { data: events } = await this.supabase
        .from('tracking_events')
        .select('status')
        .eq('entity_type', 'contract')
        .eq('entity_id', contractId)
        .order('created_at', { ascending: false });

      if (events && events.length > 0) {
        const latestStatus = events[0].status;

        await this.supabase
          .from('contracts')
          .update({
            tracking_status: latestStatus,
            last_tracked_at: new Date().toISOString(),
          })
          .eq('id', contractId);
      }
    } catch (error) {
      console.error('Error updating contract tracking summary:', error);
    }
  }

  private async createDeliveryTracking(
    documentId: string,
    deliveryData: any
  ): Promise<void> {
    try {
      await this.supabase.from('delivery_tracking').insert([
        {
          document_id: documentId,
          tracking_number: deliveryData.tracking_number,
          carrier: deliveryData.carrier,
          estimated_delivery: deliveryData.estimated_delivery,
          status: 'in_transit',
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error creating delivery tracking:', error);
    }
  }
}
