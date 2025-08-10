-- Optimize User Management System Performance
-- This script adds indexes and optimizations for better query performance

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_status ON app_users(status);
CREATE INDEX IF NOT EXISTS idx_app_users_created_at ON app_users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_users_last_login ON app_users(last_login DESC);
CREATE INDEX IF NOT EXISTS idx_app_users_department ON app_users(department);
CREATE INDEX IF NOT EXISTS idx_app_users_created_by ON app_users(created_by);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_app_users_role_status ON app_users(role, status);
CREATE INDEX IF NOT EXISTS idx_app_users_status_created_at ON app_users(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_users_role_created_at ON app_users(role, created_at DESC);

-- Full-text search index for email and full_name
CREATE INDEX IF NOT EXISTS idx_app_users_search ON app_users USING gin(to_tsvector('english', email || ' ' || COALESCE(full_name, '')));

-- Index for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Index for user activity logs
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);

-- Index for user invitations
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires_at ON user_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);

-- Optimize table statistics
ANALYZE app_users;
ANALYZE user_sessions;
ANALYZE user_activity_logs;
ANALYZE user_invitations;

-- Create a materialized view for user statistics (optional, for very large datasets)
-- This can be refreshed periodically for better performance
CREATE MATERIALIZED VIEW IF NOT EXISTS user_statistics AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE status = 'active') as active_users,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
  COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '24 hours') as recent_activity,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_month
FROM app_users;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_statistics_unique ON user_statistics (total_users);

-- Function to refresh user statistics
CREATE OR REPLACE FUNCTION refresh_user_statistics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW user_statistics;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get user statistics efficiently
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE(
  total_users bigint,
  active_users bigint,
  admin_users bigint,
  recent_activity bigint,
  new_users_week bigint,
  new_users_month bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE status = 'active') as active_users,
    COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
    COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '24 hours') as recent_activity,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_month
  FROM app_users;
END;
$$ LANGUAGE plpgsql;

-- Create a function to search users efficiently
CREATE OR REPLACE FUNCTION search_users(
  search_term text DEFAULT '',
  user_role text DEFAULT '',
  user_status text DEFAULT '',
  page_num integer DEFAULT 1,
  page_size integer DEFAULT 10,
  sort_column text DEFAULT 'created_at',
  sort_direction text DEFAULT 'desc'
)
RETURNS TABLE(
  id uuid,
  email text,
  role text,
  status text,
  full_name text,
  department text,
  position text,
  avatar_url text,
  created_at timestamp with time zone,
  last_login timestamp with time zone,
  total_count bigint
) AS $$
DECLARE
  offset_val integer;
  sort_sql text;
BEGIN
  offset_val := (page_num - 1) * page_size;
  
  -- Build sort clause
  sort_sql := format('ORDER BY %I %s', sort_column, sort_direction);
  
  RETURN QUERY EXECUTE format('
    SELECT 
      au.id,
      au.email,
      au.role,
      au.status,
      au.full_name,
      au.department,
      au.position,
      au.avatar_url,
      au.created_at,
      au.last_login,
      COUNT(*) OVER() as total_count
    FROM app_users au
    WHERE 
      ($1 = '''' OR au.email ILIKE %L OR au.full_name ILIKE %L)
      AND ($2 = '''' OR au.role = $2)
      AND ($3 = '''' OR au.status = $3)
    %s
    LIMIT %s OFFSET %s
  ', 
    '%' || search_term || '%',
    '%' || search_term || '%',
    sort_sql,
    page_size,
    offset_val
  ) USING search_term, user_role, user_status;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION search_users(text, text, text, integer, integer, text, text) TO authenticated;
GRANT SELECT ON user_statistics TO authenticated;

-- Create a trigger to automatically refresh statistics when users are modified
CREATE OR REPLACE FUNCTION trigger_refresh_user_statistics()
RETURNS trigger AS $$
BEGIN
  -- Refresh statistics asynchronously (you might want to use a job queue in production)
  PERFORM refresh_user_statistics();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user statistics refresh
DROP TRIGGER IF EXISTS refresh_user_statistics_trigger ON app_users;
CREATE TRIGGER refresh_user_statistics_trigger
  AFTER INSERT OR UPDATE OR DELETE ON app_users
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_user_statistics();

-- Add comments for documentation
COMMENT ON INDEX idx_app_users_email IS 'Index for email lookups and uniqueness checks';
COMMENT ON INDEX idx_app_users_role IS 'Index for role-based filtering';
COMMENT ON INDEX idx_app_users_status IS 'Index for status-based filtering';
COMMENT ON INDEX idx_app_users_created_at IS 'Index for sorting by creation date';
COMMENT ON INDEX idx_app_users_last_login IS 'Index for sorting by last login';
COMMENT ON INDEX idx_app_users_search IS 'Full-text search index for email and name searches';
COMMENT ON MATERIALIZED VIEW user_statistics IS 'Cached user statistics for better performance';
COMMENT ON FUNCTION get_user_statistics() IS 'Function to get real-time user statistics';
COMMENT ON FUNCTION search_users(text, text, text, integer, integer, text, text) IS 'Optimized function for searching and paginating users';

-- Log the optimization
INSERT INTO schema_migrations (version, applied_at) 
VALUES ('011_optimize_user_management_performance', NOW())
ON CONFLICT (version) DO NOTHING; 