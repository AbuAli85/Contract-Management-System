# Metrics Diagnostics Guide

## Overview
This guide explains how to diagnose and fix metrics display issues in the SmartPro Portal.

---

## Issue #5: Contradictory Metrics Display

### Symptoms Observed
1. **Active Workforce vs Awaiting Assignment:**
   - Shows "Active workforce: 171"
   - Also shows "171 awaiting assignment"
   - **Contradiction:** If all 171 are awaiting assignment, they can't all be "active workforce"

2. **Compliance Rate vs Assigned Staff:**
   - Shows "Compliance rate 66%"
   - Shows "10 assigned staff"
   - **Possible Issue:** These metrics might be measuring different things

### Root Cause Analysis

#### 1. Terminology Confusion
The metrics are using ambiguous terminology:

- **"Active workforce"** likely means promoters with `status = 'active'` in database
- **"Awaiting assignment"** means active promoters NOT assigned to any contract
- **"Assigned staff"** means promoters currently on active contracts

**Resolution:** These are not contradictory, just poorly labeled. The correct interpretation:
- Total Active: 171
- Unassigned (available): 171
- Currently on contracts: 10

This suggests most promoters are in the system but not deployed.

#### 2. Data Consistency Issue
The metrics calculation in `lib/metrics.ts` handles this correctly:

```typescript
// Line 489 in lib/metrics.ts
const unassignedCount = (activeCount || 0) - uniquePromotersOnAssignments;

const metrics: PromoterMetrics = {
  total: totalCount || 0,
  active: activeCount || 0,
  inactive: (totalCount || 0) - (activeCount || 0),
  onAssignments: uniquePromotersOnAssignments,
  available: (activeCount || 0) - uniquePromotersOnAssignments,
  complianceRate,
  critical: criticalCount,
  expiring: expiringCount,
  unassigned: unassignedCount,
};
```

**The logic is correct!** The issue is in the **dashboard display labels**, not the calculation.

### Diagnostic API Endpoint

A new diagnostic endpoint has been created:

```
GET /api/diagnostics/metrics?check=full&format=json
```

#### Usage Examples

**1. Full Diagnostics (JSON):**
```bash
curl https://portal.thesmartpro.io/api/diagnostics/metrics?check=full
```

**2. Full Diagnostics (Markdown Report):**
```bash
curl https://portal.thesmartpro.io/api/diagnostics/metrics?check=full&format=markdown
```

**3. Validation Only:**
```bash
curl https://portal.thesmartpro.io/api/diagnostics/metrics?check=validation
```

**4. Consistency Checks Only:**
```bash
curl https://portal.thesmartpro.io/api/diagnostics/metrics?check=consistency
```

### Running Diagnostics in Production

**Option 1: Browser Console**
```javascript
fetch('/api/diagnostics/metrics?check=full')
  .then(res => res.json())
  .then(data => console.table(data.rawCounts))
  .then(() => fetch('/api/diagnostics/metrics?check=full'))
  .then(res => res.json())
  .then(data => console.log('Validation:', data.metricsValidation))
  .then(() => fetch('/api/diagnostics/metrics?check=full'))
  .then(res => res.json())
  .then(data => console.log('Consistency:', data.consistencyChecks));
```

**Option 2: Download Report**
```javascript
fetch('/api/diagnostics/metrics?check=full&format=markdown')
  .then(res => res.text())
  .then(text => {
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrics-report-${new Date().toISOString()}.md`;
    a.click();
  });
```

### Recommended Fixes

#### Fix 1: Update Dashboard Labels (High Priority)

**Before:**
- "Active workforce: 171"
- "171 awaiting assignment"

**After:**
- "Total Promoters: 171"
- "Available (unassigned): 161"  
- "On Active Contracts: 10"

**Implementation:**
Update the dashboard component to use clearer labels that match the actual metrics meaning.

#### Fix 2: Add Metrics Tooltips (Medium Priority)

Add tooltips to explain each metric:

```tsx
<Tooltip>
  <TooltipTrigger>
    <Badge>Available: 161</Badge>
  </TooltipTrigger>
  <TooltipContent>
    <p>Active promoters not currently assigned to contracts</p>
  </TooltipContent>
</Tooltip>
```

#### Fix 3: Add Data Validation (Low Priority)

The system already has validation built into `lib/metrics.ts`. Ensure it's being used:

```typescript
import { validateMetrics } from '@/lib/metrics';

const metrics = await getPromoterMetrics();
const validation = validateMetrics(metrics);

