-- Emergency fix: Create view to make user_roles compatible with RBAC cache
-- This bridges the gap between the text-based role storage and UUID-based lookup

-- 1. Create a view that makes user_roles look like rbac_user_role_assignments
CREATE OR REPLACE VIEW rbac_user_role_assignments AS
SELECT 
  gen_random_uuid() as id,
  ur.user_id,
  r.id as role_id,
  NULL::uuid as assigned_by,
  '{}'::jsonb as context,
  NOW() as valid_from,
  NULL::timestamptz as valid_until,
  true as is_active,
  NOW() as created_at,
  NULL::timestamptz as updated_at
FROM user_roles ur
JOIN roles r ON ur.role = r.name;

-- 2. Ensure role_permissions uses standard tables
-- (Already exists based on your query results)

-- 3. Grant access to the view
GRANT SELECT ON rbac_user_role_assignments TO authenticated;
GRANT SELECT ON rbac_user_role_assignments TO anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Permission cache compatibility view created!';
  RAISE NOTICE 'The RBAC system can now read permissions properly.';
END $$;

