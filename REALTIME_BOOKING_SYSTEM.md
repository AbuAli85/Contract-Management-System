# 🚀 Real-time Booking Events System

## Overview

This document provides comprehensive documentation for the real-time booking events system with Supabase subscriptions and Make.com webhook integration.

## 🎯 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │    │   Supabase DB    │    │   Make.com      │
│                 │    │                  │    │   Webhook       │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │                 │
│ │ React Hook  │◄├────┤ │ Real-time    │ │    │                 │
│ │ Subscription│ │    │ │ Subscriptions│ │    │                 │
│ └─────────────┘ │    │ └──────────────┘ │    │                 │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │   Events    │ │    │ │   Database   │ │    │ │  Webhook    │ │
│ │ Component   │ │    │ │   Triggers   │─├────┤ │ Processing  │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 Implementation Components

### 1. **Real-time Subscriptions** (`lib/realtime/booking-subscriptions.ts`)

#### Core Features:
- **Multi-subscription Support**: Handle multiple simultaneous subscriptions
- **Automatic Reconnection**: Robust connection management
- **Event Filtering**: Filter events by booking ID, user ID, or provider ID
- **React Hooks**: Easy integration with React components
- **TypeScript Support**: Fully typed interfaces

#### Usage Examples:

```typescript
import { subscribeToBookingEvents } from '@/lib/realtime/booking-subscriptions'

// Subscribe to specific booking events
const unsubscribe = subscribeToBookingEvents('booking-id', (event) => {
  console.log('Event received:', event)
  // Handle the event (update UI, show notifications, etc.)
})

// Cleanup
unsubscribe()
```

#### React Hook Usage:

```typescript
import { useBookingEvents } from '@/lib/realtime/booking-subscriptions'

function BookingComponent({ bookingId }) {
  const { events, isConnected, error, clearEvents } = useBookingEvents(bookingId)
  
  if (error) return <div>Error: {error}</div>
  if (!isConnected) return <div>Connecting...</div>
  
  return (
    <div>
      {events.map(event => (
        <div key={event.id}>
          {event.event_type}: {event.description}
        </div>
      ))}
      <button onClick={clearEvents}>Clear Events</button>
    </div>
  )
}
```

### 2. **Make.com Webhook Integration** (`lib/webhooks/make-integration.ts`)

#### Features:
- **Automatic Retry Logic**: Exponential backoff with configurable retry attempts
- **Payload Enhancement**: Rich context data for Make.com scenarios
- **Error Handling**: Comprehensive error logging and recovery
- **Performance Monitoring**: Built-in statistics and health checking
- **Batch Processing**: Send multiple events efficiently

#### Configuration:

```bash
# Environment variables
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/your-webhook-url
MAKE_WEBHOOK_SECRET=your-webhook-secret
SUPABASE_WEBHOOK_SECRET=your-supabase-secret
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### Usage Examples:

```typescript
import { sendToMakeWebhookWithRetry } from '@/lib/webhooks/make-integration'

// Send event with automatic retry
const result = await sendToMakeWebhookWithRetry(bookingEvent, {
  booking_details: bookingDetails,
  client_info: clientInfo,
  provider_info: providerInfo
})

if (result.success) {
  console.log(`Webhook sent successfully in ${result.attempts} attempts`)
} else {
  console.error(`Failed after ${result.attempts} attempts: ${result.error}`)
}
```

#### Webhook Payload Structure:

```typescript
interface MakeWebhookPayload {
  // Event metadata
  event_id: string
  event_type: string
  event_time: string
  source: 'contract-management-system'
  
  // Booking event data
  booking_event: BookingEventPayload
  
  // Enhanced context
  booking_details?: {
    id: string
    booking_number: string
    client_id: string
    provider_id: string
    status: string
    total_price: number
    // ... more fields
  }
  
  client_info?: {
    id: string
    name: string
    email: string
  }
  
  provider_info?: {
    id: string
    name: string
    email: string
    company_name?: string
  }
  
