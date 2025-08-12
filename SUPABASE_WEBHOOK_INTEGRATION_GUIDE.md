# Supabase to Make.com Webhook Integration Guide

## Overview

This guide sets up automatic webhook triggers from your Supabase database to Make.com, eliminating the need for manual API calls and ensuring every database change triggers your automation workflows.

## Architecture

```
📊 Supabase Database Changes
    ↓ (Postgres Triggers)
🔗 Automatic Webhook Calls
    ↓ (HTTP Extension)
🤖 Make.com Automation
    ↓ (Workflows Execute)
📧 Emails, Calendar, Slack, etc.
```

## Setup Steps

### Step 1: Enable HTTP Extension in Supabase

1. **Go to Supabase Dashboard** → Database → Extensions
2. **Enable the `http` extension**
3. **Grant permissions** to your service role:

```sql
-- Enable HTTP extension
CREATE EXTENSION IF NOT EXISTS http;

-- Grant permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA net TO postgres, anon, authenticated, service_role;
```

### Step 2: Get Your Make.com Webhook URLs

In Make.com, create scenarios with webhook triggers and copy the webhook URLs:

1. **Booking Created Scenario**:
   - Trigger: Webhook
   - Copy URL: `https://hook.eu1.make.com/abc123xyz/booking-created`

2. **Booking Status Changed Scenario**:
   - Trigger: Webhook
   - Copy URL: `https://hook.eu1.make.com/def456uvw/booking-status-changed`

3. **Payment Processed Scenario**:
   - Trigger: Webhook
   - Copy URL: `https://hook.eu1.make.com/ghi789rst/payment-processed`

4. **User Registered Scenario**:
   - Trigger: Webhook
   - Copy URL: `https://hook.eu1.make.com/jkl012mno/user-registered`

5. **Service Created Scenario**:
   - Trigger: Webhook
   - Copy URL: `https://hook.eu1.make.com/pqr345stu/service-created`

### Step 3: Configure Webhook URLs

Open `setup-supabase-webhooks.sql` and replace the placeholder URLs:

```sql
-- Find and replace these URLs with your actual Make.com webhook URLs:

-- Booking created webhook
'https://hook.eu1.make.com/YOUR_BOOKING_CREATED_WEBHOOK_ID'
-- Replace with: 'https://hook.eu1.make.com/abc123xyz/booking-created'

-- Booking status changed webhook
'https://hook.eu1.make.com/YOUR_BOOKING_STATUS_CHANGED_WEBHOOK_ID'
-- Replace with: 'https://hook.eu1.make.com/def456uvw/booking-status-changed'

-- Payment processed webhook
'https://hook.eu1.make.com/YOUR_PAYMENT_PROCESSED_WEBHOOK_ID'
-- Replace with: 'https://hook.eu1.make.com/ghi789rst/payment-processed'

-- User registered webhook
'https://hook.eu1.make.com/YOUR_USER_REGISTERED_WEBHOOK_ID'
-- Replace with: 'https://hook.eu1.make.com/jkl012mno/user-registered'

-- Service created webhook
'https://hook.eu1.make.com/YOUR_SERVICE_CREATED_WEBHOOK_ID'
-- Replace with: 'https://hook.eu1.make.com/pqr345stu/service-created'
```

### Step 4: Run the Setup Script

1. **Go to Supabase** → SQL Editor
2. **Paste the entire `setup-supabase-webhooks.sql` file**
3. **Run the script** - this will create:
   - HTTP helper functions
   - Trigger functions for each table
   - Database triggers that fire on changes
   - Webhook logging system
   - Monitoring and retry functions

## Testing the Integration

### Test 1: Manual Webhook Call

```sql
-- Test if HTTP extension is working
SELECT safe_webhook_call(
  'https://hook.eu1.make.com/YOUR_TEST_WEBHOOK_ID',
  '{"test": "data", "timestamp": "' || NOW() || '"}'::jsonb
);
```

### Test 2: Create a Test Booking

```sql
-- Insert a test booking to trigger the webhook
INSERT INTO bookings (
  service_id,
  client_name,
  client_email,
  scheduled_start,
  scheduled_end,
  quoted_price,
  status
) VALUES (
  'your-service-id',
  'Test Client',
  'test@example.com',
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
  150.00,
  'pending'
);
```

### Test 3: Update Booking Status

```sql
-- Update booking status to trigger status change webhook
UPDATE bookings
SET status = 'confirmed'
WHERE client_email = 'test@example.com'
  AND status = 'pending';
```

### Test 4: Check Webhook Logs

