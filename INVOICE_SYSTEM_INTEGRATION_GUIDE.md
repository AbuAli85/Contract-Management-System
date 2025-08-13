# Invoice System Integration Guide

## Overview
This guide explains how to integrate the invoice system with your existing booking and payment flow. The system automatically creates invoices when bookings are confirmed and handles payment processing through webhooks.

## 🚀 Quick Setup

### 1. Database Setup
Run the invoice system setup script:
```sql
-- Execute the setup-invoice-system.sql file in your database
-- This creates the invoices table, triggers, and functions
```

### 2. Environment Variables
Add these to your `.env.local` file:
```env
# Payment webhook verification
PAYMENT_WEBHOOK_SECRET=your_payment_provider_webhook_secret
WEBHOOK_VERIFY_TOKEN=your_verification_token

# Supabase service role (for webhook operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Make.com webhook URL for invoice notifications
INVOICE_WEBHOOK_URL=https://hook.eu1.make.com/YOUR_INVOICE_WEBHOOK_ID
```

### 3. Install Dependencies
```bash
npm install zod @supabase/ssr
```

## 📋 Integration Flow

### Automatic Invoice Creation
Invoices are automatically created when a booking status changes to 'confirmed':

```typescript
// This will trigger automatic invoice creation
await supabase
  .from('bookings')
  .update({ status: 'confirmed' })
  .eq('id', bookingId);
```

### Manual Invoice Creation
Create invoices manually using the API:

```typescript
// Client-side API call
const response = await fetch(`/api/bookings/${bookingId}/create-invoice`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vat_rate: 5.0,
    description: 'Custom service description',
    due_days: 30,
    currency: 'OMR'
  })
});

const result = await response.json();
```

### Direct Invoice Creation
Create invoices directly:

```typescript
const response = await fetch('/api/invoices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    booking_id: 'uuid-here',
    subtotal: 150.00,
    vat_rate: 5.0,
    currency: 'OMR'
  })
});
```

## 💳 Payment Processing

### Payment Success Webhook
Configure your payment provider to send webhooks to:
```
https://yourdomain.com/api/webhooks/payment-success
```

### Webhook Payload Format
Your payment provider should send:
```json
{
  "booking_id": "uuid-here",
  "payment_amount": 157.50,
  "payment_method": "credit_card",
  "payment_reference": "stripe_pi_abc123",
  "payment_gateway": "stripe",
  "currency": "OMR"
}
```

### What Happens on Payment Success
1. ✅ Creates invoice if it doesn't exist
2. ✅ Records payment in payments table
3. ✅ Updates invoice status to 'paid'
4. ✅ Updates booking status to 'completed'
5. ✅ Updates tracking status to 'completed'
6. ✅ Sends webhook to Make.com for notifications

## 🔐 Role-Based Access Control

### Permissions Matrix
| Role | View Invoices | Create Invoices | Modify Invoices | Delete Invoices |
|------|---------------|-----------------|-----------------|-----------------|
| Admin | All | ✅ | ✅ | ✅ |
| Manager | All | ✅ | ✅ | ✅ |
| Provider | Own only | ✅ | Own only | ❌ |
| Client | Own only | ❌ | ❌ | ❌ |

### Route Protection
Routes are automatically protected by middleware:
- `/invoices/*` - Requires authentication
- `/provider/*` - Requires provider/admin/manager role
- `/admin/*` - Requires admin/manager role

## 📊 API Endpoints

### Invoice Management

#### List Invoices
```typescript
GET /api/invoices
Query params: page, limit, status, provider_id, start_date, end_date
```

#### Get Invoice Details
```typescript
GET /api/invoices/[id]
Returns: Invoice with payments, booking, and provider data
```

#### Update Invoice
```typescript
PATCH /api/invoices/[id]
Body: { status, description, notes, due_date, payment_method }
```

#### Delete Invoice
```typescript
DELETE /api/invoices/[id]
Note: Only admins/managers, cannot delete invoices with completed payments
```

#### Create Invoice from Booking
```typescript
POST /api/bookings/[id]/create-invoice
Body: { vat_rate?, description?, due_days?, currency? }
```

### Webhook Endpoints

#### Payment Success
```typescript
POST /api/webhooks/payment-success
Body: { booking_id, payment_amount, payment_method, payment_reference?, payment_gateway?, currency? }
```

## 🔄 Database Schema

