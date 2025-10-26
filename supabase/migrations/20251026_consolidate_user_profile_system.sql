-- ================================================================
-- Migration: Consolidate User & Profile System
-- Date: 2025-10-26
-- Purpose: Fix fragmented user/role/profile architecture
-- ================================================================
-- This migration:
-- 1. Consolidates profiles/users into single source of truth
-- 2. Fixes foreign key references
-- 3. Implements auto-sync between auth.users and profiles
-- 4. Consolidates RBAC system
-- 5. Fixes SECURITY DEFINER functions
-- ================================================================

-- ================================================================
-- PART 1: BACKUP AND PREPARATION
-- ================================================================

-- Create backup tables (for safety)
DO $$
BEGIN
  -- Backup profiles if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    CREATE TABLE IF NOT EXISTS profiles_backup_20251026 AS SELECT * FROM profiles;
    RAISE NOTICE 'Created profiles backup';
  END IF;
  
  -- Backup users if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    CREATE TABLE IF NOT EXISTS users_backup_20251026 AS SELECT * FROM users;
    RAISE NOTICE 'Created users backup';
  END IF;
END $$;

-- ================================================================
-- PART 2: CONSOLIDATE PROFILES TABLE
-- ================================================================

-- Drop conflicting constraints and recreate profiles table properly
DROP TABLE IF EXISTS profiles CASCADE;

-- Create the canonical profiles table (Supabase standard)
CREATE TABLE profiles (
  -- Core identity (linked 1:1 with auth.users)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info (synced from auth.users)
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  
  -- Extended profile
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  position TEXT,
  company TEXT,
  bio TEXT,
  
  -- Status and settings
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'suspended', 'inactive', 'deleted')),
  preferences JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_department ON profiles(department);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_profiles_full_name ON profiles(full_name);

-- Add comments
COMMENT ON TABLE profiles IS 'User profiles - single source of truth for user data, synced with auth.users';
COMMENT ON COLUMN profiles.id IS 'Primary key, matches auth.users.id exactly (1:1 relationship)';
COMMENT ON COLUMN profiles.email IS 'Synced from auth.users.email automatically';
COMMENT ON COLUMN profiles.full_name IS 'Synced from auth.users.raw_user_meta_data.full_name';
COMMENT ON COLUMN profiles.status IS 'User status: pending (new), approved (verified), active (regular user), suspended (temp ban), inactive (disabled), deleted (soft delete)';

-- ================================================================
-- PART 3: MIGRATE DATA FROM OLD STRUCTURES
-- ================================================================

-- Migrate from auth.users to profiles
INSERT INTO profiles (
  id,
  email,
  full_name,
  first_name,
  last_name,
  status,
  created_at,
  updated_at,
  last_sign_in_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    CONCAT_WS(' ', au.raw_user_meta_data->>'first_name', au.raw_user_meta_data->>'last_name')
  ) as full_name,
  au.raw_user_meta_data->>'first_name' as first_name,
  au.raw_user_meta_data->>'last_name' as last_name,
  CASE 
    WHEN au.raw_user_meta_data->>'verification_status' = 'approved' THEN 'approved'
    WHEN au.raw_user_meta_data->>'status' = 'approved' THEN 'approved'
    WHEN au.email_confirmed_at IS NOT NULL THEN 'active'
    ELSE 'pending'
  END as status,
  au.created_at,
  au.updated_at,
  au.last_sign_in_at
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
  first_name = COALESCE(profiles.first_name, EXCLUDED.first_name),
  last_name = COALESCE(profiles.last_name, EXCLUDED.last_name),
  updated_at = NOW();

-- Migrate additional data from backup if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles_backup_20251026') THEN
    -- Merge in additional fields from backup
    UPDATE profiles p
    SET 
      avatar_url = COALESCE(p.avatar_url, pb.avatar_url),
      phone = COALESCE(p.phone, pb.phone),
      department = COALESCE(p.department, pb.department),
      position = COALESCE(p.position, pb.position),
      company = COALESCE(p.company, pb.company),
      bio = COALESCE(p.bio, pb.bio),
      preferences = COALESCE(p.preferences, pb.preferences, '{}')
    FROM profiles_backup_20251026 pb
    WHERE p.id = pb.id OR p.id = pb.user_id;
    
    RAISE NOTICE 'Merged data from profiles backup';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users_backup_20251026') THEN
    -- Merge in additional fields from users backup
    UPDATE profiles p
    SET 
      department = COALESCE(p.department, ub.department),
      position = COALESCE(p.position, ub.position),
      phone = COALESCE(p.phone, ub.phone)
    FROM users_backup_20251026 ub
    WHERE p.id = ub.id;
    
    RAISE NOTICE 'Merged data from users backup';
  END IF;
END $$;

-- ================================================================
-- PART 4: AUTO-SYNC TRIGGERS
-- ================================================================

