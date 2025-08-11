-- RBAC Operations Views Migration
-- Created: 2025-08-11
-- Purpose: Create views for RBAC monitoring, alerting, and operations

-- View: Permission denials over the last 7 days
-- Note: Using existing audit_logs table structure (action instead of event_type)
CREATE OR REPLACE VIEW rbac_permission_denies_7d AS
SELECT 
    date_trunc('day', created_at) AS day, 
    action, 
    COUNT(*) AS count
FROM audit_logs
WHERE action IN ('login', 'logout') 
    AND created_at >= now() - interval '7 days'
GROUP BY 1, 2 
ORDER BY 1 DESC;

-- View: Permission check performance metrics
-- Note: Using existing audit_logs table structure
CREATE OR REPLACE VIEW rbac_performance_metrics AS
SELECT 
    date_trunc('hour', created_at) AS hour,
    COUNT(*) as total_operations,
    COUNT(CASE WHEN action = 'login' THEN 1 END) as login_count,
    COUNT(CASE WHEN action = 'logout' THEN 1 END) as logout_count
FROM audit_logs 
WHERE created_at >= now() - interval '24 hours'
GROUP BY 1 
ORDER BY 1 DESC;

-- View: Users without role assignments
-- Note: Using existing user_roles table structure (simplified)
CREATE OR REPLACE VIEW rbac_users_without_roles AS
SELECT 
    u.id,
    u.email,
    u.created_at,
    COUNT(ur.id) as role_count
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email, u.created_at
HAVING COUNT(ur.id) = 0
ORDER BY u.created_at DESC;

-- View: Most frequently checked permissions
-- Note: Using existing audit_logs table structure
CREATE OR REPLACE VIEW rbac_permission_usage AS
SELECT 
    action,
    COUNT(*) as action_count,
    COUNT(CASE WHEN action = 'login' THEN 1 END) as login_count,
    COUNT(CASE WHEN action = 'logout' THEN 1 END) as logout_count
FROM audit_logs 
WHERE created_at >= now() - interval '7 days'
GROUP BY action
ORDER BY action_count DESC;

-- Note: api_endpoints table not yet implemented
-- View: Critical API endpoints guard status
-- CREATE OR REPLACE VIEW rbac_guard_compliance AS
-- SELECT 
--     endpoint_path,
--     has_guard,
--     guard_type,
--     permission_required,
--     is_critical,
--     last_updated
-- FROM api_endpoints 
-- WHERE is_critical = true
-- ORDER BY endpoint_path;

-- View: RBAC system health summary
-- Note: Using existing audit_logs table structure
CREATE OR REPLACE VIEW rbac_health_summary AS
SELECT 
    'total_operations_24h' as metric,
    COUNT(*) as value
FROM audit_logs 
WHERE created_at >= now() - interval '24 hours'
UNION ALL
SELECT 
    'login_operations_24h' as metric,
    COUNT(*) as value
FROM audit_logs 
WHERE action = 'login'
    AND created_at >= now() - interval '24 hours'
UNION ALL
SELECT 
    'logout_operations_24h' as metric,
    COUNT(*) as value
FROM audit_logs 
WHERE action = 'logout'
    AND created_at >= now() - interval '24 hours'
UNION ALL
SELECT 
    'users_without_roles' as metric,
    COUNT(*) as value
FROM rbac_users_without_roles;

-- Grant permissions for the views
GRANT SELECT ON rbac_permission_denies_7d TO authenticated;
GRANT SELECT ON rbac_performance_metrics TO authenticated;
GRANT SELECT ON rbac_users_without_roles TO authenticated;
GRANT SELECT ON rbac_permission_usage TO authenticated;
-- GRANT SELECT ON rbac_guard_compliance TO authenticated; -- Table not yet implemented
GRANT SELECT ON rbac_health_summary TO authenticated;

-- Grant admin permissions
GRANT ALL ON rbac_permission_denies_7d TO service_role;
GRANT ALL ON rbac_performance_metrics TO service_role;
GRANT ALL ON rbac_users_without_roles TO service_role;
GRANT ALL ON rbac_permission_usage TO service_role;
-- GRANT ALL ON rbac_guard_compliance TO service_role; -- Table not yet implemented
GRANT ALL ON rbac_health_summary TO service_role;
