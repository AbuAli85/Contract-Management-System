# Promoter Metrics Quick Start Guide

## 🚀 Quick Reference

### Status Categories

| Status         | On Contracts? | Available? | Description       |
| -------------- | ------------- | ---------- | ----------------- |
| **ACTIVE**     | ✅ Yes        | ✅ Yes     | Currently working |
| **AVAILABLE**  | ❌ No         | ✅ Yes     | Ready for work    |
| **ON_LEAVE**   | ❌ No         | ❌ No      | Temporary absence |
| **INACTIVE**   | ❌ No         | ❌ No      | Not available     |
| **TERMINATED** | ❌ No         | ❌ No      | Left company      |

### Dashboard Metrics Explained

```
📊 Active Promoters: 12
   └─ Promoters currently working on active contracts

📊 Available: 83
   └─ Ready for assignment but not currently working

📊 Total Workforce: 113
   └─ All registered promoters (all statuses)

📊 Utilization Rate: 13%
   └─ (12 active ÷ 95 available workforce) × 100
```

## 📦 Files Created

### 1. Type Definitions

**File:** `types/promoter-status.ts`

- Status enum
- Metrics interface
- Helper functions

### 2. Database Migration

**File:** `supabase/migrations/20251023_add_promoter_status_enum.sql`

- Creates status enum
- Adds status_enum column
- Migrates existing data
- Creates helper functions

### 3. Metrics Service

**File:** `lib/services/promoter-metrics.service.ts`

- Calculate comprehensive metrics
- Caching for performance
- Helper functions for summaries

### 4. API Endpoint

**File:** `app/api/promoters/enhanced-metrics/route.ts`

- GET endpoint for metrics
- Supports cache refresh

### 5. Dashboard Update

**File:** `app/[locale]/dashboard/page.tsx`

- Updated to use new metrics
- Added tooltips
- Clear status labels

## 🎯 Usage Examples

### In TypeScript

```typescript
import { getEnhancedPromoterMetrics } from '@/lib/services/promoter-metrics.service';

const metrics = await getEnhancedPromoterMetrics();
console.log(`Active: ${metrics.activeOnContracts}`);
console.log(`Available: ${metrics.availableForWork}`);
console.log(`Total: ${metrics.totalWorkforce}`);
```

### In React Component

```typescript
const [metrics, setMetrics] = useState(null);

useEffect(() => {
  fetch('/api/promoters/enhanced-metrics')
    .then(res => res.json())
    .then(data => setMetrics(data.metrics));
}, []);
```

### In SQL

```sql
-- Get all metrics
SELECT * FROM get_promoter_metrics();

-- Get status distribution
SELECT * FROM promoter_status_summary;

-- Count active on contracts
SELECT count_promoters_with_active_contracts();
```

## ⚡ Quick Deploy

### Step 1: Run Migration

```bash
# In Supabase SQL Editor or psql
\i supabase/migrations/20251023_add_promoter_status_enum.sql
```

### Step 2: Verify

```sql
SELECT * FROM promoter_status_summary;
```

### Step 3: Test API

```bash
curl http://localhost:3000/api/promoters/enhanced-metrics
```

## 🔧 Common Tasks

### Update Promoter Status

```typescript
// Update to available
await supabase
  .from('promoters')
  .update({ status_enum: 'available' })
  .eq('id', promoterId);

// Clear cache after update
import { clearPromoterMetricsCache } from '@/lib/services/promoter-metrics.service';
clearPromoterMetricsCache();
```

### Get Specific Metrics

```typescript
// Just status summary
import { getPromoterStatusSummary } from '@/lib/services/promoter-metrics.service';
const statusSummary = await getPromoterStatusSummary();

// Just compliance
import { getDocumentComplianceSummary } from '@/lib/services/promoter-metrics.service';
const compliance = await getDocumentComplianceSummary();

// Just utilization
import { getWorkforceUtilizationSummary } from '@/lib/services/promoter-metrics.service';
const utilization = await getWorkforceUtilizationSummary();
```

## 📊 Understanding the Numbers

### Before Fix

- Dashboard: "Active Promoters: 12" ❓ (unclear meaning)
- Hub: "Total: 113, Active: 95" ❓ (conflicting)

### After Fix

- Dashboard:
  - ✅ "Active Promoters: 12" (on contracts)
  - ✅ "Available: 83" (ready for work)
  - ✅ "Total Workforce: 113" (all registered)

### The Math

```
Total Workforce = 113 (all promoters)
├── Active on Contracts = 12 (working)
├── Available = 83 (ready)
├── On Leave = 5 (temporary)
├── Inactive = 10 (not available)
└── Terminated = 3 (left)

Available Workforce = 12 + 83 = 95
Utilization Rate = 12 / 95 = 13%
```

## 🎨 UI Components

### Metric Card with Tooltip

```tsx
<Card>
  <CardHeader>
    <div className='flex items-center gap-2'>
      <CardTitle>Active Promoters</CardTitle>
      <Tooltip>
        <TooltipTrigger>
          <Info className='h-3 w-3' />
        </TooltipTrigger>
        <TooltipContent>
          Promoters currently working on active contracts
        </TooltipContent>
      </Tooltip>
    </div>
  </CardHeader>
  <CardContent>
    <div className='text-2xl'>{metrics.activeOnContracts}</div>
    <p className='text-xs'>On assignments</p>
  </CardContent>
</Card>
```

## 🐛 Troubleshooting

| Issue                     | Solution                                       |
| ------------------------- | ---------------------------------------------- |
| Metrics showing 0         | Run migration, check status_enum column exists |
| Old numbers still showing | Clear cache: `clearPromoterMetricsCache()`     |
| API returning errors      | Check Supabase connection, verify migration    |
| Dashboard not updating    | Check browser console, verify API endpoint     |

## 📚 Full Documentation

For detailed information, see:

- [Complete Documentation](./PROMOTER_STATUS_SYSTEM.md)
- [Migration File](../supabase/migrations/20251023_add_promoter_status_enum.sql)
- [Metrics Service](../lib/services/promoter-metrics.service.ts)

---

**Status:** Ready to Use ✅