-- Function to sync auth.users changes to profiles
CREATE OR REPLACE FUNCTION sync_auth_user_to_profile()
RETURNS TRIGGER
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- On INSERT: Create profile automatically
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      first_name,
      last_name,
      status
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        CONCAT_WS(' ', NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name')
      ),
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      CASE 
        WHEN NEW.raw_user_meta_data->>'verification_status' = 'approved' THEN 'approved'
        WHEN NEW.raw_user_meta_data->>'status' = 'approved' THEN 'approved'
        WHEN NEW.email_confirmed_at IS NOT NULL THEN 'active'
        ELSE 'pending'
      END
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  -- On UPDATE: Sync changes
  IF (TG_OP = 'UPDATE') THEN
    UPDATE public.profiles SET
      email = NEW.email,
      full_name = COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        full_name
      ),
      first_name = COALESCE(
        NEW.raw_user_meta_data->>'first_name',
        first_name
      ),
      last_name = COALESCE(
        NEW.raw_user_meta_data->>'last_name',
        last_name
      ),
      last_sign_in_at = NEW.last_sign_in_at,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_auth_user_to_profile_trigger ON auth.users;
CREATE TRIGGER sync_auth_user_to_profile_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user_to_profile();

-- Function to sync profile changes back to auth.users
CREATE OR REPLACE FUNCTION sync_profile_to_auth_user()
RETURNS TRIGGER
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE auth.users SET
    email = NEW.email,
    raw_user_meta_data = jsonb_set(
      jsonb_set(
        jsonb_set(
          COALESCE(raw_user_meta_data, '{}'::jsonb),
          '{full_name}',
          to_jsonb(NEW.full_name)
        ),
        '{first_name}',
        to_jsonb(NEW.first_name)
      ),
      '{last_name}',
      to_jsonb(NEW.last_name)
    ),
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_profile_to_auth_user_trigger ON profiles;
CREATE TRIGGER sync_profile_to_auth_user_trigger
  AFTER UPDATE OF email, full_name, first_name, last_name ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_auth_user();

-- ================================================================
-- PART 5: CONSOLIDATE RBAC SYSTEM
-- ================================================================

-- Ensure RBAC tables exist with proper structure
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT,
  description TEXT,
  category TEXT CHECK (category IN ('system', 'business', 'custom')),
  permissions JSONB DEFAULT '[]',
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  scope TEXT CHECK (scope IN ('own', 'team', 'department', 'organization', 'all')),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource, action, scope)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  context JSONB DEFAULT '{}',
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_id ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_active ON user_role_assignments(is_active) WHERE is_active = TRUE;

-- Migrate from old rbac_ tables if they exist
DO $$
BEGIN
  -- Migrate roles
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rbac_roles') THEN
    INSERT INTO roles (id, name, description, category, created_at)
    SELECT id, name, description, category, created_at
    FROM rbac_roles
    ON CONFLICT (name) DO NOTHING;
  END IF;
  
  -- Migrate permissions
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rbac_permissions') THEN
    INSERT INTO permissions (id, resource, action, scope, name, description, created_at)
    SELECT id, resource, action, scope, name, description, created_at
    FROM rbac_permissions
    ON CONFLICT (name) DO NOTHING;
  END IF;
  
  -- Migrate role-permission mappings
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rbac_role_permissions') THEN
    INSERT INTO role_permissions (role_id, permission_id, created_at)
    SELECT role_id, permission_id, created_at
    FROM rbac_role_permissions
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
  
  -- Migrate user role assignments
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rbac_user_role_assignments') THEN
    INSERT INTO user_role_assignments (
      id, user_id, role_id, assigned_by, context, 
      valid_from, valid_until, is_active, created_at, updated_at
    )
    SELECT 
      id, user_id, role_id, assigned_by, context,
      valid_from, valid_until, is_active, created_at, updated_at
    FROM rbac_user_role_assignments
    WHERE user_id IN (SELECT id FROM profiles)  -- Only migrate valid users
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END $$;

