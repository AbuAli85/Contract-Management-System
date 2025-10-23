-- Migration: Complete Contract Workflow
-- Date: 2025-01-25
-- Purpose: Ensure complete contract workflow: pending → approved → active → expired

-- ========================================
-- 1. Update status constraint to include all workflow statuses
-- ========================================
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;

ALTER TABLE contracts 
ADD CONSTRAINT contracts_status_check 
CHECK (status IN (
  'draft',        -- Initial creation state
  'pending',      -- Awaiting admin approval
  'approved',     -- Approved by admin, ready to start
  'active',       -- Currently active (on/after start_date)
  'completed',    -- Successfully completed
  'terminated',   -- Terminated before completion
  'expired',      -- Past end_date
  'rejected'      -- Rejected during approval
));

-- ========================================
-- 2. Ensure all tracking columns exist
-- ========================================
DO $$ 
BEGIN
    -- Approval tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'approved_by') THEN
        ALTER TABLE contracts ADD COLUMN approved_by UUID REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'approved_at') THEN
        ALTER TABLE contracts ADD COLUMN approved_at TIMESTAMPTZ;
    END IF;
    
    -- Rejection tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'rejected_by') THEN
        ALTER TABLE contracts ADD COLUMN rejected_by UUID REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'rejected_at') THEN
        ALTER TABLE contracts ADD COLUMN rejected_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'rejection_reason') THEN
        ALTER TABLE contracts ADD COLUMN rejection_reason TEXT;
    END IF;
    
    -- Change request tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'changes_requested_by') THEN
        ALTER TABLE contracts ADD COLUMN changes_requested_by UUID REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'changes_requested_at') THEN
        ALTER TABLE contracts ADD COLUMN changes_requested_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'changes_requested_reason') THEN
        ALTER TABLE contracts ADD COLUMN changes_requested_reason TEXT;
    END IF;
    
    -- Submission tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'submitted_for_review_at') THEN
        ALTER TABLE contracts ADD COLUMN submitted_for_review_at TIMESTAMPTZ;
    END IF;
END $$;

-- ========================================
-- 3. Create indexes for workflow queries
-- ========================================
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_approved_by ON contracts(approved_by);
CREATE INDEX IF NOT EXISTS idx_contracts_approved_at ON contracts(approved_at);
CREATE INDEX IF NOT EXISTS idx_contracts_rejected_by ON contracts(rejected_by);
CREATE INDEX IF NOT EXISTS idx_contracts_pending_review ON contracts(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_contracts_approved ON contracts(status) WHERE status = 'approved';

-- ========================================
-- 4. Add helpful comments
-- ========================================
COMMENT ON COLUMN contracts.status IS 'Contract workflow status: draft → pending → approved → active → expired/completed/terminated';
COMMENT ON COLUMN contracts.approved_by IS 'User who approved this contract';
COMMENT ON COLUMN contracts.approved_at IS 'Timestamp when contract was approved';
COMMENT ON COLUMN contracts.rejected_by IS 'User who rejected this contract';
COMMENT ON COLUMN contracts.rejected_at IS 'Timestamp when contract was rejected';
COMMENT ON COLUMN contracts.rejection_reason IS 'Reason for contract rejection';
COMMENT ON COLUMN contracts.changes_requested_by IS 'User who requested changes';
COMMENT ON COLUMN contracts.changes_requested_at IS 'Timestamp when changes were requested';
COMMENT ON COLUMN contracts.changes_requested_reason IS 'Details about requested changes';
COMMENT ON COLUMN contracts.submitted_for_review_at IS 'Timestamp when contract was submitted for review';

-- ========================================
-- 5. Update existing contracts to proper workflow states
-- ========================================

-- Contracts that are 'draft' or have invalid status → set to 'pending'
UPDATE contracts 
SET 
  status = 'pending',
  submitted_for_review_at = COALESCE(submitted_for_review_at, created_at)
WHERE status NOT IN ('draft', 'pending', 'approved', 'active', 'completed', 'terminated', 'expired', 'rejected');

-- Contracts marked as 'active' but have no approval record → set to 'pending'
UPDATE contracts 
SET 
  status = 'pending',
  submitted_for_review_at = COALESCE(submitted_for_review_at, created_at)
WHERE status = 'active' 
  AND approved_by IS NULL 
  AND approved_at IS NULL
  AND created_at > NOW() - INTERVAL '60 days'; -- Only recent contracts

-- ========================================
-- 6. Create function to auto-update contract status based on dates
-- ========================================
CREATE OR REPLACE FUNCTION update_contract_status_based_on_dates()
RETURNS void AS $$
BEGIN
  -- Update approved contracts to active if start_date has passed
  UPDATE contracts
  SET status = 'active'
  WHERE status = 'approved'
    AND start_date IS NOT NULL
    AND start_date <= CURRENT_DATE;
  
  -- Update active contracts to expired if end_date has passed
  UPDATE contracts
  SET status = 'expired'
  WHERE status = 'active'
    AND end_date IS NOT NULL
    AND end_date < CURRENT_DATE;
    
  -- Log the update
  RAISE NOTICE 'Contract statuses updated based on dates at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. Create a view for pending contracts dashboard
-- ========================================
CREATE OR REPLACE VIEW pending_contracts_view AS
SELECT 
  c.*,
  u.email as created_by_email,
  u.full_name as created_by_name,
  EXTRACT(DAY FROM (NOW() - c.submitted_for_review_at)) as days_pending
FROM contracts c
LEFT JOIN users u ON c.created_by = u.id
WHERE c.status = 'pending'
ORDER BY c.submitted_for_review_at ASC;

COMMENT ON VIEW pending_contracts_view IS 'All contracts awaiting approval with creator info and pending duration';

-- ========================================
-- 8. Create a view for approved contracts dashboard
-- ========================================
CREATE OR REPLACE VIEW approved_contracts_view AS
SELECT 
  c.*,
  u.email as approved_by_email,
  u.full_name as approved_by_name,
  EXTRACT(DAY FROM (c.start_date - CURRENT_DATE)) as days_until_start
FROM contracts c
LEFT JOIN users u ON c.approved_by = u.id
WHERE c.status = 'approved'
ORDER BY c.start_date ASC;

COMMENT ON VIEW approved_contracts_view IS 'All approved contracts awaiting activation with approver info';

-- ========================================
-- 9. Grant permissions on views
-- ========================================
GRANT SELECT ON pending_contracts_view TO authenticated;
GRANT SELECT ON approved_contracts_view TO authenticated;

