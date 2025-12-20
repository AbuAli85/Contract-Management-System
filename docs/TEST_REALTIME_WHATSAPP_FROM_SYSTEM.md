# Testing Real-Time WhatsApp from System

This guide shows how to test WhatsApp notifications through the **actual system features**, not just the test endpoint.

## Method 1: Using the Real Notification Service API

### Test via API Endpoint

```javascript
// Test real notification service
fetch('/api/test/notifications/whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+96879665522',
    title: 'Document Expiry Alert',
    message: 'Your passport will expire in 30 days. Please renew it soon.',
    priority: 'high', // Required for WhatsApp
    category: 'document_expiry',
    actionUrl: '/documents'
  })
})
.then(r => r.json())
.then(console.log);
```

### Available Test Scenarios

Get pre-configured scenarios:

```javascript
fetch('/api/test/notifications/whatsapp')
  .then(r => r.json())
  .then(data => {
    console.log('Available scenarios:', data.scenarios);
    // Use any scenario's body for testing
  });
```

## Method 2: Trigger Document Expiry Automation

### Step 1: Ensure You Have Documents

Make sure you have documents in the system that are expiring soon or expired.

### Step 2: Trigger Document Expiry Check

```javascript
// Trigger document expiry automation (sends WhatsApp for high/urgent alerts)
fetch('/api/automation/documents/check-expiry', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    channels: ['whatsapp', 'email', 'in_app'], // Include WhatsApp
    sendToEmployee: true,
    sendToEmployer: true
  })
})
.then(r => r.json())
.then(result => {
  console.log('Document expiry check:', result);
  // Check WhatsApp for alerts
});
```

**What happens:**
- System checks all documents
- Finds expiring/expired documents
- Sends WhatsApp alerts for **high** and **urgent** priority alerts
- Alerts are sent to employees and employers

## Method 3: Create a Test Document with Expiry

### Step 1: Create a Test Document

1. Go to **HR** → **Documents**
2. Add a new document for a promoter/employee
3. Set expiry date to **7 days from now** (to trigger urgent alert)
4. Save the document

### Step 2: Trigger Expiry Check

```javascript
fetch('/api/automation/documents/check-expiry', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    channels: ['whatsapp']
  })
})
.then(r => r.json())
.then(console.log);
```

### Step 3: Check WhatsApp

The employee should receive a WhatsApp message:
```
🚨 URGENT: Document Expiry Alert

Your [Document Type] will expire in 7 day(s). Please renew it immediately.

View Document: [Link]
```

## Method 4: Test via Promoter Notification Service

### Send Document Expiry Reminder

```javascript
// Get a promoter ID first
const promoterId = 'your-promoter-id';

fetch(`/api/promoters/${promoterId}/notify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'document_expiry',
    title: 'Document Expiry Reminder',
    message: 'Your passport will expire in 30 days.',
    priority: 'high', // Required for WhatsApp
    sendSms: false,
    sendEmail: true,
    sendInApp: true
  })
})
.then(r => r.json())
.then(console.log);
```

## Method 5: Create a Test UI Component

### Add to Your Dashboard

Create a test button in your admin dashboard:

```typescript
// components/admin/whatsapp-test-button.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function WhatsAppTestButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const testWhatsApp = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/notifications/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '+96879665522',
          title: 'System Test Notification',
          message: 'This is a test WhatsApp notification from the system.',
          priority: 'high',
          category: 'system_test',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: 'WhatsApp notification sent! Check your phone.',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send notification',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={testWhatsApp} disabled={loading}>
      {loading ? 'Sending...' : 'Test WhatsApp Notification'}
    </Button>
  );
}
```

## Method 6: Test Document Expiry Workflow

### Complete Real-World Test

1. **Create a test employee/promoter:**
   - Go to **Promoters** or **Team Management**
   - Add a new employee
   - Set phone number: `+96879665522`

2. **Add a document:**
   - Go to **Documents**
   - Add document for the employee
   - Set expiry date: **5 days from now** (triggers urgent alert)

3. **Trigger automation:**
   ```javascript
   fetch('/api/automation/documents/check-expiry', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       channels: ['whatsapp', 'email', 'in_app']
     })
   });
   ```

4. **Check results:**
   - Check WhatsApp on `+96879665522`
   - Check in-app notifications
   - Check email (if configured)

## Expected WhatsApp Messages

### Document Expiry (Urgent)
```
🚨 URGENT: Document Expiry Alert

Your passport will expire in 5 day(s). Please renew it immediately.

View Document: https://portal.thesmartpro.io/documents/123
```

### Document Expiry (High Priority)
```
⚠️ Document Expiry Alert

Your ID card will expire in 30 day(s). Please renew it soon.

View Document: https://portal.thesmartpro.io/documents/456
```

### System Alert
```
🔔 System Alert

Your account requires immediate attention. Please contact support.

View Details: https://portal.thesmartpro.io/support
```

## Verification Checklist

- [ ] WhatsApp message received
- [ ] Message content is correct
- [ ] Priority-based sending works (high/urgent only)
- [ ] In-app notification created
- [ ] Email sent (if configured)
- [ ] Action URL works (if provided)
- [ ] Multiple recipients work (if testing bulk)

## Troubleshooting

### ❌ WhatsApp not sent

1. **Check priority:**
   - WhatsApp only sends for `high` or `urgent` priority
   - Change priority in your test

2. **Check phone number:**
   - Must be in E.164 format: `+96879665522`
   - Must have WhatsApp enabled

3. **Check configuration:**
   ```javascript
   fetch('/api/test/whatsapp')
     .then(r => r.json())
     .then(console.log);
   // Should show: configured: true
   ```

### ❌ Message received but wrong format

- Check message content in the API response
- Verify notification service is formatting correctly
- Check Twilio Console for actual message sent

## Real-Time Testing Tips

1. **Use browser console** for quick tests
2. **Create test documents** with near-expiry dates
3. **Monitor Twilio Console** for delivery status
4. **Check application logs** for notification service activity
5. **Test different priorities** to verify channel selection

## Next Steps

After successful testing:

1. ✅ Configure webhook for incoming messages
2. ✅ Set up scheduled document expiry checks (cron)
3. ✅ Customize message templates
4. ✅ Test with real employees/promoters
5. ✅ Monitor delivery rates

## Summary

You can test WhatsApp notifications in real-time through:
- ✅ Real notification service API
- ✅ Document expiry automation
- ✅ Promoter notification service
- ✅ System alerts and announcements
- ✅ Custom test components

All methods use the **actual system services**, so they behave exactly like production notifications!

