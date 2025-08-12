# Implementation Examples & Code Samples

## Complete Code Examples

### 1. Advanced Role-Based Middleware

```typescript
// lib/rbac-middleware.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export type Permission =
  | 'bookings:read'
  | 'bookings:write'
  | 'bookings:delete'
  | 'services:read'
  | 'services:write'
  | 'services:delete'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'analytics:read'
  | 'reports:read';

export type UserRole = 'admin' | 'client' | 'provider' | 'manager' | 'user';

// Role-permission matrix
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'bookings:read',
    'bookings:write',
    'bookings:delete',
    'services:read',
    'services:write',
    'services:delete',
    'users:read',
    'users:write',
    'users:delete',
    'analytics:read',
    'reports:read',
  ],
  manager: [
    'bookings:read',
    'bookings:write',
    'services:read',
    'services:write',
    'users:read',
    'analytics:read',
    'reports:read',
  ],
  provider: [
    'bookings:read',
    'bookings:write',
    'services:read',
    'services:write',
  ],
  client: ['bookings:read', 'bookings:write', 'services:read'],
  user: ['bookings:read', 'services:read'],
};

export interface AuthContext {
  user: any;
  profile: any;
  role: UserRole;
  permissions: Permission[];
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function withRBAC(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>,
  requiredPermissions: Permission[] = []
) {
  return async (req: NextRequest) => {
    try {
      const supabase = createServerComponentClient({ cookies });

      // Get session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get user profile with role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile || profile.status !== 'active') {
        return NextResponse.json(
          { error: 'Profile not found or inactive' },
          { status: 403 }
        );
      }

      const userRole = profile.role as UserRole;
      const userPermissions = ROLE_PERMISSIONS[userRole];

      // Check required permissions
      const missingPermissions = requiredPermissions.filter(
        permission => !hasPermission(userRole, permission)
      );

      if (missingPermissions.length > 0) {
        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            missing: missingPermissions,
          },
          { status: 403 }
        );
      }

      // Create auth context
      const context: AuthContext = {
        user: session.user,
        profile,
        role: userRole,
        permissions: userPermissions,
      };

      return handler(req, context);
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
```

### 2. Advanced API Route with Caching

```typescript
// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac-middleware';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';

// Cache configuration
const CACHE_TTL = 300; // 5 minutes
const CACHE_TAG = 'dashboard-stats';

// Cached stats function
const getCachedStats = unstable_cache(
  async (userId: string, role: string) => {
    const supabase = createServerComponentClient({ cookies });

    const stats = {
      totalBookings: 0,
      activeServices: 0,
      totalRevenue: 0,
      pendingApprovals: 0,
      recentActivity: [],
    };

    try {
      // Get role-specific stats
      if (role === 'admin' || role === 'manager') {
        // Admin/Manager: Get all stats
        const [bookingsResult, servicesResult, revenueResult] =
          await Promise.all([
            supabase
              .from('bookings')
              .select('id', { count: 'exact', head: true }),
            supabase
              .from('services')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'active'),
            supabase
              .from('bookings')
              .select('quoted_price')
              .eq('status', 'completed'),
          ]);

        stats.totalBookings = bookingsResult.count || 0;
        stats.activeServices = servicesResult.count || 0;
        stats.totalRevenue =
          revenueResult.data?.reduce(
            (sum, booking) => sum + (booking.quoted_price || 0),
            0
          ) || 0;
      } else if (role === 'provider') {
        // Provider: Get their stats
        const [bookingsResult, servicesResult, revenueResult] =
          await Promise.all([
            supabase
              .from('bookings')
              .select('id', { count: 'exact', head: true })
              .eq('provider_id', userId),
            supabase
              .from('services')
              .select('id', { count: 'exact', head: true })
              .eq('provider_id', userId)
              .eq('status', 'active'),
            supabase
              .from('bookings')
              .select('quoted_price')
              .eq('provider_id', userId)
              .eq('status', 'completed'),
          ]);

        stats.totalBookings = bookingsResult.count || 0;
        stats.activeServices = servicesResult.count || 0;
        stats.totalRevenue =
          revenueResult.data?.reduce(
            (sum, booking) => sum + (booking.quoted_price || 0),
            0
          ) || 0;
      } else if (role === 'client') {
        // Client: Get their bookings
        const [bookingsResult, totalSpentResult] = await Promise.all([
          supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', userId),
          supabase
            .from('bookings')
            .select('quoted_price')
            .eq('client_id', userId)
            .eq('status', 'completed'),
        ]);

        stats.totalBookings = bookingsResult.count || 0;
        stats.totalRevenue =
          totalSpentResult.data?.reduce(
            (sum, booking) => sum + (booking.quoted_price || 0),
            0
          ) || 0;
      }

      // Get recent activity for all roles
      const { data: recentActivity } = await supabase
        .from('activity_logs')
        .select('action, resource_type, created_at, details')
        .or(role === 'admin' ? undefined : `user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(10);

      stats.recentActivity = recentActivity || [];
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }

    return stats;
  },
  [CACHE_TAG],
  {
    revalidate: CACHE_TTL,
    tags: [CACHE_TAG],
  }
);

