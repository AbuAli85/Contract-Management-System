'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bell,
  BellOff,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  CreditCard,
  Calendar,
  MessageSquare,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  useBookingEvents,
  useUserBookingEvents,
  formatEventDescription,
  bookingSubscriptionManager,
  type BookingEventPayload,
} from '@/lib/realtime/booking-subscriptions';
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider';
import { useAuth } from '@/app/providers';
import { toast } from 'sonner';

interface RealTimeBookingEventsProps {
  bookingId?: string;
  showUserEvents?: boolean;
  maxEvents?: number;
  className?: string;
}

export function RealTimeBookingEvents({
  bookingId,
  showUserEvents = false,
  maxEvents = 50,
  className,
}: RealTimeBookingEventsProps) {
  const { user } = useAuth();
  const { userRole } = useEnhancedRBAC();
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [subscriptionCount, setSubscriptionCount] = useState(0);

  // Use appropriate hook based on props
  const {
    events: bookingEvents,
    isConnected: bookingConnected,
    error: bookingError,
    clearEvents: clearBookingEvents,
  } = useBookingEvents(bookingId || null);

  const {
    events: userEvents,
    isConnected: userConnected,
    clearEvents: clearUserEvents,
  } = useUserBookingEvents(showUserEvents && user?.id ? user.id : null);

  // Combine events based on what we're showing
  const events = showUserEvents ? userEvents : bookingEvents;
  const isConnected = showUserEvents ? userConnected : bookingConnected;
  const error = showUserEvents ? null : bookingError;
  const clearEvents = showUserEvents ? clearUserEvents : clearBookingEvents;

  // Update subscription status
  useEffect(() => {
    const updateStatus = () => {
      const count = bookingSubscriptionManager.getActiveSubscriptionCount();
      setSubscriptionCount(count);
      setIsSubscriptionActive(count > 0);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle new events with toast notifications
  useEffect(() => {
    if (events.length > 0) {
      const latestEvent = events[0];
      const eventAge = Date.now() - new Date(latestEvent.created_at).getTime();

      // Only show toast for events less than 5 seconds old
      if (eventAge < 5000) {
        const description = formatEventDescription(latestEvent);
        toast.info('Booking Update', {
          description,
          duration: 3000,
        });
      }
    }
  }, [events]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'booking_created':
        return <Calendar className='h-4 w-4 text-blue-500' />;
      case 'booking_confirmed':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'booking_cancelled':
        return <XCircle className='h-4 w-4 text-red-500' />;
      case 'booking_completed':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'payment_received':
        return <CreditCard className='h-4 w-4 text-green-500' />;
      case 'reminder_sent':
        return <Bell className='h-4 w-4 text-orange-500' />;
      case 'booking_updated':
        return <RefreshCw className='h-4 w-4 text-blue-500' />;
      default:
        return <Activity className='h-4 w-4 text-gray-500' />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'booking_created':
        return 'bg-blue-100 text-blue-800';
      case 'booking_confirmed':
        return 'bg-green-100 text-green-800';
      case 'booking_cancelled':
        return 'bg-red-100 text-red-800';
      case 'booking_completed':
        return 'bg-green-100 text-green-800';
      case 'payment_received':
        return 'bg-emerald-100 text-emerald-800';
      case 'reminder_sent':
        return 'bg-orange-100 text-orange-800';
      case 'booking_updated':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffMs = now.getTime() - eventTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              {isConnected ? (
                <Activity className='h-5 w-5 text-green-500 animate-pulse' />
              ) : (
                <BellOff className='h-5 w-5 text-gray-400' />
              )}
              Real-time Events
              {subscriptionCount > 0 && (
                <Badge variant='outline' className='ml-2'>
                  {subscriptionCount} active
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {showUserEvents
                ? 'Live updates for all your bookings'
                : bookingId
                  ? 'Live updates for this booking'
                  : 'Real-time booking event monitoring'}
            </CardDescription>
          </div>

          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-1'>
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className='text-xs text-gray-500'>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {events.length > 0 && (
              <Button variant='outline' size='sm' onClick={clearEvents}>
                <Trash2 className='h-3 w-3 mr-1' />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant='destructive' className='mb-4'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isConnected && !error && (
          <Alert className='mb-4'>
            <Activity className='h-4 w-4' />
            <AlertDescription>
              Connecting to real-time events...
            </AlertDescription>
          </Alert>
        )}

        {events.length === 0 && isConnected ? (
          <div className='text-center py-8 text-gray-500'>
            <Bell className='h-12 w-12 mx-auto mb-4 text-gray-300' />
            <p>No events yet</p>
            <p className='text-sm'>Events will appear here in real-time</p>
          </div>
        ) : (
          <ScrollArea className='h-96'>
            <div className='space-y-4'>
              {events.slice(0, maxEvents).map((event, index) => (
                <div key={event.id} className='relative'>
                  <div className='flex items-start gap-3'>
                    <div className='flex-shrink-0 mt-1'>
                      {getEventIcon(event.event_type)}
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between mb-1'>
                        <Badge className={getEventColor(event.event_type)}>
                          {event.event_type.replace('_', ' ')}
                        </Badge>
                        <span className='text-xs text-gray-500 flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          {formatTimeAgo(event.created_at)}
                        </span>
                      </div>

                      <p className='text-sm text-gray-900 mb-1'>
                        {formatEventDescription(event)}
                      </p>

                      {event.description &&
                        event.description !== formatEventDescription(event) && (
                          <p className='text-xs text-gray-500'>
                            {event.description}
                          </p>
                        )}

                      {(event.old_value || event.new_value) && (
                        <div className='mt-2 p-2 bg-gray-50 rounded text-xs'>
                          {event.old_value && (
                            <div className='text-red-600'>
                              <span className='font-medium'>Before: </span>
                              {JSON.stringify(event.old_value, null, 0)}
                            </div>
                          )}
                          {event.new_value && (
                            <div className='text-green-600'>
                              <span className='font-medium'>After: </span>
                              {JSON.stringify(event.new_value, null, 0)}
                            </div>
                          )}
                        </div>
                      )}

                      <div className='flex items-center gap-4 mt-2 text-xs text-gray-400'>
                        {event.booking_id && (
                          <span>
                            Booking: {event.booking_id.slice(0, 8)}...
                          </span>
                        )}
                        {event.created_by && (
                          <span>By: {event.created_by.slice(0, 8)}...</span>
                        )}
                        <span>
                          {new Date(event.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {index < events.length - 1 && <Separator className='mt-4' />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {events.length > maxEvents && (
          <div className='mt-4 text-center'>
            <Badge variant='outline'>
              Showing {maxEvents} of {events.length} events
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simplified component for specific booking
export function BookingEventMonitor({
  bookingId,
  className,
}: {
  bookingId: string;
  className?: string;
}) {
  return (
    <RealTimeBookingEvents
      bookingId={bookingId}
      className={className}
      maxEvents={20}
    />
  );
}

// Component for user's all events
export function UserEventMonitor({ className }: { className?: string }) {
  return (
    <RealTimeBookingEvents
      showUserEvents={true}
      className={className}
      maxEvents={30}
    />
  );
}
