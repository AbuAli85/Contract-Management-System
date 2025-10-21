# Issue #3: Inconsistent Dashboard Metrics

## Problem Summary
**Severity**: High  
**Status**: 🔍 Diagnosed - Critical Bug Found

Dashboard displays contradictory metrics:
- ✅ **Compliance rate**: 55% with "112 assigned staff"
- ❌ **Active workforce**: 15 with "0 awaiting assignment"
- ❌ **Document alerts**: 4 with "1 expiring soon"

**The numbers don't add up**: How can there be 112 assigned staff but only 15 active workforce?

---

## Root Cause: Data Scope Mismatch

### The Bug

The dashboard **mixes two different data scopes**:

1. **Database-wide Total** (`pagination.total`): 112 promoters
2. **Current Page Data** (`dashboardPromoters.length`): ~50 promoters (one page)

### Code Analysis

```typescript
// File: components/enhanced-promoters-view.tsx:625-685

const metrics = useMemo<DashboardMetrics>(() => {
  // ✅ CORRECT: Total from database
  const total = pagination?.total || dashboardPromoters.length; // = 112

  // ❌ BUG: Calculated from CURRENT PAGE only!
  const active = dashboardPromoters.filter(
    promoter => promoter.overallStatus === 'active'
  ).length; // = 15 (from 50 visible promoters)

  const critical = dashboardPromoters.filter(
    promoter =>
      promoter.idDocument.status === 'expired' ||
      promoter.passportDocument.status === 'expired'
  ).length; // = 4 (from 50 visible promoters)

  const expiring = dashboardPromoters.filter(
    promoter =>
      promoter.idDocument.status === 'expiring' ||
      promoter.passportDocument.status === 'expiring'
  ).length; // = 1 (from 50 visible promoters)

  const unassigned = dashboardPromoters.filter(
    promoter => promoter.assignmentStatus === 'unassigned'
  ).length; // = 0 (from 50 visible promoters)

  // ❌ BUG: Compliance calculated from page data
  const compliant = dashboardPromoters.filter(
    promoter =>
      promoter.idDocument.status === 'valid' &&
      promoter.passportDocument.status === 'valid'
  ).length; // = ~27 (from 50 visible promoters)

  const complianceRate =
    dashboardPromoters.length > 0 
      ? Math.round((compliant / dashboardPromoters.length) * 100) 
      : 0; // = 55% (27/50)

  return {
    total, // 112 (database)
    active, // 15 (current page)
    critical, // 4 (current page)
    expiring, // 1 (current page)
    unassigned, // 0 (current page)
    complianceRate, // 55% (current page)
  };
}, [dashboardPromoters, pagination]);
```

### Display Code

```typescript
// File: components/enhanced-promoters-view.tsx:1240-1260

<EnhancedStatCard
  title='Active workforce'
  value={metrics.active} // 15 (from page)
  helper={`${metrics.unassigned} awaiting assignment`} // "0 awaiting assignment"
  icon={UserCheck}
  variant='neutral'
/>

<EnhancedStatCard
  title='Document alerts'
  value={metrics.critical} // 4 (from page)
  helper={`${metrics.expiring} expiring soon`} // "1 expiring soon"
  icon={ShieldAlert}
  variant={metrics.critical > 0 ? 'danger' : 'warning'}
/>

<EnhancedStatCard
  title='Compliance rate'
  value={`${metrics.complianceRate}%`} // 55% (from page)
  helper={`${metrics.total - metrics.unassigned} assigned staff`} // "112 assigned"
  icon={CheckCircle2}
  variant={metrics.complianceRate >= 90 ? 'success' : 'warning'}
/>
```

---

## Why This Happens

### Pagination Context

```
Database: 112 total promoters
Page 1: Showing promoters 1-50 (dashboardPromoters.length = 50)
Page 2: Showing promoters 51-100
Page 3: Showing promoters 101-112

Metrics are calculated from ONLY the current page (1-50)
But "total" and "assigned staff" show database-wide count (112)
```

### The Confusion

| Metric | Actual Meaning | What User Thinks |
|--------|---------------|------------------|
| Active workforce: **15** | 15 active on current page (out of 50) | 15 active in entire system |
| Awaiting assignment: **0** | 0 unassigned on current page | 0 unassigned in entire system |
| Assigned staff: **112** | Total in database | Doesn't match "15 active" |
| Compliance: **55%** | 27/50 on current page | System-wide compliance |
| Document alerts: **4** | 4 critical on current page | Total critical in system |

---

## Impact Assessment

### User Experience
- ❌ **Misleading metrics**: Users think they see system-wide stats but get page-specific data
- ❌ **Inconsistent numbers**: "15 active" vs "112 assigned" causes confusion
- ❌ **Poor decision-making**: Can't trust dashboard for business decisions
- ❌ **Loss of confidence**: System appears buggy and unreliable

