-- Migration: Contract approval reminders and escalations system
-- Date: 2025-07-29
-- Description: Add tables and functions for automated approval reminders and escalations

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add reminder and escalation fields to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS assigned_reviewer UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS escalated_to TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS export_method TEXT,
ADD COLUMN IF NOT EXISTS exported_at TIMESTAMPTZ;

-- Create contract activity log table
CREATE TABLE IF NOT EXISTS contract_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Create contract export logs table
CREATE TABLE IF NOT EXISTS contract_export_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    success BOOLEAN NOT NULL,
    export_method TEXT,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create signatures table for digital signatures
CREATE TABLE IF NOT EXISTS signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    signer_id UUID NOT NULL REFERENCES users(id),
    signer_type TEXT NOT NULL CHECK (signer_type IN ('first_party', 'second_party', 'promoter', 'admin')),
    signature_image_url TEXT,
    signature_timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_status_updated_at ON contracts(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_contracts_reminder_count ON contracts(reminder_count);
CREATE INDEX IF NOT EXISTS idx_contracts_priority ON contracts(priority);
CREATE INDEX IF NOT EXISTS idx_contract_activity_log_contract_id ON contract_activity_log(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_activity_log_action ON contract_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_contract_activity_log_created_at ON contract_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_contract_export_logs_contract_id ON contract_export_logs(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_export_logs_success ON contract_export_logs(success);
CREATE INDEX IF NOT EXISTS idx_signatures_contract_id ON signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_signatures_signer_id ON signatures(signer_id);

-- Create function to get pending contracts for reminders
CREATE OR REPLACE FUNCTION get_pending_contracts(
    reminder_threshold_hours INTEGER DEFAULT 48,
    escalation_threshold_hours INTEGER DEFAULT 120
)
RETURNS TABLE (
    id UUID,
    contract_number TEXT,
    contract_type TEXT,
    job_title TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    status TEXT,
    reminder_count INTEGER,
    last_reminder_sent TIMESTAMPTZ,
    assigned_reviewer UUID,
    priority TEXT,
    hours_since_update NUMERIC,
    should_escalate BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.contract_number,
        c.contract_type,
        c.job_title,
        c.created_at,
        c.updated_at,
        c.status,
        COALESCE(c.reminder_count, 0),
        c.last_reminder_sent,
        c.assigned_reviewer,
        c.priority,
        EXTRACT(EPOCH FROM (NOW() - c.updated_at)) / 3600 as hours_since_update,
        CASE 
            WHEN EXTRACT(EPOCH FROM (NOW() - c.updated_at)) / 3600 >= escalation_threshold_hours 
            OR COALESCE(c.reminder_count, 0) >= 3
            THEN true
            ELSE false
        END as should_escalate
    FROM contracts c
    WHERE c.status = 'pending_approval'
    AND EXTRACT(EPOCH FROM (NOW() - c.updated_at)) / 3600 >= reminder_threshold_hours
    ORDER BY c.updated_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get contract analytics
CREATE OR REPLACE FUNCTION get_contract_submissions_over_time(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    date DATE,
    submissions INTEGER,
    approvals INTEGER,
    rejections INTEGER,
    pending INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(c.created_at) as date,
        COUNT(*) as submissions,
        COUNT(CASE WHEN c.status = 'approved' THEN 1 END) as approvals,
        COUNT(CASE WHEN c.status = 'rejected' THEN 1 END) as rejections,
        COUNT(CASE WHEN c.status = 'pending_approval' THEN 1 END) as pending
    FROM contracts c
    WHERE DATE(c.created_at) BETWEEN start_date AND end_date
    GROUP BY DATE(c.created_at)
    ORDER BY date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get average approval time
CREATE OR REPLACE FUNCTION get_average_approval_time()
RETURNS TABLE (
    contract_type TEXT,
    avg_approval_hours NUMERIC,
    min_approval_hours NUMERIC,
    max_approval_hours NUMERIC,
    total_contracts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.contract_type,
        AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) / 3600) as avg_approval_hours,
        MIN(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) / 3600) as min_approval_hours,
        MAX(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) / 3600) as max_approval_hours,
        COUNT(*) as total_contracts
    FROM contracts c
    WHERE c.status IN ('approved', 'rejected')
    AND c.updated_at > c.created_at
    GROUP BY c.contract_type
    ORDER BY avg_approval_hours DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get contracts requiring attention
CREATE OR REPLACE FUNCTION get_contracts_requiring_attention()
RETURNS TABLE (
    id UUID,
    contract_number TEXT,
    job_title TEXT,
    status TEXT,
    priority TEXT,
    days_pending INTEGER,
    reminder_count INTEGER,
    assigned_reviewer TEXT,
    escalation_needed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.contract_number,
        c.job_title,
        c.status,
        c.priority,
        EXTRACT(DAY FROM (NOW() - c.created_at))::INTEGER as days_pending,
        COALESCE(c.reminder_count, 0) as reminder_count,
        u.name as assigned_reviewer,
        CASE 
            WHEN EXTRACT(DAY FROM (NOW() - c.created_at)) >= 5 
            OR COALESCE(c.reminder_count, 0) >= 3
            THEN true
            ELSE false
        END as escalation_needed
    FROM contracts c
    LEFT JOIN users u ON c.assigned_reviewer = u.id
    WHERE c.status = 'pending_approval'
    AND (
        EXTRACT(DAY FROM (NOW() - c.created_at)) >= 2
        OR c.priority = 'high'
    )
    ORDER BY 
        c.priority DESC,
        c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update contract reminder count
CREATE OR REPLACE FUNCTION update_contract_reminder(
    contract_uuid UUID,
    reminder_sent BOOLEAN DEFAULT true
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE contracts 
    SET 
        reminder_count = COALESCE(reminder_count, 0) + CASE WHEN reminder_sent THEN 1 ELSE 0 END,
        last_reminder_sent = CASE WHEN reminder_sent THEN NOW() ELSE last_reminder_sent END,
        updated_at = NOW()
    WHERE id = contract_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to escalate contract
CREATE OR REPLACE FUNCTION escalate_contract(
    contract_uuid UUID,
    escalated_to_emails TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE contracts 
    SET 
        status = 'escalated',
        escalated_at = NOW(),
        escalated_to = array_to_string(escalated_to_emails, ', '),
        updated_at = NOW()
    WHERE id = contract_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for new tables
ALTER TABLE contract_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_export_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- Contract activity log policies
CREATE POLICY "Users can view contract activity for accessible contracts" ON contract_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contracts
            WHERE contracts.id = contract_activity_log.contract_id
            AND auth.role() = 'authenticated'
        )
    );

CREATE POLICY "Users can insert contract activity for accessible contracts" ON contract_activity_log
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contracts
            WHERE contracts.id = contract_activity_log.contract_id
            AND auth.role() = 'authenticated'
        )
    );

-- Contract export logs policies
CREATE POLICY "Users can view export logs for accessible contracts" ON contract_export_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contracts
            WHERE contracts.id = contract_export_logs.contract_id
            AND auth.role() = 'authenticated'
        )
    );

