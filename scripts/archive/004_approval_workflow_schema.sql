-- Migration: Approval Workflow Schema
-- Description: Adds approval workflow tables and updates contracts table
-- Date: 2024-01-XX
-- Author: System

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Update contracts table with approval workflow fields
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'draft' CHECK (approval_status IN ('draft', 'legal_review', 'hr_review', 'final_approval', 'signature', 'active', 'rejected')),
ADD COLUMN IF NOT EXISTS current_reviewer_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS workflow_version INTEGER DEFAULT 1;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_approval_status ON contracts(approval_status);
CREATE INDEX IF NOT EXISTS idx_contracts_current_reviewer ON contracts(current_reviewer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_submitted_at ON contracts(submitted_for_review_at);
CREATE INDEX IF NOT EXISTS idx_contracts_workflow_version ON contracts(workflow_version);

-- 2. Create contract_approvals table for audit trail
CREATE TABLE IF NOT EXISTS contract_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    review_stage VARCHAR(50) NOT NULL CHECK (review_stage IN ('legal_review', 'hr_review', 'final_approval', 'signature')),
    action VARCHAR(20) NOT NULL CHECK (action IN ('approved', 'rejected', 'requested_changes')),
    comments TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one approval per reviewer per stage per contract
    UNIQUE(contract_id, reviewer_id, review_stage)
);

-- Add indexes for contract_approvals
CREATE INDEX IF NOT EXISTS idx_contract_approvals_contract_id ON contract_approvals(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_approvals_reviewer_id ON contract_approvals(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_contract_approvals_stage ON contract_approvals(review_stage);
CREATE INDEX IF NOT EXISTS idx_contract_approvals_created_at ON contract_approvals(created_at);

-- 3. Create reviewer_roles table for role management
CREATE TABLE IF NOT EXISTS reviewer_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('legal_reviewer', 'hr_reviewer', 'final_approver', 'signatory')),
    is_active BOOLEAN DEFAULT true,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one active role per user per type
    UNIQUE(user_id, role_type)
);

-- Add indexes for reviewer_roles
CREATE INDEX IF NOT EXISTS idx_reviewer_roles_user_id ON reviewer_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_roles_type ON reviewer_roles(role_type);
CREATE INDEX IF NOT EXISTS idx_reviewer_roles_active ON reviewer_roles(is_active);

-- 4. Create workflow_config table for routing rules
CREATE TABLE IF NOT EXISTS workflow_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_name VARCHAR(100) NOT NULL UNIQUE,
    config_type VARCHAR(50) NOT NULL CHECK (config_type IN ('routing_rules', 'escalation_rules', 'notification_rules')),
    config_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for workflow_config
CREATE INDEX IF NOT EXISTS idx_workflow_config_type ON workflow_config(config_type);
CREATE INDEX IF NOT EXISTS idx_workflow_config_active ON workflow_config(is_active);

-- 5. Create Row Level Security (RLS) policies

-- Enable RLS on new tables
ALTER TABLE contract_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_config ENABLE ROW LEVEL SECURITY;

-- Contract approvals policies
CREATE POLICY "Users can view approvals for contracts they created or are reviewing" ON contract_approvals
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM contracts 
        WHERE contracts.id = contract_approvals.contract_id 
        AND (contracts.created_by = auth.uid() OR contracts.current_reviewer_id = auth.uid())
    ) OR
    contract_approvals.reviewer_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM reviewer_roles 
        WHERE user_id = auth.uid() AND is_active = true
    )
);

CREATE POLICY "Reviewers can create approvals for contracts in their stage" ON contract_approvals
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM reviewer_roles 
        WHERE user_id = auth.uid() 
        AND role_type = review_stage 
        AND is_active = true
    )
);

-- Reviewer roles policies
CREATE POLICY "Users can view their own roles and admins can view all" ON reviewer_roles
FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

CREATE POLICY "Only admins can manage reviewer roles" ON reviewer_roles
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Workflow config policies
CREATE POLICY "All authenticated users can view active workflow config" ON workflow_config
FOR SELECT USING (
    is_active = true AND auth.uid() IS NOT NULL
);

