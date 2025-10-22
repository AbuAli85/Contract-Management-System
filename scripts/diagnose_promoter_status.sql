-- =====================================================
-- Promoter Status Diagnostic Script
-- Run this to understand your current promoter data state
-- =====================================================

\echo '=== PROMOTER STATUS DIAGNOSTIC ==='
\echo ''

-- 1. Overall counts
\echo '1. OVERALL COUNTS'
\echo '─────────────────'
SELECT 
  'Total Promoters' as description,
  COUNT(*) as count
FROM promoters
UNION ALL
SELECT 
  'With status_enum set',
  COUNT(*)
FROM promoters
WHERE status_enum IS NOT NULL
UNION ALL
SELECT 
  'Without status_enum (NULL)',
  COUNT(*)
FROM promoters
WHERE status_enum IS NULL;

\echo ''
\echo '2. STATUS_ENUM DISTRIBUTION'
\echo '───────────────────────────'
SELECT 
  COALESCE(status_enum::text, 'NULL') as status_enum,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) || '%' as percentage
FROM promoters
GROUP BY status_enum
ORDER BY count DESC;

\echo ''
\echo '3. OLD STATUS COLUMN DISTRIBUTION'
\echo '──────────────────────────────────'
SELECT 
  COALESCE(status, 'NULL') as old_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) || '%' as percentage
FROM promoters
GROUP BY status
ORDER BY count DESC;

\echo ''
\echo '4. STATUS MAPPING (old → new)'
\echo '──────────────────────────────'
SELECT 
  COALESCE(status, 'NULL') as old_status,
  COALESCE(status_enum::text, 'NULL') as new_status,
  COUNT(*) as count
FROM promoters
GROUP BY status, status_enum
ORDER BY count DESC
LIMIT 20;

\echo ''
\echo '5. PROMOTERS WITH ACTIVE CONTRACTS'
\echo '───────────────────────────────────'
SELECT 
  'Unique promoters on contracts' as description,
  COUNT(DISTINCT promoter_id) as count
FROM contracts
WHERE status = 'active' AND promoter_id IS NOT NULL
UNION ALL
SELECT 
  'Total active contracts',
  COUNT(*)
FROM contracts
WHERE status = 'active' AND promoter_id IS NOT NULL;

\echo ''
\echo '6. STATUS OF PROMOTERS WITH ACTIVE CONTRACTS'
\echo '─────────────────────────────────────────────'
SELECT 
  COALESCE(p.status_enum::text, p.status, 'NULL') as promoter_status,
  COUNT(DISTINCT p.id) as unique_promoters,
  COUNT(c.id) as total_contracts
FROM promoters p
INNER JOIN contracts c ON c.promoter_id = p.id AND c.status = 'active'
GROUP BY COALESCE(p.status_enum::text, p.status, 'NULL')
ORDER BY unique_promoters DESC;

\echo ''
\echo '7. PROMOTERS NEEDING STATUS UPDATE'
\echo '───────────────────────────────────'
SELECT 
  p.id,
  p.name_en,
  p.status as old_status,
  p.status_enum as new_status,
  COUNT(c.id) as active_contracts
FROM promoters p
LEFT JOIN contracts c ON c.promoter_id = p.id AND c.status = 'active'
WHERE p.status_enum IS NULL
GROUP BY p.id, p.name_en, p.status, p.status_enum
ORDER BY active_contracts DESC
LIMIT 10;

\echo ''
\echo '8. DOCUMENT COMPLIANCE'
\echo '──────────────────────'
WITH compliance AS (
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (
      WHERE id_card_expiry_date > CURRENT_DATE + INTERVAL '30 days'
        AND passport_expiry_date > CURRENT_DATE + INTERVAL '30 days'
    ) as fully_compliant,
    COUNT(*) FILTER (
      WHERE (id_card_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')
         OR (passport_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')
    ) as expiring_soon,
    COUNT(*) FILTER (
      WHERE id_card_expiry_date < CURRENT_DATE
         OR passport_expiry_date < CURRENT_DATE
    ) as expired,
    COUNT(*) FILTER (
      WHERE id_card_expiry_date IS NULL OR passport_expiry_date IS NULL
    ) as missing_dates
  FROM promoters
)
SELECT 
  'Fully Compliant' as status,
  fully_compliant as count,
  ROUND(fully_compliant * 100.0 / NULLIF(total, 0), 2) || '%' as percentage
FROM compliance
UNION ALL
SELECT 
  'Expiring Soon (30 days)',
  expiring_soon,
  ROUND(expiring_soon * 100.0 / NULLIF(total, 0), 2) || '%'
FROM compliance
UNION ALL
SELECT 
  'Expired',
  expired,
  ROUND(expired * 100.0 / NULLIF(total, 0), 2) || '%'
FROM compliance
UNION ALL
SELECT 
  'Missing Dates',
  missing_dates,
  ROUND(missing_dates * 100.0 / NULLIF(total, 0), 2) || '%'
FROM compliance;

\echo ''
\echo '9. COMPREHENSIVE METRICS'
\echo '────────────────────────'
SELECT * FROM get_promoter_metrics();

\echo ''
\echo '10. RECOMMENDATIONS'
\echo '───────────────────'
DO $$
DECLARE
  null_count INT;
  mismatch_count INT;
  working_without_active_status INT;
BEGIN
  -- Count nulls
  SELECT COUNT(*) INTO null_count 
  FROM promoters 
  WHERE status_enum IS NULL;
  
  -- Count mismatches
  SELECT COUNT(*) INTO mismatch_count
  FROM promoters
  WHERE status IS NOT NULL 
    AND status_enum IS NOT NULL 
    AND LOWER(status) != status_enum::text;
  
  -- Count promoters with contracts but not marked as active
  SELECT COUNT(DISTINCT p.id) INTO working_without_active_status
  FROM promoters p
  INNER JOIN contracts c ON c.promoter_id = p.id AND c.status = 'active'
  WHERE COALESCE(p.status_enum::text, p.status) != 'active';
  
  RAISE NOTICE '';
  RAISE NOTICE '=== RECOMMENDATIONS ===';
  RAISE NOTICE '';
  
  IF null_count > 0 THEN
    RAISE NOTICE '⚠️  % promoters have NULL status_enum', null_count;
    RAISE NOTICE '   → Run: UPDATE promoters SET status_enum = ''available''::promoter_status_enum WHERE status_enum IS NULL;';
    RAISE NOTICE '';
  END IF;
  
  IF mismatch_count > 0 THEN
    RAISE NOTICE '⚠️  % promoters have mismatched old and new status', mismatch_count;
    RAISE NOTICE '   → Review with: SELECT * FROM promoters_status_review WHERE status_check LIKE ''⚠️%%'';';
    RAISE NOTICE '';
  END IF;
  
  IF working_without_active_status > 0 THEN
    RAISE NOTICE '⚠️  % promoters have active contracts but status is not ''active''', working_without_active_status;
    RAISE NOTICE '   → Consider updating their status to reflect current work';
    RAISE NOTICE '';
  END IF;
  
  IF null_count = 0 AND mismatch_count = 0 THEN
    RAISE NOTICE '✅ All promoters have valid status_enum values!';
    RAISE NOTICE '';
  END IF;
END $$;

\echo ''
\echo '=== END OF DIAGNOSTIC ==='

