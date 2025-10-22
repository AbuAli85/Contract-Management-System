# Automated Document Compliance Monitoring Setup

## Overview

This guide explains how to set up automated document compliance monitoring for your Contract Management System. The system will check promoter documents daily and send alerts for expirations.

## How It Works

The document monitoring system:
1. **Checks all promoter documents** (ID cards, passports) daily
2. **Categorizes by urgency**:
   - 🚨 **Critical**: Expired documents
   - ⚠️ **Urgent**: Expiring within 7 days
   - 📋 **Warning**: Expiring within 30 days
3. **Sends notifications** to promoters and admins
4. **Updates compliance dashboard** with latest data

## Setup Options

### Option 1: Vercel Cron Jobs (Recommended for Vercel Deployments)

If deployed on Vercel, use Vercel Cron Jobs:

**1. Create `vercel.json` in project root:**

```json
{
  "crons": [
    {
      "path": "/api/cron/document-check",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**2. Create the cron endpoint:**

```bash
# File: app/api/cron/document-check/route.ts
```

```typescript
import { NextResponse } from 'next/server';
import { scheduledDocumentCheck } from '@/lib/document-monitor';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const report = await scheduledDocumentCheck();
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

**3. Set environment variable:**

```bash
CRON_SECRET=your-random-secret-key-here
```

**4. Deploy to Vercel:**

```bash
vercel --prod
```

The cron job will run automatically at 9 AM UTC daily.

### Option 2: Node-Cron (For Self-Hosted Deployments)

**1. Install node-cron:**

```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

**2. Create cron service:**

```typescript
// services/cron-service.ts
import cron from 'node-cron';
import { scheduledDocumentCheck } from '@/lib/document-monitor';

export function startCronJobs() {
  // Run daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('🕐 Running scheduled document compliance check...');
    try {
      await scheduledDocumentCheck();
    } catch (error) {
      console.error('❌ Scheduled document check failed:', error);
    }
  });

  console.log('✅ Cron jobs started');
}
```

**3. Initialize in your server:**

```typescript
// server.ts or app startup
import { startCronJobs } from './services/cron-service';

// Start cron jobs when server starts
startCronJobs();
```

### Option 3: External Cron Services (EasyCron, cron-job.org)

**1. Create a protected API endpoint:**

```typescript
// app/api/cron/document-check/route.ts
import { NextResponse } from 'next/server';
import { scheduledDocumentCheck } from '@/lib/document-monitor';

export async function GET(request: Request) {
  const apiKey = request.headers.get('x-api-key');
  
  if (apiKey !== process.env.CRON_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const report = await scheduledDocumentCheck();
  return NextResponse.json({ success: true, report });
}
```

**2. Set up external cron:**

- **EasyCron**: https://www.easycron.com/
- **cron-job.org**: https://cron-job.org/

Configure to call:
```
GET https://yourdomain.com/api/cron/document-check
Headers: x-api-key: your-secret-key
Schedule: Daily at 9:00 AM
```

## Cron Schedule Examples

```bash
# Every day at 9 AM
0 9 * * *

# Every Monday at 8 AM
0 8 * * 1

# Twice daily (9 AM and 5 PM)
0 9,17 * * *

# Every hour during business hours (9 AM - 5 PM)
0 9-17 * * *

# First day of every month at midnight
0 0 1 * *
```

## Manual Trigger

You can also manually trigger document checks from the compliance dashboard:

1. Go to `/en/compliance`
2. Click "Send Alerts" button
3. System will check all documents and send notifications

Or via API:

```bash
curl -X POST https://yourdomain.com/api/compliance/documents/send-alerts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notification Integration

### Email Notifications

Update `lib/document-monitor.ts` to integrate with your email service:

```typescript
// Example: SendGrid
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

private async sendAlert(alert: DocumentAlert): Promise<void> {
  const msg = {
    to: alert.promoterEmail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `${alert.severity === 'critical' ? 'URGENT: ' : ''}Document Expiring`,
    html: `
      <h2>Document Expiration Alert</h2>
      <p>Your ${alert.documentType} ${alert.status === 'expired' ? 'has expired' : `expires in ${alert.daysUntilExpiry} days`}.</p>
      <p>Please renew it as soon as possible.</p>
    `
  };
  
  await sgMail.send(msg);
}
```

### SMS Notifications

```typescript
// Example: Twilio
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

if (alert.severity === 'critical') {
  await client.messages.create({
    body: `URGENT: Your ${alert.documentType} has expired. Please renew immediately.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: promoter.phoneNumber
  });
}
```

### In-App Notifications

```typescript
// Store in database for in-app display
await supabase.from('notifications').insert({
  user_id: alert.promoterId,
  type: 'DOCUMENT_EXPIRY',
  title: `${alert.documentType} ${alert.status === 'expired' ? 'Expired' : 'Expiring Soon'}`,
  message: `Your document ${alert.status === 'expired' ? 'expired' : `expires in ${alert.daysUntilExpiry} days`}`,
  severity: alert.severity,
  action_url: `/en/promoters/${alert.promoterId}/documents`,
  read: false,
  created_at: new Date().toISOString()
});
```

## Environment Variables

Add to your `.env` file:

```bash
# Cron Job Security
CRON_SECRET=your-random-secret-key
CRON_API_KEY=another-random-key

