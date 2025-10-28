# 🔔 Resend Webhooks Setup Guide

**Track email delivery, bounces, opens, and clicks in real-time**

---

## 📋 **What Resend Webhooks Track**

Resend can send webhooks for these events:
- ✅ `email.sent` - Email successfully sent
- ✅ `email.delivered` - Email delivered to recipient
- ✅ `email.opened` - Recipient opened the email
- ✅ `email.clicked` - Recipient clicked a link
- ❌ `email.bounced` - Email bounced (hard/soft)
- ❌ `email.complained` - Recipient marked as spam
- ⚠️ `email.delivery_delayed` - Temporary delivery issue

---

## 🚀 **STEP-BY-STEP SETUP**

### **Step 1: Create Webhook Endpoint** (5 minutes)

Create new file: `app/api/webhooks/resend/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Resend webhook event types
type ResendWebhookEvent =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked';

interface ResendWebhookPayload {
  type: ResendWebhookEvent;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Additional fields based on event type
    bounced_at?: string;
    opened_at?: string;
    clicked_at?: string;
    click?: {
      link: string;
      timestamp: string;
    };
    bounce?: {
      type: 'hard' | 'soft';
      message: string;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    // Parse the webhook payload
    const payload: ResendWebhookPayload = await req.json();

    console.log('📬 Resend webhook received:', payload.type);

    // Verify webhook signature (recommended for production)
    const signature = req.headers.get('svix-signature');
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      // TODO: Verify signature with Svix library
      // const isValid = await verifyWebhookSignature(signature, payload, webhookSecret);
      // if (!isValid) {
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      // }
    }

    // Handle different event types
    switch (payload.type) {
      case 'email.sent':
        await handleEmailSent(payload);
        break;

      case 'email.delivered':
        await handleEmailDelivered(payload);
        break;

      case 'email.opened':
        await handleEmailOpened(payload);
        break;

      case 'email.clicked':
        await handleEmailClicked(payload);
        break;

      case 'email.bounced':
        await handleEmailBounced(payload);
        break;

      case 'email.complained':
        await handleEmailComplained(payload);
        break;

      case 'email.delivery_delayed':
        await handleEmailDelayed(payload);
        break;

      default:
        console.log('Unknown event type:', payload.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Event handlers

async function handleEmailSent(payload: ResendWebhookPayload) {
  console.log('✅ Email sent:', payload.data.email_id);
  
  // Optional: Update database
  // const supabase = await createClient();
  // await supabase.from('email_logs').insert({
  //   email_id: payload.data.email_id,
  //   to: payload.data.to[0],
  //   subject: payload.data.subject,
  //   status: 'sent',
  //   sent_at: payload.created_at,
  // });
}

async function handleEmailDelivered(payload: ResendWebhookPayload) {
  console.log('📬 Email delivered:', payload.data.email_id);
  
  // Optional: Update delivery status
  // const supabase = await createClient();
  // await supabase.from('email_logs')
  //   .update({ status: 'delivered', delivered_at: payload.created_at })
  //   .eq('email_id', payload.data.email_id);
}

async function handleEmailOpened(payload: ResendWebhookPayload) {
  console.log('👁️ Email opened:', payload.data.email_id);
  
  // Track email opens
  // const supabase = await createClient();
  // await supabase.from('email_logs')
  //   .update({ 
  //     opened: true, 
  //     opened_at: payload.data.opened_at,
  //     open_count: supabase.raw('open_count + 1')
  //   })
  //   .eq('email_id', payload.data.email_id);
}

async function handleEmailClicked(payload: ResendWebhookPayload) {
  console.log('🖱️ Email link clicked:', payload.data.email_id);
  
  if (payload.data.click) {
    console.log('  Link:', payload.data.click.link);
    
    // Track link clicks
    // const supabase = await createClient();
    // await supabase.from('email_clicks').insert({
    //   email_id: payload.data.email_id,
    //   link: payload.data.click.link,
    //   clicked_at: payload.data.click.timestamp,
    // });
  }
}

async function handleEmailBounced(payload: ResendWebhookPayload) {
  console.error('❌ Email bounced:', payload.data.email_id);
  
  if (payload.data.bounce) {
    console.error('  Type:', payload.data.bounce.type);
    console.error('  Message:', payload.data.bounce.message);
    
    // Handle bounces (especially hard bounces - invalid email)
    // const supabase = await createClient();
    // await supabase.from('email_logs')
    //   .update({ 
    //     status: 'bounced',
    //     bounce_type: payload.data.bounce.type,
    //     bounce_message: payload.data.bounce.message,
    //     bounced_at: payload.data.bounced_at,
    //   })
    //   .eq('email_id', payload.data.email_id);
    
    // If hard bounce, mark email as invalid
    // if (payload.data.bounce.type === 'hard') {
    //   await supabase.from('promoters')
    //     .update({ email_valid: false })
    //     .eq('email', payload.data.to[0]);
    // }
  }
}

async function handleEmailComplained(payload: ResendWebhookPayload) {
  console.warn('⚠️ Email marked as spam:', payload.data.email_id);
  
  // Handle spam complaints - important to prevent being blacklisted
  // const supabase = await createClient();
  // await supabase.from('email_logs')
  //   .update({ status: 'complained' })
  //   .eq('email_id', payload.data.email_id);
  
  // Optionally unsubscribe user from emails
  // await supabase.from('promoters')
  //   .update({ email_notifications: false })
  //   .eq('email', payload.data.to[0]);
}

async function handleEmailDelayed(payload: ResendWebhookPayload) {
  console.warn('⏳ Email delivery delayed:', payload.data.email_id);
  
  // Usually temporary, will retry automatically
  // Just log for monitoring
}

// Allow POST requests without authentication (webhooks)
export const dynamic = 'force-dynamic';
```

