-- Add 'processing' status to contracts table constraint
-- This allows the contract generation service to use 'processing' status

DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
  
  -- Add new constraint with 'processing' status included
  ALTER TABLE contracts ADD CONSTRAINT contracts_status_check 
    CHECK (status IN ('draft', 'pending', 'processing', 'active', 'expired', 'generated', 'soon-to-expire', 'approved', 'rejected'));
    
  -- Update any existing contracts with invalid status to 'draft'
  UPDATE contracts 
  SET status = 'draft' 
  WHERE status NOT IN ('draft', 'pending', 'processing', 'active', 'expired', 'generated', 'soon-to-expire', 'approved', 'rejected');
  
END $$;

-- Add comment to document the change
COMMENT ON CONSTRAINT contracts_status_check ON contracts IS 'Contract status constraint - allows draft, pending, processing, active, expired, generated, soon-to-expire, approved, rejected'; 