### Invoices Table
```sql
invoices (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  invoice_number TEXT UNIQUE,
  status TEXT CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
  subtotal DECIMAL(10,2),
  vat_rate DECIMAL(5,2) DEFAULT 5.00,
  vat_amount DECIMAL(10,2) GENERATED ALWAYS AS (subtotal * vat_rate / 100),
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (subtotal + vat_amount),
  currency TEXT DEFAULT 'OMR',
  invoice_date DATE,
  due_date DATE,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  provider_id UUID REFERENCES profiles(id),
  description TEXT,
  notes TEXT,
  payment_method TEXT,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Payments Table Updates
```sql
ALTER TABLE payments ADD COLUMN invoice_id UUID REFERENCES invoices(id);
```

## 🔔 Webhook Integration

### Make.com Webhook Payload
When invoice events occur, webhooks are sent to Make.com:

```json
{
  "event": "invoice.created" | "invoice.status_changed" | "invoice.updated",
  "invoice_id": "uuid",
  "invoice_number": "INV000001",
  "booking_id": "uuid",
  "status": "paid",
  "subtotal": 150.00,
  "vat_amount": 7.50,
  "total_amount": 157.50,
  "currency": "OMR",
  "client_email": "client@example.com",
  "client_name": "John Doe",
  "provider_id": "uuid",
  "invoice_date": "2024-01-15",
  "due_date": "2024-02-14",
  "paid_at": "2024-01-16T10:30:00Z",
  "booking": { ... },
  "old_status": "pending" // Only for status changes
}
```

## 🧪 Testing

### Test Invoice Creation
```typescript
// 1. Create a booking
const booking = await supabase.from('bookings').insert({...}).select().single();

// 2. Confirm booking (triggers invoice creation)
await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', booking.id);

// 3. Check invoice was created
const invoice = await supabase.from('invoices').select('*').eq('booking_id', booking.id).single();
```

### Test Payment Webhook
```bash
curl -X POST https://yourdomain.com/api/webhooks/payment-success \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "your-booking-uuid",
    "payment_amount": 157.50,
    "payment_method": "credit_card",
    "payment_reference": "test_payment_123",
    "currency": "OMR"
  }'
```

### Test Invoice API
```typescript
// Get invoices
const invoices = await fetch('/api/invoices').then(r => r.json());

// Get specific invoice
const invoice = await fetch('/api/invoices/invoice-uuid').then(r => r.json());

// Update invoice status
await fetch('/api/invoices/invoice-uuid', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'paid' })
});
```

## 🔧 Customization

### Custom VAT Rates
Modify the default VAT rate in the database function:
```sql
-- In setup-invoice-system.sql, change the default VAT rate
vat_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00, -- Change from 5.00 to 10.00
```

### Custom Invoice Numbers
Modify the `generate_invoice_number()` function for different formats:
```sql
-- Example: Change from INV000001 to INVOICE-2024-0001
invoice_number := 'INVOICE-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(next_number::TEXT, 4, '0');
```

### Payment Provider Integration
Configure webhook signature verification:
```typescript
// In payment-success webhook
const signature = headersList.get('x-stripe-signature'); // For Stripe
const isValid = verifyStripeSignature(payload, signature, webhookSecret);
```

## 🚨 Error Handling

### Common Issues
1. **Invoice already exists**: Check if invoice exists before creation
2. **Booking not found**: Verify booking ID is valid
3. **Permission denied**: Check user role and ownership
4. **Webhook signature invalid**: Verify webhook secret configuration

### Debugging
Enable request logging by setting:
```env
ENABLE_REQUEST_LOGGING=true
```

Check webhook logs in the `webhook_logs` table:
```sql
SELECT * FROM webhook_logs WHERE webhook_type LIKE 'invoice%' ORDER BY created_at DESC;
```

## 🎯 Best Practices

1. **Always verify webhook signatures** from payment providers
2. **Use idempotency keys** for payment processing
3. **Handle duplicate webhooks** gracefully
4. **Monitor invoice generation** for failed attempts
5. **Implement retry logic** for failed webhook calls
6. **Use transactions** for critical operations
7. **Log all payment events** for audit trails

## 📈 Monitoring

### Key Metrics to Track
- Invoice creation success rate
- Payment processing time
- Webhook delivery success rate
- Failed payment attempts
- Outstanding invoice amounts

### Health Check Endpoint
```typescript
GET /api/webhooks/payment-success
Returns: { status: 'active', endpoint: 'payment-success-webhook', timestamp: '...' }
```

This invoice system provides a complete solution for automated billing, payment processing, and real-time notifications integrated with your existing booking workflow.
