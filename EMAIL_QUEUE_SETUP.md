# Email Queue Setup Guide

## Overview

The email queue system allows you to queue emails for sending and process them asynchronously. This is useful for:
- Company invitations
- Bulk notifications
- Scheduled emails
- Rate-limited email sending

## How It Works

1. **Queueing**: When an action requires an email (e.g., inviting a user to a company), the email is inserted into the `email_queue` table with status `pending`.

2. **Processing**: A background job (cron or scheduled task) calls the `/api/email/process-queue` endpoint to process pending emails.

3. **Sending**: The processor fetches pending emails, generates email content based on templates, sends them via Resend, and updates the queue status.

## Setup Instructions

### 1. Environment Variables

Ensure these environment variables are set:

```bash
# Required for sending emails
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@portal.thesmartpro.io
RESEND_FROM_NAME=SmartPro Contract Management System

# Required for email queue processing
EMAIL_QUEUE_SECRET=your-secret-key-here  # Used to secure the process-queue endpoint
NEXT_PUBLIC_APP_URL=https://portal.thesmartpro.io
```

### 2. Database Setup

The email queue table should already be created by the migration:
- `supabase/migrations/20250729_create_email_queue_and_cron.sql`

If not, run the migration manually.

### 3. Set Up Cron Job

You have two options:

#### Option A: Use Supabase pg_cron (Recommended for Supabase-hosted databases)

The migration already includes a pg_cron job, but it needs to be updated to call your API endpoint. However, pg_cron runs SQL, not HTTP requests.

**Alternative**: Create a Supabase Edge Function or use an external cron service.

#### Option B: External Cron Service (Recommended)

Use a service like:
- **Vercel Cron Jobs** (if deployed on Vercel)
- **GitHub Actions** (scheduled workflows)
- **cron-job.org** (free external cron service)
- **EasyCron** (external cron service)

**Example: Vercel Cron Job**

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/email/process-queue",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Example: External Cron Service (cron-job.org)**

1. Sign up at https://cron-job.org
2. Create a new cron job:
   - **URL**: `https://portal.thesmartpro.io/api/email/process-queue`
   - **Schedule**: Every 5 minutes (`*/5 * * * *`)
   - **Method**: POST
   - **Headers**: 
     - `Authorization: Bearer your-secret-key-here`
     - `Content-Type: application/json`

**Example: GitHub Actions**

Create `.github/workflows/email-queue.yml`:

```yaml
name: Process Email Queue

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Process Email Queue
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.EMAIL_QUEUE_SECRET }}" \
            -H "Content-Type: application/json" \
            https://portal.thesmartpro.io/api/email/process-queue
```

### 4. Test the Setup

1. **Queue an email**: Invite a user to a company via the UI
2. **Check the queue**: Query the `email_queue` table:
   ```sql
   SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10;
   ```
3. **Trigger processing**: Manually call the endpoint:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer your-secret-key-here" \
     -H "Content-Type: application/json" \
     https://portal.thesmartpro.io/api/email/process-queue
   ```
4. **Verify**: Check that emails were sent and queue status updated:
   ```sql
   SELECT * FROM email_queue WHERE status = 'sent' ORDER BY sent_at DESC LIMIT 10;
   ```

## Email Templates

Currently supported templates:

1. **`company_invitation`**: For existing users added to a company
2. **`company_invitation_new_user`**: For new users invited to a company

### Adding New Templates

1. Add template case in `app/api/email/process-queue/route.ts` → `generateEmailContent()`
2. Use the template name when inserting into `email_queue`
3. Include all necessary data in the `data` JSONB field

## Monitoring

### Check Queue Status

```sql
-- Pending emails
SELECT COUNT(*) FROM email_queue WHERE status = 'pending';

-- Failed emails
SELECT COUNT(*) FROM email_queue WHERE status = 'failed';

-- Recent sent emails
SELECT * FROM email_queue WHERE status = 'sent' ORDER BY sent_at DESC LIMIT 10;

-- Emails with errors
SELECT email, template, error_message, retry_count 
FROM email_queue 
WHERE status = 'failed' OR (status = 'pending' AND retry_count > 0)
ORDER BY updated_at DESC;
```

### Queue Statistics View

The migration creates a view `email_queue_stats`:

```sql
SELECT * FROM email_queue_stats;
```

## Troubleshooting

### Emails Not Sending

1. **Check RESEND_API_KEY**: Ensure it's set and valid
2. **Check queue status**: Query `email_queue` to see if emails are pending
3. **Check cron job**: Verify the cron job is running and calling the endpoint
4. **Check logs**: Look for errors in the API endpoint logs
5. **Check rate limits**: Resend has rate limits (10 emails/second on free tier)

### Authentication Errors

- Ensure `EMAIL_QUEUE_SECRET` matches the Authorization header
- The endpoint expects: `Authorization: Bearer <secret>`

### Template Errors

- Ensure template name matches exactly (case-sensitive)
- Ensure all required data fields are included in the `data` JSONB

## Security Notes

- **Protect the endpoint**: The `/api/email/process-queue` endpoint should be protected with authentication
- **Use HTTPS**: Always use HTTPS for the cron job URL
- **Rotate secrets**: Regularly rotate `EMAIL_QUEUE_SECRET`
- **Monitor access**: Log and monitor access to the endpoint

## Rate Limiting

The processor includes a 100ms delay between emails to avoid rate limits. For higher volumes:
- Adjust the delay in `app/api/email/process-queue/route.ts`
- Consider batching or using Resend's batch API
- Monitor Resend rate limits: https://resend.com/docs/api-reference/rate-limits