# Email Service (example: SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# SMS Service (example: Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Admin Notifications
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PHONE=+1234567890
```

## Monitoring & Logs

### Check Logs

```bash
# Vercel
vercel logs --follow

# Self-hosted
pm2 logs your-app-name
```

### Health Check

Create a monitoring endpoint:

```typescript
// app/api/health/cron/route.ts
export async function GET() {
  const lastRun = await getLastCronRun(); // Implement this
  const nextRun = calculateNextRun();
  
  return Response.json({
    status: 'healthy',
    lastRun,
    nextRun,
    isOverdue: isOverdue(lastRun)
  });
}
```

## Testing

### Test Locally

```bash
# Call the scheduled function directly
curl http://localhost:3000/api/cron/document-check \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Email Sending

```typescript
// Create a test script
import { DocumentMonitor } from './lib/document-monitor';

async function test() {
  const monitor = new DocumentMonitor();
  const report = await monitor.checkExpirations();
  console.log('Report:', report);
  
  if (report.alerts.critical.length > 0) {
    await monitor.sendAlerts(report);
  }
}

test();
```

## Troubleshooting

### Cron Job Not Running

1. **Check Vercel dashboard** for cron execution logs
2. **Verify CRON_SECRET** environment variable is set
3. **Check time zone** - Vercel crons run in UTC
4. **Review logs** for errors

### Notifications Not Sending

1. **Verify API keys** for email/SMS services
2. **Check rate limits** on notification services
3. **Test individual functions** separately
4. **Review error logs** in notification code

### Incorrect Compliance Data

1. **Check database** for correct expiry dates
2. **Verify timezone handling** in date calculations
3. **Test calculation logic** with sample data
4. **Refresh compliance dashboard** to ensure latest data

## Best Practices

1. **Start with email only** - Add SMS later for critical alerts
2. **Monitor costs** - Track notification service usage
3. **Rate limiting** - Don't spam users with too many alerts
4. **Escalation** - Different urgency levels get different treatment
5. **Logging** - Log all cron runs for audit trail
6. **Testing** - Test in staging environment first

## Cost Estimates

| Service | Free Tier | Cost |
|---------|-----------|------|
| **Vercel Cron** | Included | Free with plan |
| **SendGrid Email** | 100/day | $0 - $20/month |
| **Twilio SMS** | Trial only | $0.0075/SMS |
| **Node-cron** | N/A | Free (self-hosted) |

## Next Steps

1. ✅ Choose deployment option (Vercel, self-hosted, external)
2. ✅ Set up cron schedule
3. ✅ Configure notification services
4. ✅ Test in staging environment
5. ✅ Deploy to production
6. ✅ Monitor first few runs
7. ✅ Optimize based on feedback

---

**Questions?** Check the [main documentation](./PROMOTER_METRICS_FIX.md) or [compliance guide](./DOCUMENT_COMPLIANCE.md).

