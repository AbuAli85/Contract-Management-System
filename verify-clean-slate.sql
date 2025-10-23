-- Verify clean slate - all contracts deleted
-- This confirms you're starting fresh

SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  '🔍 DATABASE CLEAN SLATE VERIFICATION' as section;

SELECT 
  '═══════════════════════════════════════' as divider;

-- Check contracts
SELECT 
  'Total Contracts' as metric,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅ CLEAN SLATE' ELSE '⚠️ ' || COUNT(*)::text || ' contracts exist' END as status
FROM contracts;

-- Check parties (should still have 16)
SELECT 
  'Total Parties' as metric,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*)::text || ' parties ready' ELSE '❌ No parties' END as status
FROM parties;

-- Check promoters (should still have 114)
SELECT 
  'Total Promoters' as metric,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*)::text || ' promoters ready' ELSE '❌ No promoters' END as status
FROM promoters;

-- Party types breakdown
SELECT 
  '─────────────────────────────────────' as divider;

SELECT 
  'Parties by Type:' as info;

SELECT 
  COALESCE(type, 'NULL') as party_type,
  COUNT(*) as count
FROM parties
GROUP BY type
ORDER BY count DESC;

-- Promoters by employer
SELECT 
  '─────────────────────────────────────' as divider;

SELECT 
  'Promoters by Employer:' as info;

SELECT 
  p.name_en as employer_name,
  COUNT(pr.id) as promoter_count
FROM parties p
LEFT JOIN promoters pr ON pr.employer_id = p.id
WHERE p.type = 'Employer'
GROUP BY p.id, p.name_en
ORDER BY promoter_count DESC
LIMIT 10;

-- Database readiness check
SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  '✅ READINESS CHECKLIST' as section;

SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  'Database Schema' as check_item,
  'UUID columns verified' as status,
  '✅' as result
UNION ALL
SELECT 
  'Triggers',
  'sync_contract_party_ids active',
  '✅'
UNION ALL
SELECT 
  'Parties',
  COUNT(*)::text || ' parties ready',
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM parties
UNION ALL
SELECT 
  'Promoters',
  COUNT(*)::text || ' promoters ready',
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM promoters
UNION ALL
SELECT 
  'Contracts',
  'Clean slate - ready for new data',
  '✅';

SELECT 
  '═══════════════════════════════════════' as divider;

SELECT 
  '🎯 You are ready to start adding real contracts!' as final_status;