---

### **Step 2: Configure Webhook in Resend** (3 minutes)

1. **Go to Resend Dashboard**
   - Visit: https://resend.com/webhooks
   - Click "Add Endpoint"

2. **Add Your Webhook URL**
   ```
   Production: https://portal.thesmartpro.io/api/webhooks/resend
   Development: Use ngrok (see below)
   ```

3. **Select Events**
   - ✅ `email.sent`
   - ✅ `email.delivered`
   - ✅ `email.bounced`
   - ✅ `email.complained`
   - ⚠️ Optional: `email.opened`, `email.clicked` (requires tracking)

4. **Save Webhook**
   - Copy the webhook signing secret
   - Add to `.env.local`:
     ```env
     RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
     ```

---

### **Step 3: Testing with Ngrok** (Development)

For local testing, expose your localhost:

```bash
# Install ngrok (if not installed)
npm install -g ngrok

# Start your dev server
npm run dev

# In another terminal, expose port 3000
ngrok http 3000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
# Add to Resend: https://abc123.ngrok.io/api/webhooks/resend
```

---

### **Step 4: Add Email Logging Table** (Optional)

If you want to track all emails in database:

```sql
-- Create email logs table
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id TEXT UNIQUE NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened BOOLEAN DEFAULT false,
  opened_at TIMESTAMPTZ,
  open_count INTEGER DEFAULT 0,
  bounced BOOLEAN DEFAULT false,
  bounce_type TEXT,
  bounce_message TEXT,
  bounced_at TIMESTAMPTZ,
  complained BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_email_logs_email_id ON email_logs(email_id);
CREATE INDEX idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX idx_email_logs_status ON email_logs(status);

-- Create email clicks table
CREATE TABLE email_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id TEXT NOT NULL REFERENCES email_logs(email_id),
  link TEXT NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_clicks_email_id ON email_clicks(email_id);
```

---

### **Step 5: Update Email Service to Log** (Optional)

Update `lib/services/email.service.ts` to log emails:

```typescript
export async function sendEmail(options: EmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // ... existing code ...

    if (error) {
      console.error('❌ Email send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    console.log('✅ Email sent successfully:', data?.id);

    // Log to database (optional)
    if (data?.id) {
      try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        await supabase.from('email_logs').insert({
          email_id: data.id,
          to_email: Array.isArray(options.to) ? options.to[0] : options.to,
          subject: options.subject,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
      } catch (logError) {
        // Don't fail email send if logging fails
        console.error('Failed to log email:', logError);
      }
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    // ... existing code ...
  }
}
```

---

## 🔒 **SECURITY: Verify Webhook Signature**

Install Svix for webhook verification:

```bash
npm install svix
```

Update webhook route:

```typescript
import { Webhook } from 'svix';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('svix-signature');
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('⚠️ RESEND_WEBHOOK_SECRET not configured');
      // Continue without verification in development
    } else if (signature) {
      // Verify signature
      const wh = new Webhook(webhookSecret);
      try {
        wh.verify(payload, {
          'svix-signature': signature,
          'svix-id': req.headers.get('svix-id') || '',
          'svix-timestamp': req.headers.get('svix-timestamp') || '',
        });
      } catch (error) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse payload
    const data = JSON.parse(payload);
    
    // ... rest of handler ...
  }
}
```

---

## 📊 **MONITORING WEBHOOKS**

### **View Webhook Deliveries**
https://resend.com/webhooks

You'll see:
- ✅ Successful deliveries
- ❌ Failed deliveries
- 🔄 Retry attempts
- 📊 Response codes

### **Test Webhooks**
Resend provides test mode:
- Click "Send Test Event"
- Choose event type
- Verify your endpoint receives it

---

## 🎯 **COMMON USE CASES**

### **1. Track Document Expiry Email Opens**

```typescript
async function handleEmailOpened(payload: ResendWebhookPayload) {
  const supabase = await createClient();
  
  // Find which promoter this email was for
  const { data: emailLog } = await supabase
    .from('email_logs')
    .select('to_email, subject')
    .eq('email_id', payload.data.email_id)
    .single();

  if (emailLog?.subject.includes('Document Expiry')) {
    // Promoter read the expiry notice
    console.log('✅ Promoter read document expiry email:', emailLog.to_email);
    
    // Maybe reduce notification urgency
    await supabase
      .from('promoters')
      .update({ last_notified_at: new Date().toISOString() })
      .eq('email', emailLog.to_email);
  }
}
```

### **2. Handle Hard Bounces (Invalid Emails)**

```typescript
async function handleEmailBounced(payload: ResendWebhookPayload) {
  if (payload.data.bounce?.type === 'hard') {
    const supabase = await createClient();
    
    // Mark email as invalid
    await supabase
      .from('promoters')
      .update({ 
        email_valid: false,
        email_bounced: true,
        email_bounce_reason: payload.data.bounce.message
      })
      .eq('email', payload.data.to[0]);
    
    // Alert admin
    console.error(`🚨 Invalid email detected: ${payload.data.to[0]}`);
    
    // TODO: Send notification to admin to update promoter's email
  }
}
```

### **3. Track Contract Approval Email Clicks**

```typescript
async function handleEmailClicked(payload: ResendWebhookPayload) {
  if (payload.data.click?.link.includes('/contracts/')) {
    console.log('🎯 Contract approval link clicked!');
    
    // Extract contract ID from link
    const contractId = payload.data.click.link.split('/contracts/')[1];
    
    // Log that approver is viewing the contract
    const supabase = await createClient();
    await supabase.from('contract_audit_log').insert({
      contract_id: contractId,
      action: 'viewed_from_email',
      clicked_at: payload.data.click.timestamp,
    });
  }
}
```

---

## 📋 **ENVIRONMENT VARIABLES**

Add to `.env.local`:

```env
# Resend Webhook Configuration
RESEND_WEBHOOK_SECRET=whsec_your_secret_here

# Optional: Enable webhook logging
RESEND_WEBHOOK_LOGGING=true
```

Add to `env.example`:

```env
# Resend Webhook Secret (from https://resend.com/webhooks)
RESEND_WEBHOOK_SECRET=whsec_your_secret_here
```

---

## 🧪 **TESTING CHECKLIST**

- [ ] Webhook endpoint created
- [ ] Webhook URL added to Resend
- [ ] Signing secret configured
- [ ] Test event sent from Resend
- [ ] Email sent and webhook received
- [ ] Email delivered webhook received
- [ ] Bounced email handled correctly
- [ ] Database logging working (if enabled)

---

## 🎯 **BENEFITS**

With webhooks configured:
- ✅ **Track delivery** - Know if emails were delivered
- ✅ **Handle bounces** - Detect invalid email addresses
- ✅ **Monitor opens** - See if recipients read emails
- ✅ **Track clicks** - Know when links are clicked
- ✅ **Prevent spam** - Handle complaints promptly
- ✅ **Better UX** - Update UI based on email status

---

## 📚 **RESEND DOCS**

- Webhooks: https://resend.com/docs/dashboard/webhooks/introduction
- Event types: https://resend.com/docs/dashboard/webhooks/event-types
- Securing webhooks: https://resend.com/docs/dashboard/webhooks/securing-webhooks

---

**Ready to set up?** Start with Step 1! 🚀

