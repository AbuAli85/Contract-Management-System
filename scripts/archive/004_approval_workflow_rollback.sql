-- Rollback: Approval Workflow Schema
-- Description: Reverts approval workflow tables and contract table changes
-- Date: 2024-01-XX
-- Author: System

-- 1. Drop triggers first
DROP TRIGGER IF EXISTS trigger_approval_status_change ON contracts;

-- 2. Drop functions
DROP FUNCTION IF EXISTS log_approval_status_change();
DROP FUNCTION IF EXISTS update_contract_approval_status(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS get_next_reviewer(UUID, TEXT);

-- 3. Drop tables (in reverse order due to foreign key constraints)
DROP TABLE IF EXISTS contract_approvals CASCADE;
DROP TABLE IF EXISTS reviewer_roles CASCADE;
DROP TABLE IF EXISTS workflow_config CASCADE;

-- 4. Remove columns from contracts table
ALTER TABLE contracts 
DROP COLUMN IF EXISTS approval_status,
DROP COLUMN IF EXISTS current_reviewer_id,
DROP COLUMN IF EXISTS submitted_for_review_at,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS rejected_at,
DROP COLUMN IF EXISTS rejection_reason,
DROP COLUMN IF EXISTS workflow_version;

-- 5. Drop indexes
DROP INDEX IF EXISTS idx_contracts_approval_status;
DROP INDEX IF EXISTS idx_contracts_current_reviewer;
DROP INDEX IF EXISTS idx_contracts_submitted_at;
DROP INDEX IF EXISTS idx_contracts_workflow_version;

-- Rollback completed successfully
SELECT 'Approval workflow schema rollback completed successfully' as status; 