# Supabase Functions & RPCs Documentation

## Overview

This document provides comprehensive documentation for all Supabase Edge Functions and RPC (Remote Procedure Call) functions in the Contract Management System.

## Edge Functions

### 1. export-contract

**Purpose**: Handles contract export requests with structured error handling and multiple export methods.

**Location**: `supabase/functions/export-contract/index.ts`

**Trigger**: Manual invocation via HTTP POST

**Input**:
```typescript
interface ExportRequest {
  contractId: string
  contractType?: string
  exportMethod?: 'puppeteer' | 'makecom' | 'google_docs'
  options?: {
    includeImages?: boolean
    highQuality?: boolean
    watermark?: boolean
  }
}
```

**Output**:
```typescript
interface ExportSuccess {
  success: true
  contractId: string
  contractNumber: string
  pdfUrl: string
  googleDriveUrl?: string
  exportMethod: 'puppeteer' | 'makecom' | 'google_docs'
  timestamp: string
  processingTime: number
}

interface ExportError {
  code: ExportErrorCode
  message: string
  details?: Record<string, any>
  actionable?: boolean
  retryable?: boolean
  suggestions?: string[]
}
```

**Error Codes**:
- `INVALID_CONTRACT_ID`: Contract ID is missing or invalid
- `MISSING_REQUIRED_FIELDS`: Required contract fields are missing
- `TEMPLATE_NOT_FOUND`: Contract template not found
- `PDF_GENERATION_FAILED`: PDF generation process failed
- `RATE_LIMIT_ERROR`: Rate limit exceeded

**Usage Example**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/export-contract \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "uuid",
    "exportMethod": "puppeteer",
    "options": {
      "highQuality": true
    }
  }'
