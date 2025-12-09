# Promoter Status System Documentation

## 📋 Overview

This document describes the enhanced promoter status system that provides clear categorization and metrics for workforce management.

## 🎯 Problem Solved

**Before:**

- Dashboard showed: "Active Promoters: 12"
- Promoter Intelligence Hub showed: "Total Promoters: 113, Active Right Now: 95"
- Confusion about what "active" meant
- Inconsistent metrics across different views

**After:**

- Clear status categories with specific definitions
- Consistent metrics across all views
- Dashboard shows:
  - "Active Promoters: 12" (on assignments)
  - "Available: 83" (ready for work)
  - "Total Workforce: 113" (all registered)

## 📊 Status Categories

### 1. ACTIVE

- **Definition:** Currently assigned to contracts
- **Description:** Promoters actively working on contract assignments
- **Use Case:** Track who is currently working
- **Icon:** ✅
- **Color:** Green

### 2. AVAILABLE

- **Definition:** Ready for assignment but not currently assigned
- **Description:** Registered promoters ready to take on contract work
- **Use Case:** Find promoters ready for new assignments
- **Icon:** 🟦
- **Color:** Blue

### 3. ON_LEAVE

- **Definition:** Temporarily unavailable
- **Description:** Promoters on vacation, sick leave, or personal leave
- **Use Case:** Track temporary absences
- **Icon:** ⏸️
- **Color:** Yellow

### 4. INACTIVE

- **Definition:** Not available for assignments
- **Description:** Suspended, pending approval, or otherwise unavailable
- **Use Case:** Manage workforce availability
- **Icon:** ⭕
- **Color:** Gray

### 5. TERMINATED

- **Definition:** No longer with company
- **Description:** Resigned, contract ended, or terminated
- **Use Case:** Historical tracking
- **Icon:** 🚫
- **Color:** Red

## 🗄️ Database Schema

### Migration File

`supabase/migrations/20251023_add_promoter_status_enum.sql`

### Enum Type

```sql
CREATE TYPE promoter_status_enum AS ENUM (
  'active',       -- Currently assigned to contracts
  'available',    -- Ready for assignment
  'on_leave',     -- Temporarily unavailable
  'inactive',     -- Not available for assignments
  'terminated'    -- No longer with company
);
```

### Table Update

```sql
-- Add new enum column
ALTER TABLE promoters ADD COLUMN status_enum promoter_status_enum;

-- Set default
ALTER TABLE promoters
  ALTER COLUMN status_enum SET DEFAULT 'available'::promoter_status_enum;

-- Add index
CREATE INDEX idx_promoters_status_enum ON promoters(status_enum);
```

### Status Migration Mapping

The migration automatically maps old status values:

- `'active'` → `active`
- `'inactive'` → `inactive`
- `'pending'` → `available`
- `'suspended'` → `inactive`
- `'terminated'` → `terminated`
- `'on_leave'` → `on_leave`
- NULL or unknown → `available` (default)

## 📈 Enhanced Metrics

### Metrics Structure

```typescript
interface EnhancedPromoterMetrics {
  // Total Counts
  totalWorkforce: number; // All registered promoters

  // By Status
  activeOnContracts: number; // Currently working
  availableForWork: number; // Ready but not assigned
  onLeave: number; // Temporarily unavailable
  inactive: number; // Not available
  terminated: number; // Left company

  // Document Compliance
  fullyCompliant: number; // All documents valid
  expiringDocuments: number; // Expiring within 30 days
  expiredDocuments: number; // Already expired
  complianceRate: number; // Percentage

  // Utilization
  utilizationRate: number; // % of available on contracts
  averageContractsPerPromoter: number;

  // Details
  details: {
    byStatus: Record<PromoterStatus, number>;
    criticalIds: number;
    criticalPassports: number;
    expiringIds: number;
    expiringPassports: number;
  };
}
```

## 🔌 API Endpoints

### Get Enhanced Metrics

```
GET /api/promoters/enhanced-metrics
GET /api/promoters/enhanced-metrics?refresh=true
```

