# Webhook Integration Refactor Guide

## Overview

This document outlines the refactoring of the Make.com webhook integration to improve security, reliability, and maintainability.

## Changes Made

### 1. Environment Variables

**Before:**

```env
NEXT_PUBLIC_MAKE_SERVICE_CREATION_WEBHOOK=https://hook.eu2.make.com/...
NEXT_PUBLIC_MAKE_BOOKING_CREATED_WEBHOOK=https://hook.eu2.make.com/...
NEXT_PUBLIC_MAKE_TRACKING_UPDATED_WEBHOOK=https://hook.eu2.make.com/...
NEXT_PUBLIC_MAKE_PAYMENT_SUCCEEDED_WEBHOOK=https://hook.eu2.make.com/...
```

**After:**

```env
MAKE_SERVICE_CREATION_WEBHOOK=https://hook.eu2.make.com/...
MAKE_BOOKING_CREATED_WEBHOOK=https://hook.eu2.make.com/...
MAKE_TRACKING_UPDATED_WEBHOOK=https://hook.eu2.make.com/...
MAKE_PAYMENT_SUCCEEDED_WEBHOOK=https://hook.eu2.make.com/...
WEBHOOK_SECRET=your-shared-secret-here
```

### 2. New Architecture

#### Central Webhook Dispatcher (`lib/makeWebhooks.ts`)

- Handles all webhook dispatches with retry logic
- Exponential backoff (1s, 2s, 4s delays)
- Automatic logging to `webhook_logs` table
- Webhook signature generation for security

#### API Routes (`app/api/webhooks/[type]/route.ts`)

- Validates webhook types and payloads using Zod schemas
- Provides consistent error handling
- Only accepts POST requests
- Returns standardized responses

#### Database Logging (`webhook_logs` table)

```sql
CREATE TABLE webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  payload jsonb NOT NULL,
  error text,
  attempts int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
```

### 3. Payload Schemas

All webhook payloads are now strictly typed and validated:

#### Service Creation

```typescript
interface ServiceCreatedPayload {
  serviceId: string;
  name: string;
  providerId: string;
  createdAt: string;
  description?: string;
  category?: string;
  price?: number;
  currency?: string;
}
```

#### Booking Created

```typescript
interface BookingCreatedPayload {
  bookingId: string;
  serviceId: string;
  userId: string;
  bookingDate: string;
  status: string;
  amount?: number;
  currency?: string;
  notes?: string;
}
```

#### Tracking Updated

```typescript
interface TrackingUpdatedPayload {
  trackingId: string;
  status: string;
  location?: string;
  updatedAt: string;
  bookingId?: string;
  serviceId?: string;
  estimatedDelivery?: string;
  notes?: string;
}
```

#### Payment Succeeded

```typescript
interface PaymentSucceededPayload {
  paymentId: string;
  amount: number;
  currency: string;
  userId: string;
  serviceId?: string;
  bookingId?: string;
  paymentDate: string;
  paymentMethod?: string;
  transactionId?: string;
}
```

## Migration Guide

### 1. Update Environment Variables

Remove all `NEXT_PUBLIC_` prefixes from webhook URLs and add the `WEBHOOK_SECRET`:

```env
# Remove these
NEXT_PUBLIC_MAKE_SERVICE_CREATION_WEBHOOK
NEXT_PUBLIC_MAKE_BOOKING_CREATED_WEBHOOK
NEXT_PUBLIC_MAKE_TRACKING_UPDATED_WEBHOOK
NEXT_PUBLIC_MAKE_PAYMENT_SUCCEEDED_WEBHOOK

# Add these instead
MAKE_SERVICE_CREATION_WEBHOOK
MAKE_BOOKING_CREATED_WEBHOOK
MAKE_TRACKING_UPDATED_WEBHOOK
MAKE_PAYMENT_SUCCEEDED_WEBHOOK
WEBHOOK_SECRET
```

### 2. Update Frontend Code

**Before:**

```typescript
import { sendServiceCreation } from '@/lib/webhooks/make-webhooks';

const result = await sendServiceCreation({
  service_id: '123',
  provider_id: '456',
  service_name: 'Test Service',
  created_at: new Date().toISOString(),
});
```

**After:**

```typescript
const response = await fetch('/api/webhooks/serviceCreation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serviceId: '123',
    name: 'Test Service',
    providerId: '456',
    createdAt: new Date().toISOString(),
  }),
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error);
}
```

### 3. Update Make.com Scenarios

Update your Make.com scenarios to verify the webhook signature:

```javascript
// In your Make.com scenario
const payload = JSON.stringify(data.body);
const signature = data.headers['X-Webhook-Signature'];
const expectedSignature = btoa(payload + 'your-webhook-secret');

if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature');
}
```

## New Features

### 1. Admin Dashboard

Access webhook logs at `/admin/integrations`:

- View recent webhook dispatches
- Filter by type and status
- Search through payloads and errors
- Monitor success/failure rates

### 2. Enhanced Security

- Webhook URLs no longer exposed to client
- Signature verification for authenticity
- Rate limiting and validation
- Comprehensive error logging

### 3. Improved Reliability

- Automatic retry with exponential backoff
- Detailed error tracking
- Success/failure monitoring
- Payload validation

## Testing

### Unit Tests

```bash
npm test __tests__/webhook-dispatcher.test.ts
```

### Integration Tests

```bash
npm test __tests__/webhook-api-integration.test.ts
```

### Manual Testing

1. Create a service via the form
2. Check the webhook logs in `/admin/integrations`
3. Verify the Make.com scenario receives the webhook

## Troubleshooting

### Common Issues

1. **Webhook not being sent**
   - Check environment variables are set correctly
   - Verify webhook URLs are accessible
   - Check admin dashboard for error logs

2. **Validation errors**
   - Ensure payload matches the expected schema
   - Check that all required fields are present
   - Verify UUID formats are correct

3. **Signature verification failures**
   - Ensure `WEBHOOK_SECRET` is set consistently
   - Verify Make.com scenario is checking signatures correctly

### Debug Mode

Enable debug logging by setting:

```env
DEBUG_WEBHOOKS=true
```

This will log detailed information about webhook dispatches to the console.

## Security Considerations

1. **Never expose webhook URLs to the client**
2. **Use strong, unique secrets for signature verification**
3. **Rotate secrets regularly**
4. **Monitor webhook logs for suspicious activity**
5. **Implement rate limiting if needed**

## Performance

- Webhook dispatches are asynchronous
- Retry logic prevents data loss
- Database logging provides audit trail
- Admin dashboard loads efficiently with pagination

## Future Enhancements

1. **Webhook replay functionality** - Retry failed webhooks from admin dashboard
2. **Webhook templates** - Predefined payload structures
3. **Webhook analytics** - Success rates, response times, etc.
4. **Webhook scheduling** - Delayed webhook dispatches
5. **Webhook encryption** - End-to-end encryption of payloads
