-- Migration: Create contract activity logs table
-- Date: 2025-01-25
-- Description: Track all contract actions and status changes

CREATE TABLE IF NOT EXISTS contract_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contract_activity_logs_contract_id ON contract_activity_logs(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_activity_logs_user_id ON contract_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_activity_logs_action ON contract_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_contract_activity_logs_created_at ON contract_activity_logs(created_at);

-- Add comments for documentation
COMMENT ON TABLE contract_activity_logs IS 'Tracks all actions and status changes on contracts';
COMMENT ON COLUMN contract_activity_logs.contract_id IS 'Reference to the contract being acted upon';
COMMENT ON COLUMN contract_activity_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN contract_activity_logs.action IS 'Type of action performed (approve, reject, etc.)';
COMMENT ON COLUMN contract_activity_logs.details IS 'Additional details about the action in JSON format';

-- Enable Row Level Security (RLS)
ALTER TABLE contract_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Enable read access for authenticated users" ON contract_activity_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON contract_activity_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON contract_activity_logs
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON contract_activity_logs
    FOR DELETE USING (auth.role() = 'authenticated');
