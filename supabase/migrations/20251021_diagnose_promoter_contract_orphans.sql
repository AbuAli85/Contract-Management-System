-- Diagnostic Query: Find promoters with employer_id but no contracts
-- This identifies data integrity issues where active promoters are assigned but have zero contracts

-- Step 1: Find promoters with employer_id but no contracts
SELECT 
    p.id as promoter_id,
    p.name_en,
    p.name_ar,
    p.status,
    p.employer_id,
    employer.name_en as employer_name,
    p.job_title,
    p.mobile_number,
    COUNT(c.id) as contract_count,
    p.created_at as promoter_created_at
FROM promoters p
LEFT JOIN parties employer ON employer.id = p.employer_id
LEFT JOIN contracts c ON c.promoter_id::uuid = p.id
WHERE p.status = 'active'
  AND p.employer_id IS NOT NULL
GROUP BY p.id, p.name_en, p.name_ar, p.status, p.employer_id, employer.name_en, p.job_title, p.mobile_number, p.created_at
HAVING COUNT(c.id) = 0
ORDER BY p.created_at DESC;

-- Step 2: Summary statistics
SELECT 
    'Total Active Promoters' as metric,
    COUNT(*) as count
FROM promoters
WHERE status = 'active'
UNION ALL
SELECT 
    'Active with Employer' as metric,
    COUNT(*) as count
FROM promoters
WHERE status = 'active' AND employer_id IS NOT NULL
UNION ALL
SELECT 
    'Active with Employer but NO Contracts' as metric,
    COUNT(DISTINCT p.id) as count
FROM promoters p
LEFT JOIN contracts c ON c.promoter_id::uuid = p.id
WHERE p.status = 'active' 
  AND p.employer_id IS NOT NULL
  AND c.id IS NULL;

-- Step 3: Check for contract-promoter mismatches (contracts pointing to non-existent promoters)
SELECT 
    c.id as contract_id,
    c.contract_number,
    c.promoter_id,
    c.status as contract_status,
    CASE 
        WHEN p.id IS NULL THEN 'ORPHANED - No Promoter Found'
        ELSE 'OK'
    END as integrity_status
FROM contracts c
LEFT JOIN promoters p ON p.id = c.promoter_id::uuid
WHERE c.promoter_id IS NOT NULL
  AND p.id IS NULL;

-- Step 4: Find promoters with mismatched employer_id (promoter.employer_id != contract.employer_id)
SELECT 
    p.id as promoter_id,
    p.name_en,
    p.employer_id as promoter_employer_id,
    p_employer.name_en as promoter_employer_name,
    c.id as contract_id,
    c.contract_number,
    c.employer_id as contract_employer_id,
    c_employer.name_en as contract_employer_name,
    c.status as contract_status
FROM promoters p
INNER JOIN contracts c ON c.promoter_id::uuid = p.id
LEFT JOIN parties p_employer ON p_employer.id = p.employer_id
LEFT JOIN parties c_employer ON c_employer.id = c.employer_id
WHERE p.employer_id IS NOT NULL
  AND c.employer_id IS NOT NULL
  AND p.employer_id != c.employer_id
  AND c.status IN ('active', 'pending')
ORDER BY p.name_en;

