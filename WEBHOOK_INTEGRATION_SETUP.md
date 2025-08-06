# Environment Variables Configuration

## Required Environment Variables for Webhook Integration

Add these variables to your `.env.local` file:

```bash
# Supabase Configuration (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Make.com Webhook URLs
MAKE_WEBHOOK_BOOKING_CREATED=https://hook.eu2.make.com/your_webhook_id_for_booking_created
MAKE_WEBHOOK_BOOKING_STATUS=https://hook.eu2.make.com/your_webhook_id_for_status_change
MAKE_WEBHOOK_SERVICE_CREATED=https://hook.eu2.make.com/your_webhook_id_for_service_created
MAKE_WEBHOOK_USER_REGISTERED=https://hook.eu2.make.com/your_webhook_id_for_user_registration

# Development/Testing (optional)
NODE_ENV=development
```

## How to Get Make.com Webhook URLs

1. **Log into Make.com**
2. **Create a New Scenario**
3. **Add Webhook Trigger**:
   - Choose "Webhooks" > "Custom webhook"
   - Click "Add" to create a new webhook
   - Copy the generated webhook URL
4. **Set up Different Webhooks for Each Event**:
   - `booking.created` → Use for new booking notifications
   - `booking.status_changed` → Use for status update notifications
   - `service.created` → Use for new service notifications
   - `user.registered` → Use for new user registration

## Testing Your Webhook Integration

### 1. Test Individual Webhooks

```bash
# Test booking creation webhook
curl -X GET "http://localhost:3000/api/bookings/webhook/test?event=booking.created"

# Test status change webhook
curl -X GET "http://localhost:3000/api/bookings/webhook/test?event=booking.status_changed"

# Test service creation webhook
curl -X GET "http://localhost:3000/api/bookings/webhook/test?event=service.created"

# Test user registration webhook
curl -X GET "http://localhost:3000/api/bookings/webhook/test?event=user.registered"
```

### 2. Test with Custom Data

```bash
curl -X POST "http://localhost:3000/api/bookings/webhook/test" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "booking.created",
    "test_data": {
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "service_title": "Business Consultation"
    }
  }'
```

### 3. Monitor Webhook Logs

Check your webhook execution logs in the database:

```sql
SELECT 
    webhook_type,
    status,
    created_at,
    processed_at,
    error_message
FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

## Integration Points

### Automatic Webhook Triggers

The system automatically triggers webhooks for:

1. **New Bookings** (`booking.created`)
   - Triggered when: `POST /api/bookings` creates a new booking
   - Data includes: Booking details, client info, service info, provider info

2. **Booking Status Changes** (`booking.status_changed`)
   - Triggered when: `PATCH /api/bookings/[id]` updates booking status
   - Data includes: Old status, new status, booking details

3. **New Services** (`service.created`)
   - Triggered when: New service is created by provider
   - Data includes: Service details, provider info

4. **User Registration** (`user.registered`)
   - Triggered when: New user completes registration
   - Data includes: User details, role, profile info

### Manual Webhook Triggers

You can also manually trigger webhooks in your code:

```typescript
import { triggerBookingCreatedWebhook } from '@/lib/webhook-helpers'

// After creating a booking
const webhookResult = await triggerBookingCreatedWebhook(booking)
if (!webhookResult.success) {
  console.warn('Webhook failed:', webhookResult.error)
}
```

## Make.com Scenario Setup

Follow the `MAKECOM_SCENARIOS_GUIDE.md` to set up your Make.com scenarios to handle the webhook data and automate:

- Email notifications to clients and providers
- Slack/Teams notifications to your team
- Calendar event creation
- CRM updates
- SMS notifications (optional)
- Follow-up automation

## Troubleshooting

### Common Issues

1. **Webhook URL Not Found**
   - Check that the environment variable is set correctly
   - Verify the Make.com webhook URL is active

2. **Webhook Timeout**
   - Make.com webhooks have a timeout limit
   - Ensure your scenarios are not too complex

3. **Missing Data**
   - Check the webhook payload in Make.com logs
   - Verify all required data is being sent

4. **Authentication Errors**
   - Ensure Supabase service role key has proper permissions
   - Check that webhook logs table exists

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG_WEBHOOKS=true
```

This will provide detailed console logs for webhook processing.
