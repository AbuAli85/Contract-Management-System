-- Migration: Add rejected and extended statuses to contracts status constraint
-- Date: 2025-11-16
-- Description: Update contracts status constraint to include rejected, approved, processing, generated, and soon-to-expire statuses

-- Drop the existing constraint
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;

-- Add the new constraint with all commonly used statuses
ALTER TABLE contracts 
ADD CONSTRAINT contracts_status_check 
CHECK (status IN (
  -- Core workflow statuses
  'draft', 
  'pending', 
  'approved',
  'active', 
  'completed', 
  'terminated', 
  'expired',
  'rejected',
  -- Approval workflow statuses
  'legal_review', 
  'hr_review', 
  'final_approval', 
  'signature',
  -- Processing statuses
  'processing',
  'generated',
  'soon-to-expire'
));

-- Update any existing contracts with invalid status values to 'pending'
UPDATE contracts 
SET status = 'pending' 
WHERE status NOT IN (
  'draft', 
  'pending', 
  'approved',
  'active', 
  'completed', 
  'terminated', 
  'expired',
  'rejected',
  'legal_review', 
  'hr_review', 
  'final_approval', 
  'signature',
  'processing',
  'generated',
  'soon-to-expire'
);

-- Add comment for documentation
COMMENT ON CONSTRAINT contracts_status_check ON contracts IS 'Contract status constraint - includes all workflow, approval, and processing statuses';

