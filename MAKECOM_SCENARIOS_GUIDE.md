# Make.com Scenarios & Integration Guide

## Make.com Scenario Configurations

### 1. New Booking Automation Scenario

**Trigger: Webhook (Instant)**
- Webhook URL: `https://hook.eu1.make.com/YOUR_WEBHOOK_ID/booking-created`
- Method: POST
- Content-Type: application/json

**Expected Webhook Payload:**
```json
{
  "event": "booking.created",
  "booking_id": "uuid",
  "booking_number": "BK20240815ABC123",
  "service_id": "uuid",
  "client_id": "uuid",
  "provider_id": "uuid",
  "client_email": "client@example.com",
  "client_name": "John Doe",
  "scheduled_start": "2024-08-15T10:00:00Z",
  "scheduled_end": "2024-08-15T11:00:00Z",
  "quoted_price": 150.00,
  "status": "pending",
  "created_at": "2024-08-15T08:30:00Z"
}
```

**Scenario Flow:**

#### Module 1: Webhook Trigger
```
Input: Booking webhook data
Output: Parsed booking information
```

#### Module 2: Get Provider Details
```
Action: HTTP > Make a request
URL: https://your-supabase-url.supabase.co/rest/v1/profiles
Method: GET
Headers:
  - apikey: [Your Supabase Anon Key]
  - Authorization: Bearer [Your Supabase Service Role Key]
  - Content-Type: application/json
Query: select=*&id=eq.{{provider_id}}
```

#### Module 3: Get Service Details
```
Action: HTTP > Make a request
URL: https://your-supabase-url.supabase.co/rest/v1/services
Method: GET
Headers:
  - apikey: [Your Supabase Anon Key]
  - Authorization: Bearer [Your Supabase Service Role Key]
Query: select=*&id=eq.{{service_id}}
```

#### Module 4: Router - Service Type
```
Action: Flow Control > Router
Routes:
  1. Online Services (location_type = "online")
  2. On-site Services (location_type = "on-site")
  3. Hybrid Services (location_type = "hybrid")
```

#### Module 5A: Send Client Confirmation Email
```
Action: Email > Send an email
To: {{client_email}}
Subject: Booking Confirmation - {{service.title}} ({{booking_number}})
Content: HTML template with booking details
```

**Email Template:**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .booking-card { 
            border: 1px solid #ddd; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
        }
        .status-pending { 
            color: #f59e0b; 
            font-weight: bold; 
        }
    </style>
</head>
<body>
    <h2>Booking Confirmation</h2>
    
    <div class="booking-card">
        <h3>{{service.title}}</h3>
        <p><strong>Booking Number:</strong> {{booking_number}}</p>
        <p><strong>Date & Time:</strong> {{formatDate(scheduled_start)}} - {{formatDate(scheduled_end)}}</p>
        <p><strong>Provider:</strong> {{provider.full_name}}</p>
        <p><strong>Price:</strong> ${{quoted_price}}</p>
        <p><strong>Status:</strong> <span class="status-pending">{{status}}</span></p>
    </div>
    
    <p>Your booking is pending confirmation from the provider. You'll receive another email when it's confirmed.</p>
    
    <p>If you have any questions, please contact the provider directly or our support team.</p>
</body>
</html>
```

#### Module 5B: Send Provider Notification Email
```
Action: Email > Send an email
To: {{provider.email}}
Subject: New Booking Request - {{service.title}}
Content: HTML template for provider notification
```

#### Module 6: Slack Team Notification
```
Action: Slack > Send a message
Channel: #bookings
Message: 
🆕 New booking received!
📅 Service: {{service.title}}
👤 Client: {{client_name}} ({{client_email}})
💰 Value: ${{quoted_price}}
📋 Booking #{{booking_number}}
⏰ Scheduled: {{formatDate(scheduled_start)}}
```

#### Module 7: Create Google Calendar Event (Provider)
```
Action: Google Calendar > Create an event
Calendar: Provider's calendar (needs OAuth setup)
Title: {{service.title}} - {{client_name}}
Start: {{scheduled_start}}
End: {{scheduled_end}}
Description: 
Booking #{{booking_number}}
Client: {{client_name}} ({{client_email}})
Service: {{service.title}}
Price: ${{quoted_price}}
Status: {{status}}
```

#### Module 8: Update Database - Log Automation
```
Action: HTTP > Make a request
URL: https://your-supabase-url.supabase.co/rest/v1/webhook_logs
Method: POST
Headers:
  - apikey: [Your Supabase Service Role Key]
  - Authorization: Bearer [Your Supabase Service Role Key]
  - Content-Type: application/json
Body:
{
  "webhook_type": "booking_created",
  "payload": {{webhook.payload}},
  "status": "success",
  "response": {
    "emails_sent": 2,
    "slack_notified": true,
    "calendar_created": true
  },
  "processed_at": "{{now}}"
}
```

#### Module 9: Schedule Follow-up Reminder
```
Action: Tools > Sleep
Duration: 24 hours
Then: HTTP webhook to trigger reminder scenario
```

### 2. Booking Status Change Scenario

**Trigger: Webhook (Instant)**
- Webhook URL: `https://hook.eu1.make.com/YOUR_WEBHOOK_ID/booking-status-changed`

**Expected Payload:**
```json
{
  "event": "booking.status_changed",
  "booking_id": "uuid",
  "booking_number": "BK20240815ABC123",
  "old_status": "pending",
  "new_status": "confirmed",
  "client_email": "client@example.com",
  "provider_id": "uuid",
  "service_id": "uuid",
  "updated_at": "2024-08-15T09:30:00Z"
}
```

**Scenario Flow:**