  // System metadata
  system: {
    environment: string
    timestamp: string
    user_agent?: string
    ip_address?: string
  }
}
```

### 3. **API Routes** (`app/api/webhooks/booking-events/route.ts`)

#### Endpoints:

- **POST `/api/webhooks/booking-events`**: Receive booking events and forward to Make.com
- **GET `/api/webhooks/booking-events`**: Health check and configuration status

#### Security:
- **Bearer Token Authentication**: Validates Supabase webhook secret
- **Request Validation**: Ensures payload integrity
- **Error Handling**: Graceful error responses

### 4. **React Components** (`components/booking/real-time-booking-events.tsx`)

#### Components Available:

```typescript
// General real-time events component
<RealTimeBookingEvents 
  bookingId="booking-123"
  showUserEvents={false}
  maxEvents={50}
/>

// Specific booking monitor
<BookingEventMonitor bookingId="booking-123" />

// User's all events monitor  
<UserEventMonitor />
```

#### Features:
- **Real-time Updates**: Live event streaming with visual indicators
- **Event Filtering**: Show events by booking or user
- **Toast Notifications**: Automatic notifications for new events
- **Event History**: Scrollable event timeline
- **Connection Status**: Visual connection indicators
- **Event Actions**: Clear events, export, etc.

### 5. **Database Integration**

#### Database Triggers (`supabase/migrations/20250117_booking_event_triggers.sql`):

```sql
-- Automatically trigger webhook on booking event insert
CREATE TRIGGER booking_events_webhook_trigger
    AFTER INSERT ON booking_events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_booking_event_webhook();

-- Trigger on booking status changes
CREATE TRIGGER bookings_webhook_trigger
    AFTER UPDATE ON bookings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION trigger_booking_event_webhook();
```

#### Webhook Logging:
- **webhook_logs**: Complete audit trail of all webhook attempts
- **webhook_stats**: Performance statistics view
- **Retention Management**: Automatic cleanup of old logs

### 6. **Supabase Edge Function** (`supabase/functions/booking-event-webhook/index.ts`)

#### Purpose:
- Bridge between database triggers and Next.js API routes
- Forward events to the main application for Make.com processing
- Provide fallback webhook processing

#### Deployment:
```bash
supabase functions deploy booking-event-webhook
```

## 🚀 **Getting Started**

### Step 1: Environment Setup

```bash
# Add to .env.local
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/your-webhook-url
MAKE_WEBHOOK_SECRET=your-webhook-secret
SUPABASE_WEBHOOK_SECRET=your-supabase-secret
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Step 2: Database Migration

```bash
# Apply the booking events migration
supabase db push
```

### Step 3: Component Integration

```typescript
import { RealTimeBookingEvents } from '@/components/booking/real-time-booking-events'

function BookingPage({ bookingId }) {
  return (
    <div>
      <h1>Booking Details</h1>
      {/* Your booking details */}
      
      <RealTimeBookingEvents bookingId={bookingId} />
    </div>
  )
}
```

### Step 4: Make.com Scenario Setup

1. **Create a new scenario** in Make.com
2. **Add a webhook trigger** using your webhook URL
3. **Configure modules** to process the booking event data
4. **Test the webhook** using the demo page

## 📊 **Monitoring & Analytics**

### Webhook Statistics

```typescript
import { getWebhookStats } from '@/lib/webhooks/make-integration'

const stats = getWebhookStats()
console.log('Webhook Performance:', {
  totalSent: stats.totalSent,
  successRate: (stats.successfulSent / stats.totalSent) * 100,
  averageResponseTime: stats.averageResponseTime
})
```

### Subscription Management

```typescript
import { bookingSubscriptionManager } from '@/lib/realtime/booking-subscriptions'

// Get active subscription count
const activeCount = bookingSubscriptionManager.getActiveSubscriptionCount()

// Get subscription IDs
const subscriptions = bookingSubscriptionManager.getActiveSubscriptions()

// Cleanup all subscriptions
bookingSubscriptionManager.unsubscribeAll()
```

### Database Monitoring

```sql
-- View webhook statistics
SELECT * FROM webhook_stats;

-- Check failed webhooks
SELECT * FROM webhook_logs WHERE status = 'failed';

-- Clean up old logs
SELECT cleanup_webhook_logs(30); -- 30 days retention

-- Retry failed webhooks
SELECT retry_failed_webhooks(3); -- Max 3 retries
```

## 🧪 **Testing**

### Demo Page
Visit `/demo/real-time-bookings` for a comprehensive testing interface:
- **Live Events**: Monitor real-time events
- **Webhook Testing**: Test Make.com integration
- **Subscription Management**: Monitor active connections
- **Integration Examples**: Code samples and documentation