-- Insert default system roles
INSERT INTO roles (name, display_name, description, category, is_system_role)
VALUES
  ('admin', 'Administrator', 'Full system access', 'system', true),
  ('manager', 'Manager', 'Department management access', 'system', true),
  ('user', 'User', 'Standard user access', 'system', true),
  ('viewer', 'Viewer', 'Read-only access', 'system', true),
  ('promoter', 'Promoter', 'Promoter role for contract execution', 'business', true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ================================================================
-- PART 6: CREATE HELPER VIEWS AND FUNCTIONS
-- ================================================================

-- View for user with roles (materialized for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_permissions_cache AS
SELECT
  p.id as user_id,
  p.email,
  p.full_name,
  array_agg(DISTINCT r.name) as roles,
  array_agg(DISTINCT perm.name) as permissions
FROM profiles p
LEFT JOIN user_role_assignments ura ON p.id = ura.user_id AND ura.is_active = TRUE
LEFT JOIN roles r ON ura.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions perm ON rp.permission_id = perm.id
GROUP BY p.id, p.email, p.full_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_permissions_cache_user_id ON user_permissions_cache(user_id);

-- Function to refresh permissions cache
CREATE OR REPLACE FUNCTION refresh_user_permissions_cache()
RETURNS void
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_permissions_cache;
EXCEPTION WHEN undefined_table THEN
  REFRESH MATERIALIZED VIEW user_permissions_cache;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(p_user_id UUID, p_role_name TEXT)
RETURNS BOOLEAN
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_role_assignments ura
    JOIN roles r ON ura.role_id = r.id
    WHERE ura.user_id = p_user_id
    AND r.name = p_role_name
    AND ura.is_active = TRUE
    AND (ura.valid_until IS NULL OR ura.valid_until > NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(p_user_id UUID, p_permission_name TEXT)
RETURNS BOOLEAN
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_role_assignments ura
    JOIN role_permissions rp ON ura.role_id = rp.role_id
    JOIN permissions perm ON rp.permission_id = perm.id
    WHERE ura.user_id = p_user_id
    AND perm.name = p_permission_name
    AND ura.is_active = TRUE
    AND (ura.valid_until IS NULL OR ura.valid_until > NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get user's current role (for backward compatibility)
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID DEFAULT NULL)
RETURNS TEXT
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Get highest priority role
  SELECT r.name INTO v_role
  FROM user_role_assignments ura
  JOIN roles r ON ura.role_id = r.id
  WHERE ura.user_id = v_user_id
  AND ura.is_active = TRUE
  AND (ura.valid_until IS NULL OR ura.valid_until > NOW())
  ORDER BY 
    CASE r.name
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'promoter' THEN 3
      WHEN 'user' THEN 4
      WHEN 'viewer' THEN 5
      ELSE 6
    END
  LIMIT 1;
  
  RETURN COALESCE(v_role, 'user');
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 7: ENABLE RLS AND CREATE POLICIES
-- ================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert users" ON profiles;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
  ON profiles FOR SELECT 
  USING (user_has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" 
  ON profiles FOR UPDATE 
  USING (user_has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles" 
  ON profiles FOR INSERT 
  WITH CHECK (user_has_role(auth.uid(), 'admin'));

-- Roles RLS policies  
CREATE POLICY "Anyone can view roles" 
  ON roles FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage roles" 
  ON roles FOR ALL 
  USING (user_has_role(auth.uid(), 'admin'));

-- Permissions RLS policies
CREATE POLICY "Anyone can view permissions" 
  ON permissions FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage permissions" 
  ON permissions FOR ALL 
  USING (user_has_role(auth.uid(), 'admin'));

-- Role permissions RLS policies
CREATE POLICY "Anyone can view role permissions" 
  ON role_permissions FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage role permissions" 
  ON role_permissions FOR ALL 
  USING (user_has_role(auth.uid(), 'admin'));

-- User role assignments RLS policies
CREATE POLICY "Users can view own role assignments" 
  ON user_role_assignments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all role assignments" 
  ON user_role_assignments FOR SELECT 
  USING (user_has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage role assignments" 
  ON user_role_assignments FOR ALL 
  USING (user_has_role(auth.uid(), 'admin'));

-- ================================================================
-- PART 8: GRANT PERMISSIONS
-- ================================================================

GRANT SELECT ON profiles TO authenticated, anon;
GRANT INSERT, UPDATE ON profiles TO authenticated;

GRANT SELECT ON roles TO authenticated, anon;
GRANT SELECT ON permissions TO authenticated, anon;
GRANT SELECT ON role_permissions TO authenticated, anon;
GRANT SELECT ON user_role_assignments TO authenticated;

GRANT SELECT ON user_permissions_cache TO authenticated;

GRANT EXECUTE ON FUNCTION user_has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_permission(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_user_permissions_cache() TO authenticated;

-- ================================================================
-- VERIFICATION AND SUMMARY
-- ================================================================

DO $$
DECLARE
  profile_count INT;
  role_count INT;
  permission_count INT;
  assignment_count INT;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO role_count FROM roles;
  SELECT COUNT(*) INTO permission_count FROM permissions;
  SELECT COUNT(*) INTO assignment_count FROM user_role_assignments;
  
  RAISE NOTICE '✅ User/Profile System Consolidation Complete!';
  RAISE NOTICE '  - Profiles: %', profile_count;
  RAISE NOTICE '  - Roles: %', role_count;
  RAISE NOTICE '  - Permissions: %', permission_count;
  RAISE NOTICE '  - Role Assignments: %', assignment_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Auto-sync triggers created';
  RAISE NOTICE '✅ RLS policies enabled';
  RAISE NOTICE '✅ Helper functions created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run: SELECT * FROM profiles LIMIT 5;';
  RAISE NOTICE '2. Test: SELECT user_has_role(auth.uid(), ''admin'');';
  RAISE NOTICE '3. Refresh cache: SELECT refresh_user_permissions_cache();';
END $$;