**Response:**

```json
{
  "success": true,
  "metrics": {
    "totalWorkforce": 113,
    "activeOnContracts": 12,
    "availableForWork": 83,
    "onLeave": 5,
    "inactive": 10,
    "terminated": 3,
    "fullyCompliant": 95,
    "expiringDocuments": 8,
    "expiredDocuments": 10,
    "complianceRate": 84,
    "utilizationRate": 13,
    "averageContractsPerPromoter": 1.2,
    "details": {
      "byStatus": {
        "active": 12,
        "available": 83,
        "on_leave": 5,
        "inactive": 10,
        "terminated": 3
      },
      "criticalIds": 5,
      "criticalPassports": 5,
      "expiringIds": 4,
      "expiringPassports": 4
    }
  },
  "timestamp": "2025-10-23T10:30:00.000Z",
  "cached": true
}
```

## 💻 Usage Examples

### TypeScript/JavaScript

#### Import Types

```typescript
import {
  PromoterStatus,
  EnhancedPromoterMetrics,
  PROMOTER_STATUS_DEFINITIONS,
  getStatusOptions,
} from '@/types/promoter-status';
```

#### Get Metrics

```typescript
import { getEnhancedPromoterMetrics } from '@/lib/services/promoter-metrics.service';

// Get cached metrics
const metrics = await getEnhancedPromoterMetrics();

// Force refresh
const freshMetrics = await getEnhancedPromoterMetrics(true);

console.log(`Active on Contracts: ${metrics.activeOnContracts}`);
console.log(`Available for Work: ${metrics.availableForWork}`);
console.log(`Utilization Rate: ${metrics.utilizationRate}%`);
```

#### Use in Components

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { EnhancedPromoterMetrics } from '@/types/promoter-status';

export function PromoterDashboard() {
  const [metrics, setMetrics] = useState<EnhancedPromoterMetrics | null>(null);

  useEffect(() => {
    fetch('/api/promoters/enhanced-metrics')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMetrics(data.metrics);
        }
      });
  }, []);

  if (!metrics) return <div>Loading...</div>;

  return (
    <div>
      <h2>Promoter Metrics</h2>
      <div>Active: {metrics.activeOnContracts}</div>
      <div>Available: {metrics.availableForWork}</div>
      <div>Total Workforce: {metrics.totalWorkforce}</div>
    </div>
  );
}
```

#### Status Dropdown

```typescript
import { getStatusOptions, PROMOTER_STATUS_DEFINITIONS } from '@/types/promoter-status';

export function PromoterStatusSelect() {
  const statusOptions = getStatusOptions();

  return (
    <select>
      {statusOptions.map(option => (
        <option key={option.value} value={option.value}>
          {PROMOTER_STATUS_DEFINITIONS[option.value].icon} {option.label}
        </option>
      ))}
    </select>
  );
}
```

### SQL

#### Query Status Distribution

```sql
SELECT * FROM promoter_status_summary;
```

#### Get Comprehensive Metrics

```sql
SELECT * FROM get_promoter_metrics();
```

#### Count Active Contracts

```sql
SELECT count_promoters_with_active_contracts();
```

#### Custom Queries

```sql
-- Get promoters by status
SELECT * FROM promoters WHERE status_enum = 'available';

-- Count by status
SELECT status_enum, COUNT(*)
FROM promoters
GROUP BY status_enum;

-- Get available promoters with valid documents
SELECT *
FROM promoters
WHERE status_enum = 'available'
  AND id_card_expiry_date > CURRENT_DATE + INTERVAL '30 days'
  AND passport_expiry_date > CURRENT_DATE + INTERVAL '30 days';
```

## 🎨 Dashboard Integration

### Metric Cards with Tooltips

```typescript
<TooltipProvider>
  <Card>
    <CardHeader>
      <div className='flex items-center gap-2'>
        <CardTitle>Active Promoters</CardTitle>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className='h-3 w-3 cursor-help' />
          </TooltipTrigger>
          <TooltipContent>
            <p>Promoters currently working on active contract assignments</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </CardHeader>
    <CardContent>
      <div className='text-2xl font-bold'>
        {metrics?.activeOnContracts ?? 0}
      </div>
      <p className='text-xs text-muted-foreground'>
        On assignments
      </p>
    </CardContent>
  </Card>