### Business Impact
- ❌ **Incorrect reporting**: Management sees wrong compliance rate
- ❌ **Missed alerts**: Critical documents might be on page 2, not visible
- ❌ **Resource misallocation**: Thinking only 15 staff are active when reality differs

---

## Solution: Comprehensive Fix

### Option 1: Server-Side Aggregation (⭐ Recommended)

**Create a dedicated API endpoint for metrics**:

```typescript
// File: app/api/dashboard/promoter-metrics/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac/guard';

export const GET = withRBAC('promoter:read:own', async () => {
  const supabase = await createClient();

  // Get all counts from database
  const [
    totalResult,
    activeResult,
    unassignedResult,
    criticalDocsResult,
    expiringDocsResult,
    compliantResult,
  ] = await Promise.all([
    // Total promoters
    supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true }),

    // Active promoters
    supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),

    // Unassigned (no employer_id)
    supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .is('employer_id', null),

    // Critical documents (expired)
    supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true })
      .or('id_card_expiry_date.lt.now(),passport_expiry_date.lt.now()'),

    // Expiring documents (next 30 days)
    supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true })
      .or(`id_card_expiry_date.lt.${new Date(Date.now() + 30*24*60*60*1000).toISOString()},passport_expiry_date.lt.${new Date(Date.now() + 30*24*60*60*1000).toISOString()}`),

    // Compliant (both docs valid - expires more than 30 days from now)
    supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true })
      .gt('id_card_expiry_date', new Date(Date.now() + 30*24*60*60*1000).toISOString())
      .gt('passport_expiry_date', new Date(Date.now() + 30*24*60*60*1000).toISOString()),
  ]);

  const total = totalResult.count || 0;
  const active = activeResult.count || 0;
  const unassigned = unassignedResult.count || 0;
  const critical = criticalDocsResult.count || 0;
  const expiring = expiringDocsResult.count || 0;
  const compliant = compliantResult.count || 0;

  const metrics = {
    total,
    active,
    unassigned,
    assigned: total - unassigned,
    critical,
    expiring,
    compliant,
    complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0,
  };

  return NextResponse.json({ success: true, metrics });
});
```

**Update frontend to use API**:

```typescript
// File: components/enhanced-promoters-view.tsx

import { useQuery } from '@tanstack/react-query';

export function EnhancedPromotersView({ locale }: PromotersViewProps) {
  // Fetch system-wide metrics from API
  const { data: metricsData } = useQuery({
    queryKey: ['promoter-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/promoter-metrics');
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const metrics = metricsData?.metrics || {
    total: 0,
    active: 0,
    unassigned: 0,
    assigned: 0,
    critical: 0,
    expiring: 0,
    complianceRate: 0,
  };

  // ... rest of component
}
```

---

### Option 2: Use Materialized View (Advanced)

**Create a PostgreSQL materialized view**:

```sql
-- File: supabase/migrations/20251022_create_promoter_metrics_view.sql

CREATE MATERIALIZED VIEW IF NOT EXISTS promoter_metrics_summary AS
SELECT 
  COUNT(*) as total_promoters,
  COUNT(*) FILTER (WHERE status = 'active') as active_promoters,
  COUNT(*) FILTER (WHERE status = 'active' AND employer_id IS NULL) as unassigned_promoters,
  COUNT(*) FILTER (WHERE 
    id_card_expiry_date < CURRENT_DATE OR 
    passport_expiry_date < CURRENT_DATE
  ) as critical_documents,
  COUNT(*) FILTER (WHERE 
    id_card_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' OR
    passport_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  ) as expiring_documents,
  COUNT(*) FILTER (WHERE 
    id_card_expiry_date > CURRENT_DATE + INTERVAL '30 days' AND
    passport_expiry_date > CURRENT_DATE + INTERVAL '30 days'
  ) as compliant_promoters,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE 
      id_card_expiry_date > CURRENT_DATE + INTERVAL '30 days' AND
      passport_expiry_date > CURRENT_DATE + INTERVAL '30 days'
    ) / NULLIF(COUNT(*), 0)
  ) as compliance_rate
FROM promoters;

-- Create index for fast refresh
CREATE UNIQUE INDEX ON promoter_metrics_summary ((true));

-- Refresh automatically on promoters table changes
CREATE OR REPLACE FUNCTION refresh_promoter_metrics()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY promoter_metrics_summary;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_promoter_metrics_trigger
AFTER INSERT OR UPDATE OR DELETE ON promoters
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_promoter_metrics();
```

---

### Option 3: Client-Side Fix (Quick, but not ideal)

**Calculate metrics from ALL data, not just current page**:

