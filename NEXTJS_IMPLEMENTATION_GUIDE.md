# Next.js Implementation Guide

## API Routes & Security

### 1. Role-Based API Route Protection

```typescript
// lib/auth-middleware.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export type UserRole = 'admin' | 'client' | 'provider' | 'manager' | 'user';

export interface AuthContext {
  user: any;
  profile: any;
  role: UserRole;
}

export async function withAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>,
  options: {
    requiredRole?: UserRole;
    allowedRoles?: UserRole[];
  } = {}
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

      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }

      // Check role requirements
      if (options.requiredRole && profile.role !== options.requiredRole) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      if (
        options.allowedRoles &&
        !options.allowedRoles.includes(profile.role)
      ) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Create auth context
      const context: AuthContext = {
        user: session.user,
        profile,
        role: profile.role,
      };

      return handler(req, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
```

### 2. Booking API Routes

```typescript
// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { withAuth } from '@/lib/auth-middleware';

// GET /api/bookings - Get user's bookings based on role
export const GET = withAuth(
  async (req: NextRequest, context) => {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase.from('bookings').select(`
    *,
    service:services(title, category, provider_id),
    client:profiles!client_id(full_name, email),
    provider:profiles!provider_id(full_name, email, company_name)
  `);

    // Apply role-based filtering (RLS handles this, but we can optimize queries)
    switch (context.role) {
      case 'client':
        query = query.eq('client_id', context.user.id);
        break;
      case 'provider':
        query = query.eq('provider_id', context.user.id);
        break;
      case 'admin':
      case 'manager':
        // No additional filtering - can see all bookings
        break;
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: bookings, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings });
  },
  { allowedRoles: ['client', 'provider', 'manager', 'admin'] }
);

// POST /api/bookings - Create new booking
export const POST = withAuth(
  async (req: NextRequest, context) => {
    const supabase = createServerComponentClient({ cookies });

    try {
      const body = await req.json();
      const {
        service_id,
        scheduled_start,
        scheduled_end,
        client_name,
        client_email,
        client_phone,
        client_notes,
        participants = 1,
      } = body;

      // Validate required fields
      if (
        !service_id ||
        !scheduled_start ||
        !scheduled_end ||
        !client_name ||
        !client_email
      ) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Get service details to validate and get provider
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*, provider:profiles!provider_id(full_name, email)')
        .eq('id', service_id)
        .eq('status', 'active')
        .single();

      if (serviceError || !service) {
        return NextResponse.json(
          { error: 'Service not found or inactive' },
          { status: 404 }
        );
      }

      // Create booking
      const bookingData = {
        service_id,
        client_id: context.user.id,
        provider_id: service.provider_id,
        scheduled_start,
        scheduled_end,
        quoted_price: service.base_price,
        client_name,
        client_email,
        client_phone,
        client_notes,
        participants,
        status: 'pending',
        currency: service.currency || 'USD',
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select(
          `
        *,
        service:services(title, category),
        provider:profiles!provider_id(full_name, email, company_name)
      `
        )
        .single();

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
        return NextResponse.json(
          { error: 'Failed to create booking' },
          { status: 500 }
        );
      }

      // Trigger Make.com webhook manually if needed
      await triggerMakeWebhook('booking_created', {
        booking_id: booking.id,
        booking_number: booking.booking_number,
        service: service,
        client: context.profile,
        provider: service.provider,
      });

      return NextResponse.json({ booking }, { status: 201 });
    } catch (error) {
      console.error('Booking creation error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  { allowedRoles: ['client', 'admin'] }
);
```

### 3. Services API Routes

