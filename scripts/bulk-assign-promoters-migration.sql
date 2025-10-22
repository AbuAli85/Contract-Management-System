-- Migration script to help bulk assign promoters to existing contracts
-- This creates a temporary view to identify contracts that need promoter assignment

-- Create a view to show contracts missing promoters
CREATE OR REPLACE VIEW contracts_without_promoters AS
SELECT 
  c.id,
  c.contract_number,
  c.title,
  c.start_date,
  c.end_date,
  c.status,
  fp.name_en AS first_party_name,
  sp.name_en AS second_party_name,
  c.created_at
FROM contracts c
LEFT JOIN parties fp ON c.first_party_id = fp.id
LEFT JOIN parties sp ON c.second_party_id = sp.id
WHERE c.promoter_id IS NULL
ORDER BY c.created_at DESC;

-- Create a view to show available promoters for assignment
CREATE OR REPLACE VIEW available_promoters AS
SELECT 
  p.id,
  p.name_en,
  p.name_ar,
  p.email,
  p.mobile_number,
  p.status,
  COUNT(c.id) AS current_contracts_count
FROM promoters p
LEFT JOIN contracts c ON p.id = c.promoter_id
WHERE p.status = 'active'
GROUP BY p.id, p.name_en, p.name_ar, p.email, p.mobile_number, p.status
ORDER BY current_contracts_count ASC, p.name_en ASC;

-- Function to bulk assign a promoter to multiple contracts
CREATE OR REPLACE FUNCTION bulk_assign_promoter(
  p_promoter_id UUID,
  p_contract_ids UUID[]
)
RETURNS TABLE (
  updated_count INTEGER,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Verify promoter exists
  IF NOT EXISTS (SELECT 1 FROM promoters WHERE id = p_promoter_id) THEN
    RETURN QUERY SELECT 0, FALSE, 'Promoter ID not found';
    RETURN;
  END IF;

  -- Update contracts
  UPDATE contracts
  SET 
    promoter_id = p_promoter_id,
    updated_at = NOW()
  WHERE id = ANY(p_contract_ids)
    AND promoter_id IS NULL; -- Only update contracts without a promoter
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_updated_count, TRUE, 
    format('Successfully assigned promoter to %s contracts', v_updated_count);
END;
$$ LANGUAGE plpgsql;

-- Example usage (commented out):
-- SELECT * FROM bulk_assign_promoter(
--   '08558bc7-d026-43e4-b69d-1bd73a17b5da'::UUID,  -- promoter_id
--   ARRAY['contract-id-1', 'contract-id-2']::UUID[]  -- array of contract IDs
-- );

COMMENT ON VIEW contracts_without_promoters IS 
'Shows all contracts that do not have a promoter assigned. Use this to identify contracts needing assignment.';

COMMENT ON VIEW available_promoters IS 
'Shows active promoters with their current contract count. Use this to find promoters for assignment.';

COMMENT ON FUNCTION bulk_assign_promoter IS 
'Bulk assigns a promoter to multiple contracts. Only updates contracts that do not already have a promoter.';

