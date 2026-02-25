'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealTimeNotifications } from '@/components/real-time-notifications';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Star,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company_name?: string;
  phone?: string;
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
  quoted_price: number;
  created_at: string;
  service: {
    title: string;
    category: string;
    location_type: string;
  };
}

interface Service {
  id: string;
  title: string;
  category: string;
  base_price: number;
  currency: string;
  location_type: string;
  status: string;
  created_at: string;
}

interface DashboardStats {
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  total_revenue: number;
  this_month_revenue: number;
  active_services: number;
  avg_rating: number;
}

interface ProviderDashboardProps {
  user: User;
}

export function ProviderDashboard({ user }: ProviderDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load recent bookings with real-time subscription
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(
            `
            *,
            service:services(title, category, location_type)
          `
          )
          .eq('services.provider_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (bookingsError) throw bookingsError;
        setRecentBookings(bookingsData || []);

        // Load services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false });

        if (servicesError) throw servicesError;
        setServices(servicesData || []);

        // Calculate stats
        const totalBookings = bookingsData?.length || 0;
        const pendingBookings =
          bookingsData?.filter(b => b.status === 'pending').length || 0;
        const confirmedBookings =
          bookingsData?.filter(b => b.status === 'confirmed').length || 0;
        const totalRevenue =
          bookingsData?.reduce((sum, b) => sum + (b.quoted_price || 0), 0) || 0;

        const thisMonth = new Date();
        thisMonth.setDate(1);
        const thisMonthRevenue =
          bookingsData
            ?.filter(b => new Date(b.created_at) >= thisMonth)
            .reduce((sum, b) => sum + (b.quoted_price || 0), 0) || 0;

        setStats({
          total_bookings: totalBookings,
          pending_bookings: pendingBookings,
          confirmed_bookings: confirmedBookings,
          total_revenue: totalRevenue,
          this_month_revenue: thisMonthRevenue,
          active_services:
            servicesData?.filter(s => s.status === 'active').length || 0,
          avg_rating: 4.8, // This would come from reviews table
        });
      } catch (error) {
        toast({
          title: 'Failed to load dashboard',
          description: 'Please refresh the page to try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user.id, supabase, toast]);

  // Set up real-time subscription for bookings
  useEffect(() => {
    const subscription = supabase
      .channel(`provider-bookings:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `service_id=in.(${services.map(s => s.id).join(',')})`,
        },
        payload => {
          if (payload.eventType === 'INSERT') {
            // New booking created
            const newBooking = payload.new as Booking;
            setRecentBookings(current => [newBooking, ...current.slice(0, 9)]);

            // Update stats
            setStats(current =>
              current
                ? {
                    ...current,
                    total_bookings: current.total_bookings + 1,
                    pending_bookings: current.pending_bookings + 1,
                  }
                : null
            );
          } else if (payload.eventType === 'UPDATE') {
            // Booking status changed
            const updatedBooking = payload.new as Booking;
            setRecentBookings(current =>
              current.map(b =>
                b.id === updatedBooking.id ? updatedBooking : b
              )
            );
          }
        }
      )
      .subscribe(status => {});

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user.id, services, supabase]);

  const handleBookingAction = async (bookingId: string, action: string) => {
    try {
      let newStatus = '';
      switch (action) {
        case 'confirm':
          newStatus = 'confirmed';
          break;
        case 'cancel':
          newStatus = 'cancelled';
          break;
        case 'complete':
          newStatus = 'completed';
          break;
        default:
          return;
      }

      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: `Booking ${action}ed successfully`,
        description: `The booking status has been updated to ${newStatus}.`,
      });
    } catch (error) {
      toast({
        title: `Failed to ${action} booking`,
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className='p-6'>
        <div className='animate-pulse space-y-6'>
          <div className='h-8 bg-gray-200 rounded w-1/3'></div>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className='h-24 bg-gray-200 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Header with Notifications */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Welcome back, {user.full_name}! 👋
          </h1>
          <p className='text-gray-600 mt-1'>
            Here's what's happening with your services today.
          </p>
        </div>
        <RealTimeNotifications user={user} />
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Bookings
              </CardTitle>
              <Calendar className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.total_bookings}</div>
              <p className='text-xs text-muted-foreground'>
                {stats.pending_bookings} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                This Month Revenue
              </CardTitle>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {formatCurrency(stats.this_month_revenue)}
              </div>
              <p className='text-xs text-muted-foreground'>
                Total: {formatCurrency(stats.total_revenue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Active Services
              </CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.active_services}</div>
              <p className='text-xs text-muted-foreground'>
                {services.length} total services
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Average Rating
              </CardTitle>
              <Star className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.avg_rating}</div>
              <p className='text-xs text-muted-foreground'>
                Based on recent reviews
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='w-5 h-5' />
            Recent Bookings
          </CardTitle>
          <CardDescription>
            Your latest booking requests and confirmed appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <div className='text-center py-8'>
              <Calendar className='w-12 h-12 text-gray-300 mx-auto mb-4' />
              <p className='text-gray-500'>No bookings yet</p>
              <p className='text-sm text-gray-400 mt-1'>
                Bookings will appear here when clients book your services
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {recentBookings.map(booking => (
                <div
                  key={booking.id}
                  className='border rounded-lg p-4 hover:bg-gray-50 transition-colors'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <h3 className='font-medium'>{booking.service.title}</h3>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <Badge variant='outline'>
                          {booking.booking_number}
                        </Badge>
                      </div>

                      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3'>
                        <div className='flex items-center gap-1'>
                          <Users className='w-4 h-4' />
                          {booking.client_name}
                        </div>
                        <div className='flex items-center gap-1'>
                          <Mail className='w-4 h-4' />
                          {booking.client_email}
                        </div>
                        <div className='flex items-center gap-1'>
                          <Calendar className='w-4 h-4' />
                          {new Date(
                            booking.scheduled_start
                          ).toLocaleDateString()}
                        </div>
                        <div className='flex items-center gap-1'>
                          <DollarSign className='w-4 h-4' />
                          {formatCurrency(booking.quoted_price)}
                        </div>
                      </div>

                      <div className='text-sm text-gray-500'>
                        {new Date(booking.scheduled_start).toLocaleString()} -{' '}
                        {new Date(booking.scheduled_end).toLocaleString()}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex gap-2 ml-4'>
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            size='sm'
                            onClick={() =>
                              handleBookingAction(booking.id, 'confirm')
                            }
                            className='bg-green-600 hover:bg-green-700'
                          >
                            Confirm
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              handleBookingAction(booking.id, 'cancel')
                            }
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <Button
                          size='sm'
                          onClick={() =>
                            handleBookingAction(booking.id, 'complete')
                          }
                          className='bg-blue-600 hover:bg-blue-700'
                        >
                          Mark Complete
                        </Button>
                      )}
                      {booking.client_phone && (
                        <Button size='sm' variant='outline'>
                          <Phone className='w-4 h-4' />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Create New Service</CardTitle>
            <CardDescription>Add a new service offering</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className='w-full'>
              <TrendingUp className='w-4 h-4 mr-2' />
              Create Service
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>View Calendar</CardTitle>
            <CardDescription>See your upcoming appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant='outline' className='w-full'>
              <Calendar className='w-4 h-4 mr-2' />
              Open Calendar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Analytics</CardTitle>
            <CardDescription>View detailed performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant='outline' className='w-full'>
              <TrendingUp className='w-4 h-4 mr-2' />
              View Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
