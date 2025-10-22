# Promoter Status Migration Results

## ✅ Migration Successful!

The migration ran successfully and all 114 promoters now have `status_enum` values.

## 📊 What We Found

### Non-Standard Status Values
Your database had some non-standard status values that couldn't be automatically mapped:

| Old Status | Count | Current Mapping | Recommended |
|-----------|-------|-----------------|-------------|
| `"?"` | ~8+ | `available` | ✅ Keep as available (safe default) |
| `"Cancel"` | ~2+ | `available` | ⚠️ Should be `terminated` |
| `"Office"` | ~1+ | `available` | ⚠️ Should be `inactive` or clarify meaning |

## 🔧 Next Steps

### Option 1: Apply Automatic Cleanup (Recommended)
Run the cleanup script to handle these special cases:

```sql
-- In Supabase SQL Editor
\i supabase/migrations/20251023_cleanup_special_statuses.sql
```

This will:
- Map `"Cancel"` → `terminated`
- Map `"Office"` → `inactive` (adjust if needed)
- Keep `"?"` as `available`

### Option 2: Manual Review
If you want to review each case individually:

```sql
-- See all promoters with non-standard status
SELECT 
  id,
  name_en,
  status as old_status,
  status_enum as new_status,
  employer_id
FROM promoters
WHERE status IN ('?', 'Cancel', 'Office')
ORDER BY status, name_en;

-- Update individually
UPDATE promoters 
SET status_enum = 'terminated'::promoter_status_enum 
WHERE id = 'promoter-id-here';
```

## 📈 Current Metrics

After the initial migration, your metrics should show:

```sql
SELECT * FROM get_promoter_metrics();
```

Expected results:
```
total_workforce: 114
active_on_contracts: 2
available_for_work: 110+ (most promoters)
on_leave: 0
inactive: 0-2
terminated: 0-2
```

## 🎯 Understanding Your Statuses

### What Each Status Means

**`"?"`** - Questionable/Unknown
- Likely promoters whose status was unclear
- **Recommended:** Set to `available` (default) or review individually

**`"Cancel"`** - Cancelled
- Promoters whose contracts were cancelled
- **Recommended:** Set to `terminated` if they left, or `available` if they can work again

**`"Office"`** - Office-based?
- Could mean internal staff or office workers
- **Recommended:** 
  - Set to `inactive` if they're not field promoters
  - Set to `available` if they can take assignments
  - Set to `active` if they're currently working

## 🚀 Quick Actions

### Apply Recommended Mappings
```sql
-- Cancel → Terminated
UPDATE promoters
SET status_enum = 'terminated'::promoter_status_enum
WHERE LOWER(status) = 'cancel';

-- Office → Inactive (change if needed)
UPDATE promoters
SET status_enum = 'inactive'::promoter_status_enum
WHERE LOWER(status) = 'office';

-- Verify
SELECT * FROM promoter_status_summary;
```

### Check Updated Metrics
```sql
SELECT * FROM get_promoter_metrics();
```

### View Dashboard
After applying changes, check your dashboard:
```
http://localhost:3000/en/dashboard
```

You should now see clear, accurate numbers! 🎉

## 🔍 Data Quality Notes

The "status mismatches" you're seeing are actually **good news** - they show:
1. ✅ The migration worked successfully
2. ✅ All promoters have a valid `status_enum`
3. ℹ️ Some old status values need clarification

These mismatches just mean your old data had custom status values that need to be mapped to the new standardized enum.

## 📞 Need Help?

### To understand what "Office" or "Cancel" means in your business:
1. Talk to your team about these status values
2. Decide on the correct mapping
3. Apply the updates

### Common Questions

**Q: Why were they all set to 'available'?**
A: This is the safest default. It's better to have promoters marked as available (and potentially assign them) than to incorrectly mark them as terminated or inactive.

**Q: What if I set the wrong status?**
A: Easy to fix! Just run an UPDATE:
```sql
UPDATE promoters 
SET status_enum = 'correct_status'::promoter_status_enum 
WHERE id = 'promoter-id';
```

**Q: Should I clean up the old status column?**
A: Not necessary, but you can normalize it:
```sql
UPDATE promoters SET status = status_enum::text;
```

## ✅ Checklist

- [x] Initial migration completed
- [x] All promoters have status_enum
- [ ] Review non-standard status values
- [ ] Apply cleanup script OR manual updates
- [ ] Verify metrics are accurate
- [ ] Check dashboard displays correctly
- [ ] Optionally: Normalize old status column

---

**Status:** Migration Successful ✅  
**Action Required:** Review and cleanup special status values  
**Time Required:** 5-10 minutes

