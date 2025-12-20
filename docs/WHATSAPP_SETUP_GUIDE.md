# WhatsApp Notification Setup Guide

This guide explains how to configure WhatsApp notifications via Twilio in the Contract Management System.

## Overview

The system supports WhatsApp notifications through Twilio's WhatsApp API. WhatsApp messages can be sent for high-priority and urgent notifications, providing an additional communication channel alongside email and SMS.

## Prerequisites

1. **Twilio Account**: Sign up at [https://www.twilio.com](https://www.twilio.com)
2. **Twilio WhatsApp Sandbox**: Set up WhatsApp messaging in Twilio Console
3. **Content Templates**: Create approved WhatsApp message templates (for business-initiated messages)

## Configuration Steps

### 1. Set Up Twilio WhatsApp Sandbox

1. Log in to [Twilio Console](https://console.twilio.com)
2. Navigate to **Develop** → **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Join the WhatsApp sandbox by sending the join phrase to the Twilio sandbox number
4. Copy your sandbox number (format: `whatsapp:+14155238886`)

### 2. Get Twilio Credentials

1. In Twilio Console, go to **Account** → **API Keys & Tokens**
2. Copy your:
   - **Account SID** (starts with `AC...`)
   - **Auth Token**

### 3. Create WhatsApp Content Templates (Optional)

For business-initiated messages, you need pre-approved templates:

1. In Twilio Console, go to **Develop** → **Messaging** → **Senders** → **Content Template Builder**
2. Create a new template (e.g., "Appointment Reminders")
3. Use variables like `{{1}}` and `{{2}}` for dynamic content
4. Copy the **Content SID** (starts with `HX...`)

**Example Template:**
```
Your appointment is coming up on {{1}} at {{2}}. If you need to change it, please reply back and let us know.
```

### 4. Configure Environment Variables

Add the following to your `.env` file:

```env
# Twilio WhatsApp Service
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# WhatsApp Sender Number (from sandbox or approved number)
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# WhatsApp Content Template SID (optional - for business-initiated messages)
TWILIO_WHATSAPP_TEMPLATE_SID=HXb5b62575e6e4ff6129ad7c8efe1f983e
```

### 5. Install Twilio Package

If not already installed:

```bash
npm install twilio
```

## How It Works

### Message Types

1. **Business-Initiated Messages** (Using Templates):
   - Requires pre-approved content templates
   - Used for first contact with users
   - Template variables are automatically populated from notification content

2. **User-Initiated Messages** (Free-form):
   - Can be sent within 24 hours after user replies
   - No template required
   - Uses plain text message

### Automatic Channel Selection

WhatsApp is automatically used for:
- **High priority** notifications
- **Urgent** notifications
- Only if WhatsApp is configured and recipient has a phone number

### Phone Number Format

Phone numbers are automatically formatted to E.164 format:
- Oman numbers starting with `0` → `+968...`
- Numbers without `+` → `+968...` (Oman default)
- Already formatted numbers → Used as-is

## Usage Examples

### Send WhatsApp via Unified Notification Service

```typescript
import { UnifiedNotificationService } from '@/lib/services/unified-notification.service';

const notificationService = new UnifiedNotificationService();

await notificationService.sendNotification({
  recipients: [
    {
      userId: 'user-id',
      email: 'user@example.com',
      phone: '+96879665522', // Will be formatted automatically
      name: 'John Doe',
    },
  ],
  content: {
    title: 'Document Expiry Alert',
    message: 'Your passport will expire in 30 days. Please renew it soon.',
    priority: 'high', // Required for WhatsApp
    category: 'document_expiry',
  },
  channels: ['whatsapp', 'email'], // Include 'whatsapp'
});
```

### Send WhatsApp Directly

```typescript
import { sendWhatsApp } from '@/lib/services/whatsapp.service';

// Using template
await sendWhatsApp({
  to: '+96879665522',
  templateSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
  templateVariables: {
    '1': '12/1',
    '2': '3pm',
  },
});

// Using free-form message (within 24h window)
await sendWhatsApp({
  to: '+96879665522',
  message: 'Your document will expire soon. Please renew it.',
});
```

## Testing

### Test WhatsApp Configuration

1. Use the Twilio Console "Try it out" feature
2. Send a test message to your WhatsApp number
3. Verify receipt on your device

### Test in Application

1. Create a high-priority notification
2. Ensure recipient has a valid phone number
3. Check console logs for WhatsApp send status
4. Verify message received on WhatsApp

## Troubleshooting

### "WhatsApp service not configured"
- Check that `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_FROM` are set
- Verify credentials in Twilio Console

### "Invalid phone number format"
- Ensure phone numbers are in E.164 format or can be auto-formatted
- Check that country code is correct (Oman: +968)

### "Template not found"
- Verify `TWILIO_WHATSAPP_TEMPLATE_SID` matches a template in your Twilio account
- Ensure template is approved and active

### "Rate limit exceeded"
- WhatsApp has stricter rate limits than SMS
- Messages are automatically batched with delays
- Consider upgrading Twilio plan for higher limits

### Messages not received
- Verify recipient has joined WhatsApp sandbox (for sandbox numbers)
- Check Twilio Console logs for delivery status
- Ensure recipient number is correct and WhatsApp-enabled

## Best Practices

1. **Use Templates for Business-Initiated Messages**: Required for first contact
2. **Respect Rate Limits**: WhatsApp has stricter limits than SMS
3. **Provide Clear Opt-Out**: Allow users to opt out of WhatsApp notifications
4. **Monitor Delivery Status**: Check Twilio logs for delivery issues
5. **Fallback to SMS**: If WhatsApp fails, system can fallback to SMS

## Production Setup

For production, you'll need:

1. **Approved WhatsApp Business Account**: Apply through Twilio
2. **Verified Phone Number**: Use your own WhatsApp Business number
3. **Approved Templates**: All templates must be pre-approved by WhatsApp
4. **Compliance**: Follow WhatsApp Business Policy

## Additional Resources

- [Twilio WhatsApp Documentation](https://www.twilio.com/docs/whatsapp)
- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy)
- [Twilio Console](https://console.twilio.com)