```

### 2. remind-pending-approvals

**Purpose**: Automated approval reminders and escalations for pending contracts.

**Location**: `supabase/functions/remind-pending-approvals/index.ts`

**Trigger**: Scheduled via pg_cron (hourly)

**Configuration**:
- Reminder threshold: 48 hours
- Escalation threshold: 120 hours (5 days)
- Max reminders per contract: 3

**Input**: None (automated execution)

**Output**:
```typescript
interface ReminderResult {
  success: boolean
  processed: number
  remindersSent: number
  escalationsSent: number
  skipped: number
  results: Array<{
    contractId: string
    contractNumber: string
    action: 'reminder_sent' | 'escalated' | 'skipped'
    recipients: string[]
    emailSent: boolean
  }>
}
```

**Features**:
- Identifies contracts pending approval beyond threshold
- Sends reminder emails to stakeholders
- Escalates to admin users when thresholds exceeded
- Updates contract status and logs activity

### 3. session-expiry-reminder

**Purpose**: Sends email reminders for user sessions about to expire.

**Location**: `supabase/functions/session-expiry-reminder/index.ts`

**Trigger**: Scheduled via pg_cron (daily)

**Input**: None (automated execution)

**Output**:
```typescript
interface SessionReminderResult {
  success: boolean
  remindersSent: number
  sessionsProcessed: number
  errors: string[]
}
```

**Features**:
- Identifies sessions expiring within 24 hours
- Sends personalized reminder emails
- Updates session status to 'notified'
- Logs reminder activity

### 4. import-promoters-csv

**Purpose**: Handles bulk import of promoter data from CSV files.

**Location**: `supabase/functions/import-promoters-csv/index.ts`

**Trigger**: Manual invocation via HTTP POST

**Input**:
```typescript
interface ImportRequest {
  csvData: string
  options?: {
    skipHeader?: boolean
    validateOnly?: boolean
    updateExisting?: boolean
  }
}
```

**Output**:
```typescript
interface ImportResult {
  success: boolean
  imported: number
  updated: number
  errors: Array<{
    row: number
    field: string
    message: string
  }>
  warnings: string[]
}
```

**Features**:
- CSV parsing and validation
- Data transformation and cleaning
- Duplicate detection and handling
- Comprehensive error reporting

### 5. delete-parties

**Purpose**: Handles bulk deletion of parties with proper cleanup.

**Location**: `supabase/functions/delete-parties/index.ts`

**Trigger**: Manual invocation via HTTP POST

**Input**:
```typescript
interface DeleteRequest {
  partyIds: string[]
  options?: {
    cascade?: boolean
    softDelete?: boolean
  }
}
```

**Output**:
```typescript
interface DeleteResult {
  success: boolean
  deleted: number
  failed: number
  errors: string[]
}
```

**Features**:
- Bulk deletion with transaction safety
- Cascade deletion of related records
- Soft delete option for audit trails
- Permission validation

### 6. pdf-exporter

**Purpose**: Self-contained PDF generation using Puppeteer.

**Location**: `supabase/functions/pdf-exporter/index.ts`

**Trigger**: Manual invocation via HTTP POST

**Input**:
```typescript
interface PDFRequest {
  htmlContent: string
  options?: {
    format?: 'A4' | 'Letter'
    margin?: {
      top?: string
      right?: string
      bottom?: string
      left?: string
    }
    headerTemplate?: string
    footerTemplate?: string
  }
}
```

**Output**:
```typescript
interface PDFResult {
  success: boolean
  pdfUrl: string
  processingTime: number
  error?: string
}
```

**Features**:
- HTML to PDF conversion
- Custom page formatting
- Header/footer templates
- Supabase Storage integration

## RPC Functions

### Contract Management RPCs

#### 1. get_pending_contracts

**Purpose**: Retrieves contracts pending approval that need reminders or escalation.

**Parameters**:
- `reminder_threshold_hours` (INTEGER, DEFAULT 48): Hours after which to send reminders
- `escalation_threshold_hours` (INTEGER, DEFAULT 120): Hours after which to escalate

**Return Type**:
```sql
TABLE (
    id UUID,
    contract_number TEXT,
    contract_type TEXT,
    job_title TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    status TEXT,
    reminder_count INTEGER,
    last_reminder_sent TIMESTAMPTZ,
    assigned_reviewer UUID,
    priority TEXT,
    hours_since_update NUMERIC,
    should_escalate BOOLEAN
)
```

**Usage**:
```sql
SELECT * FROM get_pending_contracts(48, 120);
```

#### 2. get_contract_submissions_over_time

**Purpose**: Analytics function to get contract submission trends over time.

**Parameters**:
- `start_date` (DATE): Start date for analysis
- `end_date` (DATE): End date for analysis
- `group_by` (TEXT, DEFAULT 'day'): Grouping interval ('day', 'week', 'month')

**Return Type**:
```sql
TABLE (
    period_start DATE,
    period_end DATE,
    submission_count INTEGER,
    approval_count INTEGER,
    rejection_count INTEGER,
    avg_processing_time NUMERIC
)
```

**Usage**:
```sql
SELECT * FROM get_contract_submissions_over_time(
    '2024-01-01'::DATE,
    '2024-12-31'::DATE,
    'month'
);
```

#### 3. get_average_approval_time

**Purpose**: Calculates average approval time for contracts by type and status.

**Parameters**:
- `contract_type` (TEXT, OPTIONAL): Filter by contract type
- `status` (TEXT, OPTIONAL): Filter by contract status

**Return Type**:
```sql
TABLE (
    contract_type TEXT,
    status TEXT,
    avg_approval_hours NUMERIC,
    min_approval_hours NUMERIC,
    max_approval_hours NUMERIC,
    contract_count INTEGER
)
```

**Usage**:
```sql
SELECT * FROM get_average_approval_time('employment', 'approved');
```

#### 4. get_contracts_requiring_attention

**Purpose**: Identifies contracts that require immediate attention.

**Parameters**: None

**Return Type**:
```sql
TABLE (
    id UUID,
    contract_number TEXT,
    priority TEXT,
    days_pending INTEGER,
    reminder_count INTEGER,
    attention_reason TEXT
)
```

**Usage**:
```sql
SELECT * FROM get_contracts_requiring_attention();
```

#### 5. update_contract_reminder

**Purpose**: Updates contract reminder count and last reminder timestamp.

**Parameters**:
- `contract_id` (UUID): Contract ID to update
- `reminder_count` (INTEGER): New reminder count

**Return Type**: BOOLEAN (success indicator)

**Usage**:
```sql
SELECT update_contract_reminder('contract-uuid', 2);
```

#### 6. escalate_contract

**Purpose**: Escalates a contract to admin users.

**Parameters**:
- `contract_id` (UUID): Contract ID to escalate
- `escalated_to` (TEXT): Admin email addresses (comma-separated)

**Return Type**: BOOLEAN (success indicator)

**Usage**:
```sql
SELECT escalate_contract('contract-uuid', 'admin1@example.com,admin2@example.com');
```

### Promoter Management RPCs

#### 1. search_parties

**Purpose**: Fuzzy search for parties using trigram similarity.

**Parameters**:
- `search_text` (TEXT): Search query

**Return Type**:
```sql
TABLE (
    id UUID,
    name_en TEXT,
    name_ar TEXT,
    crn TEXT,
    type TEXT,
    similarity NUMERIC
)
```

**Usage**:
```sql
SELECT * FROM search_parties('company name');
```

#### 2. search_parties_with_contacts

**Purpose**: Fuzzy search for parties including their contacts.

**Parameters**:
- `search_text` (TEXT): Search query

**Return Type**:
```sql
TABLE (
    id UUID,
    name_en TEXT,
    name_ar TEXT,
    crn TEXT,
    type TEXT,
    contacts JSONB,
    similarity NUMERIC
)
```

**Usage**:
```sql
SELECT * FROM search_parties_with_contacts('company name');
```

#### 3. get_party_contacts

**Purpose**: Retrieves all contacts for a specific party.

**Parameters**:
- `party_id` (UUID): Party ID

**Return Type**:
```sql
TABLE (
    id UUID,
    name_en TEXT,
    name_ar TEXT,
    email TEXT,
    phone TEXT,
    position TEXT,
    is_primary BOOLEAN
)
```

**Usage**:
```sql
SELECT * FROM get_party_contacts('party-uuid');
```

### Analytics RPCs

#### 1. get_promoter_performance_stats

**Purpose**: Calculates performance statistics for promoters.

**Parameters**:
- `start_date` (DATE, OPTIONAL): Start date for analysis
- `end_date` (DATE, OPTIONAL): End date for analysis

**Return Type**:
```sql
TABLE (
    promoter_id UUID,
    promoter_name TEXT,
    total_contracts INTEGER,
    active_contracts INTEGER,
    avg_contract_value NUMERIC,
    total_earnings NUMERIC,
    performance_score NUMERIC
)
```

**Usage**:
```sql
SELECT * FROM get_promoter_performance_stats('2024-01-01'::DATE, '2024-12-31'::DATE);
```

#### 2. get_contract_analytics

**Purpose**: Comprehensive contract analytics and reporting.

**Parameters**:
- `date_range` (TEXT, DEFAULT '30d'): Date range ('7d', '30d', '90d', '1y')
- `group_by` (TEXT, DEFAULT 'day'): Grouping interval

**Return Type**:
```sql
TABLE (
    period_start DATE,
    period_end DATE,
    contracts_created INTEGER,
    contracts_approved INTEGER,
    contracts_rejected INTEGER,
    avg_approval_time NUMERIC,
    total_contract_value NUMERIC
)
```

**Usage**:
```sql
SELECT * FROM get_contract_analytics('90d', 'week');
```

## Scheduled Jobs (pg_cron)

### 1. Contract Approval Reminders

**Schedule**: `0 * * * *` (Every hour)

**Function**: `remind-pending-approvals`

**Purpose**: Checks for contracts pending approval and sends reminders/escalations.

### 2. Session Expiry Reminders

**Schedule**: `0 9 * * *` (Daily at 9 AM)

**Function**: `session-expiry-reminder`

**Purpose**: Sends email reminders for sessions expiring within 24 hours.

### 3. Email Queue Processing

**Schedule**: `*/5 * * * *` (Every 5 minutes)

**Function**: `process_email_queue()`

**Purpose**: Processes queued emails and sends them via email service.

### 4. System Cleanup

**Schedule**: `0 2 * * *` (Daily at 2 AM)

**Functions**: 
- `cleanup_email_queue()`
- `cleanup_system_activity_log()`

**Purpose**: Cleans up old email queue entries and activity logs.

## Security Considerations

### Authentication
- All Edge Functions require valid JWT tokens
- RPC functions use RLS policies for authorization
- Service role key used for internal operations

### Rate Limiting
- Edge Functions implement rate limiting
- Database queries optimized with proper indexing
- Bulk operations use transactions for consistency

### Error Handling
- Structured error responses with actionable messages
- Comprehensive logging for debugging
- Graceful degradation on failures

## Monitoring & Logging

### Activity Logging
- All Edge Function executions logged
- RPC function calls tracked
- Performance metrics collected

### Error Tracking
- Error codes and messages logged
- Stack traces captured for debugging
- Alert thresholds configured

### Performance Monitoring
- Response times tracked
- Database query performance monitored
- Resource usage metrics collected

## Deployment

### Edge Functions
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy export-contract
```

### Database Migrations
```bash
# Apply migrations
supabase db push

# Reset database
supabase db reset
```

### RPC Functions
- Automatically deployed with migrations
- Version controlled in SQL files
- Tested in staging environment

## Testing

### Edge Function Testing
```bash
# Test locally
supabase functions serve

# Test specific function
curl -X POST http://localhost:54321/functions/v1/export-contract \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contractId": "test-uuid"}'
```

### RPC Function Testing
```sql
-- Test RPC function
SELECT * FROM get_pending_contracts();

-- Test with parameters
SELECT * FROM get_contract_submissions_over_time(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    'week'
);
```

## Troubleshooting

### Common Issues

1. **Edge Function Timeout**
   - Check function execution time
   - Optimize database queries
   - Consider breaking into smaller functions

2. **RPC Function Errors**
   - Verify RLS policies
   - Check parameter types
   - Review function permissions

3. **Migration Failures**
   - Check for conflicting changes
   - Verify migration order
   - Review dependency constraints

### Debug Commands
```bash
# Check function logs
supabase functions logs

# Check database logs
supabase db logs

# Verify RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```