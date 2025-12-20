# WhatsApp Webhook Setup Guide

This guide explains how to configure the WhatsApp inbound webhook to handle incoming messages from users.

## Current Status

✅ **WhatsApp is working!** Your test message was successfully sent and received.

⚠️ **Sandbox is echoing messages** - This is normal default behavior. To handle incoming messages properly, you need to configure the inbound webhook URL.

## What You Need to Do

### Step 1: Configure Webhook URL in Twilio Console

1. **Go to Twilio Console:**
   - Navigate to: https://console.twilio.com/us1/develop/sms/whatsapp/learn

2. **Find Sandbox Settings:**
   - Look for "Sandbox settings" or "Configuration"
   - Find the "Inbound URL" or "When a message comes in" field

3. **Set Your Webhook URL:**
   ```
   https://yourdomain.com/api/webhooks/whatsapp
   ```
   
   **For local development (using ngrok):**
   ```bash
   # Install ngrok if you haven't
   npm install -g ngrok
   
   # Start your dev server
   npm run dev
   
   # In another terminal, expose your local server
   ngrok http 3000
   
   # Use the ngrok URL:
   https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp
   ```

4. **HTTP Method:**
   - Select: **POST**

5. **Save Configuration**

### Step 2: Test the Webhook

After configuring the webhook:

1. **Send a message to the sandbox:**
   - Open WhatsApp
   - Send a message to `+14155238886`
   - Try: "HELP", "STATUS", or any message

2. **Expected Behavior:**
   - ✅ You should receive a smart response (not just an echo)
   - ✅ Commands like "HELP" and "STATUS" should work
   - ✅ Messages are logged in your application

### Step 3: Verify Webhook is Working

Check your application logs:
```bash
# You should see:
📱 Incoming WhatsApp Message: {
  from: 'whatsapp:+96879665522',
  to: 'whatsapp:+14155238886',
  body: 'HELP',
  ...
}
```

## Available Commands

Once the webhook is configured, users can send:

- **HELP** or **INFO** - Show available commands
- **STATUS** - Check account status
- **STOP** or **UNSUBSCRIBE** - Unsubscribe from notifications
- **START** or **SUBSCRIBE** - Subscribe to notifications
- **Any other message** - Acknowledged with a response

## Customizing Responses

Edit `/app/api/webhooks/whatsapp/route.ts` to customize:

### Example: Custom Business Logic

```typescript
// Handle specific commands
if (message.startsWith('order ')) {
  const orderId = message.split(' ')[1];
  responseMessage = `Your order #${orderId} status: Processing`;
}

// Route to support
if (message.includes('support') || message.includes('help')) {
  // Create support ticket
  // Notify support team
  responseMessage = 'Your support request has been logged. Ticket #12345';
}

// Process document requests
if (message.includes('document') || message.includes('doc')) {
  // Find user's documents
  // Send document links
  responseMessage = 'Here are your documents: [links]';
}
```

## Production Setup

### For Production:

1. **Use Your Own Domain:**
   ```
   https://yourdomain.com/api/webhooks/whatsapp
   ```

2. **Use HTTPS:**
   - Twilio requires HTTPS for webhooks
   - Ensure SSL certificate is valid

3. **Verify Webhook Signature (Optional but Recommended):**
   ```typescript
   import { validateRequest } from '@twilio/webhook-validator';

   const signature = request.headers.get('x-twilio-signature');
   const url = request.url;
   const params = await request.formData();
   
   if (!validateRequest(process.env.TWILIO_AUTH_TOKEN, signature, url, params)) {
     return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
   }
   ```

4. **Handle Rate Limiting:**
   - Implement rate limiting for webhook endpoint
   - Prevent abuse

## Testing Locally

### Option 1: Using ngrok (Recommended)

```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Expose with ngrok
ngrok http 3000

# Use the ngrok URL in Twilio Console
# Example: https://abc123.ngrok.io/api/webhooks/whatsapp
```

### Option 2: Using Twilio CLI

```bash
# Install Twilio CLI
npm install -g twilio-cli

# Login
twilio login

# Start local tunnel
twilio phone-numbers:update +14155238886 \
  --sms-url http://localhost:3000/api/webhooks/whatsapp
```

## Troubleshooting

### ❌ Webhook not receiving messages

1. **Check Twilio Console:**
   - Verify webhook URL is saved
   - Check for errors in Twilio logs

2. **Verify URL is accessible:**
   ```bash
   curl https://yourdomain.com/api/webhooks/whatsapp
   # Should return: {"status":"ok","message":"WhatsApp webhook is active"}
   ```

3. **Check application logs:**
   - Look for incoming message logs
   - Check for errors

### ❌ Still getting echo responses

- Webhook URL might not be configured correctly
- Check Twilio Console settings
- Verify webhook is returning valid TwiML

### ❌ Messages not being processed

- Check application logs for errors
- Verify database connections
- Ensure phone number matching logic works

## Next Steps

1. ✅ Configure webhook URL in Twilio Console
2. ✅ Test with a few messages
3. ✅ Customize responses for your business needs
4. ✅ Set up production webhook URL
5. ✅ Add webhook signature verification (production)
6. ✅ Implement custom business logic

## Additional Resources

- [Twilio WhatsApp Webhooks](https://www.twilio.com/docs/whatsapp/webhooks)
- [TwiML Reference](https://www.twilio.com/docs/messaging/twiml)
- [Webhook Security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)

