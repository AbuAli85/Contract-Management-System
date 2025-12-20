-- ============================================================================
-- ROLLBACK EMAIL CHANGES (IF NEEDED)
-- ============================================================================
-- This script restores original emails if you need to undo the changes
-- ============================================================================

-- Restore original emails
UPDATE promoters
SET email = original_email,
    updated_at = NOW()
WHERE original_email IS NOT NULL
  AND email != original_email;

-- Verify rollback
DO $$
DECLARE
  v_restored_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_restored_count
  FROM promoters
  WHERE original_email IS NOT NULL
    AND email = original_email;
  
  RAISE NOTICE 'Emails restored to original values: % records', v_restored_count;
END $$;

