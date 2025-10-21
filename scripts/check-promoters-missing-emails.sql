-- Check which promoters are missing email addresses
-- This script helps identify promoters that need their email addresses updated

-- Count promoters with missing or empty email addresses
SELECT 
  COUNT(*) as total_without_email,
  (SELECT COUNT(*) FROM promoters) as total_promoters,
  ROUND(
    (COUNT(*) * 100.0) / NULLIF((SELECT COUNT(*) FROM promoters), 0),
    2
  ) as percentage_missing
FROM promoters
WHERE email IS NULL OR TRIM(email) = '';

-- List promoters without email addresses (with name and ID for reference)
SELECT 
  id,
  COALESCE(name_en, name_ar, 'Unnamed') as name,
  COALESCE(mobile_number, phone, 'No phone') as contact,
  id_card_number,
  status,
  created_at,
  employer_id
FROM promoters
WHERE email IS NULL OR TRIM(email) = ''
ORDER BY created_at DESC
LIMIT 50;

-- Summary by status
SELECT 
  status,
  COUNT(*) as count_without_email,
  ROUND(
    (COUNT(*) * 100.0) / NULLIF(
      (SELECT COUNT(*) FROM promoters WHERE promoters.status = p.status),
      0
    ),
    2
  ) as percentage_of_status
FROM promoters p
WHERE email IS NULL OR TRIM(email) = ''
GROUP BY status
ORDER BY count_without_email DESC;

-- Recent promoters (last 30 days) without email
SELECT 
  id,
  COALESCE(name_en, name_ar, 'Unnamed') as name,
  created_at,
  status
FROM promoters
WHERE 
  (email IS NULL OR TRIM(email) = '')
  AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- EXAMPLE: How to update a promoter's email (DO NOT RUN automatically!)
-- UPDATE promoters 
-- SET email = 'promoter@example.com' 
-- WHERE id = 'your-promoter-id-here';

-- EXAMPLE: Bulk update pattern if you have a CSV with id,email pairs
-- (Requires manual review and approval before running!)
-- UPDATE promoters 
-- SET email = 'email_from_csv'
-- WHERE id = 'id_from_csv';

