-- ============================================
-- REFRESH RBAC MATERIALIZED VIEW
-- ============================================
-- This view caches user permissions for fast lookups
-- Run this after ANY changes to roles/permissions/assignments

-- Check if materialized view exists
SELECT 
  '🔍 Checking Materialized View' as status,
  schemaname,
  matviewname,
  hasindexes
FROM pg_matviews
WHERE matviewname = 'rbac_user_permissions_mv';

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY rbac_user_permissions_mv;

SELECT '✅ Materialized view refreshed!' as status;

-- Verify it has data
SELECT 
  '📊 Permissions in View' as status,
  COUNT(*) as total_cached_permissions,
  COUNT(DISTINCT user_id) as users_with_permissions
FROM rbac_user_permissions_mv;

-- Check if your permissions are cached
SELECT 
  '🔍 Sample Cached Permissions' as status,
  u.email,
  mv.permission_name,
  mv.role_name
FROM rbac_user_permissions_mv mv
JOIN auth.users u ON u.id = mv.user_id
WHERE mv.permission_name LIKE 'contract:%'
LIMIT 20;

