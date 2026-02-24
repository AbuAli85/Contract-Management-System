'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin,
  Clock,
  Navigation,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Phone,
  MessageCircle,
  Car,
  Home,
  Wrench,
} from 'lucide-react';

interface TrackingData {
  id: string;
  booking_id: string;
  status: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  estimated_arrival?: string;
  actual_arrival?: string;
  notes?: string;
  provider_id: string;
  client_id: string;
  created_at: string;
  updated_at: string;
}

interface Booking {
  id: string;
  booking_number: string;
  service_id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  service: {
    title: string;
    category: string;
    location_type: string;
  };
}

interface RealTimeTrackingProps {
  bookingId: string;
  userRole: 'provider' | 'client' | 'admin';
  userId: string;
}

export function RealTimeTracking({
  bookingId,
  userRole,
  userId,
}: RealTimeTrackingProps) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<TrackingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const supabase = createClientComponentClient();
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    const loadTrackingData = async () => {
      try {
        // Load booking data
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select(
            `
            *,
            service:services(title, category, location_type)
          `
          )
          .eq('id', bookingId)
          .single();

        if (bookingError) throw bookingError;
        setBooking(bookingData);

        // Load current tracking
        const { data: trackingCurrentData, error: trackingError } =
          await supabase
            .from('trackings')
            .select('*')
            .eq('booking_id', bookingId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (trackingError && trackingError.code !== 'PGRST116') {
          throw trackingError;
        }

        if (trackingCurrentData) {
          setTrackingData(trackingCurrentData);
          setNewStatus(trackingCurrentData.status);
        }

        // Load tracking history
        const { data: historyData, error: historyError } = await supabase
          .from('trackings')
          .select('*')
          .eq('booking_id', bookingId)
          .order('updated_at', { ascending: false });

        if (historyError) throw historyError;
        setTrackingHistory(historyData || []);
      } catch (error) {
        console.error('Error loading tracking data:', error);
        toast({
          title: 'Failed to load tracking data',
          description: 'Please refresh the page to try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadTrackingData();
  }, [bookingId, supabase, toast]);

  // Set up real-time subscription
  useEffect(() => {
    console.log(
      '🔔 Setting up real-time tracking subscription for booking:',
      bookingId
    );

    const subscription = supabase
      .channel(`tracking:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trackings',
          filter: `booking_id=eq.${bookingId}`,
        },
        payload => {
          console.log('📍 Tracking update received:', payload.new);

          const updatedTracking = payload.new as TrackingData;

          // Update current tracking
          setTrackingData(updatedTracking);

          // Add to history if not already there
          setTrackingHistory(current => {
            const exists = current.find(t => t.id === updatedTracking.id);
            if (exists) {
              return current.map(t =>
                t.id === updatedTracking.id ? updatedTracking : t
              );
            } else {
              return [updatedTracking, ...current];
            }
          });

          // Show toast notification
          toast({
            title: 'Status Updated',
            description: `Service status changed to: ${updatedTracking.status.replace('_', ' ')}`,
            duration: 4000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trackings',
          filter: `booking_id=eq.${bookingId}`,
        },
        payload => {
          console.log('📍 New tracking record:', payload.new);

          const newTracking = payload.new as TrackingData;
          setTrackingData(newTracking);
          setTrackingHistory(current => [newTracking, ...current]);
        }
      )
      .subscribe(status => {
        console.log('📡 Tracking subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up tracking subscription');
      supabase.removeChannel(subscription);
    };
  }, [bookingId, supabase, toast]);

  // Update tracking status (provider only)
  const updateTrackingStatus = async () => {
    if (userRole !== 'provider') return;

    setUpdating(true);

    try {
      // Call the update function
      const { data, error } = await (supabase as any).rpc(
        'update_tracking_status',
        {
          p_booking_id: bookingId,
          p_new_status: newStatus,
          p_location_address: locationInput || null,
          p_notes: notesInput || null,
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Status Updated Successfully! ✅',
          description: `Service status updated to: ${newStatus.replace('_', ' ')}`,
        });

        // Clear inputs
        setLocationInput('');
        setNotesInput('');
      } else {
        throw new Error(data?.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating tracking:', error);
      toast({
        title: 'Update Failed',
        description:
          error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='w-4 h-4 text-yellow-600' />;
      case 'confirmed':
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      case 'on_route':
        return <Car className='w-4 h-4 text-blue-600' />;
      case 'arrived':
        return <MapPin className='w-4 h-4 text-purple-600' />;
      case 'service_started':
        return <PlayCircle className='w-4 h-4 text-green-600' />;
      case 'service_completed':
        return <Wrench className='w-4 h-4 text-green-600' />;
      case 'completed':
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      case 'cancelled':
        return <AlertCircle className='w-4 h-4 text-red-600' />;
      default:
        return <Clock className='w-4 h-4 text-gray-600' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'on_route':
        return 'bg-blue-100 text-blue-800';
      case 'arrived':
        return 'bg-purple-100 text-purple-800';
      case 'service_started':
        return 'bg-green-100 text-green-800';
      case 'service_completed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'on_route', label: 'On Route' },
    { value: 'arrived', label: 'Arrived' },
    { value: 'service_started', label: 'Service Started' },
    { value: 'service_completed', label: 'Service Completed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='animate-pulse space-y-4'>
            <div className='h-4 bg-gray-200 rounded w-1/3'></div>
            <div className='h-8 bg-gray-200 rounded w-1/2'></div>
            <div className='h-20 bg-gray-200 rounded'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Navigation className='w-5 h-5' />
            Service Tracking
          </CardTitle>
          <CardDescription>
            {booking?.service.title} - {booking?.booking_number}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trackingData ? (
            <div className='space-y-4'>
              {/* Current Status */}
              <div className='flex items-center gap-4'>
                {getStatusIcon(trackingData.status)}
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <Badge className={getStatusColor(trackingData.status)}>
                      {trackingData.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className='text-sm text-gray-500'>
                      Updated {formatDateTime(trackingData.updated_at)}
                    </span>
                  </div>
                  {trackingData.notes && (
                    <p className='text-sm text-gray-600 mt-1'>
                      {trackingData.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Location Information */}
              {trackingData.location_address && (
                <div className='flex items-center gap-2 p-3 bg-gray-50 rounded-lg'>
                  <MapPin className='w-4 h-4 text-gray-600' />
                  <span className='text-sm'>
                    {trackingData.location_address}
                  </span>
                </div>
              )}

              {/* Estimated/Actual Arrival */}
              {(trackingData.estimated_arrival ||
                trackingData.actual_arrival) && (
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  {trackingData.estimated_arrival && (
                    <div>
                      <span className='font-medium'>Estimated Arrival:</span>
                      <p className='text-gray-600'>
                        {formatDateTime(trackingData.estimated_arrival)}
                      </p>
                    </div>
                  )}
                  {trackingData.actual_arrival && (
                    <div>
                      <span className='font-medium'>Actual Arrival:</span>
                      <p className='text-gray-600'>
                        {formatDateTime(trackingData.actual_arrival)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Information */}
              {booking && (
                <div className='flex gap-2 pt-2 border-t'>
                  {booking.client_phone && (
                    <Button variant='outline' size='sm'>
                      <Phone className='w-4 h-4 mr-1' />
                      Call Client
                    </Button>
                  )}
                  <Button variant='outline' size='sm'>
                    <MessageCircle className='w-4 h-4 mr-1' />
                    Message
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className='text-center py-8'>
              <Navigation className='w-12 h-12 text-gray-300 mx-auto mb-4' />
              <p className='text-gray-500'>No tracking data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider Update Panel */}
      {userRole === 'provider' && trackingData && (
        <Card>
          <CardHeader>
            <CardTitle>Update Service Status</CardTitle>
            <CardDescription>
              Update the status to keep your client informed in real-time
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-2'>Status</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className='w-full p-2 border rounded-md'
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>
                Location (Optional)
              </label>
              <Input
                value={locationInput}
                onChange={e => setLocationInput(e.target.value)}
                placeholder='e.g., 123 Main St, New York, NY'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>
                Notes (Optional)
              </label>
              <Textarea
                value={notesInput}
                onChange={e => setNotesInput(e.target.value)}
                placeholder='Additional information for the client...'
                rows={3}
              />
            </div>

            <Button
              onClick={updateTrackingStatus}
              disabled={updating || newStatus === trackingData.status}
              className='w-full'
            >
              {updating ? 'Updating...' : 'Update Status'}
            </Button>

            <div className='text-xs text-gray-500 bg-blue-50 p-3 rounded-lg'>
              💡 <strong>Tip:</strong> Status updates trigger automatic
              notifications to the client and team via email, Slack, and
              real-time dashboard updates.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking History */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking History</CardTitle>
          <CardDescription>
            Complete timeline of service updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trackingHistory.length > 0 ? (
            <div className='space-y-4'>
              {trackingHistory.map((record, index) => (
                <div key={record.id} className='flex items-start gap-4'>
                  <div className='flex-shrink-0 mt-1'>
                    {getStatusIcon(record.status)}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <Badge
                        className={getStatusColor(record.status)}
                        variant='outline'
                      >
                        {record.status.replace('_', ' ')}
                      </Badge>
                      <span className='text-sm text-gray-500'>
                        {formatDateTime(record.updated_at)}
                      </span>
                    </div>
                    {record.notes && (
                      <p className='text-sm text-gray-600 mt-1'>
                        {record.notes}
                      </p>
                    )}
                    {record.location_address && (
                      <p className='text-sm text-gray-500 mt-1 flex items-center gap-1'>
                        <MapPin className='w-3 h-3' />
                        {record.location_address}
                      </p>
                    )}
                  </div>
                  {index < trackingHistory.length - 1 && (
                    <div className='absolute left-2 mt-8 w-px h-6 bg-gray-200'></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8'>
              <Clock className='w-12 h-12 text-gray-300 mx-auto mb-4' />
              <p className='text-gray-500'>No tracking history available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