</TooltipProvider>
```

## 🚀 Deployment Steps

### 1. Run Migration

```bash
# Connect to your Supabase project
psql "your-supabase-connection-string"

# Run migration
\i supabase/migrations/20251023_add_promoter_status_enum.sql
```

### 2. Verify Migration

```sql
-- Check enum exists
SELECT * FROM pg_type WHERE typname = 'promoter_status_enum';

-- Check column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'promoters' AND column_name = 'status_enum';

-- Check data migration
SELECT * FROM promoter_status_summary;
```

### 3. Update Application Code

The new API endpoint `/api/promoters/enhanced-metrics` is backward compatible. Update components to use the new endpoint gradually.

### 4. Monitor

```sql
-- Check metrics calculation
SELECT * FROM get_promoter_metrics();

-- Monitor query performance
EXPLAIN ANALYZE SELECT * FROM promoters WHERE status_enum = 'available';
```

## 🔄 Migration Safety

The migration uses a **gradual approach** for safety:

1. ✅ Old `status` column is preserved
2. ✅ New `status_enum` column added alongside
3. ✅ Data automatically migrated to `status_enum`
4. ✅ Backup table created (`promoters_status_backup`)
5. ⏸️ Old column drop is commented out (uncomment after verification)

### Rollback Plan

If issues occur:

```sql
-- Restore from backup
UPDATE promoters p
SET status = b.status
FROM promoters_status_backup b
WHERE p.id = b.id;

-- Drop enum column
ALTER TABLE promoters DROP COLUMN status_enum;
```

## 📊 Metrics Explanation

### Utilization Rate

```
utilizationRate = (activeOnContracts / availableWorkforce) × 100
where availableWorkforce = active + available
```

**Example:**

- 12 promoters on contracts
- 95 total available (active + available)
- Utilization: 12 / 95 = 13%

### Compliance Rate

```
complianceRate = (fullyCompliant / totalWorkforce) × 100
```

**Example:**

- 95 promoters fully compliant
- 113 total workforce
- Compliance: 95 / 113 = 84%

## 🔍 Troubleshooting

### Issue: Metrics showing 0

**Solution:** Check if migration ran successfully

```sql
SELECT * FROM promoters LIMIT 5;
-- Should show status_enum column
```

### Issue: Status not updating

**Solution:** Clear cache

```typescript
import { clearPromoterMetricsCache } from '@/lib/services/promoter-metrics.service';
clearPromoterMetricsCache();
```

### Issue: Old API still used

**Solution:** Search for old endpoint usage

```bash
grep -r "dashboard/promoter-metrics" .
# Replace with: promoters/enhanced-metrics
```

## 📚 Related Documentation

- [Database Schema Reference](./PRISMA_SCHEMA_REFERENCE_PARTIES.prisma)
- [Promoter Architecture Review](../PROMOTERS_ARCHITECTURE_REVIEW.md)
- [Metrics Issue #3](../ISSUE_#3_INCONSISTENT_METRICS.md)

## 🎯 Benefits

1. **Clarity:** Clear status definitions eliminate confusion
2. **Consistency:** Single source of truth for all metrics
3. **Performance:** Indexed queries and caching
4. **Safety:** Gradual migration with rollback capability
5. **Usability:** Tooltips explain each metric
6. **Accuracy:** Metrics calculated from entire database, not just current page

## 📝 Change Log

| Date       | Version | Changes                                 |
| ---------- | ------- | --------------------------------------- |
| 2025-10-23 | 1.0.0   | Initial release with status enum system |

## 👥 Support

For questions or issues:

1. Check this documentation
2. Review the migration file comments
3. Check the troubleshooting section
4. Contact the development team

---

**Last Updated:** October 23, 2025
**Status:** Production Ready ✅