```sql
-- View recent webhook calls
SELECT
  webhook_type,
  status,
  created_at,
  response
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

## Webhook Payloads

### Booking Created Payload

```json
{
  "event": "booking.created",
  "booking_id": "uuid",
  "booking_number": "BK20250107001",
  "service_id": "uuid",
  "client_id": "uuid",
  "client_email": "john@example.com",
  "client_name": "John Doe",
  "scheduled_start": "2025-01-08T10:00:00Z",
  "scheduled_end": "2025-01-08T11:00:00Z",
  "quoted_price": 150.0,
  "status": "pending",
  "created_at": "2025-01-07T14:30:00Z",
  "service": {
    "title": "Business Consultation",
    "category": "consulting",
    "base_price": 150.0
  },
  "provider": {
    "full_name": "Jane Smith",
    "email": "jane@provider.com",
    "company_name": "Smith Consulting"
  }
}
```

### Booking Status Changed Payload

```json
{
  "event": "booking.status_changed",
  "booking_id": "uuid",
  "booking_number": "BK20250107001",
  "old_status": "pending",
  "new_status": "confirmed",
  "client_email": "john@example.com",
  "provider_id": "uuid",
  "service_id": "uuid",
  "updated_at": "2025-01-07T15:00:00Z"
}
```

## Monitoring and Maintenance

### View Webhook Statistics

```sql
-- Get webhook performance for last 7 days
SELECT * FROM get_webhook_stats(7);

-- Expected output:
--  webhook_type        | total_calls | successful_calls | failed_calls | success_rate
-- --------------------+-------------+------------------+--------------+--------------
--  booking_created     |          15 |               14 |            1 |        93.33
--  booking_status_changed |       8 |                8 |            0 |       100.00
--  payment_processed   |           3 |                3 |            0 |       100.00
```

### Retry Failed Webhooks

```sql
-- Retry failed webhooks (max 3 attempts)
SELECT retry_failed_webhooks(3);

-- Returns number of webhooks retried
```

### Clean Up Old Logs

```sql
-- Delete webhook logs older than 30 days
DELETE FROM webhook_logs
WHERE created_at < NOW() - INTERVAL '30 days';
```

## Advanced Configuration

### Custom Webhook Headers

Modify the `safe_webhook_call` function to add authentication headers:

```sql
-- Add API key header
SELECT safe_webhook_call(
    'https://hook.eu1.make.com/your-webhook-id',
    payload,
    ARRAY[
        ('Content-Type', 'application/json'),
        ('X-API-Key', 'your-api-key'),
        ('Authorization', 'Bearer your-token')
    ]::http_header[]
);
```

### Conditional Webhooks

Modify trigger functions to add conditions:

```sql
-- Only trigger webhook for high-value bookings
CREATE OR REPLACE FUNCTION notify_booking_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Only send webhook for bookings over $100
    IF NEW.quoted_price >= 100 THEN
        -- ... existing webhook code ...
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Webhook Rate Limiting

Add rate limiting to prevent spam:

```sql
-- Create rate limiting table
CREATE TABLE webhook_rate_limits (
    webhook_type TEXT PRIMARY KEY,
    last_call TIMESTAMP WITH TIME ZONE,
    call_count INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add rate limiting logic to webhook functions
-- (Allow max 100 calls per hour per webhook type)
```

## Troubleshooting

### Common Issues

#### 1. HTTP Extension Not Working

```sql
-- Check if extension is enabled
SELECT * FROM pg_extension WHERE extname = 'http';

-- If empty, enable it:
CREATE EXTENSION IF NOT EXISTS http;
```

#### 2. Permission Denied Errors

```sql
-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA net TO service_role;
```

#### 3. Webhook URLs Not Responding

```sql
-- Test webhook URL manually
SELECT net.http_post(
    'https://hook.eu1.make.com/your-webhook-id',
    '{"test": "manual call"}'
);
```

#### 4. Triggers Not Firing

```sql
-- Check if triggers exist
SELECT
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

### Debug Mode

Enable detailed logging:

```sql
-- Add debug logging to trigger functions
RAISE LOG 'Webhook triggered: % with payload: %', webhook_type, webhook_payload;
```

## Production Recommendations

1. **Monitor webhook success rates** - Set up alerts for failed webhooks
2. **Implement exponential backoff** - For retry logic
3. **Add webhook signature verification** - For security
4. **Use connection pooling** - For high-volume scenarios
5. **Set up webhook health checks** - Monitor Make.com scenario status

## Integration Benefits

✅ **Zero Manual Intervention** - Webhooks fire automatically on database changes  
✅ **Real-time Automation** - Instant triggering of Make.com scenarios  
✅ **Comprehensive Logging** - Full audit trail of webhook calls  
✅ **Error Recovery** - Automatic retry of failed webhooks  
✅ **Rich Payloads** - Enriched data with related records  
✅ **Scalable Architecture** - Handles high-volume scenarios

Your database is now fully integrated with Make.com! Every booking, payment, and user action will automatically trigger your automation workflows. 🚀
