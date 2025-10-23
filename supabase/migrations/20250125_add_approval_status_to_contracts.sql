-- Migration: Add approval_status column to contracts table
-- Date: 2025-01-25
-- Description: Add approval_status column to support contract approval workflow

-- Add approval_status column to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' 
CHECK (approval_status IN ('pending', 'legal_review', 'hr_review', 'final_approval', 'signature', 'active', 'rejected', 'cancelled'));

-- Create index for faster approval status queries
CREATE INDEX IF NOT EXISTS idx_contracts_approval_status ON contracts(approval_status);

-- Create composite index for status and approval_status queries
CREATE INDEX IF NOT EXISTS idx_contracts_status_approval ON contracts(status, approval_status);

-- Add comment for documentation
COMMENT ON COLUMN contracts.approval_status IS 'Contract approval workflow status';

-- Update existing contracts to have proper approval status
UPDATE contracts 
SET approval_status = CASE 
  WHEN status = 'active' THEN 'active'
  WHEN status = 'completed' THEN 'active'
  WHEN status = 'terminated' THEN 'cancelled'
  WHEN status = 'expired' THEN 'cancelled'
  ELSE 'pending'
END
WHERE approval_status IS NULL OR approval_status = 'pending';
