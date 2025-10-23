-- Migration: Add missing columns to contracts table for actions
-- Date: 2025-01-25
-- Description: Add columns needed for contract approval workflow actions

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
CREATE INDEX IF NOT EXISTS idx_contracts_approved_by ON contracts(approved_by);
CREATE INDEX IF NOT EXISTS idx_contracts_rejected_by ON contracts(rejected_by);
CREATE INDEX IF NOT EXISTS idx_contracts_changes_requested_by ON contracts(changes_requested_by);
CREATE INDEX IF NOT EXISTS idx_contracts_sent_to_legal_by ON contracts(sent_to_legal_by);
CREATE INDEX IF NOT EXISTS idx_contracts_sent_to_hr_by ON contracts(sent_to_hr_by);

-- Add comments for documentation
COMMENT ON COLUMN contracts.approved_at IS 'Timestamp when contract was approved';
COMMENT ON COLUMN contracts.approved_by IS 'User who approved the contract';
COMMENT ON COLUMN contracts.rejected_at IS 'Timestamp when contract was rejected';
COMMENT ON COLUMN contracts.rejected_by IS 'User who rejected the contract';
COMMENT ON COLUMN contracts.rejection_reason IS 'Reason for contract rejection';
COMMENT ON COLUMN contracts.changes_requested_at IS 'Timestamp when changes were requested';
COMMENT ON COLUMN contracts.changes_requested_by IS 'User who requested changes';
COMMENT ON COLUMN contracts.changes_requested_reason IS 'Reason for requested changes';
COMMENT ON COLUMN contracts.sent_to_legal_at IS 'Timestamp when sent to legal review';
COMMENT ON COLUMN contracts.sent_to_legal_by IS 'User who sent to legal review';
COMMENT ON COLUMN contracts.sent_to_hr_at IS 'Timestamp when sent to HR review';
COMMENT ON COLUMN contracts.sent_to_hr_by IS 'User who sent to HR review';
