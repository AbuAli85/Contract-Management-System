-- Migration: Add 'approved' status to contracts table
-- Date: 2025-01-25
-- Purpose: Support proper contract workflow with pending → approved → active → expired

-- Add 'approved' status to the existing CHECK constraint
ALTER TABLE contracts 
DROP CONSTRAINT IF EXISTS contracts_status_check;

ALTER TABLE contracts 
ADD CONSTRAINT contracts_status_check 
CHECK (status IN ('draft', 'pending', 'approved', 'active', 'completed', 'terminated', 'expired'));

-- Add approval tracking columns if they don't exist
DO $$ 
BEGIN
    -- Add approved_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'approved_by') THEN
        ALTER TABLE contracts ADD COLUMN approved_by UUID REFERENCES users(id);
    END IF;
    
    -- Add approved_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'approved_at') THEN
        ALTER TABLE contracts ADD COLUMN approved_at TIMESTAMPTZ;
    END IF;
    
    -- Add rejection_reason column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'rejection_reason') THEN
        ALTER TABLE contracts ADD COLUMN rejection_reason TEXT;
    END IF;
    
    -- Add rejected_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'rejected_by') THEN
        ALTER TABLE contracts ADD COLUMN rejected_by UUID REFERENCES users(id);
    END IF;
    
    -- Add rejected_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'rejected_at') THEN
        ALTER TABLE contracts ADD COLUMN rejected_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create indexes for approval workflow queries
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_approved_by ON contracts(approved_by);
CREATE INDEX IF NOT EXISTS idx_contracts_approved_at ON contracts(approved_at);
CREATE INDEX IF NOT EXISTS idx_contracts_rejected_by ON contracts(rejected_by);

-- Add comments for documentation
COMMENT ON COLUMN contracts.approved_by IS 'User who approved this contract';
COMMENT ON COLUMN contracts.approved_at IS 'Timestamp when contract was approved';
COMMENT ON COLUMN contracts.rejection_reason IS 'Reason for contract rejection';
COMMENT ON COLUMN contracts.rejected_by IS 'User who rejected this contract';
COMMENT ON COLUMN contracts.rejected_at IS 'Timestamp when contract was rejected';

-- Update existing contracts that are 'active' but should be 'pending' for proper workflow
-- This is a one-time migration for existing data
UPDATE contracts 
SET status = 'pending' 
WHERE status = 'active' 
  AND (approved_by IS NULL OR approved_at IS NULL)
  AND created_at > NOW() - INTERVAL '30 days'; -- Only recent contracts
