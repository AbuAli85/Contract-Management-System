# Direct Make.com Webhook Integration Guide

## Overview

This implementation provides a direct, reliable webhook integration with Make.com that triggers immediately after booking creation, bypassing Supabase's database triggers entirely.

## Implementation

### 1. Direct Webhook API Route (`/api/bookings/direct-webhook`)

The new API route follows the exact pattern you described:

```typescript
// 1) Insert the booking
const { data: booking, error: insertError } = await supabase
  .from('bookings')
  .insert([bookingData])
  .select()
  .single()

if (insertError) {
  return NextResponse.json({ error: insertError.message }, { status: 500 })
}

// 2) Immediately POST to Make.com webhook
try {
  await fetch('https://hook.eu2.make.com/1unm44xv23srammipy0j1cauawrkzn32', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  })
} catch (hookError) {
  console.error('Make webhook failed:', hookError)
  // Booking was created successfully, webhook failure is logged but doesn't block
}
```

### 2. Key Features

#### ✅ Immediate Trigger
- Webhook fires instantly after database insert
- No waiting for Supabase database triggers
- No reliance on preview features

#### ✅ Full Control
- Complete control over payload shape
- Custom error handling and logging
- Retry logic can be added if needed

#### ✅ Reliable Error Handling
- Booking creation succeeds even if webhook fails
- All webhook attempts are logged to `webhook_logs` table
- Detailed error messages for debugging

#### ✅ Comprehensive Logging
```typescript
// Success logging
await supabase.from('webhook_logs').insert({
  webhook_type: 'booking.created',
  booking_id: booking.id,
  payload: webhookPayload,
  response: makeResponseData,
  status: 'success',
  processed_at: new Date().toISOString()
})

// Error logging  
await supabase.from('webhook_logs').insert({
  webhook_type: 'booking.created',
  booking_id: booking.id,
  payload: webhookPayload,
  status: 'error',
  error_message: `HTTP ${makeResponse.status}: ${errorText}`
})
```

## Usage

### Frontend Integration

```typescript
const response = await fetch('/api/bookings/direct-webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resource_id: 'conf-room-a',
    title: 'Team Meeting',
    start_time: '2024-01-22T10:00:00Z',
    end_time: '2024-01-22T11:00:00Z',
    total_cost: 50,
    attendees: ['john@company.com']
  })
})

const result = await response.json()
if (result.success) {
  console.log('Booking created and webhook triggered:', result.booking)
}
```

### Test Page

A complete test interface is available at `/test-webhook-integration` that demonstrates:
- Form-based booking creation
- Real-time result display
- Error handling visualization
- Integration step explanation

## Webhook Payload

The Make.com webhook receives a structured payload:

```json
{
  "event": "booking.created",
  "booking_id": "uuid-here",
  "resource_id": "conf-room-a", 
  "title": "Team Meeting",
  "description": "Weekly team sync",
  "start_time": "2024-01-22T10:00:00Z",
  "end_time": "2024-01-22T11:00:00Z",
  "user_id": "user-uuid",
  "status": "confirmed",
  "total_cost": 50,
  "attendees": ["john@company.com"],
  "created_at": "2024-01-22T09:30:00Z",
  "webhook_timestamp": "2024-01-22T09:30:01Z",
  "source": "contract-management-system"
}
```

## Configuration

### Environment Variables

```env
# Primary Make.com webhook URL
MAKE_WEBHOOK_BOOKING_CREATED=https://hook.eu2.make.com/your-webhook-id

# Alternative webhook URLs for different events
MAKE_WEBHOOK_BOOKING_STATUS=https://hook.eu2.make.com/your-status-webhook
MAKE_WEBHOOK_SERVICE_CREATED=https://hook.eu2.make.com/your-service-webhook
```

### Make.com Setup

1. Create a new scenario in Make.com
2. Use "Webhooks" → "Custom webhook" as trigger
3. Copy the webhook URL to your environment variables
4. Configure your automation logic to process the booking data

## Advantages vs Supabase Triggers

| Feature | Direct Webhook | Supabase Triggers |
|---------|---------------|-------------------|
| **Reliability** | ✅ Immediate, server-controlled | ⚠️ Depends on preview features |
| **Control** | ✅ Full payload customization | ❌ Limited to database changes |
| **Error Handling** | ✅ Custom retry and logging | ❌ Limited error visibility |
| **Debugging** | ✅ Full request/response logs | ❌ Limited debugging tools |
| **Coupling** | ⚠️ Slightly more coupled code | ✅ Decoupled from application |
| **Performance** | ✅ Single request, immediate | ⚠️ Async, potential delays |

## Existing System Compatibility

Your system already has comprehensive webhook infrastructure:

- **Webhook Helper Functions** (`lib/webhook-helpers.ts`)
- **General Webhook Endpoint** (`/api/bookings/webhook`)
- **Multiple Event Types** (booking.created, booking.status_changed, etc.)
- **Enriched Payloads** (includes related data from joins)

The new direct webhook approach can work alongside your existing system, giving you options for different use cases:

- **Direct Webhook**: For critical, immediate notifications
- **Existing System**: For complex enriched payloads with related data

## Monitoring

All webhook attempts are logged to the `webhook_logs` table with:
- Event type and booking ID
- Full payload sent to Make.com
- Response received (if successful)
- Error details (if failed)
- Timestamps for performance monitoring

This provides complete audit trail and debugging capabilities for your webhook integrations.

## Next Steps

1. **Test the Integration**: Use `/test-webhook-integration` page
2. **Configure Make.com**: Set up your automation scenarios
3. **Update Environment**: Add your webhook URLs
4. **Monitor Logs**: Check `webhook_logs` table for delivery status
5. **Consider Gradual Migration**: Start with critical bookings, expand as needed

The implementation gives you the reliability and control you need while maintaining compatibility with your existing webhook infrastructure.
