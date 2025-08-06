# Real-Time Notifications Setup Guide

## Overview

This guide walks you through implementing a complete real-time notification system for your provider dashboard. The system uses Supabase real-time subscriptions to deliver instant notifications for new bookings, status changes, payments, and more.

## Architecture Components

### 1. Database Schema (`create-notifications-schema.sql`)
- **notifications table**: Stores all notification data with metadata
- **Triggers**: Automatically creates notifications when bookings/payments change
- **RLS Policies**: Ensures users only see their own notifications
- **Functions**: Helper functions for creating notifications programmatically

### 2. Real-Time Component (`components/real-time-notifications.tsx`)
- Real-time subscription to Supabase changes
- Toast notifications for immediate feedback
- Browser notifications support
- Notification management (read/unread, delete)

### 3. Notification Service (`lib/notification-service.ts`)
- Programmatic notification creation
- Type-safe notification management
- Helper functions for different notification types

### 4. Provider Dashboard (`components/provider-dashboard.tsx`)
- Integrated notification bell with unread count
- Real-time booking updates
- Dashboard statistics with live updates

## Implementation Steps

### Step 1: Set Up Database Schema

First, run the notification schema setup:

```sql
-- Run the create-notifications-schema.sql file in your Supabase SQL editor
```

This creates:
- `notifications` table with proper indexes
- RLS policies for security
- Trigger functions for automatic notifications
- Helper functions for creating notifications

### Step 2: Configure Supabase Real-time

Enable real-time on the notifications table:

1. Go to Supabase Dashboard → Settings → API
2. Navigate to Realtime section
3. Enable realtime for the `notifications` table:

```sql
-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable realtime for bookings (for dashboard updates)
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
```

### Step 3: Add Components to Your App

#### Provider Dashboard Page

```tsx
// app/dashboard/provider/page.tsx
import { ProviderDashboard } from '@/components/provider-dashboard'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function ProviderDashboardPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'provider') {
    redirect('/dashboard')
  }

  return <ProviderDashboard user={profile} />
}
```

#### Standalone Notifications Component

```tsx
// For any page that needs notifications
import { RealTimeNotifications } from '@/components/real-time-notifications'

export function SomeComponent({ user }) {
  return (
    <div className="flex justify-between items-center">
      <h1>My Dashboard</h1>
      <RealTimeNotifications user={user} />
    </div>
  )
}
```

### Step 4: Test the System

#### Create Test Notifications

```tsx
// Test component or page
import { createTestNotifications } from '@/lib/notification-service'

export function TestNotifications({ userId }) {
  const handleCreateTest = async () => {
    await createTestNotifications(userId)
  }

  return (
    <button onClick={handleCreateTest}>
      Create Test Notifications
    </button>
  )
}
```

#### Manual Testing

1. **Open Provider Dashboard** in one browser tab
2. **Create a booking** via your booking form
3. **Watch for real-time notifications** appearing instantly
4. **Test notification interactions**:
   - Mark as read
   - Delete notifications  
   - Mark all as read

### Step 5: Integration with Webhooks

The notification system automatically integrates with your webhook system:

1. **Booking created** → Triggers webhook → Creates notification
2. **Status changed** → Triggers webhook → Creates notification
3. **Payment received** → Triggers webhook → Creates notification

```typescript
// Example: Manual notification creation
import { notificationService } from '@/lib/notification-service'

// In your API route or component
await notificationService.createBookingNotification(
  providerId,
  {
    id: booking.id,
    booking_number: booking.booking_number,
    client_name: booking.client_name,
    service_title: service.title,
    scheduled_start: booking.scheduled_start,
    quoted_price: booking.quoted_price,
    status: booking.status
  },
  'created'
)
```

## Testing Scenarios

### 1. Real-time Booking Notifications

**Test**: Create a new booking and verify provider gets instant notification

```bash
# Terminal 1: Start your Next.js app
npm run dev

# Terminal 2: Create test booking via API
curl -X POST "http://localhost:3000/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "service_id": "service-uuid",
    "client_name": "Test Client",
    "client_email": "test@example.com",
    "scheduled_start": "2025-01-08T10:00:00Z",
    "scheduled_end": "2025-01-08T11:00:00Z",
    "quoted_price": 150
  }'
```

