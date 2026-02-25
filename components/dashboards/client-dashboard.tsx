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
import {
  Calendar,
  Clock,
  Star,
  Heart,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  CreditCard,
} from 'lucide-react';
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

interface ClientStats {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  favoriteServices: number;
  totalSpent: number;
  averageRating: number;
}

interface Booking {
  id: string;
  booking_number: string;
  service_name: string;
  provider_name: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  total_price: number;
  currency: string;
  provider_avatar?: string;
}

interface FavoriteService {
  id: string;
  service_name: string;
  provider_name: string;
  category: string;
  price_base: number;
  rating: number;
  image_url?: string;
}

interface RecentReview {
  id: string;
  service_name: string;
  rating: number;
  review_text: string;
  created_at: string;
}

export function ClientDashboard() {
  const { userRole, isLoading: rbacLoading } = useEnhancedRBAC();
  const [stats, setStats] = useState<ClientStats>({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    favoriteServices: 0,
    totalSpent: 0,
    averageRating: 0,
  });
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [favoriteServices, setFavoriteServices] = useState<FavoriteService[]>(
    []
  );
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!rbacLoading) {
      loadClientData();
    }
  }, [rbacLoading]);

  const loadClientData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Load client stats
      const { data: statsData } = await supabase
        .from('client_dashboard_stats')
        .select('*')
        .eq('client_id', user.id)
        .single();

      if (statsData) {
        setStats({
          totalBookings: statsData.total_bookings || 0,
          upcomingBookings: statsData.upcoming_bookings || 0,
          completedBookings: statsData.completed_bookings || 0,
          favoriteServices: statsData.favorite_services || 0,
          totalSpent: statsData.total_spent || 0,
          averageRating: 0, // We'll calculate this from reviews
        });
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
          provider_services (
            name,
            provider:users!provider_id (
              full_name,
              avatar_url
            )
          )
        `
        )
        .eq('client_id', user.id)
        .in('status', ['confirmed', 'pending'])
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true })
        .limit(5);

      if (upcomingData) {
        setUpcomingBookings(
          upcomingData.map(booking => ({
            id: booking.id,
            booking_number: booking.booking_number,
            service_name: booking.provider_services?.name || 'Unknown Service',
            provider_name:
              booking.provider_services?.provider?.full_name ||
              'Unknown Provider',
            scheduled_start: booking.scheduled_start,
            scheduled_end: booking.scheduled_end,
            status: booking.status,
            total_price: booking.total_price || 0,
            currency: booking.currency || 'USD',
            provider_avatar: booking.provider_services?.provider?.avatar_url,
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
          provider_services (
            name,
            provider:users!provider_id (
              full_name,
              avatar_url
            )
          )
        `
        )
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentData) {
        setRecentBookings(
          recentData.map(booking => ({
            id: booking.id,
            booking_number: booking.booking_number,
            service_name: booking.provider_services?.name || 'Unknown Service',
            provider_name:
              booking.provider_services?.provider?.full_name ||
              'Unknown Provider',
            scheduled_start: booking.scheduled_start,
            scheduled_end: booking.scheduled_end,
            status: booking.status,
            total_price: booking.total_price || 0,
            currency: booking.currency || 'USD',
            provider_avatar: booking.provider_services?.provider?.avatar_url,
          }))
        );
      }

      // Load favorite services
      const { data: favoritesData } = await supabase
        .from('client_favorites')
        .select(
          `
          id,
          provider_services (
            id,
            name,
            category,
            price_base,
            images,
            provider:users!provider_id (
              full_name
            )
          )
        `
        )
        .eq('client_id', user.id)
        .limit(6);

      if (favoritesData) {
        setFavoriteServices(
          favoritesData.map(fav => ({
            id: fav.id,
            service_name: fav.provider_services?.name || 'Unknown Service',
            provider_name:
              fav.provider_services?.provider?.full_name || 'Unknown Provider',
            category: fav.provider_services?.category || 'General',
            price_base: fav.provider_services?.price_base || 0,
            rating: fav.provider_services?.average_rating || fav.provider_services?.rating || 0,
            image_url: fav.provider_services?.images?.[0],
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
          created_at,
          provider_services (
            name
          )
        `
        )
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (reviewsData) {
        setRecentReviews(
          reviewsData.map(review => ({
            id: review.id,
            service_name: review.provider_services?.name || 'Unknown Service',
            rating: review.rating,
            review_text: review.review_text || '',
            created_at: review.created_at,
          }))
        );
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
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
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        <span className='ml-3 text-lg'>Loading your dashboard...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Welcome Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Welcome Back!</h1>
          <p className='text-gray-600'>
            Manage your bookings and discover new services
          </p>
        </div>
        <Link href='/services'>
          <Button className='bg-blue-600 hover:bg-blue-700'>
            <Calendar className='w-4 h-4 mr-2' />
            Book a Service
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Bookings
            </CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalBookings}</div>
            <p className='text-xs text-muted-foreground'>All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Upcoming</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.upcomingBookings}</div>
            <p className='text-xs text-muted-foreground'>Confirmed bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Favorites</CardTitle>
            <Heart className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.favoriteServices}</div>
            <p className='text-xs text-muted-foreground'>Saved services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Spent</CardTitle>
            <CreditCard className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(stats.totalSpent)}
            </div>
            <p className='text-xs text-muted-foreground'>All time spending</p>
          </CardContent>
        </Card>
      </div>

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
                <Link href='/services'>
                  <Button variant='outline' className='mt-2'>
                    Browse Services
                  </Button>
                </Link>
              </div>
            ) : (
              <div className='space-y-4'>
                {upcomingBookings.map(booking => (
                  <div
                    key={booking.id}
                    className='flex items-center space-x-4 p-3 border rounded-lg'
                  >
                    <Avatar>
                      <AvatarImage src={booking.provider_avatar} />
                      <AvatarFallback>
                        {booking.provider_name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium truncate'>
                        {booking.service_name}
                      </p>
                      <p className='text-sm text-gray-500'>
                        {booking.provider_name}
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
                        {formatCurrency(booking.total_price, booking.currency)}
                      </p>
                    </div>
                  </div>
                ))}
                <Link href='/bookings'>
                  <Button variant='outline' className='w-full'>
                    View All Bookings
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Favorite Services */}
        <Card>
          <CardHeader>
            <CardTitle>Favorite Services</CardTitle>
            <CardDescription>
              Your saved services for quick booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            {favoriteServices.length === 0 ? (
              <div className='text-center py-8'>
                <Heart className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>No favorite services yet</p>
                <Link href='/services'>
                  <Button variant='outline' className='mt-2'>
                    Explore Services
                  </Button>
                </Link>
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {favoriteServices.map(service => (
                  <div key={service.id} className='border rounded-lg p-3'>
                    <div className='aspect-video bg-gray-100 rounded mb-2 overflow-hidden'>
                      {service.image_url ? (
                        <img
                          src={service.image_url}
                          alt={service.service_name}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center text-gray-400'>
                          No Image
                        </div>
                      )}
                    </div>
                    <h4 className='font-medium truncate'>
                      {service.service_name}
                    </h4>
                    <p className='text-sm text-gray-500 truncate'>
                      {service.provider_name}
                    </p>
                    <div className='flex items-center justify-between mt-2'>
                      <span className='text-sm font-medium'>
                        {formatCurrency(service.price_base)}
                      </span>
                      <div className='flex items-center'>
                        <Star className='h-3 w-3 text-yellow-400 fill-current' />
                        <span className='text-xs ml-1'>{service.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <Link href='/favorites'>
                  <Button variant='outline' className='col-span-full'>
                    View All Favorites
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Reviews */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest bookings and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {recentBookings.map(booking => (
                <div
                  key={booking.id}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div>
                    <p className='font-medium'>{booking.service_name}</p>
                    <p className='text-sm text-gray-500'>
                      {booking.provider_name}
                    </p>
                    <p className='text-xs text-gray-400'>
                      #{booking.booking_number}
                    </p>
                  </div>
                  <div className='text-right'>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Your Recent Reviews</CardTitle>
            <CardDescription>Feedback you've shared</CardDescription>
          </CardHeader>
          <CardContent>
            {recentReviews.length === 0 ? (
              <div className='text-center py-8'>
                <Star className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>No reviews yet</p>
                <p className='text-sm text-gray-400'>
                  Share your experience with completed services
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {recentReviews.map(review => (
                  <div key={review.id} className='p-3 border rounded-lg'>
                    <div className='flex items-center justify-between mb-2'>
                      <p className='font-medium'>{review.service_name}</p>
                      <div className='flex items-center'>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className='text-sm text-gray-600 line-clamp-2'>
                      {review.review_text}
                    </p>
                    <p className='text-xs text-gray-400 mt-1'>
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