CREATE POLICY "Only admins can manage workflow config" ON workflow_config
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- 6. Insert default workflow configuration
INSERT INTO workflow_config (config_name, config_type, config_data, created_by) VALUES
(
    'default_routing_rules',
    'routing_rules',
    '{
        "parallel_reviews": true,
        "contract_value_threshold": 50000,
        "high_value_reviewers": [],
        "auto_assign_reviewers": true,
        "require_both_legal_hr": true
    }'::jsonb,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
    'default_escalation_rules',
    'escalation_rules',
    '{
        "legal_review_timeout_days": 3,
        "hr_review_timeout_days": 2,
        "final_approval_timeout_days": 1,
        "escalation_recipients": [],
        "auto_escalate": true
    }'::jsonb,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
),
(
    'default_notification_rules',
    'notification_rules',
    '{
        "email_notifications": true,
        "slack_notifications": true,
        "notify_on_submission": true,
        "notify_on_approval": true,
        "notify_on_rejection": true,
        "notify_on_escalation": true
    }'::jsonb,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);

-- 7. Create functions for workflow management

-- Function to get next reviewer for a contract
CREATE OR REPLACE FUNCTION get_next_reviewer(contract_id UUID, current_stage TEXT)
RETURNS UUID AS $$
DECLARE
    next_reviewer_id UUID;
BEGIN
    -- Get the next reviewer based on current stage
    CASE current_stage
        WHEN 'draft' THEN
            -- For draft, assign to legal reviewer first
            SELECT user_id INTO next_reviewer_id
            FROM reviewer_roles
            WHERE role_type = 'legal_reviewer' AND is_active = true
            LIMIT 1;
        WHEN 'legal_review' THEN
            -- After legal review, assign to HR reviewer
            SELECT user_id INTO next_reviewer_id
            FROM reviewer_roles
            WHERE role_type = 'hr_reviewer' AND is_active = true
            LIMIT 1;
        WHEN 'hr_review' THEN
            -- After HR review, assign to final approver
            SELECT user_id INTO next_reviewer_id
            FROM reviewer_roles
            WHERE role_type = 'final_approver' AND is_active = true
            LIMIT 1;
        WHEN 'final_approval' THEN
            -- After final approval, assign to signatory
            SELECT user_id INTO next_reviewer_id
            FROM reviewer_roles
            WHERE role_type = 'signatory' AND is_active = true
            LIMIT 1;
        ELSE
            next_reviewer_id := NULL;
    END CASE;
    
    RETURN next_reviewer_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update contract approval status
CREATE OR REPLACE FUNCTION update_contract_approval_status(contract_id UUID, new_status TEXT, reviewer_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    UPDATE contracts 
    SET 
        approval_status = new_status,
        current_reviewer_id = reviewer_id,
        submitted_for_review_at = CASE WHEN new_status = 'legal_review' THEN NOW() ELSE submitted_for_review_at END,
        approved_at = CASE WHEN new_status = 'active' THEN NOW() ELSE approved_at END,
        rejected_at = CASE WHEN new_status = 'rejected' THEN NOW() ELSE rejected_at END,
        updated_at = NOW()
    WHERE id = contract_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers for audit trail

-- Trigger to log approval status changes
CREATE OR REPLACE FUNCTION log_approval_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the status change in contract_approvals if it's an approval action
    IF NEW.approval_status != OLD.approval_status AND NEW.approval_status IN ('legal_review', 'hr_review', 'final_approval', 'signature', 'active') THEN
        INSERT INTO contract_approvals (contract_id, reviewer_id, review_stage, action, comments)
        VALUES (
            NEW.id,
            COALESCE(NEW.current_reviewer_id, auth.uid()),
            NEW.approval_status,
            'approved',
            'Status changed from ' || OLD.approval_status || ' to ' || NEW.approval_status
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_approval_status_change
    AFTER UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION log_approval_status_change();

-- 9. Add comments for documentation
COMMENT ON TABLE contract_approvals IS 'Audit trail for contract approval decisions';
COMMENT ON TABLE reviewer_roles IS 'Mapping of users to approval workflow roles';
COMMENT ON TABLE workflow_config IS 'Configuration for approval workflow routing and rules';
COMMENT ON COLUMN contracts.approval_status IS 'Current stage in the approval workflow';
COMMENT ON COLUMN contracts.current_reviewer_id IS 'ID of the user currently responsible for reviewing this contract';

-- 10. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON contract_approvals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON reviewer_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workflow_config TO authenticated;

-- Migration completed successfully
SELECT 'Approval workflow schema migration completed successfully' as status; 