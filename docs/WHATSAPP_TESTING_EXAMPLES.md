# WhatsApp Testing Examples

## ✅ Correct Syntax for Multi-line Messages

### Using Template Literals (Backticks)

```javascript
fetch('/api/test/whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+96879665522',
    message: `hi there
here is from smartpro business hub. How can we assist you?
best regards
SmartPRO`
  })
})
.then(r => r.json())
.then(console.log);
```

### Using Single Line with \n

```javascript
fetch('/api/test/whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+96879665522',
    message: 'hi there\nhere is from smartpro business hub. How can we assist you?\nbest regards\nSmartPRO'
  })
})
.then(r => r.json())
.then(console.log);
```

## Common Test Messages

### Simple Greeting
```javascript
fetch('/api/test/whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+96879665522',
    message: 'Hello! This is a test message from SmartPRO Business Hub.'
  })
})
.then(r => r.json())
.then(console.log);
```

### Business Message
```javascript
fetch('/api/test/whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+96879665522',
    message: `Hi there!

Here is from SmartPRO Business Hub. How can we assist you?

Best regards,
SmartPRO Team`
  })
})
.then(r => r.json())
.then(console.log);
```

### Notification Message
```javascript
fetch('/api/test/whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+96879665522',
    message: '🔔 Notification: Your document will expire in 30 days. Please renew it soon.'
  })
})
.then(r => r.json())
.then(console.log);
```

## Expected Response

```json
{
  "success": true,
  "messageId": "SMec00d0198d192edf0af6e0fef4e49e89",
  "details": {
    "phone": "whatsapp:+96879665522",
    "method": "direct",
    "message": "Your message here"
  }
}
```

## Quick Test Function

Save this in your browser console for easy testing:

```javascript
function testWhatsApp(phone, message) {
  return fetch('/api/test/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message })
  })
  .then(r => r.json())
  .then(result => {
    console.log('✅ WhatsApp sent:', result);
    if (result.success) {
      console.log('📱 Message ID:', result.messageId);
      console.log('📞 Sent to:', result.details.phone);
    } else {
      console.error('❌ Error:', result.error);
    }
    return result;
  });
}

// Usage:
testWhatsApp('+96879665522', 'Hello from SmartPRO!');
testWhatsApp('+96879665522', `Multi-line message
Line 2
Line 3`);
```

## Testing Different Message Types

### Plain Text
```javascript
testWhatsApp('+96879665522', 'Simple text message');
```

### With Emojis
```javascript
testWhatsApp('+96879665522', '✅ Success! 🎉 Your order has been processed.');
```

### Formatted (Multi-line)
```javascript
testWhatsApp('+96879665522', `Dear Customer,

Thank you for your inquiry. We will respond shortly.

Best regards,
SmartPRO Team`);
```

### With Special Characters
```javascript
testWhatsApp('+96879665522', 'Message with special chars: @#$%^&*()');
```

## Troubleshooting

### ❌ Syntax Error: Invalid or unexpected token
- **Cause:** Using single/double quotes for multi-line strings
- **Fix:** Use backticks (`) for template literals

### ❌ Message not received
- Check Twilio Console for delivery status
- Verify phone number format: `+96879665522`
- Ensure sandbox is joined

### ✅ Success but no message
- Wait 5-10 seconds for delivery
- Check WhatsApp on the target phone
- Verify message in Twilio logs