**Expected Results**:
- ✅ Booking created in database
- ✅ Webhook triggered to Make.com
- ✅ Notification appears instantly on provider dashboard
- ✅ Toast notification shows
- ✅ Notification bell shows unread count
- ✅ Browser notification (if permissions granted)

### 2. Booking Status Changes

**Test**: Update booking status and verify notifications

```sql
-- In Supabase SQL editor
UPDATE bookings 
SET status = 'confirmed' 
WHERE id = 'your-booking-id';
```

**Expected Results**:
- ✅ Real-time status update on dashboard
- ✅ Status change notification created
- ✅ Webhook triggered to Make.com
- ✅ Email automation triggered

### 3. Multiple Provider Testing

**Test**: Multiple providers receiving different notifications

1. Open dashboard for Provider A
2. Open dashboard for Provider B  
3. Create booking for Provider A
4. Verify only Provider A gets notification

### 4. Browser Notification Testing

**Test**: Browser notifications work correctly

```javascript
// Test in browser console
if ('Notification' in window) {
  Notification.requestPermission().then(permission => {
    console.log('Notification permission:', permission)
  })
}
```

## Troubleshooting

### Common Issues

#### 1. Notifications Not Appearing

**Check Supabase Real-time Status**:
```javascript
// In browser console on your app
console.log('Supabase channels:', window.supabase?._channels)
```

**Verify RLS Policies**:
```sql
-- Test notification access
SELECT * FROM notifications WHERE user_id = 'your-user-id';
```

**Check Subscription Status**:
```javascript
// Component debug
useEffect(() => {
  const subscription = supabase.channel('test')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, 
      payload => console.log('Change received!', payload))
    .subscribe((status) => console.log('Subscription status:', status))
}, [])
```

#### 2. Webhook Integration Issues

**Test Webhook Endpoint**:
```bash
curl -X GET "http://localhost:3000/api/bookings/webhook/test?event=booking.created"
```

**Check Webhook Logs**:
```sql
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;
```

#### 3. Performance Issues

**Optimize Queries**:
```sql
-- Add indexes if needed
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_created 
ON notifications(user_id, created_at DESC);
```

**Limit Subscription Scope**:
```typescript
// Only subscribe to user's notifications
const subscription = supabase
  .channel(`notifications:${user.id}`)
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'notifications',
      filter: `user_id=eq.${user.id}` // Important: filter by user
    },
    handleNotification
  )
```

## Production Considerations

### 1. Rate Limiting
```typescript
// Add rate limiting for notification creation
const RATE_LIMIT = 10 // max 10 notifications per minute per user
```

### 2. Cleanup Job
```sql
-- Schedule cleanup of old notifications
SELECT cron.schedule(
  'cleanup-notifications',
  '0 2 * * *', -- Daily at 2 AM
  'SELECT cleanup_expired_notifications();'
);
```

### 3. Monitoring
```typescript
// Add notification metrics
const notificationMetrics = {
  created: 0,
  failed: 0,
  delivered: 0
}
```

### 4. Error Handling
```typescript
// Graceful degradation if real-time fails
const [isRealtimeConnected, setIsRealtimeConnected] = useState(true)

// Fallback to polling if real-time fails
useEffect(() => {
  if (!isRealtimeConnected) {
    const interval = setInterval(loadNotifications, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }
}, [isRealtimeConnected])
```

## Next Steps

1. **Add notification preferences** - Let users choose notification types
2. **Implement push notifications** - For mobile apps
3. **Add email notification summaries** - Daily/weekly digests
4. **Create notification analytics** - Track engagement metrics
5. **Add notification templates** - Customizable notification content

## Live Demo

Your real-time notification system is now ready! 🎉

**Test it now**:
1. Open your provider dashboard
2. Watch for the notification bell in the top-right
3. Create a test booking or use the test notification button
4. See instant notifications appear without page refresh!

The system provides:
- ✅ **Instant real-time updates** via Supabase subscriptions
- ✅ **Automatic webhook integration** with Make.com
- ✅ **Professional UI components** with unread counts and actions
- ✅ **Type-safe notification management** 
- ✅ **Production-ready error handling** and fallbacks

Your providers will love getting immediate notifications for new bookings without ever needing to refresh the page or check email! 🚀