export const GET = withRBAC(
  async (req: NextRequest, context) => {
    const stats = await getCachedStats(context.user.id, context.role);

    return NextResponse.json({
      stats,
      cached_at: new Date().toISOString(),
      user_role: context.role,
    });
  },
  ['analytics:read']
);

// Invalidate cache when data changes
export const POST = withRBAC(
  async (req: NextRequest, context) => {
    const { revalidate } = await import('next/cache');

    // Invalidate dashboard stats cache
    revalidate(CACHE_TAG);

    return NextResponse.json({ message: 'Cache invalidated' });
  },
  ['analytics:read']
);
```

### 3. Real-time Booking Status Updates

```typescript
// components/booking-status-tracker.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface BookingStatusTrackerProps {
  bookingId: string
  userRole: 'client' | 'provider' | 'admin' | 'manager'
}

export function BookingStatusTracker({ bookingId, userRole }: BookingStatusTrackerProps) {
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  const supabase = createClientComponentClient()

  useEffect(() => {
    // Initial fetch
    fetchBooking()

    // Set up real-time subscription
    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          setBooking(payload.new)
          toast({
            title: 'Booking Updated',
            description: `Status changed to ${payload.new.status}`,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bookingId])

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(title, category, provider_id),
          client:profiles!client_id(full_name, email),
          provider:profiles!provider_id(full_name, email, company_name)
        `)
        .eq('id', bookingId)
        .single()

      if (error) throw error
      setBooking(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch booking details',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateBookingStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Update failed')

      toast({
        title: 'Status Updated',
        description: `Booking status changed to ${newStatus}`,
      })
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Could not update booking status',
        variant: 'destructive'
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div>Loading booking details...</div>
  }

  if (!booking) {
    return <div>Booking not found</div>
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getAvailableActions = () => {
    const actions = []

    if (userRole === 'provider') {
      if (booking.status === 'pending') {
        actions.push({ label: 'Confirm', status: 'confirmed', variant: 'default' })
        actions.push({ label: 'Cancel', status: 'cancelled', variant: 'destructive' })
      }
      if (booking.status === 'confirmed') {
        actions.push({ label: 'Start Service', status: 'in_progress', variant: 'default' })
      }
      if (booking.status === 'in_progress') {
        actions.push({ label: 'Complete', status: 'completed', variant: 'default' })
      }
    }

    if (userRole === 'client') {
      if (['pending', 'confirmed'].includes(booking.status)) {
        actions.push({ label: 'Cancel', status: 'cancelled', variant: 'destructive' })
      }
    }

    if (['admin', 'manager'].includes(userRole)) {
      actions.push({ label: 'Mark Completed', status: 'completed', variant: 'default' })
      actions.push({ label: 'Cancel', status: 'cancelled', variant: 'destructive' })
      if (booking.status === 'cancelled') {
        actions.push({ label: 'Refund', status: 'refunded', variant: 'secondary' })
      }
    }

    return actions
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Booking #{booking.booking_number}</CardTitle>
            <p className="text-sm text-gray-600">{booking.service.title}</p>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Client</p>
            <p>{booking.client.full_name}</p>
          </div>
          <div>
            <p className="font-medium">Provider</p>
            <p>{booking.provider.full_name}</p>
          </div>
          <div>
            <p className="font-medium">Scheduled</p>
            <p>{new Date(booking.scheduled_start).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="font-medium">Price</p>
            <p>${booking.quoted_price}</p>
          </div>
        </div>

        {getAvailableActions().length > 0 && (
          <div className="flex gap-2 pt-4 border-t">
            {getAvailableActions().map((action) => (
              <Button
                key={action.status}
                variant={action.variant as any}
                size="sm"
                disabled={updating}
                onClick={() => updateBookingStatus(action.status)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### 4. Advanced Search & Filtering

```typescript
// components/service-search.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, MapPin, Star, DollarSign } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

interface ServiceSearchProps {
  onResults: (services: any[]) => void
}

interface SearchFilters {
  query: string
  category: string
  location: string
  priceRange: [number, number]
  rating: number
  availability: string
  sortBy: string
}

export function ServiceSearch({ onResults }: ServiceSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    location: '',
    priceRange: [0, 1000],
    rating: 0,
    availability: '',
    sortBy: 'relevance'
  })

  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])

  const debouncedQuery = useDebounce(filters.query, 300)

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  // Search when filters change
  useEffect(() => {
    searchServices()
  }, [debouncedQuery, filters.category, filters.location, filters.rating, filters.sortBy])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/services/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const searchServices = async () => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams()

      if (filters.query) searchParams.set('q', filters.query)
      if (filters.category) searchParams.set('category', filters.category)
      if (filters.location) searchParams.set('location', filters.location)
      if (filters.rating > 0) searchParams.set('min_rating', filters.rating.toString())
      if (filters.sortBy) searchParams.set('sort', filters.sortBy)

      searchParams.set('min_price', filters.priceRange[0].toString())
      searchParams.set('max_price', filters.priceRange[1].toString())

      const response = await fetch(`/api/services/search?${searchParams}`)
      const data = await response.json()

      setServices(data.services || [])
      onResults(data.services || [])
    } catch (error) {
      console.error('Error searching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      // Additional client-side filtering for immediate response
      if (filters.priceRange[0] > 0 && service.base_price < filters.priceRange[0]) return false
      if (filters.priceRange[1] < 1000 && service.base_price > filters.priceRange[1]) return false
      return true
    })
  }, [services, filters.priceRange])

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      location: '',
      priceRange: [0, 1000],
      rating: 0,
      availability: '',
      sortBy: 'relevance'
    })
  }

  const activeFiltersCount = Object.values(filters).filter(value =>
    value !== '' && value !== 0 && value !== 'relevance' && !Array.isArray(value)
  ).length

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search services, providers, or keywords..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={clearFilters} disabled={activeFiltersCount === 0}>
          <Filter className="h-4 w-4 mr-2" />
          Clear Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Location"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="pl-10"
          />
        </div>

        <Select value={filters.rating.toString()} onValueChange={(value) => setFilters({ ...filters, rating: parseInt(value) })}>
          <SelectTrigger>
            <SelectValue placeholder="Minimum Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any Rating</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="3">3+ Stars</SelectItem>
            <SelectItem value="2">2+ Stars</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <Badge variant="secondary">
              Category: {filters.category}
              <button
                onClick={() => setFilters({ ...filters, category: '' })}
                className="ml-2 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.location && (
            <Badge variant="secondary">
              Location: {filters.location}
              <button
                onClick={() => setFilters({ ...filters, location: '' })}
                className="ml-2 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.rating > 0 && (
            <Badge variant="secondary">
              {filters.rating}+ Stars
              <button
                onClick={() => setFilters({ ...filters, rating: 0 })}
                className="ml-2 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          {loading ? 'Searching...' : `${filteredServices.length} services found`}
        </span>
        {filteredServices.length > 0 && (
          <span>
            Price range: ${Math.min(...filteredServices.map(s => s.base_price))} - ${Math.max(...filteredServices.map(s => s.base_price))}
          </span>
        )}
      </div>
    </div>
  )
}
```

### 5. Complete Environment Configuration

```bash
# .env.local - Complete configuration
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Make.com Webhook URLs
MAKE_WEBHOOK_BOOKING_CREATED=https://hook.eu1.make.com/abc123/booking-created
MAKE_WEBHOOK_BOOKING_STATUS=https://hook.eu1.make.com/abc123/booking-status
MAKE_WEBHOOK_SERVICE_CREATED=https://hook.eu1.make.com/abc123/service-created
MAKE_WEBHOOK_USER_REGISTERED=https://hook.eu1.make.com/abc123/user-registered
MAKE_WEBHOOK_PAYMENT_COMPLETED=https://hook.eu1.make.com/abc123/payment-completed

# Email Configuration (for Make.com)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Integration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# External APIs
GOOGLE_MAPS_API_KEY=your_google_maps_key
SENDGRID_API_KEY=your_sendgrid_key
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Analytics & Monitoring
MIXPANEL_TOKEN=your_mixpanel_token
SENTRY_DSN=https://your-sentry-dsn

# File Storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

This comprehensive implementation provides a fully functional, role-based business services platform with automated workflows, real-time updates, and secure data handling.
