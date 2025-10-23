-- Promoter-Party Relationship Analysis
-- This shows how many promoters each party (employer) has

SELECT 
  p.id,
  p.name_en as party_name,
  p.type as party_type,
  COUNT(pr.id) as promoter_count,
  
  -- Count by promoter status
  COUNT(CASE WHEN pr.status = 'active' THEN 1 END) as active_promoters,
  COUNT(CASE WHEN pr.status IN ('inactive', 'Office', 'office') THEN 1 END) as inactive_promoters,
  COUNT(CASE WHEN pr.status IN ('Cancel', 'terminated') THEN 1 END) as terminated_promoters,
  COUNT(CASE WHEN pr.status IN ('?', 'available', 'V', 'IT') THEN 1 END) as other_status,
  
  -- Show which parties have the most active workforce
  ROUND(COUNT(CASE WHEN pr.status = 'active' THEN 1 END) * 100.0 / NULLIF(COUNT(pr.id), 0), 1) as active_percentage
  
FROM parties p
LEFT JOIN promoters pr ON pr.employer_id = p.id
WHERE p.type IN ('Employer', 'Generic')  -- Focus on employers
GROUP BY p.id, p.name_en, p.type
HAVING COUNT(pr.id) > 0  -- Only show parties with promoters
ORDER BY promoter_count DESC, active_promoters DESC;

-- Summary
SELECT 
  COUNT(DISTINCT employer_id) as parties_with_promoters,
  COUNT(*) as total_promoters,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_promoters,
  COUNT(CASE WHEN employer_id IS NULL THEN 1 END) as unassigned_promoters
FROM promoters;

-- Data Quality Check
SELECT 
  'Missing Employer' as issue,
  COUNT(*) as count
FROM promoters 
WHERE employer_id IS NULL

UNION ALL

SELECT 
  'Unclear Status' as issue,
  COUNT(*) as count
FROM promoters 
WHERE status IN ('?', 'V', 'IT')

UNION ALL

SELECT 
  'Missing Passport' as issue,
  COUNT(*) as count
FROM promoters 
WHERE passport_number IS NULL

UNION ALL

SELECT 
  'ID Expiring in 2025' as issue,
  COUNT(*) as count
FROM promoters 
WHERE id_card_expiry_date < '2026-01-01';

