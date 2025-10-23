-- Final test query - All columns are now UUID!
-- This will show the actual contract counts for each party

-- Query 1: Detailed party contract counts
WITH party_contract_counts AS (
  SELECT 
    p.id,
    p.name_en,
    p.name_ar,
    p.type,
    p.crn,
    
    -- Count as employer (clean UUID comparison)
    COUNT(DISTINCT CASE WHEN c.employer_id = p.id THEN c.id END) as employer_contracts,
    
    -- Count as client (clean UUID comparison)
    COUNT(DISTINCT CASE WHEN c.client_id = p.id THEN c.id END) as client_contracts,
    
    -- Count as first party (NOW UUID - no casting needed!)
    COUNT(DISTINCT CASE WHEN c.first_party_id = p.id THEN c.id END) as first_party_contracts,
    
    -- Count as second party (NOW UUID - no casting needed!)
    COUNT(DISTINCT CASE WHEN c.second_party_id = p.id THEN c.id END) as second_party_contracts,
    
    -- Total unique contracts
    COUNT(DISTINCT 
      CASE 
        WHEN c.employer_id = p.id OR c.client_id = p.id OR 
             c.first_party_id = p.id OR c.second_party_id = p.id 
        THEN c.id 
      END
    ) as total_contracts,
    
    -- Active contracts only
    COUNT(DISTINCT 
      CASE 
        WHEN (c.employer_id = p.id OR c.client_id = p.id OR 
              c.first_party_id = p.id OR c.second_party_id = p.id)
             AND c.status IN ('active', 'pending', 'approved')
        THEN c.id 
      END
    ) as active_contracts
    
  FROM parties p
  LEFT JOIN contracts c ON (
    c.employer_id = p.id OR 
    c.client_id = p.id OR 
    c.first_party_id = p.id OR 
    c.second_party_id = p.id
  )
  GROUP BY p.id, p.name_en, p.name_ar, p.type, p.crn
)
SELECT 
  name_en as "Party Name",
  type as "Type",
  crn as "CRN",
  employer_contracts as "As Employer",
  client_contracts as "As Client",
  first_party_contracts as "As First Party",
  second_party_contracts as "As Second Party",
  total_contracts as "Total Contracts",
  active_contracts as "Active Contracts",
  CASE 
    WHEN total_contracts = 0 THEN '❌ No contracts'
    WHEN total_contracts > 0 AND total_contracts < 10 THEN '✅ Few'
    WHEN total_contracts >= 10 AND total_contracts < 50 THEN '🔥 Normal'
    ELSE '⭐ High Volume'
  END as "Status"
FROM party_contract_counts
ORDER BY total_contracts DESC, name_en;

-- Query 2: Summary statistics
WITH party_contract_counts AS (
  SELECT 
    p.id,
    COUNT(DISTINCT 
      CASE 
        WHEN c.employer_id = p.id OR c.client_id = p.id OR 
             c.first_party_id = p.id OR c.second_party_id = p.id 
        THEN c.id 
      END
    ) as total_contracts,
    COUNT(DISTINCT 
      CASE 
        WHEN (c.employer_id = p.id OR c.client_id = p.id OR 
              c.first_party_id = p.id OR c.second_party_id = p.id)
             AND c.status IN ('active', 'pending', 'approved')
        THEN c.id 
      END
    ) as active_contracts
  FROM parties p
  LEFT JOIN contracts c ON (
    c.employer_id = p.id OR 
    c.client_id = p.id OR 
    c.first_party_id = p.id OR 
    c.second_party_id = p.id
  )
  GROUP BY p.id
)
SELECT 
  '📊 SUMMARY STATISTICS' as section,
  '─────────────────────' as separator;

WITH party_contract_counts AS (
  SELECT 
    p.id,
    COUNT(DISTINCT 
      CASE 
        WHEN c.employer_id = p.id OR c.client_id = p.id OR 
             c.first_party_id = p.id OR c.second_party_id = p.id 
        THEN c.id 
      END
    ) as total_contracts,
    COUNT(DISTINCT 
      CASE 
        WHEN (c.employer_id = p.id OR c.client_id = p.id OR 
              c.first_party_id = p.id OR c.second_party_id = p.id)
             AND c.status IN ('active', 'pending', 'approved')
        THEN c.id 
      END
    ) as active_contracts
  FROM parties p
  LEFT JOIN contracts c ON (
    c.employer_id = p.id OR 
    c.client_id = p.id OR 
    c.first_party_id = p.id OR 
    c.second_party_id = p.id
  )
  GROUP BY p.id
)
SELECT 
  'Total Parties' as metric,
  COUNT(*)::text as value
FROM party_contract_counts
UNION ALL
SELECT 
  'Parties With Contracts',
  SUM(CASE WHEN total_contracts > 0 THEN 1 ELSE 0 END)::text
FROM party_contract_counts
UNION ALL
SELECT 
  'Parties Without Contracts',
  SUM(CASE WHEN total_contracts = 0 THEN 1 ELSE 0 END)::text
FROM party_contract_counts
UNION ALL
SELECT 
  'Total Contracts',
  SUM(total_contracts)::text
FROM party_contract_counts
UNION ALL
SELECT 
  'Total Active Contracts',
  SUM(active_contracts)::text
FROM party_contract_counts
UNION ALL
SELECT 
  'Average Contracts per Party',
  ROUND(AVG(total_contracts), 2)::text
FROM party_contract_counts
UNION ALL
SELECT 
  'Most Contracts (Single Party)',
  MAX(total_contracts)::text
FROM party_contract_counts;

-- Query 3: Top 5 Parties by Contract Volume
SELECT 
  '🏆 TOP 5 PARTIES BY CONTRACTS' as section,
  '─────────────────────────────' as separator;

WITH party_contract_counts AS (
  SELECT 
    p.id,
    p.name_en,
    COUNT(DISTINCT 
      CASE 
        WHEN c.employer_id = p.id OR c.client_id = p.id OR 
             c.first_party_id = p.id OR c.second_party_id = p.id 
        THEN c.id 
      END
    ) as total_contracts,
    COUNT(DISTINCT 
      CASE 
        WHEN (c.employer_id = p.id OR c.client_id = p.id OR 
              c.first_party_id = p.id OR c.second_party_id = p.id)
             AND c.status IN ('active', 'pending', 'approved')
        THEN c.id 
      END
    ) as active_contracts
  FROM parties p
  LEFT JOIN contracts c ON (
    c.employer_id = p.id OR 
    c.client_id = p.id OR 
    c.first_party_id = p.id OR 
    c.second_party_id = p.id
  )
  GROUP BY p.id, p.name_en
)
SELECT 
  ROW_NUMBER() OVER (ORDER BY total_contracts DESC) as rank,
  name_en as party_name,
  total_contracts,
  active_contracts,
  (total_contracts - active_contracts) as inactive_contracts
FROM party_contract_counts
WHERE total_contracts > 0
ORDER BY total_contracts DESC
LIMIT 5;
