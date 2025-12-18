# Automated Attendance Link Schedules

## Overview

The Automated Attendance Link Schedules system allows managers to configure daily attendance link generation and distribution with professional settings for location, time, and notifications.

## Features

### Schedule Configuration

1. **Basic Settings**
   - Schedule name and description
   - Check-in time (required)
   - Check-out time (optional)
   - Link validity duration (hours)
   - Maximum uses per link

2. **Location Settings**
   - Use pre-configured office locations
   - Search via Google Maps
   - Enter custom GPS coordinates
   - Configure allowed radius (meters)

3. **Schedule Settings**
   - Select active days (Monday-Sunday)
   - Enable/disable check-in link generation
   - Enable/disable check-out link generation

4. **Notification Settings**
   - Email notifications
   - SMS notifications (future)
   - Send before time (minutes before check-in)
   - Target all employees or specific groups

## How It Works

### 1. Create a Schedule

1. Navigate to **HR Management > Automated Schedules**
2. Click **Create Schedule**
3. Configure all settings:
   - **Basic**: Name, times, duration
   - **Location**: Office location or custom coordinates
   - **Schedule**: Active days, link types
   - **Notifications**: Methods, timing, recipients
4. Click **Create Schedule**

### 2. Automated Generation

The system automatically:
- Generates links daily at the configured check-in time
- Sends notifications to employees (email/SMS)
- Tracks generation and notification statistics
- Handles check-in and check-out links separately

### 3. Manual Trigger

Managers can manually trigger link generation:
- Click **Generate Now** on any schedule
- Links are created immediately
- Notifications are sent if configured

## Database Schema

### `attendance_link_schedules`

Stores schedule configurations:
- Location settings (office location or custom coordinates)
- Time settings (check-in/check-out times)
- Day of week settings (Monday-Sunday)
- Notification settings (email/SMS, timing)
- Employee targeting (all or specific)

### `scheduled_attendance_links`

Tracks generated links from schedules:
- Links to parent schedule
- Link type (check-in/check-out)
- Scheduled date and time
- Generation and notification timestamps

## API Endpoints

### Schedule Management

- `GET /api/employer/attendance-schedules` - List all schedules
- `POST /api/employer/attendance-schedules` - Create new schedule
- `GET /api/employer/attendance-schedules/[id]` - Get schedule details
- `PUT /api/employer/attendance-schedules/[id]` - Update schedule
- `DELETE /api/employer/attendance-schedules/[id]` - Delete schedule

### Automated Generation

- `GET /api/cron/generate-attendance-links` - Cron job endpoint

## Cron Job Setup

### Option 1: Vercel Cron

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-attendance-links",
      "schedule": "0 0 * * *"
    }
  ]
}
```

This runs daily at midnight UTC. Adjust the schedule as needed.

### Option 2: External Cron Service

Use services like:
- **cron-job.org**
- **EasyCron**
- **GitHub Actions** (scheduled workflows)

Configure to call:
```
GET https://yourdomain.com/api/cron/generate-attendance-links
Authorization: Bearer YOUR_CRON_SECRET
```

### Option 3: Manual Trigger

Managers can trigger generation manually from the UI.

## Environment Variables

Add to `.env.local`:

```env
CRON_SECRET=your-secure-random-string-here
NEXT_PUBLIC_APP_URL=https://portal.thesmartpro.io
```

## Email Notifications

Email notifications are currently logged to console. To implement:

1. Set up an email service (SendGrid, Resend, etc.)
2. Update `sendEmailNotification` function in `/api/cron/generate-attendance-links/route.ts`
3. Configure email templates

Example with Resend:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'attendance@yourdomain.com',
  to: email,
  subject: `Check-In Link - ${schedule.name}`,
  html: generateEmailTemplate(name, linkUrl, linkType, schedule),
});
```

## SMS Notifications

SMS notifications are currently logged to console. To implement:

1. Set up an SMS service (Twilio, AWS SNS, etc.)
2. Update SMS sending logic in `sendScheduleNotifications`
3. Configure phone number formatting

## Security

- All endpoints require RBAC permissions (`attendance:create:all`, `attendance:read:all`)
- Cron endpoint can be protected with `CRON_SECRET`
- Location verification ensures employees are at the correct location
- Photo capture and device fingerprinting for security

## Best Practices

1. **Schedule Timing**
   - Set check-in time to actual work start time
   - Configure `send_before_minutes` to send links 15-30 minutes early
   - Set link validity duration to cover the entire shift

2. **Location Settings**
   - Use office locations for standard workplaces
   - Use Google Maps search for client sites
   - Set appropriate radius (50-100 meters typically)

3. **Notifications**
   - Use email for reliable delivery
   - Consider SMS for time-sensitive notifications
   - Test notification timing before going live

4. **Monitoring**
   - Check schedule statistics regularly
   - Monitor failed generations
   - Review employee feedback

## Troubleshooting

### Links Not Generated

1. Check schedule is active (`is_active = true`)
2. Verify today is an active day for the schedule
3. Check cron job is running
4. Review server logs for errors

### Notifications Not Sent

1. Verify notification methods are configured
2. Check employee email/phone is valid
3. Review email service configuration
4. Check notification logs

### Location Issues

1. Verify office location coordinates are correct
2. Check allowed radius is appropriate
3. Test location picker functionality
4. Review location verification logs

## Future Enhancements

- [ ] SMS integration (Twilio, AWS SNS)
- [ ] Email templates customization
- [ ] Team/group targeting
- [ ] Schedule templates
- [ ] Analytics and reporting
- [ ] Mobile app notifications
- [ ] Multi-language support