### Manual Testing

```typescript
// Test webhook connectivity
import { testMakeWebhook } from '@/lib/webhooks/make-integration'

const result = await testMakeWebhook()
console.log('Test result:', result.success ? 'PASS' : 'FAIL')
```

### Subscription Testing

```typescript
// Test booking event subscription
import { subscribeToBookingEvents } from '@/lib/realtime/booking-subscriptions'

const unsubscribe = subscribeToBookingEvents('test-booking-id', (event) => {
  console.log('Test event received:', event)
})

// Remember to cleanup
setTimeout(unsubscribe, 10000) // Cleanup after 10 seconds
```

## 🔧 **Troubleshooting**

### Common Issues

#### 1. **Webhook Not Receiving Events**
```bash
# Check configuration
GET /api/webhooks/booking-events

# Verify environment variables
echo $MAKE_WEBHOOK_URL
echo $MAKE_WEBHOOK_SECRET
```

#### 2. **Subscription Connection Issues**
```typescript
// Check Supabase connection
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data, error } = await supabase.auth.getSession()
console.log('Auth status:', error ? 'Failed' : 'Connected')
```

#### 3. **Database Trigger Issues**
```sql
-- Check trigger status
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%webhook%';

-- Manually trigger webhook
SELECT manually_trigger_webhook('booking_events', 'your-event-id');
```

#### 4. **Performance Issues**
- **Monitor subscription count**: Keep under 10 active subscriptions per user
- **Cleanup old events**: Use `clearEvents()` function regularly
- **Check webhook logs**: Monitor for failed deliveries

### Debug Mode

```typescript
// Enable debug logging in development
if (process.env.NODE_ENV === 'development') {
  window.bookingSubscriptionManager = bookingSubscriptionManager
  console.log('Debug: Subscription manager available in window object')
}
```

## 📚 **API Reference**

### Subscription Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `subscribeToBookingEvents(bookingId, callback)` | Subscribe to specific booking events | Unsubscribe function |
| `subscribeToUserBookingEvents(userId, callback)` | Subscribe to user's booking events | Unsubscribe function |
| `subscribeToProviderBookingEvents(providerId, callback)` | Subscribe to provider's events | Unsubscribe function |

### Webhook Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `sendToMakeWebhook(event, data, config)` | Send single event to webhook | `{success, error}` |
| `sendToMakeWebhookWithRetry(event, data, config)` | Send with retry logic | `{success, error, attempts}` |
| `testMakeWebhook()` | Test webhook connectivity | `{success, responseTime, error}` |
| `validateMakeWebhookConfig()` | Validate configuration | `{isValid, errors, warnings}` |

### React Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useBookingEvents(bookingId)` | Monitor booking events | `{events, isConnected, error, clearEvents}` |
| `useUserBookingEvents(userId)` | Monitor user events | `{events, isConnected, clearEvents}` |

## 🚀 **Production Deployment**

### Performance Optimization
- **Connection Pooling**: Limit concurrent subscriptions
- **Event Debouncing**: Prevent notification spam
- **Memory Management**: Regular event cleanup
- **Error Recovery**: Automatic reconnection logic

### Security Considerations
- **Webhook Security**: Use webhook secrets
- **RLS Policies**: Proper database security
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Sanitize all inputs

### Monitoring Setup
- **Health Checks**: Regular webhook testing
- **Performance Metrics**: Response time monitoring
- **Error Alerting**: Failed webhook notifications
- **Usage Analytics**: Subscription patterns

### Scaling Considerations
- **Event Volume**: Monitor event throughput
- **Webhook Performance**: Optimize payload size
- **Database Load**: Index optimization
- **Connection Limits**: Supabase connection management

## 📞 **Support**

- **Demo Page**: `/demo/real-time-bookings` - Interactive testing interface
- **Health Check**: `/api/webhooks/booking-events` - System status
- **Documentation**: This guide and inline code comments
- **GitHub Issues**: Report bugs and feature requests

## 🎉 **Success Metrics**

After deployment, monitor these metrics:
- [ ] Real-time subscriptions working
- [ ] Webhook delivery success rate > 95%
- [ ] Average webhook response time < 2s
- [ ] Event processing latency < 500ms
- [ ] Zero data loss in event delivery
- [ ] Proper error handling and recovery

Your real-time booking events system is now production-ready! 🚀