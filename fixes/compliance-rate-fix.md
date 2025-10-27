# Fix: Compliance Rate Calculation

## Issue
The compliance rate on the Promoters page shows **0%** and **NaN/181 compliant** instead of the actual compliance percentage.

## Root Cause
The `PromoterMetrics` interface in `lib/metrics.ts` is missing the `complianceRate` field, and the `getPromoterMetrics` function doesn't calculate it.

## Solution

### Step 1: Update PromoterMetrics Interface

**File:** `lib/metrics.ts`

Find the `PromoterMetrics` interface and add the missing fields:

```typescript
export interface PromoterMetrics {
  total: number;
  active: number;
  inactive: number;
  onAssignments: number;
  available: number;
  complianceRate: number; // ADD THIS
  critical: number; // ADD THIS
  expiring: number; // ADD THIS
  unassigned: number; // ADD THIS
}
```

### Step 2: Calculate Compliance in getPromoterMetrics

**File:** `lib/metrics.ts`

In the `getPromoterMetrics` function, add this code after the existing queries and before the return statement:

```typescript
// Calculate compliance metrics
const { data: promotersData, error: promotersError } = await supabase
  .from('promoters')
  .select('id, id_expiry_date, passport_expiry_date, status');

if (promotersError) {
  console.error('Error fetching promoters for compliance:', promotersError);
}

const now = new Date();
const thirtyDaysFromNow = new Date();
thirtyDaysFromNow.setDate(now.getDate() + 30);

let compliantCount = 0;
let criticalCount = 0;
let expiringCount = 0;

if (promotersData) {
  promotersData.forEach(promoter => {
    const idExpiry = promoter.id_expiry_date ? new Date(promoter.id_expiry_date) : null;
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
}

const complianceRate = totalCount && totalCount > 0
  ? Math.round((compliantCount / totalCount) * 100)
  : 0;

const unassignedCount = (activeCount || 0) - uniquePromotersOnAssignments;
```

### Step 3: Update Return Statement

Update the `metrics` object to include the new fields:

```typescript
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

## Verification

1. Restart the development server
2. Navigate to the Promoters page
3. Verify compliance rate shows a percentage (not 0% or NaN)
4. Verify "Overall Compliance" shows a number (not NaN)
