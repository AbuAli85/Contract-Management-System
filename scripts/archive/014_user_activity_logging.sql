-- User Activity Logging System
-- This migration creates a comprehensive user activity tracking system

-- Create user_activity_log table
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    resource_name TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_action ON user_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_resource_type ON user_activity_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id_created_at ON user_activity_log(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own activities
CREATE POLICY "Users can view own activities" ON user_activity_log
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all activities
CREATE POLICY "Admins can view all activities" ON user_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- System can insert activities (for API routes)
CREATE POLICY "System can insert activities" ON user_activity_log
    FOR INSERT WITH CHECK (true);

-- Create function to automatically log user activities
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_user_name TEXT,
    p_user_email TEXT,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_resource_name TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO user_activity_log (
        user_id,
        user_name,
        user_email,
        action,
        resource_type,
        resource_id,
        resource_name,
        details,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_user_name,
        p_user_email,
        p_action,
        p_resource_type,
        p_resource_id,
        p_resource_name,
        p_details,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(p_user_id UUID)
RETURNS TABLE (
    total_activities BIGINT,
    today_activities BIGINT,
    this_week_activities BIGINT,
    this_month_activities BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_activities,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)::BIGINT as today_activities,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as this_week_activities,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')::BIGINT as this_month_activities
    FROM user_activity_log
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean old activity logs (keep last 90 days)
CREATE OR REPLACE FUNCTION clean_old_activity_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_activity_log 
    WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to clean old logs (if using pg_cron)
-- SELECT cron.schedule('clean-activity-logs', '0 2 * * *', 'SELECT clean_old_activity_logs();');

-- Insert some sample activity types for reference
INSERT INTO user_activity_log (user_id, user_name, user_email, action, resource_type, resource_name, details) VALUES
    ('00000000-0000-0000-0000-000000000000', 'System', 'system@example.com', 'login', 'auth', 'User Login', '{"method": "email"}'),
    ('00000000-0000-0000-0000-000000000000', 'System', 'system@example.com', 'logout', 'auth', 'User Logout', '{"method": "manual"}'),
    ('00000000-0000-0000-0000-000000000000', 'System', 'system@example.com', 'create', 'promoter', 'Promoter Created', '{"promoter_id": "sample"}'),
    ('00000000-0000-0000-0000-000000000000', 'System', 'system@example.com', 'update', 'promoter', 'Promoter Updated', '{"promoter_id": "sample", "fields": ["name", "status"]}'),
    ('00000000-0000-0000-0000-000000000000', 'System', 'system@example.com', 'delete', 'promoter', 'Promoter Deleted', '{"promoter_id": "sample"}'),
    ('00000000-0000-0000-0000-000000000000', 'System', 'system@example.com', 'create', 'contract', 'Contract Created', '{"contract_id": "sample"}'),
    ('00000000-0000-0000-0000-000000000000', 'System', 'system@example.com', 'update', 'contract', 'Contract Updated', '{"contract_id": "sample", "fields": ["status"]}'),
    ('00000000-0000-0000-0000-000000000000', 'System', 'system@example.com', 'approve', 'contract', 'Contract Approved', '{"contract_id": "sample"}'),
    ('00000000-0000-0000-0000-000000000000', 'System', 'system@example.com', 'settings', 'system', 'Settings Updated', '{"setting": "notification_days"}'),
    ('00000000-0000-0000-0000-000000000000', 'System', 'system@example.com', 'user_management', 'user', 'User Created', '{"user_id": "sample"}')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT ON user_activity_log TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_activity(UUID, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, JSONB, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION clean_old_activity_logs() TO authenticated;

-- Create view for easy activity reporting
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    ual.user_id,
    ual.user_name,
    ual.user_email,
    COUNT(*) as total_activities,
    COUNT(*) FILTER (WHERE DATE(ual.created_at) = CURRENT_DATE) as today_activities,
    COUNT(*) FILTER (WHERE ual.created_at >= CURRENT_DATE - INTERVAL '7 days') as this_week_activities,
    COUNT(*) FILTER (WHERE ual.created_at >= CURRENT_DATE - INTERVAL '30 days') as this_month_activities,
    MAX(ual.created_at) as last_activity
FROM user_activity_log ual
GROUP BY ual.user_id, ual.user_name, ual.user_email;

-- Grant access to the view
GRANT SELECT ON user_activity_summary TO authenticated; 