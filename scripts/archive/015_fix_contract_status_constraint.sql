-- Fix contract status constraint to include 'approved' status
-- This addresses the database constraint violation error

DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
  
  -- Add new constraint with 'approved' status included
  ALTER TABLE contracts ADD CONSTRAINT contracts_status_check 
    CHECK (status IN ('draft', 'active', 'pending', 'expired', 'generated', 'soon-to-expire', 'approved', 'rejected'));
    
  -- Update any existing contracts with 'approved' status to 'active' if needed
  UPDATE contracts 
  SET status = 'active' 
  WHERE status = 'approved' AND status NOT IN ('draft', 'active', 'pending', 'expired', 'generated', 'soon-to-expire', 'approved', 'rejected');
  
END $$;

-- Add comment to document the change
COMMENT ON CONSTRAINT contracts_status_check ON contracts IS 'Contract status constraint - allows draft, active, pending, expired, generated, soon-to-expire, approved, rejected'; 