#### Module 1: Webhook Trigger
#### Module 2: Router - Status Change Type
```
Routes:
1. Confirmed (new_status = "confirmed")
2. Cancelled (new_status = "cancelled")  
3. Completed (new_status = "completed")
4. In Progress (new_status = "in_progress")
```

#### Module 3A: Confirmed - Send Confirmation Email
```
Subject: Booking Confirmed - {{service.title}} ({{booking_number}})
Content: Confirmation with payment instructions and preparation details
```

#### Module 3B: Cancelled - Send Cancellation Notice
```
Subject: Booking Cancelled - {{booking_number}}
Content: Cancellation notice with refund information
```

#### Module 3C: Completed - Send Review Request
```
Subject: How was your experience? - {{service.title}}
Content: Thank you message with review request link
```

### 3. User Registration Scenario

**Trigger: Webhook from Supabase Auth**

**Scenario Flow:**

#### Module 1: Webhook Trigger (New User Registration)
#### Module 2: Determine User Role
```
Action: Router based on email domain or registration source
Routes:
1. Admin users (@company.com emails)
2. Provider registration
3. Client registration
4. General user registration
```

#### Module 3: Send Welcome Email Series
```
Action: Email sequence based on user role
- Welcome email (immediate)
- Getting started guide (1 hour delay)
- Feature introduction (24 hours delay)
- Tips and best practices (3 days delay)
```

#### Module 4: Create User in CRM/Marketing Tools
```
Actions:
- Add to Mailchimp/ConvertKit list
- Create HubSpot contact
- Add to Slack workspace (for providers)
- Schedule onboarding call (for enterprise clients)
```

### 4. Service Performance Analytics Scenario

**Trigger: Scheduled (Daily at 9 AM)**

**Scenario Flow:**

#### Module 1: Schedule Trigger
#### Module 2: Get Yesterday's Bookings
```
Action: HTTP > Make a request
URL: https://your-supabase-url.supabase.co/rest/v1/bookings
Query: select=*,service:services(*)&created_at=gte.{{yesterday}}&created_at=lt.{{today}}
```

#### Module 3: Aggregate Statistics
```
Action: Tools > Set multiple variables
Variables:
- total_bookings: {{count(bookings)}}
- total_revenue: {{sum(bookings.quoted_price)}}
- top_service: {{most_booked_service}}
- avg_booking_value: {{average(quoted_price)}}
```

#### Module 4: Send Daily Report
```
Action: Email > Send to management team
Subject: Daily Booking Report - {{formatDate(yesterday)}}
Content: Analytics dashboard with charts and insights
```

## Advanced Make.com Features

### 1. Error Handling & Retry Logic

```javascript
// Custom JavaScript module for error handling
const maxRetries = 3;
const retryDelay = 5000; // 5 seconds

async function processWithRetry(operation, retries = 0) {
    try {
        return await operation();
    } catch (error) {
        if (retries < maxRetries) {
            console.log(`Retry attempt ${retries + 1} after error:`, error);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return processWithRetry(operation, retries + 1);
        } else {
            // Send error notification
            await sendErrorAlert({
                operation: 'booking_processing',
                error: error.message,
                retries: retries,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
}
```

### 2. Data Validation Module

```javascript
// Validate booking data before processing
function validateBookingData(booking) {
    const errors = [];
    
    if (!booking.client_email || !isValidEmail(booking.client_email)) {
        errors.push('Invalid client email');
    }
    
    if (!booking.scheduled_start || new Date(booking.scheduled_start) < new Date()) {
        errors.push('Invalid scheduled start time');
    }
    
    if (!booking.quoted_price || booking.quoted_price <= 0) {
        errors.push('Invalid quoted price');
    }
    
    if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    return true;
}
```

### 3. Dynamic Template Selection

```javascript
// Select email template based on service type and user role
function selectEmailTemplate(booking, recipient_type) {
    const templates = {
        'consulting_client_confirmation': 'template_001',
        'workshop_client_confirmation': 'template_002', 
        'consulting_provider_notification': 'template_003',
        'workshop_provider_notification': 'template_004'
    };
    
    const key = `${booking.service.category}_${recipient_type}_${booking.status}`;
    return templates[key] || templates['default_' + recipient_type];
}
```

## Integration Testing

### 1. Test Webhook Endpoints

```bash
# Test booking creation webhook
curl -X POST "https://hook.eu1.make.com/YOUR_WEBHOOK_ID/booking-created" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "booking.created",
    "booking_id": "test-uuid",
    "booking_number": "TEST123",
    "client_email": "test@example.com",
    "client_name": "Test User",
    "service": {
      "title": "Test Service",
      "category": "consulting"
    }
  }'

# Test status change webhook  
curl -X POST "https://hook.eu1.make.com/YOUR_WEBHOOK_ID/booking-status-changed" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "booking.status_changed",
    "booking_id": "test-uuid",
    "old_status": "pending",
    "new_status": "confirmed"
  }'
```

### 2. Monitor Webhook Logs

```sql
-- Query webhook execution logs
SELECT 
    webhook_type,
    status,
    error_message,
    created_at,
    processed_at
FROM webhook_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Check for failed webhooks
SELECT 
    webhook_type,
    COUNT(*) as failure_count,
    MAX(created_at) as last_failure
FROM webhook_logs 
WHERE status = 'error' 
    AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY webhook_type;
```

### 3. Performance Monitoring

Create a Make.com scenario to monitor your automation performance:

```
Daily at 8 AM:
1. Query webhook_logs for yesterday's data
2. Calculate success/failure rates  
3. Identify slow-running scenarios
4. Send performance report to team
5. Alert if error rate > 5%
```

This comprehensive Make.com setup ensures reliable automation of your business processes while maintaining proper error handling and monitoring.
