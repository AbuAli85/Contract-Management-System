-- Migration: Update contracts status enum to include approval workflow statuses
-- Date: 2025-01-25
-- Description: Add approval workflow statuses to contracts table

-- Drop the existing constraint
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;

-- Add the new constraint with approval workflow statuses
ALTER TABLE contracts 
ADD CONSTRAINT contracts_status_check 
CHECK (status IN (
  'draft', 
  'pending', 
  'legal_review', 
  'hr_review', 
  'final_approval', 
  'signature', 
  'active', 
  'completed', 
  'terminated', 
  'expired'
));

-- Update any existing contracts with invalid status values
UPDATE contracts 
SET status = 'pending' 
WHERE status NOT IN (
  'draft', 
  'pending', 
  'legal_review', 
  'hr_review', 
  'final_approval', 
  'signature', 
  'active', 
  'completed', 
  'terminated', 
  'expired'
);

-- Add comment for documentation
COMMENT ON COLUMN contracts.status IS 'Contract status including approval workflow stages';
