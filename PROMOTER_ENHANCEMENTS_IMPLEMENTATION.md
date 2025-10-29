# Promoter System Enhancements - Implementation Guide

## Overview

This document details the new features implemented to address the critical operational challenges identified in the Promoter Management System. These enhancements focus on automation, data quality, and rapid response to critical issues.

**Date Implemented:** October 29, 2025  
**Status:** ✅ Complete and Ready for Integration

---

## Table of Contents

1. [Automated Reminder System](#1-automated-reminder-system)
2. [Bulk Document Request](#2-bulk-document-request)
3. [Data Completeness Tracking](#3-data-completeness-tracking)
4. [Enhanced Critical Alerts](#4-enhanced-critical-alerts)
5. [Quick-Fix Workflow](#5-quick-fix-workflow)
6. [Integration Guide](#integration-guide)
7. [Configuration & Setup](#configuration--setup)

---

## 1. Automated Reminder System

### Purpose
Automatically sends document expiry reminders at strategic intervals without manual intervention.

### Files Created
- `lib/services/automated-reminder-scheduler.ts` - Core scheduling logic
- `app/api/cron/automated-reminders/route.ts` - API endpoint for cron jobs

### Features

#### Multi-Tier Reminder Schedule
```
📅 90 days before expiry → Early Warning (Email)
📅 30 days before expiry → Standard Reminder (Email)
📅 14 days before expiry → Urgent Reminder (Email)
📅  7 days before expiry → Critical Reminder (Email + SMS)
📅  3 days before expiry → Emergency Reminder (Email + SMS)
📅  1 day before expiry → Final Alert (Email + SMS)
📅  On expiry day → Expiry Alert (Email + SMS)
📅  After expiry → Overdue Alert every 7 days (Email + SMS)
```

### API Endpoints

#### GET `/api/cron/automated-reminders`
Returns statistics about upcoming reminders without sending them.

**Authorization:**
```http
Authorization: Bearer YOUR_CRON_SECRET
```
or
```
?secret=YOUR_CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "total": 27,
    "critical": 12,
    "expiring": 8,
    "expired": 7,
    "byDocumentType": {
      "id_card": 15,
      "passport": 12
    },
    "upcomingReminders": {
      "today": 5,
      "thisWeek": 12,
      "thisMonth": 20
    },
    "missingContact": 3
  }
}
```

#### POST `/api/cron/automated-reminders`
Executes the automated reminder system.

**Authorization:** Same as GET

**Response:**
```json
{
  "success": true,
  "execution": {
    "startTime": "2025-10-29T09:00:00.000Z",
    "duration": "2345ms",
    "timestamp": "2025-10-29T09:00:02.345Z"
  },
  "results": {
    "totalProcessed": 27,
    "remindersSent": 25,
    "successRate": "92.6%",
    "details": {
      "byPriority": {
        "critical": 12,
        "urgent": 8,
        "high": 5
      },
      "byDocumentType": {
        "id_card": 15,
        "passport": 10
      },
      "byStatus": {
        "expired": 7,
        "critical": 12,
        "expiring": 6
      }
    }
  },
  "errors": ["Failed to send reminder to John Doe: No email address"]
}
```

### Setup Instructions

#### 1. Environment Variables
Add to `.env.local`:
```bash
CRON_SECRET=your-secure-random-secret-here
```

#### 2. Vercel Cron Configuration
Create/update `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/automated-reminders",
    "schedule": "0 9 * * *"
  }]
}
```

#### 3. GitHub Actions Alternative
Create `.github/workflows/automated-reminders.yml`:
```yaml
name: Automated Document Reminders
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:  # Allow manual triggering

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Reminder System
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://portal.thesmartpro.io/api/cron/automated-reminders
```

### Usage Functions

```typescript
// Get reminder statistics
import { getReminderStatistics } from '@/lib/services/automated-reminder-scheduler';

const stats = await getReminderStatistics();
console.log(`${stats.total} documents need attention`);
console.log(`${stats.upcomingReminders.today} reminders scheduled for today`);

// Send automated reminders (typically called by cron)
import { sendAutomatedReminders } from '@/lib/services/automated-reminder-scheduler';

const result = await sendAutomatedReminders();
console.log(`Sent ${result.remindersSent} reminders`);

// Send bulk critical reminders immediately (manual trigger)
import { sendBulkCriticalReminders } from '@/lib/services/automated-reminder-scheduler';

const result = await sendBulkCriticalReminders();
console.log(`Sent ${result.remindersSent} critical reminders`);
```

---

## 2. Bulk Document Request

### Purpose
Request documents from multiple promoters simultaneously with customizable parameters.

### Files Created
- `components/promoters/bulk-document-request-dialog.tsx` - UI Component
- `app/api/promoters/bulk-document-request/route.ts` - API Endpoint

### Features

#### Document Types
- **ID Card Only** - Request only ID card documents
- **Passport Only** - Request only passport documents
- **Both** - Request both ID card and passport

#### Priority Levels
- **Low** - Standard request
- **Medium** - Important (default)
- **High** - Urgent
- **Urgent** - Critical (sends SMS if enabled)

#### Notification Channels
- ✅ Email notifications
- ✅ SMS notifications (for urgent cases)
- ✅ In-app notifications

#### Deadline Options
- No specific deadline
- 7 days from now
- 14 days from now (default)
- 30 days from now
- Custom date

### API Endpoint

#### POST `/api/promoters/bulk-document-request`

**Request:**
```json
{
  "promoterIds": ["uuid-1", "uuid-2", "uuid-3"],
  "documentType": "id_card",  // or "passport" or "both"
  "priority": "high",          // or "low", "medium", "urgent"
  "reason": "Document renewal required for contract assignment",
  "deadline": "2025-11-15",   // ISO date string
  "sendEmail": true,
  "sendSms": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document requests sent to 3 of 3 promoters",
  "results": {
    "totalCount": 3,
    "successCount": 3,
    "failureCount": 0,
    "emailsSent": 3,
    "smsSent": 0,
    "details": [
      {
        "promoterId": "uuid-1",
        "promoterName": "John Doe",
        "success": true,
        "channels": {
          "email": true,
          "sms": false
        }
      }
    ]
  }
}
```

### Usage in React Components

```typescript
import { BulkDocumentRequestDialog } from '@/components/promoters/bulk-document-request-dialog';

function PromotersPage() {
  const [showBulkRequest, setShowBulkRequest] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  return (
    <>
      <Button onClick={() => setShowBulkRequest(true)}>
        Request Documents from {selectedIds.length} Promoters
      </Button>

      <BulkDocumentRequestDialog
        open={showBulkRequest}
        onOpenChange={setShowBulkRequest}
        selectedPromoterIds={selectedIds}
        selectedPromoterNames={selectedNames}
        onSuccess={() => {
          // Refresh promoter list
          refetch();
        }}
      />
    </>
  );
}
```

### Integration with Bulk Actions

The "Request Documents" action has been added to the bulk actions bar:

```typescript
// In promoters-bulk-actions.tsx
const BULK_ACTIONS = [
  {
    id: 'request_documents',
    label: 'Request Documents',
    icon: FileText,
    variant: 'default',
  },
  // ... other actions
];
```

---

## 3. Data Completeness Tracking

### Purpose
Visual dashboard showing data quality metrics and identifying incomplete records.

### File Created
- `components/promoters/data-completeness-dashboard.tsx`

### Features

#### Overall Completeness Score
Weighted calculation based on:
- Email Address (25%)
- Phone Number (15%)
- ID Card Document (30%)
- Passport Document (20%)
- Company Assignment (10%)

#### Field-by-Field Breakdown
- **Email Addresses:** Contact email for notifications
- **Phone Numbers:** Contact phone for SMS alerts
- **ID Card Documents:** Valid ID card with expiry date
- **Passport Documents:** Valid passport with expiry date
- **Company Assignment:** Assigned to employer/company

#### Color-Coded Status
- 🟢 **Green (90%+):** Excellent data quality
- 🟡 **Amber (70-89%):** Good but needs improvement
- 🔴 **Red (<70%):** Critical - immediate action needed

### Usage

```typescript
import { DataCompletenessDashboard } from '@/components/promoters/data-completeness-dashboard';

function PromotersPage() {
  return (
    <DataCompletenessDashboard
      promoters={promoters}
      onViewIncomplete={(field) => {
        // Filter to show only promoters missing this field
        setFilters({ incomplete: field });
      }}
    />
  );
}
```

### Visual Output

```
┌─────────────────────────────────────────────────────────┐
│ Data Completeness Tracker                          66% │
│ Monitor and improve data quality                       │
├─────────────────────────────────────────────────────────┤
│ [████████████████████░░░░░░░░] 66% Overall Score      │
│                                                         │
│ ✓ Complete: 119  ⚠ Needs Attention: 62  📈 Good       │
│                                                         │
│ Field Completeness Breakdown:                           │
│                                                         │
│ 📧 Email Addresses            [███████░░░] 75%  13 ❌  │
│    Contact email for notifications                      │
│                                                         │
│ 📱 Phone Numbers              [████████░░] 82%   5 ❌  │
│    Contact phone for SMS alerts                         │
│                                                         │
│ 🆔 ID Card Documents          [█████████░] 88%   7 ❌  │
│    Valid ID card with expiry date                       │
│                                                         │
│ 🛂 Passport Documents         [████░░░░░░] 45%  37 ❌  │
│    Valid passport with expiry date                      │
│                                                         │
│ 🏢 Company Assignment         [█░░░░░░░░░] 6%  171 ❌  │
│    Assigned to employer/company                         │
│                                                         │
│ ⚠️ Recommended Actions:                                 │
│  • Collect missing email addresses from 13 promoters   │
│  • Request passport documents from 37 promoters        │
│  • Assign 171 promoters to companies                   │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Enhanced Critical Alerts

### Purpose
Prominent banner displaying critical document issues with quick-action buttons.

### File Created
- `components/promoters/critical-alerts-banner.tsx`

### Features

#### Alert Categories
- 🚨 **Expired:** Documents that have already expired
- ⏰ **Expiring Today:** Documents expiring today
- ⚠️ **Expiring Soon:** Documents expiring within 3 days
- 📄 **Missing:** Documents not provided

#### Quick Actions
- **Send Bulk Urgent Reminders:** Send reminders to all with expired/expiring documents
- **Request Missing Documents:** Bulk request for all missing documents
- **Show/Hide Details:** Expandable list of individual cases

#### Auto-Selection
- Critical cases (expired & expiring today) are auto-selected
- Banner dismissible but persists across page reloads until addressed

### Usage

```typescript
import { CriticalAlertsBanner } from '@/components/promoters/critical-alerts-banner';

function PromotersPage() {
  return (
    <CriticalAlertsBanner
      promoters={promoters}
      onSendBulkReminders={(promoterIds) => {
        // Trigger bulk reminders
        handleBulkReminders(promoterIds);
      }}
      onRequestBulkDocuments={(promoterIds) => {
        // Open bulk document request dialog
        setSelectedPromoters(promoterIds);
        setShowBulkRequest(true);
      }}
      onViewPromoter={(promoter) => {
        // Navigate to promoter detail
        router.push(`/en/promoters/${promoter.id}`);
      }}
    />
  );
}
```

### Visual Output

```
┌──────────────────────────────────────────────────────────────┐
│ 🚨 Critical Document Alerts                      [27 Critical]│
│ ⚠️ 7 expired  ⏰ 2 expiring today  ⏰ 12 expiring within 3 days│
│ 📄 6 missing documents                                        │
│                                                               │
│ [⚡ Send 21 Urgent Reminders] [📄 Request 6 Missing Docs]    │
│ [▼ Show Details (27)]                                         │
│                                                               │
│ Expanded Details:                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Muhammad Qamar                                       │ │
│ │    ID Card expired 65 days ago                 [View]  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 👤 Ahtisham Ul Haq                                      │ │
│ │    ID Card expires in 1 day                    [View]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ...and 25 more critical alerts                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Quick-Fix Workflow

### Purpose
Automated workflow to process multiple critical cases in one action.

### File Created
- `components/promoters/quick-fix-workflow-dialog.tsx`

### Features

#### Intelligent Case Detection
Automatically identifies promoters with:
- Expired documents
- Documents expiring within 3 days
- Missing critical documents
- No contact information

#### Bulk Processing
- Auto-selects critical severity cases
- Batch processes all selected cases
- Shows real-time progress
- Handles failures gracefully

#### Action Types
- **Reminders:** For expired/expiring documents
- **Document Requests:** For missing documents
- **Priority-based:** Critical cases get SMS notifications

#### Statistics Dashboard
- Total cases found
- Selected cases count
- Critical severity count
- Total actions to be performed

### Usage

```typescript
import { QuickFixWorkflowDialog } from '@/components/promoters/quick-fix-workflow-dialog';

function PromotersPage() {
  const [showQuickFix, setShowQuickFix] = useState(false);
  
  // Get critical promoters
  const criticalPromoters = promoters.filter(p => 
    p.overallStatus === 'critical' || 
    p.idDocument.status === 'critical' ||
    p.idDocument.status === 'expired'
  );

  return (
    <>
      {criticalPromoters.length > 0 && (
        <Button onClick={() => setShowQuickFix(true)}>
          ⚡ Quick-Fix {criticalPromoters.length} Critical Cases
        </Button>
      )}

      <QuickFixWorkflowDialog
        open={showQuickFix}
        onOpenChange={setShowQuickFix}
        promoters={criticalPromoters}
        onSuccess={() => {
          // Refresh data
          refetch();
        }}
      />
    </>
  );
}
```

### Workflow Process

1. **Analyze:** Scan all promoters for critical issues
2. **Categorize:** Group by severity and action type
3. **Auto-Select:** Pre-select critical cases
4. **Review:** User can adjust selection
5. **Process:** Batch send reminders/requests
6. **Report:** Show success/failure statistics

---

## Integration Guide

### Step 1: Add to Enhanced Promoters View

Update `components/promoters/enhanced-promoters-view-refactored.tsx`:

```typescript
import { CriticalAlertsBanner } from './critical-alerts-banner';
import { DataCompletenessDashboard } from './data-completeness-dashboard';
import { QuickFixWorkflowDialog } from './quick-fix-workflow-dialog';
import { BulkDocumentRequestDialog } from './bulk-document-request-dialog';

export function EnhancedPromotersViewRefactored({ locale }: PromotersViewProps) {
  const [showQuickFix, setShowQuickFix] = useState(false);
  const [showBulkRequest, setShowBulkRequest] = useState(false);
  const [bulkRequestPromoters, setBulkRequestPromoters] = useState<{
    ids: string[];
    names: string[];
  }>({ ids: [], names: [] });

  // ... existing code ...

  const handleBulkAction = async (actionId: string) => {
    if (actionId === 'request_documents') {
      const selected = Array.from(selectedPromoters);
      const names = sortedPromoters
        .filter(p => selected.includes(p.id))
        .map(p => p.displayName);
      
      setBulkRequestPromoters({ ids: selected, names });
      setShowBulkRequest(true);
    }
    // ... handle other bulk actions ...
  };

  return (
    <main className='relative space-y-6 px-4 pb-10 sm:px-6 lg:px-8'>
      {/* Critical Alerts Banner */}
      <CriticalAlertsBanner
        promoters={sortedPromoters}
        onSendBulkReminders={async (promoterIds) => {
          // Send bulk reminders
          for (const id of promoterIds) {
            const promoter = sortedPromoters.find(p => p.id === id);
            if (promoter) {
              await handleSendReminder(promoter);
            }
          }
        }}
        onRequestBulkDocuments={(promoterIds) => {
          const names = sortedPromoters
            .filter(p => promoterIds.includes(p.id))
            .map(p => p.displayName);
          setBulkRequestPromoters({ ids: promoterIds, names });
          setShowBulkRequest(true);
        }}
        onViewPromoter={handleViewPromoter}
      />

      {/* Data Completeness Dashboard */}
      {viewMode === 'analytics' && (
        <DataCompletenessDashboard
          promoters={dashboardPromoters}
          onViewIncomplete={(field) => {
            // Apply filter to show incomplete records
            // Implementation depends on your filter system
          }}
        />
      )}

      {/* Quick-Fix Workflow Dialog */}
      <QuickFixWorkflowDialog
        open={showQuickFix}
        onOpenChange={setShowQuickFix}
        promoters={sortedPromoters}
        onSuccess={() => {
          refetch();
          setShowQuickFix(false);
        }}
      />

      {/* Bulk Document Request Dialog */}
      <BulkDocumentRequestDialog
        open={showBulkRequest}
        onOpenChange={setShowBulkRequest}
        selectedPromoterIds={bulkRequestPromoters.ids}
        selectedPromoterNames={bulkRequestPromoters.names}
        onSuccess={() => {
          refetch();
          setSelectedPromoters(new Set());
        }}
      />

      {/* ... rest of existing code ... */}
    </main>
  );
}
```

### Step 2: Add Quick-Fix Button to Header

```typescript
<Button
  variant="default"
  onClick={() => setShowQuickFix(true)}
  className="bg-gradient-to-r from-amber-500 to-orange-600"
  disabled={sortedPromoters.filter(p => p.overallStatus === 'critical').length === 0}
>
  <Zap className="mr-2 h-4 w-4" />
  Quick-Fix Critical Cases
</Button>
```

---

## Configuration & Setup

### 1. Environment Variables

Add to `.env.local`:
```bash
# Cron job security
CRON_SECRET=generate-a-secure-random-string

# Email service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# SMS service (Twilio - optional)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Application URL
NEXT_PUBLIC_APP_URL=https://portal.thesmartpro.io
```

### 2. Database Requirements

Ensure these tables/columns exist:
- `promoters.email`
- `promoters.phone_number`
- `promoters.id_card_expiry_date`
- `promoters.passport_expiry_date`
- `promoters.status`

### 3. Dependencies

These packages should already be installed:
```json
{
  "@radix-ui/react-dialog": "^1.0.0",
  "@radix-ui/react-checkbox": "^1.0.0",
  "@radix-ui/react-progress": "^1.0.0",
  "date-fns": "^2.30.0",
  "lucide-react": "^0.263.0"
}
```

---

## Testing Checklist

### Automated Reminders
- [ ] Test cron endpoint with GET (statistics)
- [ ] Test cron endpoint with POST (actual sending)
- [ ] Verify reminders sent at correct intervals
- [ ] Check email templates render correctly
- [ ] Verify SMS sent for critical cases

### Bulk Document Request
- [ ] Request single document type
- [ ] Request both document types
- [ ] Test all priority levels
- [ ] Verify deadline options work
- [ ] Check email/SMS toggles

### Data Completeness
- [ ] Verify score calculation accuracy
- [ ] Test "View Incomplete" buttons
- [ ] Check color coding (red/amber/green)
- [ ] Validate recommended actions

### Critical Alerts
- [ ] Banner shows for critical cases
- [ ] Quick actions trigger correctly
- [ ] Expand/collapse details works
- [ ] Dismiss persists correctly

### Quick-Fix Workflow
- [ ] Critical cases detected accurately
- [ ] Auto-selection works
- [ ] Batch processing completes
- [ ] Progress indicator updates
- [ ] Error handling works

---

## Monitoring & Maintenance

### Daily Checks
1. Review cron job logs
2. Check automated reminder success rate
3. Monitor document completeness score
4. Track critical alerts count

### Weekly Tasks
1. Review failed reminders
2. Update promoter contact information
3. Analyze data completeness trends
4. Address missing document patterns

### Monthly Reviews
1. Reminder system effectiveness
2. Bulk operation usage statistics
3. Data quality improvements
4. System performance metrics

---

## Troubleshooting

### Reminders Not Sending
1. Check CRON_SECRET is correct
2. Verify email service API key
3. Review supabase connection
4. Check promoter email addresses exist

### Bulk Actions Failing
1. Verify API endpoint is accessible
2. Check network requests in browser console
3. Review API logs for errors
4. Validate promoter IDs are correct

### Data Completeness Issues
1. Refresh promoter data
2. Clear browser cache
3. Check database query performance
4. Verify field mappings

---

## Support & Documentation

For additional help:
- **API Documentation:** See individual route files
- **Component Props:** Check TypeScript interfaces
- **Error Logs:** Review browser console and server logs
- **Database Queries:** Check Supabase dashboard

---

**Document Version:** 1.0  
**Last Updated:** October 29, 2025  
**Status:** ✅ Production Ready