```typescript
// app/api/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/services - Get services based on role and filters
export const GET = async (req: NextRequest) => {
  const supabase = createServerComponentClient({ cookies });
  const { searchParams } = new URL(req.url);

  const category = searchParams.get('category');
  const provider_id = searchParams.get('provider_id');
  const featured = searchParams.get('featured') === 'true';
  const location = searchParams.get('location');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase.from('services').select(`
    *,
    provider:profiles!provider_id(full_name, company_name, avatar_url)
  `);

  // Public endpoint - only show active services
  query = query.eq('status', 'active');

  if (category) query = query.eq('category', category);
  if (provider_id) query = query.eq('provider_id', provider_id);
  if (featured) query = query.eq('featured', true);
  if (location) {
    query = query.contains('service_area', [location]);
  }

  const { data: services, error } = await query
    .order('featured', { ascending: false })
    .order('rating', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }

  return NextResponse.json({ services });
};

// POST /api/services - Create new service (providers only)
export const POST = withAuth(
  async (req: NextRequest, context) => {
    const supabase = createServerComponentClient({ cookies });

    try {
      const body = await req.json();
      const serviceData = {
        ...body,
        provider_id: context.user.id,
        status: 'draft', // New services start as draft
      };

      const { data: service, error } = await supabase
        .from('services')
        .insert(serviceData)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create service' },
          { status: 500 }
        );
      }

      return NextResponse.json({ service }, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  { allowedRoles: ['provider', 'admin'] }
);
```

### 4. Make.com Webhook Helper

```typescript
// lib/make-webhook.ts
export async function triggerMakeWebhook(event: string, data: any) {
  const webhookUrls = {
    booking_created: process.env.MAKE_WEBHOOK_BOOKING_CREATED,
    booking_status_changed: process.env.MAKE_WEBHOOK_BOOKING_STATUS,
    service_created: process.env.MAKE_WEBHOOK_SERVICE_CREATED,
    user_registered: process.env.MAKE_WEBHOOK_USER_REGISTERED,
  };

  const webhookUrl = webhookUrls[event as keyof typeof webhookUrls];

  if (!webhookUrl) {
    console.warn(`No webhook URL configured for event: ${event}`);
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    console.log(`Make.com webhook triggered successfully for event: ${event}`);
  } catch (error) {
    console.error(
      `Failed to trigger Make.com webhook for event ${event}:`,
      error
    );
  }
}
```

## Frontend Components

### 1. Role-Based Dashboard Data Fetching

```typescript
// hooks/use-dashboard-data.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-service';

interface DashboardData {
  bookings: any[];
  services: any[];
  notifications: any[];
  stats: any;
}

export function useDashboardData() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user || !profile) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch role-specific data
        const endpoints = {
          client: [
            '/api/bookings?limit=5',
            '/api/services?featured=true&limit=6',
            '/api/notifications?limit=5',
          ],
          provider: [
            '/api/bookings?limit=10',
            '/api/services?provider_id=' + user.id,
            '/api/notifications?limit=5',
          ],
          admin: [
            '/api/admin/dashboard-stats',
            '/api/bookings?limit=10',
            '/api/notifications?limit=10',
          ],
          manager: [
            '/api/manager/team-stats',
            '/api/bookings?limit=10',
            '/api/notifications?limit=5',
          ],
          user: ['/api/bookings?limit=5', '/api/notifications?limit=5'],
        };

        const userEndpoints =
          endpoints[profile.role as keyof typeof endpoints] || endpoints.user;

        const responses = await Promise.all(
          userEndpoints.map(endpoint => fetch(endpoint).then(res => res.json()))
        );

        setData({
          bookings: responses[0]?.bookings || [],
          services: responses[1]?.services || [],
          notifications: responses[2]?.notifications || [],
          stats: responses[0]?.stats || {},
        });
      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user, profile]);

  return { data, loading, error, refetch: () => fetchDashboardData() };
}
```

### 2. Booking Form Component

