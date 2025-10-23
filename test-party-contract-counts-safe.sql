-- Test query to verify party contract counts (SAFE VERSION)
-- This will show how many contracts each party has
-- Handles both TEXT and UUID data types safely

WITH party_contract_counts AS (
  SELECT 
    p.id,
    p.name_en,
    p.name_ar,
    p.type,
    
    -- Count as employer (always UUID)
    COUNT(DISTINCT CASE WHEN c.employer_id = p.id THEN c.id END) as employer_contracts,
    
    -- Count as client (always UUID)
    COUNT(DISTINCT CASE WHEN c.client_id = p.id THEN c.id END) as client_contracts,
    
    -- Count as first party (might be TEXT, cast safely)
    COUNT(DISTINCT CASE 
      WHEN (
        (c.first_party_id IS NOT NULL AND c.first_party_id::text = p.id::text)
      ) THEN c.id 
    END) as first_party_contracts,
    
    -- Count as second party (might be TEXT, cast safely)
    COUNT(DISTINCT CASE 
      WHEN (
        (c.second_party_id IS NOT NULL AND c.second_party_id::text = p.id::text)
      ) THEN c.id 
    END) as second_party_contracts,
    
    -- Total unique contracts (handling duplicates and type differences)
    COUNT(DISTINCT 
      CASE 
        WHEN c.employer_id = p.id OR 
             c.client_id = p.id OR 
             (c.first_party_id IS NOT NULL AND c.first_party_id::text = p.id::text) OR
             (c.second_party_id IS NOT NULL AND c.second_party_id::text = p.id::text)
        THEN c.id 
      END
    ) as total_contracts,
    
    -- Count active contracts only
    COUNT(DISTINCT 
      CASE 
        WHEN (
          c.employer_id = p.id OR 
          c.client_id = p.id OR 
          (c.first_party_id IS NOT NULL AND c.first_party_id::text = p.id::text) OR
          (c.second_party_id IS NOT NULL AND c.second_party_id::text = p.id::text)
        ) AND c.status IN ('active', 'pending', 'approved')
        THEN c.id 
      END
    ) as active_contracts
    
  FROM parties p
  LEFT JOIN contracts c ON (
    c.employer_id = p.id OR 
    c.client_id = p.id OR 
    (c.first_party_id IS NOT NULL AND c.first_party_id::text = p.id::text) OR
    (c.second_party_id IS NOT NULL AND c.second_party_id::text = p.id::text)
  )
  GROUP BY p.id, p.name_en, p.name_ar, p.type
)
SELECT 
  name_en,
  name_ar,
  type,
  employer_contracts,
  client_contracts,
  first_party_contracts,
  second_party_contracts,
  total_contracts,
  active_contracts,
  CASE 
    WHEN total_contracts = 0 THEN '❌ No contracts'
    WHEN total_contracts > 0 AND total_contracts < 5 THEN '⚠️ Few contracts'
    WHEN total_contracts >= 5 AND total_contracts < 20 THEN '✅ Normal'
    ELSE '🔥 High volume'
  END as status
FROM party_contract_counts
ORDER BY total_contracts DESC, name_en;

-- Summary statistics
SELECT 
  COUNT(*) as total_parties,
  SUM(CASE WHEN total_contracts = 0 THEN 1 ELSE 0 END) as parties_with_no_contracts,
  SUM(CASE WHEN total_contracts > 0 THEN 1 ELSE 0 END) as parties_with_contracts,
  SUM(total_contracts) as total_contracts_count,
  ROUND(AVG(total_contracts), 2) as avg_contracts_per_party,
  MAX(total_contracts) as max_contracts
FROM party_contract_counts;