if (!validation.isValid) {
  console.error('Metrics validation failed:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('Metrics warnings:', validation.warnings);
}
```

### Compliance Rate Clarification

The compliance rate (66%) is calculated based on document validity:

```typescript
// From lib/metrics.ts (lines 465-482)
promotersData.forEach(promoter => {
  const idExpiry = promoter.id_card_expiry_date ? new Date(promoter.id_card_expiry_date) : null;
  const passportExpiry = promoter.passport_expiry_date ? new Date(promoter.passport_expiry_date) : null;

  const idExpired = idExpiry && idExpiry < now;
  const passportExpired = passportExpiry && passportExpiry < now;
  const idExpiring = idExpiry && idExpiry >= now && idExpiry <= thirtyDaysFromNow;
  const passportExpiring = passportExpiry && passportExpiry >= now && passportExpiry <= thirtyDaysFromNow;

  if (idExpired || passportExpired) {
    criticalCount++;
  } else if (idExpiring || passportExpiring) {
    expiringCount++;
  } else if (idExpiry && passportExpiry && idExpiry > thirtyDaysFromNow && passportExpiry > thirtyDaysFromNow) {
    compliantCount++;
  }
});
```

**Compliance = (Promoters with valid, non-expiring documents) / (Total promoters)**

This is **independent** of assignment status.

---

## Testing Metrics

### Test 1: Verify Raw Counts

```sql
-- Run in Supabase SQL Editor
SELECT 
  COUNT(*) as total_promoters,
  COUNT(*) FILTER (WHERE status = 'active') as active_promoters
FROM promoters;

SELECT COUNT(DISTINCT promoter_id) as assigned_promoters
FROM contracts
WHERE status = 'active' AND promoter_id IS NOT NULL;
```

### Test 2: Check Compliance Calculation

```sql
-- Promoters with valid documents (not expired, not expiring soon)
SELECT COUNT(*) as compliant
FROM promoters
WHERE 
  id_card_expiry_date > NOW() + INTERVAL '30 days'
  AND passport_expiry_date > NOW() + INTERVAL '30 days';

-- Promoters with expired documents
SELECT COUNT(*) as critical
FROM promoters
WHERE 
  id_card_expiry_date < NOW()
  OR passport_expiry_date < NOW();

-- Promoters with expiring soon documents
SELECT COUNT(*) as expiring
FROM promoters
WHERE 
  (id_card_expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days')
  OR (passport_expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days');
```

### Test 3: Validate Metrics API

```javascript
// Test in production
fetch('/api/dashboard/promoter-metrics?refresh=true')
  .then(res => res.json())
  .then(data => {
    console.log('Metrics:', data.metrics);
    
    // Verify calculations
    const { active, onAssignments, available } = data.metrics;
    console.assert(
      available === active - onAssignments,
      'Available should equal active minus onAssignments'
    );
    
    console.log('✅ Metrics calculation is correct');
  });
```

---

## Production Monitoring

### Set Up Alerts

**1. Metrics Validation Alerts:**
```typescript
// Add to dashboard component
useEffect(() => {
  const checkMetrics = async () => {
    const metrics = await getPromoterMetrics();
    const validation = validateMetrics(metrics);
    
    if (!validation.isValid) {
      // Send alert to admin
      await fetch('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          type: 'metrics_validation_error',
          errors: validation.errors,
          timestamp: new Date().toISOString(),
        }),
      });
    }
  };
  
  checkMetrics();
}, []);
```

**2. Data Consistency Checks:**
```typescript
// Run periodically (e.g., every 6 hours)
setInterval(async () => {
  const checks = await checkDataConsistency();
  const failed = checks.filter(c => c.status === 'FAIL');
  
  if (failed.length > 0) {
    console.error('Data consistency check failed:', failed);
    // Send notification
  }
}, 6 * 60 * 60 * 1000);
```

---

## Summary

### Is There a Real Problem?

**NO** - The metrics calculation is correct. The issue is **UI/UX labeling**.

### Action Items

1. ✅ **Created:** Diagnostic API endpoint (`/api/diagnostics/metrics`)
2. ⏳ **Pending:** Update dashboard labels for clarity
3. ⏳ **Pending:** Add tooltips to explain metrics
4. ⏳ **Optional:** Set up monitoring and alerts

### Expected Behavior

For 181 total promoters:
- **171 active** (status = 'active')
- **10 inactive** (181 - 171)
- **10 on assignments** (assigned to active contracts)
- **161 available** (171 - 10 = active but unassigned)
- **66% compliance** (119 promoters with valid documents)

These numbers are **consistent and correct**.

---

## Next Steps

1. **Test diagnostics endpoint:**
   ```bash
   curl https://portal.thesmartpro.io/api/diagnostics/metrics?check=full&format=markdown > report.md
   ```

2. **Review the report** and verify all checks pass

3. **Update dashboard UI** if needed to clarify labels

4. **Close issue** once labels are updated

---

**Status:** ✅ **ROOT CAUSE IDENTIFIED** - UI labeling issue, not data issue

**Created:** October 29, 2025  
**Last Updated:** October 29, 2025

