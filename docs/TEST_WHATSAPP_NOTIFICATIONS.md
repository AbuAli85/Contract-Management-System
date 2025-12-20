# Testing WhatsApp Notifications

This guide explains how to test WhatsApp notifications in the Contract Management System.

## Prerequisites

1. ✅ WhatsApp configured in `.env` file
2. ✅ Twilio WhatsApp sandbox joined (or approved business number)
3. ✅ Test phone number with WhatsApp enabled
4. ✅ Logged into the system

## Method 1: Using the Test API Endpoint (Recommended)

### Step 1: Check Configuration Status

First, verify that WhatsApp is configured:

```bash
# Using curl
curl http://localhost:3000/api/test/whatsapp

# Or open in browser
http://localhost:3000/api/test/whatsapp
```

**Expected Response:**
```json
{
  "configured": true,
  "config": {
    "accountSid": "✅ Set",
    "authToken": "✅ Set",
    "whatsappFrom": "✅ Set",
    "templateSid": "✅ Set (Optional)"
  },
  "instructions": "WhatsApp is configured. Use POST /api/test/whatsapp to send a test message."
}
```

### Step 2: Send a Test Message

#### Option A: Direct WhatsApp Service Test

```bash
curl -X POST http://localhost:3000/api/test/whatsapp \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "phone": "+96879665522",
    "message": "Hello! This is a test WhatsApp message from the Contract Management System."
  }'
```

#### Option B: Using Template (if configured)

```bash
curl -X POST http://localhost:3000/api/test/whatsapp \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "phone": "+96879665522",
    "useTemplate": true,
    "templateVariables": {
      "1": "Test Notification",
      "2": "This is a test message via WhatsApp template."
    }
  }'
```

#### Option C: Using Unified Notification Service (Recommended)

```bash
curl -X POST http://localhost:3000/api/test/whatsapp \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "phone": "+96879665522",
    "message": "Test notification via unified service"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "details": {
    "phone": "whatsapp:+96879665522",
    "method": "unified_notification_service",
    "channels": {
      "whatsapp": 1,
      "inApp": 1,
      "email": 0,
      "sms": 0
    },
    "failed": {
      "whatsapp": 0,
      "inApp": 0,
      "email": 0,
      "sms": 0
    },
    "errors": []
  },
  "message": "WhatsApp notification sent successfully!"
}
```

### Step 3: Verify on WhatsApp

1. Open WhatsApp on the test phone number
2. Look for a message from the Twilio sandbox number (e.g., `+14155238886`)
3. You should see your test message

## Method 2: Using Browser Developer Tools

### Step 1: Open Browser Console

1. Log into the system
2. Open Developer Tools (F12)
3. Go to Console tab

### Step 2: Run Test Script

```javascript
// Test WhatsApp notification
async function testWhatsApp() {
  const response = await fetch('/api/test/whatsapp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone: '+96879665522', // Replace with your test number
      message: 'Test WhatsApp message from browser console',
    }),
  });

  const result = await response.json();
  console.log('WhatsApp Test Result:', result);
  return result;
}

// Run the test
testWhatsApp();
```

### Step 3: Check Response

Look for:
- ✅ `success: true` - Message sent successfully
- ✅ `messageId` - Twilio message SID
- ❌ `error` - If there's an error, check the message

## Method 3: Using a Test Page (UI)

Create a simple test page for easier testing:

### Create Test Page

```typescript
// app/[locale]/test/whatsapp/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function TestWhatsAppPage() {
  const [phone, setPhone] = useState('+96879665522');
  const [message, setMessage] = useState('Test WhatsApp notification');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const sendTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, message }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast({
          title: 'Success',
          description: 'WhatsApp message sent! Check your phone.',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send WhatsApp message',
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
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test WhatsApp Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Phone Number (E.164 format)
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+96879665522"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Message
            </label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Test message"
            />
          </div>

          <Button onClick={sendTest} disabled={loading}>
            {loading ? 'Sending...' : 'Send Test WhatsApp'}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

Then visit: `http://localhost:3000/test/whatsapp`

## Method 4: Trigger Real Notification

Test with an actual high-priority notification:

### Example: Document Expiry Alert

1. **Create a document expiry alert:**
   - Go to Document Management
   - Find a document expiring soon
   - The system will automatically send WhatsApp if priority is "high" or "urgent"

2. **Or trigger manually via API:**
```bash
curl -X POST http://localhost:3000/api/automation/documents/check-expiry \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"
```

## Troubleshooting

### ❌ "WhatsApp not configured"
- Check `.env` file has `TWILIO_WHATSAPP_FROM`
- Verify all Twilio credentials are set
- Restart your development server after changing `.env`

### ❌ "Invalid phone number format"
- Ensure phone number starts with `+` and country code
- Example: `+96879665522` (Oman)
- The system will auto-format numbers starting with `0`

### ❌ "Message not received"
1. **Check Twilio Console:**
   - Go to [Twilio Console](https://console.twilio.com)
   - Navigate to **Monitor** → **Logs** → **Messaging**
   - Look for your message and check status

2. **Verify Sandbox:**
   - For sandbox numbers, ensure recipient has joined
   - Send join phrase to sandbox number first

3. **Check Phone Number:**
   - Verify the number has WhatsApp enabled
   - Try sending a test message from Twilio Console directly

### ❌ "Template not found"
- Verify `TWILIO_WHATSAPP_TEMPLATE_SID` matches your template
- Ensure template is approved in Twilio Console
- Check template variables match your template structure

### ✅ Success Indicators

- **API Response:** `success: true` and `messageId` present
- **Twilio Console:** Message shows "delivered" status
- **WhatsApp:** Message appears in recipient's WhatsApp

## Testing Checklist

- [ ] WhatsApp configuration verified (`GET /api/test/whatsapp`)
- [ ] Test message sent successfully
- [ ] Message received on WhatsApp
- [ ] Template messages work (if using templates)
- [ ] Free-form messages work (within 24h window)
- [ ] Error handling works (invalid phone, etc.)
- [ ] Unified notification service includes WhatsApp
- [ ] High-priority notifications trigger WhatsApp

## Next Steps

After successful testing:

1. ✅ Configure production WhatsApp Business Account
2. ✅ Set up approved templates for production
3. ✅ Update phone numbers to production numbers
4. ✅ Monitor delivery rates in Twilio Console
5. ✅ Set up alerts for failed deliveries

## Additional Resources

- [Twilio WhatsApp Documentation](https://www.twilio.com/docs/whatsapp)
- [WhatsApp Setup Guide](./WHATSAPP_SETUP_GUIDE.md)
- [Twilio Console](https://console.twilio.com)