CREATE POLICY "Users can insert export logs for accessible contracts" ON contract_export_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contracts
            WHERE contracts.id = contract_export_logs.contract_id
            AND auth.role() = 'authenticated'
        )
    );

-- Signatures policies
CREATE POLICY "Users can view signatures for accessible contracts" ON signatures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contracts
            WHERE contracts.id = signatures.contract_id
            AND auth.role() = 'authenticated'
        )
    );

CREATE POLICY "Users can insert signatures for accessible contracts" ON signatures
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contracts
            WHERE contracts.id = signatures.contract_id
            AND auth.role() = 'authenticated'
        )
    );

-- Schedule reminder processing (runs every hour)
SELECT cron.schedule(
    'contract-reminder-processing',
    '0 * * * *', -- Every hour
    'SELECT net.http_post(
        url := ''https://your-project.supabase.co/functions/v1/remind-pending-approvals'',
        headers := ''{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'',
        body := ''{}''
    );'
);

-- Add comments for documentation
COMMENT ON TABLE contract_activity_log IS 'Log of all contract-related activities including reminders and escalations';
COMMENT ON TABLE contract_export_logs IS 'Log of contract PDF export attempts and results';
COMMENT ON TABLE signatures IS 'Digital signatures for contracts with audit trail';
COMMENT ON FUNCTION get_pending_contracts(INTEGER, INTEGER) IS 'Get contracts pending approval that need reminders or escalation';
COMMENT ON FUNCTION get_contract_submissions_over_time(DATE, DATE) IS 'Get contract submission analytics over time period';
COMMENT ON FUNCTION get_average_approval_time() IS 'Get average approval times by contract type';
COMMENT ON FUNCTION get_contracts_requiring_attention() IS 'Get contracts that require immediate attention';
COMMENT ON FUNCTION update_contract_reminder(UUID, BOOLEAN) IS 'Update contract reminder count and timestamp';
COMMENT ON FUNCTION escalate_contract(UUID, TEXT[]) IS 'Escalate contract to admin users';