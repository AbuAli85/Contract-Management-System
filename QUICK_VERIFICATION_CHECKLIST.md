# Promoter Intelligence Hub - Quick Verification Checklist

## 🎯 How to Verify Fixes

### 1. Open the Promoters Page
```
https://portal.thesmartpro.io/en/promoters
```

### 2. Check Browser Console
Open Developer Tools (F12) and look for these logs:

#### ✅ Good Signs (What You Should See)
```
✅ Using system-wide metrics from API: {total: 150, active: 120, ...}
📡 API Response: {status: 200, ok: true}
✅ Successfully fetched promoters: 20
```

#### ❌ Warning Signs (What Should NOT Appear)
```
⚠️ API metrics not available, using page-based calculation (may be inaccurate)
❌ API request failed: 500
❌ Error fetching promoters
```

### 3. Verify Metrics Consistency

| Test | Steps | Expected Result |
|------|-------|----------------|
| **Pagination Test** | Navigate between pages 1, 2, 3 | Metrics stay the same |
| **Filter Test** | Apply status filter "Active" | Total count stays the same, table data changes |
| **Search Test** | Search for a promoter name | Total count stays the same, filtered results show |
| **Refresh Test** | Click Refresh button | Metrics reload with current data |

### 4. Inspect Metrics Cards

Check these values are **realistic**:

- ✅ **Total Promoters**: Should match database count
- ✅ **Active Workforce**: Should be <= Total
- ✅ **Document Alerts**: Should be <= Total
- ✅ **Compliance Rate**: Should be between 0-100%

### 5. Analytics View Test

1. Click on "Analytics" tab
2. Wait for data to load
3. Verify:
   - ✅ Workforce summary shows all members
   - ✅ Charts display data correctly
   - ✅ No "Failed to fetch" errors

---

## 🔍 Common Issues & Solutions

### Issue: Metrics show 0 or incorrect values

**Diagnosis:**
```javascript
// Open browser console and run:
fetch('/api/dashboard/promoter-metrics')
  .then(r => r.json())
  .then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "metrics": {
    "total": 150,
    "active": 120,
    "critical": 5,
    "expiring": 10,
    "unassigned": 30,
    "complianceRate": 85
  },
  "timestamp": "2024-..."
}
```

**Solution:** If response shows `success: false`, check database connection and RPC function.

---

### Issue: Page loads but metrics don't update

**Diagnosis:**
- Check Network tab for `/api/dashboard/promoter-metrics` call
- Look for 429 (rate limit) or 500 (server error) status

**Solution:**
- If 429: Wait 60 seconds for rate limit reset
- If 500: Check server logs for database errors

---

### Issue: "On Assignments" shows 0 despite active contracts

**Diagnosis:**
```sql
-- Run in Supabase SQL Editor:
SELECT count_promoters_with_active_contracts();
```

**Expected Result:** Should return a number > 0 if contracts exist

**Solution:** If function doesn't exist, run the migration:
```
supabase/migrations/20251023_add_promoter_status_enum.sql
```

---

## 🧪 Database Verification Queries

### Check Total Promoters
```sql
SELECT COUNT(*) FROM promoters;
```

### Check Active Promoters
```sql
SELECT COUNT(*) FROM promoters WHERE status = 'active';
```

### Check Critical Documents
```sql
SELECT COUNT(*) FROM promoters 
WHERE id_card_expiry_date < NOW() 
   OR passport_expiry_date < NOW();
```

### Check Promoters on Contracts
```sql
SELECT COUNT(DISTINCT promoter_id) FROM contracts 
WHERE status = 'active' AND promoter_id IS NOT NULL;
```

---

## 🎨 Visual Checks

### Header Section
- [x] Title: "Promoter Intelligence Hub"
- [x] Badges show: Auto-refresh, Compliance %, Critical count, Companies
- [x] Buttons: "Add Promoter", "Import", "Refresh"

### Metrics Cards (4 cards)
1. **Total Promoters** - Blue card with Users icon
2. **Active Workforce** - Gray card with UserCheck icon  
3. **Document Alerts** - Red/Amber card with ShieldAlert icon
4. **Compliance Rate** - Green/Amber card with CheckCircle icon

### Data Table
- [x] Shows 20 rows by default
- [x] Pagination controls at bottom
- [x] Columns: Name, Status, Organization, Documents, Actions

---

## ✅ Final Checklist

Before marking as complete, verify:

- [ ] Metrics are consistent across pages
- [ ] No console errors (except expected API delays)
- [ ] Database queries return correct counts
- [ ] RPC function works (`count_promoters_with_active_contracts`)
- [ ] Analytics view loads complete workforce data
- [ ] Build completes without errors (`npm run build`)
- [ ] No TypeScript/ESLint warnings

---

## 📊 Expected vs Actual Metrics

Fill this in after testing:

| Metric | Database Count | UI Shows | ✅/❌ |
|--------|----------------|----------|------|
| Total Promoters | ___ | ___ | |
| Active | ___ | ___ | |
| Critical | ___ | ___ | |
| Expiring | ___ | ___ | |
| Unassigned | ___ | ___ | |
| Compliance Rate | ___% | ___% | |

---

## 🚨 Emergency Rollback

If issues persist, you can temporarily revert to page-based metrics:

```typescript
// In components/promoters/enhanced-promoters-view-refactored.tsx
// Comment out the API metrics block (lines 863-890)
// Uncomment the fallback block (lines 892-926)
```

**Note:** This should only be a temporary measure while investigating the root cause.

---

## 📞 Need Help?

1. **Check logs:** Browser console + Server logs
2. **Verify database:** Run SQL queries above
3. **Test API:** Use browser DevTools Network tab
4. **Review code:** Check files listed in PROMOTER_INTELLIGENCE_HUB_FIXES.md

Last Updated: {{ date }}
Status: Ready for Testing ✅

