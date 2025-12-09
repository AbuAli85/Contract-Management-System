# Fixing Promoter Status Data

## 🔍 Current Situation

Based on your metrics output:

```json
{
  "total_workforce": 114,
  "active_on_contracts": 2,
  "available_for_work": 17,
  "on_leave": 0,
  "inactive": 1,
  "terminated": 0
}
```

**Problem:** Only 20 promoters (2+17+0+1+0) have status values, but you have 114 total.
This means **94 promoters (82%)** don't have their `status_enum` set properly.

## 🎯 Solution

### Step 1: Run Diagnostic

First, let's see what's happening with your data:

```bash
# In Supabase SQL Editor or psql
\i scripts/diagnose_promoter_status.sql
```

This will show you:

- How many promoters have NULL status_enum
- What their old status values are
- Which promoters need updating

### Step 2: Run the Fix

Apply the data fix migration:

```bash
# In Supabase SQL Editor or psql
\i supabase/migrations/20251023_fix_promoter_status_data.sql
```

This will:

- ✅ Migrate all NULL status_enum values
- ✅ Map old status values to new enum
- ✅ Update the metrics function
- ✅ Show you the results

### Step 3: Verify

Check that all promoters now have status:

```sql
-- Should show 0 NULL values
SELECT
  COUNT(*) FILTER (WHERE status_enum IS NOT NULL) as with_status,
  COUNT(*) FILTER (WHERE status_enum IS NULL) as without_status
FROM promoters;

-- Should show proper distribution
SELECT * FROM promoter_status_summary;

-- Should show accurate metrics
SELECT * FROM get_promoter_metrics();
```

### Step 4: Update Application Cache

Clear the application cache so it fetches fresh data:

```typescript
// In your application or a script
import { clearPromoterMetricsCache } from '@/lib/services/promoter-metrics.service';
clearPromoterMetricsCache();
```

Or simply restart your Next.js application:

```bash
# Stop and restart
npm run dev
```

### Step 5: Check Dashboard

Visit your dashboard and verify the metrics now show correctly:

```
http://localhost:3000/en/dashboard
```

## 🔧 Manual Fix (If Needed)

If you want to manually set statuses for specific promoters:

### Set all NULL to available (safe default)

```sql
UPDATE promoters
SET status_enum = 'available'::promoter_status_enum
WHERE status_enum IS NULL;
```

### Mark promoters with active contracts as active

```sql
UPDATE promoters
SET status_enum = 'active'::promoter_status_enum
WHERE id IN (
  SELECT DISTINCT promoter_id
  FROM contracts
  WHERE status = 'active' AND promoter_id IS NOT NULL
);
```

### Set specific status for a promoter

```sql
UPDATE promoters
SET status_enum = 'available'::promoter_status_enum  -- or 'active', 'on_leave', 'inactive', 'terminated'
WHERE id = 'promoter-uuid-here';
```

## 📊 Expected Results After Fix

After running the fix, you should see something like:

```json
{
  "total_workforce": 114,
  "active_on_contracts": 2,
  "available_for_work": 110, // Most promoters will be here
  "on_leave": 0,
  "inactive": 2,
  "terminated": 0,
  "utilization_rate": 1.79, // 2 / (2 + 110) = 1.79%
  "compliance_rate": 52.21
}
```

Now the numbers add up: 2 + 110 + 0 + 2 + 0 = 114 ✅

## 🎨 Dashboard Will Show

```
┌─────────────────────────────────────┐
│ Active Promoters: 2                 │
│ ℹ️  On assignments                   │
├─────────────────────────────────────┤
│ Available: 110                      │
│ ℹ️  Ready for work                   │
├─────────────────────────────────────┤
│ Total Workforce: 114                │
│ ℹ️  All registered                   │
└─────────────────────────────────────┘
```

## 🔍 Understanding Your Current Data

### Why only 2 active on contracts?

This is actually CORRECT if only 2 promoters are currently assigned to active contracts. The query:

```sql
SELECT COUNT(DISTINCT promoter_id) FROM contracts WHERE status = 'active';
```

Returns 2, meaning only 2 unique promoters are working on active contracts right now.

### Why 52% compliance rate?

This means 52% of your promoters have valid ID cards and passports (expiring more than 30 days from now). The other 48% either:

- Have expired documents
- Have documents expiring within 30 days
- Are missing document expiry dates

You can check with:

```sql
SELECT
  id,
  name_en,
  id_card_expiry_date,
  passport_expiry_date,
  CASE
    WHEN id_card_expiry_date < CURRENT_DATE OR passport_expiry_date < CURRENT_DATE
    THEN 'Expired'
    WHEN id_card_expiry_date < CURRENT_DATE + INTERVAL '30 days'
         OR passport_expiry_date < CURRENT_DATE + INTERVAL '30 days'
    THEN 'Expiring Soon'
    WHEN id_card_expiry_date IS NULL OR passport_expiry_date IS NULL
    THEN 'Missing Dates'
    ELSE 'Compliant'
  END as compliance_status
FROM promoters
WHERE id_card_expiry_date < CURRENT_DATE + INTERVAL '30 days'
   OR passport_expiry_date < CURRENT_DATE + INTERVAL '30 days'
   OR id_card_expiry_date IS NULL
   OR passport_expiry_date IS NULL
ORDER BY
  CASE
    WHEN id_card_expiry_date < CURRENT_DATE OR passport_expiry_date < CURRENT_DATE THEN 1
    WHEN id_card_expiry_date < CURRENT_DATE + INTERVAL '30 days'
         OR passport_expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 2
    ELSE 3
  END;
```

## 🚨 Common Issues

### Issue 1: Still seeing wrong numbers

**Solution:** Clear cache and refresh

```sql
-- In database
SELECT * FROM get_promoter_metrics();

-- In application
fetch('/api/promoters/enhanced-metrics?refresh=true')
```

### Issue 2: Some promoters still NULL

**Solution:** Set default status

```sql
UPDATE promoters
SET status_enum = 'available'::promoter_status_enum
WHERE status_enum IS NULL;
```

### Issue 3: Promoters working but status not "active"

**Solution:** This is OK! The system differentiates:

- `status_enum = 'active'` means they're registered and in the system
- `active_on_contracts` counts who's actually working right now

If you want them to match:

```sql
-- Mark all promoters with contracts as active
UPDATE promoters p
SET status_enum = 'active'::promoter_status_enum
WHERE EXISTS (
  SELECT 1 FROM contracts c
  WHERE c.promoter_id = p.id AND c.status = 'active'
);
```

## 📞 Need Help?

1. Run the diagnostic: `\i scripts/diagnose_promoter_status.sql`
2. Check the output
3. Share the results if you need assistance

## ✅ Checklist

- [ ] Run diagnostic script
- [ ] Run fix migration
- [ ] Verify all promoters have status_enum
- [ ] Check metrics are accurate
- [ ] Clear application cache
- [ ] Restart application
- [ ] Verify dashboard shows correct numbers
- [ ] Review document compliance if needed

---

**Expected Time:** 5-10 minutes
**Risk Level:** Low (migration is non-destructive)
**Rollback Available:** Yes (see migration comments)
