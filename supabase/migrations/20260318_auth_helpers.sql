-- ============================================================================
-- Canonical auth helpers for tenancy (user_roles + profiles)
-- ============================================================================
-- These functions are used by RLS policies across the schema. This migration
-- ensures they exist and match the canonical identity model:
--   - user_roles.user_id = profiles.id
--   - In consolidated profile schema, profiles.id matches auth.users.id
-- ============================================================================

CREATE OR REPLACE FUNCTION auth_user_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- In the consolidated profile system, profiles.id matches auth.users.id.
  -- Return auth.uid() directly as the profile id.
  SELECT auth.uid();
$$;

-- Define company helper functions conditionally, depending on whether
-- user_roles.company_id exists in this environment.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_roles'
      AND column_name = 'company_id'
  ) THEN
    -- Full tenancy-aware implementation
    CREATE OR REPLACE FUNCTION auth_user_company_ids()
    RETURNS UUID[]
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $func$
      SELECT COALESCE(array_agg(ur.company_id), ARRAY[]::UUID[])
      FROM public.user_roles ur
      WHERE ur.user_id = auth_user_profile_id()
        AND ur.is_active = TRUE;
    $func$;

    CREATE OR REPLACE FUNCTION auth_user_has_role(p_company_id UUID, p_role TEXT)
    RETURNS BOOLEAN
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $func$
      SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth_user_profile_id()
          AND ur.company_id = p_company_id
          AND ur.is_active = TRUE
          AND ur.role::TEXT = p_role
      );
    $func$;
  ELSE
    -- Fallback for legacy schemas without company_id on user_roles:
    -- return empty company list and false for role checks so policies
    -- remain safe (no unintended grants).
    CREATE OR REPLACE FUNCTION auth_user_company_ids()
    RETURNS UUID[]
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $func$
      SELECT ARRAY[]::UUID[];
    $func$;

    CREATE OR REPLACE FUNCTION auth_user_has_role(p_company_id UUID, p_role TEXT)
    RETURNS BOOLEAN
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $func$
      SELECT FALSE;
    $func$;
  END IF;
END $$;


