'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  Star,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Plus,
  BarChart3,
  Settings,
  MapPin,
  Phone,
  Mail,
  Eye,
} from 'lucide-react';
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProviderStats {
  totalServices: number;
  activeServices: number;
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  averageRating: number;
  totalReviews: number;
  totalRevenue: number;
  monthlyRevenue: number;
  responseRate: number;
}

interface Service {
  id: string;
  name: string;
  category: string;
  price_base: number;
  status: string;
  bookings_count: number;
  rating: number;
  reviews_count: number;
  created_at: string;
}

interface Booking {
  id: string;
  booking_number: string;
  client_name: string;
  client_avatar?: string;
  service_name: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  total_price: number;
  currency: string;
  client_notes?: string;
}

interface Review {
  id: string;
  client_name: string;
  service_name: string;
  rating: number;
  review_text: string;
  created_at: string;
  response_text?: string;
}

export function ProviderDashboard() {
  const { userRole, isLoading: rbacLoading } = useEnhancedRBAC();
  const [stats, setStats] = useState<ProviderStats>({
    totalServices: 0,
    activeServices: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    averageRating: 0,
    totalReviews: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    responseRate: 0,
  });
  const [services, setServices] = useState<Service[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!rbacLoading) {
      loadProviderData();
    }
  }, [rbacLoading]);

  const loadProviderData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Load provider stats
      const { data: statsData } = await supabase
        .from('provider_dashboard_stats')
        .select('*')
        .eq('provider_id', user.id)
        .single();

      if (statsData) {
        setStats({
          totalServices: statsData.total_services || 0,
          activeServices: statsData.active_services || 0,
          totalBookings: statsData.total_bookings || 0,
          confirmedBookings: statsData.confirmed_bookings || 0,
          completedBookings: statsData.completed_bookings || 0,
          averageRating: statsData.average_rating || 0,
          totalReviews: statsData.total_reviews || 0,
          totalRevenue: statsData.total_revenue || 0,
          monthlyRevenue: 0, // Calculate separately
          responseRate: 95, // TODO: Calculate from response times
        });
      }

      // Load services
      const { data: servicesData } = await supabase
        .from('provider_services')
        .select(
          `
          id,
          name,
          category,
          price_base,
          status,
          created_at,
          service_reviews (rating),
          bookings (id, status)
        `
        )
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (servicesData) {
        setServices(
          servicesData.map(service => ({
            id: service.id,
            name: service.name,
            category: service.category || 'General',
            price_base: service.price_base || 0,
            status: service.status,
            bookings_count: service.bookings?.length || 0,
            rating:
              service.service_reviews?.reduce((sum, r) => sum + r.rating, 0) /
                (service.service_reviews?.length || 1) || 0,
            reviews_count: service.service_reviews?.length || 0,
            created_at: service.created_at,
          }))
        );
      }

      // Load upcoming bookings
      const { data: upcomingData } = await supabase
        .from('bookings')
        .select(
          `
          id,
          booking_number,
          scheduled_start,
          scheduled_end,
          status,
          total_price,
          currency,
          client_notes,
          provider_services (name),
          client:users!client_id (
            full_name,
            avatar_url
          )
        `
        )
        .eq('provider_id', user.id)
        .in('status', ['confirmed', 'pending'])
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true })
        .limit(5);

      if (upcomingData) {
        setUpcomingBookings(
          upcomingData.map(booking => ({
            id: booking.id,
            booking_number: booking.booking_number,
            client_name: booking.client?.full_name || 'Unknown Client',
            client_avatar: booking.client?.avatar_url,
            service_name: booking.provider_services?.name || 'Unknown Service',
            scheduled_start: booking.scheduled_start,
            scheduled_end: booking.scheduled_end,
            status: booking.status,
            total_price: booking.total_price || 0,
            currency: booking.currency || 'USD',
            client_notes: booking.client_notes,
          }))
        );
      }

      // Load recent bookings
      const { data: recentData } = await supabase
        .from('bookings')
        .select(
          `
          id,
          booking_number,
          scheduled_start,
          scheduled_end,
          status,
          total_price,
          currency,
          provider_services (name),
          client:users!client_id (
            full_name,
            avatar_url
          )
        `
        )
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentData) {
        setRecentBookings(
          recentData.map(booking => ({
            id: booking.id,
            booking_number: booking.booking_number,
            client_name: booking.client?.full_name || 'Unknown Client',
            client_avatar: booking.client?.avatar_url,
            service_name: booking.provider_services?.name || 'Unknown Service',
            scheduled_start: booking.scheduled_start,
            scheduled_end: booking.scheduled_end,
            status: booking.status,
            total_price: booking.total_price || 0,
            currency: booking.currency || 'USD',
          }))
        );
      }

      // Load recent reviews
      const { data: reviewsData } = await supabase
        .from('service_reviews')
        .select(
          `
          id,
          rating,
          review_text,
          response_text,
          created_at,
          client:users!client_id (full_name),
          provider_services (name)
        `
        )
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (reviewsData) {
        setRecentReviews(
          reviewsData.map(review => ({
            id: review.id,
            client_name: review.client?.full_name || 'Anonymous',
            service_name: review.provider_services?.name || 'Unknown Service',
            rating: review.rating,
            review_text: review.review_text || '',
            created_at: review.created_at,
            response_text: review.response_text,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading provider data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (rbacLoading || isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600'></div>
        <span className='ml-3 text-lg'>Loading your dashboard...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Welcome Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Provider Dashboard
          </h1>
          <p className='text-gray-600'>Manage your services and bookings</p>
        </div>
        <div className='flex gap-2'>
          <Link href='/provider/services/new'>
            <Button className='bg-green-600 hover:bg-green-700'>
              <Plus className='w-4 h-4 mr-2' />
              Add Service
            </Button>
          </Link>
          <Link href='/provider/settings'>
            <Button variant='outline'>
              <Settings className='w-4 h-4 mr-2' />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className='text-xs text-muted-foreground'>
              +{formatCurrency(stats.monthlyRevenue)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Services
            </CardTitle>
            <CheckCircle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.activeServices}</div>
            <p className='text-xs text-muted-foreground'>
              of {stats.totalServices} total services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Bookings</CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.confirmedBookings}</div>
            <p className='text-xs text-muted-foreground'>
              {stats.totalBookings} total bookings
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
            <div className='text-2xl font-bold'>
              {stats.averageRating.toFixed(1)}
            </div>
            <p className='text-xs text-muted-foreground'>
              from {stats.totalReviews} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='bookings'>Bookings</TabsTrigger>
          <TabsTrigger value='services'>Services</TabsTrigger>
          <TabsTrigger value='reviews'>Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Upcoming Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Bookings</CardTitle>
                <CardDescription>Your confirmed appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className='text-center py-8'>
                    <Calendar className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <p className='text-gray-500'>No upcoming bookings</p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {upcomingBookings.map(booking => (
                      <div
                        key={booking.id}
                        className='flex items-center space-x-4 p-3 border rounded-lg'
                      >
                        <Avatar>
                          <AvatarImage src={booking.client_avatar} />
                          <AvatarFallback>
                            {booking.client_name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex-1 min-w-0'>
                          <p className='font-medium truncate'>
                            {booking.client_name}
                          </p>
                          <p className='text-sm text-gray-500'>
                            {booking.service_name}
                          </p>
                          <p className='text-sm text-gray-500'>
                            {formatDate(booking.scheduled_start)}
                          </p>
                        </div>
                        <div className='text-right'>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                          <p className='text-sm font-medium mt-1'>
                            {formatCurrency(
                              booking.total_price,
                              booking.currency
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                    <Link href='/provider/bookings'>
                      <Button variant='outline' className='w-full'>
                        View All Bookings
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>Latest client feedback</CardDescription>
              </CardHeader>
              <CardContent>
                {recentReviews.length === 0 ? (
                  <div className='text-center py-8'>
                    <Star className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <p className='text-gray-500'>No reviews yet</p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {recentReviews.map(review => (
                      <div key={review.id} className='p-3 border rounded-lg'>
                        <div className='flex items-center justify-between mb-2'>
                          <p className='font-medium'>{review.client_name}</p>
                          <div className='flex items-center'>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className='text-sm text-gray-500 mb-1'>
                          {review.service_name}
                        </p>
                        <p className='text-sm text-gray-600 line-clamp-2'>
                          {review.review_text}
                        </p>
                        {!review.response_text && (
                          <Button size='sm' variant='outline' className='mt-2'>
                            Respond
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='bookings' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>
                Manage your booking requests and appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {recentBookings.map(booking => (
                  <div
                    key={booking.id}
                    className='flex items-center justify-between p-4 border rounded-lg'
                  >
                    <div className='flex items-center space-x-4'>
                      <Avatar>
                        <AvatarImage src={booking.client_avatar} />
                        <AvatarFallback>
                          {booking.client_name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className='font-medium'>{booking.client_name}</p>
                        <p className='text-sm text-gray-500'>
                          {booking.service_name}
                        </p>
                        <p className='text-sm text-gray-500'>
                          {formatDate(booking.scheduled_start)}
                        </p>
                        <p className='text-xs text-gray-400'>
                          #{booking.booking_number}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                      <span className='font-medium'>
                        {formatCurrency(booking.total_price, booking.currency)}
                      </span>
                      <Button size='sm' variant='outline'>
                        <Eye className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='services' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Your Services</CardTitle>
              <CardDescription>Manage your service offerings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {services.map(service => (
                  <div key={service.id} className='border rounded-lg p-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <h4 className='font-medium'>{service.name}</h4>
                      <Badge className={getStatusColor(service.status)}>
                        {service.status}
                      </Badge>
                    </div>
                    <p className='text-sm text-gray-500 mb-2'>
                      {service.category}
                    </p>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='font-medium'>
                        {formatCurrency(service.price_base)}
                      </span>
                      <div className='flex items-center'>
                        <Star className='h-3 w-3 text-yellow-400 fill-current mr-1' />
                        <span className='text-xs'>
                          {service.rating.toFixed(1)} ({service.reviews_count})
                        </span>
                      </div>
                    </div>
                    <p className='text-xs text-gray-400 mb-3'>
                      {service.bookings_count} bookings
                    </p>
                    <div className='flex space-x-2'>
                      <Button size='sm' variant='outline' className='flex-1'>
                        Edit
                      </Button>
                      <Button size='sm' variant='outline'>
                        <BarChart3 className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className='border-2 border-dashed border-gray-200 rounded-lg p-4 flex items-center justify-center'>
                  <Link href='/provider/services/new'>
                    <Button variant='outline'>
                      <Plus className='w-4 h-4 mr-2' />
                      Add Service
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='reviews' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Client Reviews</CardTitle>
              <CardDescription>
                Manage and respond to client feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {recentReviews.map(review => (
                  <div key={review.id} className='border rounded-lg p-4'>
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center space-x-3'>
                        <Avatar className='h-8 w-8'>
                          <AvatarFallback>
                            {review.client_name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium'>{review.client_name}</p>
                          <p className='text-sm text-gray-500'>
                            {review.service_name}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center'>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className='text-gray-700 mb-3'>{review.review_text}</p>
                    {review.response_text ? (
                      <div className='bg-gray-50 p-3 rounded mt-3'>
                        <p className='text-sm font-medium text-gray-700 mb-1'>
                          Your Response:
                        </p>
                        <p className='text-sm text-gray-600'>
                          {review.response_text}
                        </p>
                      </div>
                    ) : (
                      <Button size='sm' variant='outline'>
                        Respond to Review
                      </Button>
                    )}
                    <p className='text-xs text-gray-400 mt-2'>
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
