-- ========================================
-- Fix API Keys Table Permissions
-- ========================================
-- Run this to grant proper permissions to service_role

-- Grant all permissions to service_role (bypasses RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO service_role;

-- Grant permissions to authenticated users (for RLS policies)
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO authenticated;

-- Grant permissions to anon (sometimes needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO anon;

-- Verify permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'api_keys'
ORDER BY grantee, privilege_type;

