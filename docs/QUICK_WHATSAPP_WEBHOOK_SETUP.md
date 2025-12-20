# Quick WhatsApp Webhook Setup

## Current Status

You're on the Twilio Sandbox Settings page. The "When a message comes in" field currently has:
```
https://timberwolf-mastiff-9776.twil.io/demo-reply
```

This is Twilio's demo endpoint - you need to replace it with your webhook URL.

## Step-by-Step Setup

### Option 1: Local Development (Using ngrok)

1. **Install ngrok** (if not already installed):
   ```bash
   npm install -g ngrok
   # Or download from https://ngrok.com/download
   ```

2. **Start your development server**:
   ```bash
   npm run dev
   # Your app should be running on http://localhost:3000
   ```

3. **Start ngrok in a new terminal**:
   ```bash
   ngrok http 3000
   ```

4. **Copy the ngrok HTTPS URL**:
   - You'll see something like: `https://abc123.ngrok-free.app`
   - Copy the full HTTPS URL

5. **Update Twilio Console**:
   - In the "When a message comes in" field, replace the URL with:
     ```
     https://your-ngrok-url.ngrok-free.app/api/webhooks/whatsapp
     ```
   - Keep the Method as **POST**
   - Click **Save**

6. **Test it**:
   - Send a message to `+14155238886` from WhatsApp
   - Try: "HELP" or "STATUS"
   - You should get a smart response (not an echo)

### Option 2: Production (If you have a domain)

1. **Use your production URL**:
   ```
   https://yourdomain.com/api/webhooks/whatsapp
   ```

2. **Update Twilio Console**:
   - Replace the "When a message comes in" URL
   - Keep Method as **POST**
   - Click **Save**

### Optional: Status Callback URL

You can also set the "Status callback URL" to track message delivery status:

```
https://yourdomain.com/api/webhooks/whatsapp/status
```

This is optional but useful for tracking delivery status.

## What to Enter

### For Local Development:
```
https://your-ngrok-url.ngrok-free.app/api/webhooks/whatsapp
```

### For Production:
```
https://yourdomain.com/api/webhooks/whatsapp
```

## Verification

After saving:

1. **Check your terminal** - You should see logs when messages arrive
2. **Send a test message** - Try "HELP" to `+14155238886`
3. **Expected response**:
   ```
   Welcome! Available commands:
   • HELP - Show this message
   • STOP - Unsubscribe from notifications
   • START - Subscribe to notifications
   • STATUS - Check your account status
   ```

## Troubleshooting

### ❌ "Invalid URL" error
- Make sure you're using HTTPS (not HTTP)
- Ensure the URL is accessible from the internet
- For ngrok, use the HTTPS URL (not HTTP)

### ❌ Still getting echo responses
- Verify the webhook URL is saved correctly
- Check that your server is running
- Ensure ngrok is active (if using local dev)
- Check browser console/terminal for errors

### ❌ Webhook not receiving messages
- Test the URL directly: `curl https://your-url/api/webhooks/whatsapp`
- Should return: `{"status":"ok","message":"WhatsApp webhook is active"}`
- Check Twilio Console logs for webhook errors

## Quick Test Script

After setting up, test with:

```bash
# Test webhook endpoint directly
curl https://your-url/api/webhooks/whatsapp

# Should return:
# {"status":"ok","message":"WhatsApp webhook is active"}
```

## Next Steps

1. ✅ Update the webhook URL in Twilio Console
2. ✅ Save the configuration
3. ✅ Test with a WhatsApp message
4. ✅ Verify you get smart responses (not echoes)
5. ✅ Customize responses in `/app/api/webhooks/whatsapp/route.ts`