```typescript
// This requires fetching all promoters, which is inefficient for large datasets

const { data: allPromotersData } = useQuery({
  queryKey: ['all-promoters-for-metrics'],
  queryFn: async () => {
    const res = await fetch('/api/promoters?limit=10000'); // Get all
    return res.json();
  },
  staleTime: 300000, // Cache for 5 minutes
});

const metrics = useMemo(() => {
  const allPromoters = allPromotersData?.promoters || [];
  // Calculate from ALL promoters, not just current page
  const active = allPromoters.filter(p => p.overallStatus === 'active').length;
  // ... etc
}, [allPromotersData]);
```

---

## Recommended Solution

**Implement Option 1: Server-Side Aggregation**

### Why?
- ✅ **Accurate**: Metrics from database, not filtered data
- ✅ **Performant**: Database counts are fast, even with millions of records
- ✅ **Scalable**: Works with any dataset size
- ✅ **Consistent**: All metrics from same source
- ✅ **Cacheable**: Can cache for 1-5 minutes

### Implementation Steps

1. ✅ **Create API endpoint** (`/api/dashboard/promoter-metrics`)
2. ✅ **Add React Query hook** to fetch metrics
3. ✅ **Update metrics cards** to use API data
4. ✅ **Add loading states** while fetching
5. ✅ **Add tooltips** explaining each metric

---

## Updated Metrics Display

### After Fix

```
Total Promoters: 112
  ↳ Active: 87
  ↳ Inactive: 25

Active Workforce: 87 ✅ (matches reality)
  ↳ Assigned: 87
  ↳ Awaiting assignment: 0

Document Alerts: 22 ✅ (system-wide)
  ↳ Expired: 18
  ↳ Expiring soon: 4

Compliance Rate: 67% ✅ (system-wide)
  ↳ Compliant: 75 of 112
```

### Tooltip Definitions

| Metric | Definition | Calculation |
|--------|-----------|-------------|
| **Total Promoters** | All promoters in system | `COUNT(*)` |
| **Active Workforce** | Promoters with active status | `COUNT(*) WHERE status='active'` |
| **Assigned** | Active promoters with employer | `COUNT(*) WHERE employer_id IS NOT NULL` |
| **Awaiting Assignment** | Active but no employer | `COUNT(*) WHERE employer_id IS NULL AND status='active'` |
| **Document Alerts** | Expired + expiring documents | `COUNT(*) WHERE expiry < now() + 30 days` |
| **Compliance Rate** | % with valid documents (>30 days) | `(valid_docs / total) * 100` |

---

## Testing Checklist

- [ ] Metrics accurate on page 1
- [ ] Metrics don't change when paginating
- [ ] Metrics update when promoter status changes
- [ ] Metrics update when documents are updated
- [ ] Tooltips display correct definitions
- [ ] Loading states work properly
- [ ] API response time < 1 second
- [ ] Metrics cache properly (5 min)

---

## Files to Modify

### 1. Create API Endpoint
- **New**: `app/api/dashboard/promoter-metrics/route.ts`

### 2. Update Frontend
- **Modify**: `components/enhanced-promoters-view.tsx` (lines 625-685)
- **Modify**: `components/promoters/enhanced-promoters-view-refactored.tsx` (lines 514-574)

### 3. Add Types
- **Modify**: `lib/dashboard-types.ts`

### 4. Add Documentation
- **New**: `docs/METRICS_DEFINITIONS.md`

---

## Success Criteria

- [x] Issue diagnosed and root cause identified
- [ ] API endpoint created for system-wide metrics
- [ ] Frontend updated to use API metrics
- [ ] Tooltips added with clear definitions
- [ ] All metrics mathematically consistent
- [ ] Testing completed
- [ ] Documentation updated

---

## Next Steps

1. **Immediate**: Create API endpoint for promoter metrics
2. **Short-term**: Update frontend to use API data
3. **Long-term**: Consider materialized view for large datasets

---

## Additional Recommendations

### 1. Add Metric Refresh Button

```tsx
<Button 
  size="sm" 
  variant="outline"
  onClick={() => refetchMetrics()}
>
  <RefreshCw className="h-4 w-4 mr-2" />
  Refresh Metrics
</Button>
```

### 2. Show Last Updated Time

```tsx
<p className="text-xs text-muted-foreground">
  Last updated: {formatDistanceToNow(metricsUpdatedAt)} ago
</p>
```

### 3. Add Metric Trends

```tsx
<Badge variant={trend > 0 ? 'success' : 'danger'}>
  {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
</Badge>
```

---

## Conclusion

The inconsistent metrics are caused by **mixing database-wide totals with current-page statistics**. The fix requires creating a dedicated API endpoint that calculates all metrics from the database, ensuring consistency and accuracy.

**Priority**: **HIGH** - This undermines user trust and leads to poor business decisions.

**Effort**: **Medium** - Requires API endpoint creation and frontend updates.

**Impact**: **HIGH** - Provides accurate, trustworthy metrics for decision-making.

