-- Run this script in Supabase SQL Editor to add missing columns
-- This will fix the "Could not find the 'approval_status' column" error

-- Add approval_status column to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' 
CHECK (approval_status IN ('pending', 'legal_review', 'hr_review', 'final_approval', 'signature', 'active', 'rejected', 'cancelled'));

-- Add missing columns for contract actions
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS changes_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS changes_requested_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS changes_requested_reason TEXT,
ADD COLUMN IF NOT EXISTS sent_to_legal_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sent_to_legal_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS sent_to_hr_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sent_to_hr_by UUID REFERENCES auth.users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_approval_status ON contracts(approval_status);
CREATE INDEX IF NOT EXISTS idx_contracts_status_approval ON contracts(status, approval_status);
CREATE INDEX IF NOT EXISTS idx_contracts_approved_by ON contracts(approved_by);
CREATE INDEX IF NOT EXISTS idx_contracts_rejected_by ON contracts(rejected_by);
CREATE INDEX IF NOT EXISTS idx_contracts_changes_requested_by ON contracts(changes_requested_by);
CREATE INDEX IF NOT EXISTS idx_contracts_sent_to_legal_by ON contracts(sent_to_legal_by);
CREATE INDEX IF NOT EXISTS idx_contracts_sent_to_hr_by ON contracts(sent_to_hr_by);

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

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contracts' 
  AND table_schema = 'public'
  AND column_name IN ('approval_status', 'approved_at', 'approved_by', 'rejected_at', 'rejected_by', 'rejection_reason', 'changes_requested_at', 'changes_requested_by', 'changes_requested_reason', 'sent_to_legal_at', 'sent_to_legal_by', 'sent_to_hr_at', 'sent_to_hr_by')
ORDER BY column_name;
