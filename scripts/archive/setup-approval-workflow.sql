-- Setup Approval Workflow Tables
-- Run this script to create the necessary tables for the approval workflow

-- 1. Add approval workflow fields to contracts table (if not exists)
DO $$ 
BEGIN
    -- Add approval_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'approval_status') THEN
        ALTER TABLE contracts ADD COLUMN approval_status VARCHAR(50) DEFAULT 'draft';
    END IF;

    -- Add current_reviewer_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'current_reviewer_id') THEN
        ALTER TABLE contracts ADD COLUMN current_reviewer_id UUID REFERENCES users(id);
    END IF;

    -- Add submitted_for_review_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'submitted_for_review_at') THEN
        ALTER TABLE contracts ADD COLUMN submitted_for_review_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add approved_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'approved_at') THEN
        ALTER TABLE contracts ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add rejected_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'rejected_at') THEN
        ALTER TABLE contracts ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add rejection_reason column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'rejection_reason') THEN
        ALTER TABLE contracts ADD COLUMN rejection_reason TEXT;
    END IF;

    -- Add workflow_version column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'workflow_version') THEN
        ALTER TABLE contracts ADD COLUMN workflow_version INTEGER DEFAULT 1;
    END IF;
END $$;

-- 2. Create contract_approvals table
CREATE TABLE IF NOT EXISTS contract_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    review_stage VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    comments TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create reviewer_roles table
CREATE TABLE IF NOT EXISTS reviewer_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_type)
);

-- 4. Create workflow_config table
CREATE TABLE IF NOT EXISTS workflow_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_name VARCHAR(100) NOT NULL UNIQUE,
    config_type VARCHAR(50) NOT NULL,
    config_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_approval_status ON contracts(approval_status);
CREATE INDEX IF NOT EXISTS idx_contracts_current_reviewer ON contracts(current_reviewer_id);
CREATE INDEX IF NOT EXISTS idx_contract_approvals_contract_id ON contract_approvals(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_approvals_reviewer_id ON contract_approvals(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_roles_user_id ON reviewer_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_roles_role_type ON reviewer_roles(role_type);
CREATE INDEX IF NOT EXISTS idx_workflow_config_name ON workflow_config(config_name);

-- 6. Insert default workflow configuration
INSERT INTO workflow_config (config_name, config_type, config_data, is_active) 
VALUES (
    'default_routing_rules',
    'routing_rules',
    '{
        "parallel_reviews": true,
        "auto_assign_reviewers": true,
        "require_both_legal_hr": true,
        "stages": [
            {"name": "legal_review", "role": "legal_reviewer", "order": 1},
            {"name": "hr_review", "role": "hr_reviewer", "order": 2},
            {"name": "final_approval", "role": "final_approver", "order": 3},
            {"name": "signature", "role": "signatory", "order": 4}
        ]
    }',
    true
) ON CONFLICT (config_name) DO NOTHING;

-- 7. Insert some sample reviewer roles (adjust user IDs as needed)
-- Note: Replace the user IDs with actual user IDs from your system
INSERT INTO reviewer_roles (user_id, role_type, is_active) 
SELECT id, 'legal_reviewer', true 
FROM users 
WHERE role = 'admin' 
LIMIT 1
ON CONFLICT (user_id, role_type) DO NOTHING;

INSERT INTO reviewer_roles (user_id, role_type, is_active) 
SELECT id, 'hr_reviewer', true 
FROM users 
WHERE role = 'admin' 
LIMIT 1
ON CONFLICT (user_id, role_type) DO NOTHING;

INSERT INTO reviewer_roles (user_id, role_type, is_active) 
SELECT id, 'final_approver', true 
FROM users 
WHERE role = 'admin' 
LIMIT 1
ON CONFLICT (user_id, role_type) DO NOTHING;

-- 8. Update existing contracts to have draft status if they don't have approval_status
UPDATE contracts 
SET approval_status = 'draft' 
WHERE approval_status IS NULL;

-- 9. Enable Row Level Security (RLS) on new tables
ALTER TABLE contract_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_config ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for contract_approvals
CREATE POLICY "Users can view their own approvals" ON contract_approvals
    FOR SELECT USING (reviewer_id = auth.uid());

CREATE POLICY "Users can insert their own approvals" ON contract_approvals
    FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- 11. Create RLS policies for reviewer_roles
CREATE POLICY "Users can view reviewer roles" ON reviewer_roles
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage reviewer roles" ON reviewer_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 12. Create RLS policies for workflow_config
CREATE POLICY "Users can view workflow config" ON workflow_config
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage workflow config" ON workflow_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Print success message
SELECT 'Approval workflow tables setup completed successfully!' as message; 