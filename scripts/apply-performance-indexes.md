# Database Performance Indexes - Application Guide

## Quick Start

### Option 1: Using Supabase CLI (Recommended)

```bash
# Navigate to project root
cd Contract-Management-System

# Apply migration
npx supabase migration up

# Verify indexes were created
npx supabase db remote execute --file scripts/verify-indexes.sql
```

### Option 2: Manual Application via Supabase Dashboard

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Navigate to **SQL Editor**

2. **Load Migration File**
   - Click **+ New query**
   - Copy entire contents from:
     `supabase/migrations/20251022_add_contracts_performance_indexes.sql`
   - Paste into editor

3. **Execute**
   - Click **Run** (or press Ctrl+Enter)
   - Wait for completion (should take 5-10 seconds)
   - Check for success message

4. **Verify**
   - Run verification query (see below)

---

## Verification

### Check Indexes Were Created

```sql
-- View all indexes on contracts table
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'contracts'
ORDER BY indexname;
```

**Expected Output:** You should see 10+ indexes, including:
- `idx_contracts_status`
- `idx_contracts_status_created_at`
- `idx_contracts_status_updated_at`
- `idx_contracts_first_party_id`
- `idx_contracts_second_party_id`
- `idx_contracts_promoter_id`
- `idx_contracts_client_id`
- `idx_contracts_employer_id`
- `idx_contracts_composite_parties`
- `idx_contracts_composite_status_dates`

---

## Performance Testing

### Test 1: Pending Contracts Query

```sql
-- Test query performance
EXPLAIN ANALYZE
SELECT * FROM contracts 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 20;
```

**What to Look For:**
- `Index Scan using idx_contracts_status_created_at` ✅
- Execution time < 100ms ✅
- NOT `Seq Scan on contracts` ❌

### Test 2: Multiple Status Filter

```sql
-- Test multi-status query
EXPLAIN ANALYZE
SELECT * FROM contracts 
WHERE status IN ('pending', 'legal_review', 'hr_review', 'final_approval', 'signature')
ORDER BY created_at DESC 
LIMIT 100;
```

**What to Look For:**
- `Index Scan` or `Bitmap Index Scan` ✅
- Execution time < 200ms ✅

### Test 3: User-Specific Query

```sql
-- Replace 'user-uuid' with actual user ID
EXPLAIN ANALYZE
SELECT * FROM contracts 
WHERE (first_party_id = 'user-uuid' OR second_party_id = 'user-uuid')
AND status = 'pending'
ORDER BY created_at DESC;
```

**What to Look For:**
- Uses `idx_contracts_composite_parties` or multiple indexes ✅
- Execution time < 150ms ✅

---

## Performance Benchmarks

### Before Indexes
- Pending contracts query: **3-10 seconds**
- Full table scan on large datasets
- High database CPU usage
- Poor user experience

### After Indexes
- Pending contracts query: **<100ms**
- Index scan only
- Minimal CPU usage
- Excellent user experience

### Expected Improvements
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Query Time | 3-10s | <100ms | 97%+ |
| CPU Usage | High | Low | 80%+ |
| Disk I/O | High | Minimal | 90%+ |
| User Wait | 10s | <1s | 90% |

---

## Troubleshooting

### Issue: Indexes Not Created

**Check for Errors:**
```sql
-- Check PostgreSQL logs
SELECT * FROM pg_stat_activity 
WHERE state = 'active';
```

**Common Causes:**
- Missing permissions
- Syntax errors (check PostgreSQL version compatibility)
- Existing locks on contracts table

**Solution:**
- Ensure you have superuser or table owner permissions
- Check for active transactions blocking the table
- Retry migration

---

### Issue: Indexes Created But Not Used

**Check Index Usage:**
```sql
-- Check if indexes are being used
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'contracts'
ORDER BY idx_scan DESC;
```

**Force Index Usage:**
```sql
-- Analyze table to update statistics
ANALYZE contracts;

-- Replan queries
DISCARD PLANS;
```

**Check Query Planner:**
```sql
-- Check planner configuration
SHOW enable_indexscan;
SHOW enable_bitmapscan;
SHOW enable_seqscan;
```

---

### Issue: Slow Queries Still Occurring

**Diagnose:**
1. Run `EXPLAIN ANALYZE` on slow query
2. Check if index is actually being used
3. Check for table bloat
4. Check for missing statistics

**Solutions:**

**Vacuum and Analyze:**
```sql
-- Clean up table and update statistics
VACUUM ANALYZE contracts;
```

**Check Table Bloat:**
```sql
-- Check for table bloat
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_live_tup,
  n_dead_tup
FROM pg_stat_user_tables
WHERE tablename = 'contracts';
```

**Rebuild Indexes (if needed):**
```sql
-- Only if indexes are corrupted or bloated
REINDEX TABLE contracts;
```

---

## Maintenance

### Regular Maintenance Tasks

**Weekly:**
```sql
-- Update statistics
ANALYZE contracts;
```

**Monthly:**
```sql
-- Clean up dead tuples
VACUUM contracts;

-- Update statistics
ANALYZE contracts;
```

**Quarterly:**
```sql
-- Full vacuum and reindex
VACUUM FULL contracts;
REINDEX TABLE contracts;
ANALYZE contracts;
```

### Monitoring

**Index Health Check:**
```sql
-- Monitor index usage
SELECT 
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE tablename = 'contracts'
ORDER BY idx_scan DESC;
```

**Unused Indexes:**
```sql
-- Find unused indexes (idx_scan = 0)
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE tablename = 'contracts'
AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## Rollback Plan

If you need to remove the indexes:

```sql
-- Drop all performance indexes
DROP INDEX IF EXISTS idx_contracts_status;
DROP INDEX IF EXISTS idx_contracts_status_created_at;
DROP INDEX IF EXISTS idx_contracts_status_updated_at;
DROP INDEX IF EXISTS idx_contracts_first_party_id;
DROP INDEX IF EXISTS idx_contracts_second_party_id;
DROP INDEX IF EXISTS idx_contracts_promoter_id;
DROP INDEX IF EXISTS idx_contracts_client_id;
DROP INDEX IF EXISTS idx_contracts_employer_id;
DROP INDEX IF EXISTS idx_contracts_composite_parties;
DROP INDEX IF EXISTS idx_contracts_composite_status_dates;

-- Update statistics
ANALYZE contracts;
```

**Note:** Only rollback if there are serious issues. Indexes generally improve performance significantly.

---

## Additional Resources

- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [Supabase Performance Tips](https://supabase.com/docs/guides/database/performance)
- [Query Optimization Guide](https://www.postgresql.org/docs/current/performance-tips.html)

---

## Support

If you encounter issues:

1. **Check Logs:** Review PostgreSQL logs in Supabase Dashboard
2. **Test Queries:** Run verification queries above
3. **Check Stats:** Monitor index usage statistics
4. **Contact Support:** Include query plans and error messages

---

## Checklist

- [ ] Migration file executed successfully
- [ ] All 10 indexes created
- [ ] Verification query shows indexes
- [ ] Test queries use index scans
- [ ] Query time < 100ms for pending contracts
- [ ] No errors in application logs
- [ ] Pending contracts page loads quickly
- [ ] No infinite spinners

---

**Status:** Ready for Production  
**Estimated Time:** 5-10 minutes  
**Risk Level:** Low (indexes are non-breaking)  
**Rollback Time:** <1 minute