```typescript
// components/booking-form.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

interface BookingFormProps {
  service: any
  onSuccess?: (booking: any) => void
}

export function BookingForm({ service, onSuccess }: BookingFormProps) {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    scheduled_start: '',
    scheduled_end: '',
    client_name: profile?.full_name || '',
    client_email: user?.email || '',
    client_phone: '',
    client_notes: '',
    participants: 1
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: service.id,
          ...formData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create booking')
      }

      const { booking } = await response.json()

      toast({
        title: 'Booking Created!',
        description: `Your booking ${booking.booking_number} has been submitted.`,
      })

      onSuccess?.(booking)
    } catch (error) {
      toast({
        title: 'Booking Failed',
        description: 'Failed to create booking. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date & Time</label>
          <Input
            type="datetime-local"
            value={formData.scheduled_start}
            onChange={(e) => setFormData({...formData, scheduled_start: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date & Time</label>
          <Input
            type="datetime-local"
            value={formData.scheduled_end}
            onChange={(e) => setFormData({...formData, scheduled_end: e.target.value})}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Your Name</label>
        <Input
          value={formData.client_name}
          onChange={(e) => setFormData({...formData, client_name: e.target.value})}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input
          type="email"
          value={formData.client_email}
          onChange={(e) => setFormData({...formData, client_email: e.target.value})}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone (Optional)</label>
        <Input
          type="tel"
          value={formData.client_phone}
          onChange={(e) => setFormData({...formData, client_phone: e.target.value})}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Special Requirements</label>
        <Textarea
          value={formData.client_notes}
          onChange={(e) => setFormData({...formData, client_notes: e.target.value})}
          placeholder="Any special requirements or notes..."
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Price:</span>
          <span className="text-lg font-bold">${service.base_price}</span>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating Booking...' : 'Book Service'}
      </Button>
    </form>
  )
}
```

### 3. Role-Based Service Management

```typescript
// components/service-management.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ServiceManagement() {
  const { profile } = useAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const endpoint = profile?.role === 'provider'
        ? `/api/services?provider_id=${profile.id}`
        : '/api/services'

      const response = await fetch(endpoint)
      const data = await response.json()
      setServices(data.services || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateServiceStatus = async (serviceId: string, status: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchServices() // Refresh list
      }
    } catch (error) {
      console.error('Error updating service:', error)
    }
  }

  if (loading) return <div>Loading services...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {profile?.role === 'provider' ? 'My Services' : 'All Services'}
        </h2>
        {profile?.role === 'provider' && (
          <Button>Add New Service</Button>
        )}
      </div>

      <div className="grid gap-4">
        {services.map((service: any) => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{service.title}</CardTitle>
                  <p className="text-sm text-gray-600">{service.category}</p>
                </div>
                <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                  {service.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">${service.base_price}</p>
                  <p className="text-sm text-gray-600">
                    {service.booking_count} bookings • {service.rating}★
                  </p>
                </div>
                {profile?.role === 'provider' && (
                  <div className="space-x-2">
                    {service.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => updateServiceStatus(service.id, 'active')}
                      >
                        Publish
                      </Button>
                    )}
                    {service.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateServiceStatus(service.id, 'paused')}
                      >
                        Pause
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

## Example Workflows

### 1. Complete Booking Flow

```typescript
// Example: Complete booking workflow from client perspective

// 1. Client browses services
const services = await fetch('/api/services?category=consulting').then(r =>
  r.json()
);

// 2. Client creates booking
const booking = await fetch('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service_id: 'service-uuid',
    scheduled_start: '2024-08-15T10:00:00Z',
    scheduled_end: '2024-08-15T11:00:00Z',
    client_name: 'John Doe',
    client_email: 'john@example.com',
    client_notes: 'First time consultation',
  }),
}).then(r => r.json());

// 3. This triggers:
//    - Database insert with RLS protection
//    - Make.com webhook for notifications
//    - Email to provider and client
//    - Calendar event creation
//    - Internal notifications

// 4. Provider can update booking status
await fetch(`/api/bookings/${booking.id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'confirmed' }),
});

// 5. Status change triggers more Make.com workflows
```

### 2. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Make.com Webhook URLs
MAKE_WEBHOOK_BOOKING_CREATED=https://hook.eu1.make.com/your_webhook_id
MAKE_WEBHOOK_BOOKING_STATUS=https://hook.eu1.make.com/your_webhook_id
MAKE_WEBHOOK_SERVICE_CREATED=https://hook.eu1.make.com/your_webhook_id
MAKE_WEBHOOK_USER_REGISTERED=https://hook.eu1.make.com/your_webhook_id
```

This architecture provides a robust, scalable foundation for your business services platform with proper role-based access control, automated workflows, and secure data handling.
