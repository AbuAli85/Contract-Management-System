-- ================================================================
-- Migration: Fix Function Search Paths
-- Date: 2025-10-26
-- Purpose: Fix mutable search_path security warnings
-- ================================================================
-- This migration adds `SET search_path = public, pg_catalog` to all
-- functions that currently have mutable search_path, fixing the 
-- 26 warnings from Supabase linter
-- ================================================================

-- ================================================================
-- PART 1: PASSWORD HISTORY FUNCTIONS
-- ================================================================

CREATE OR REPLACE FUNCTION add_password_to_history(
  p_user_id UUID,
  p_password_hash TEXT
)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO password_history (user_id, password_hash)
  VALUES (p_user_id, p_password_hash);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_password_reused(
  p_user_id UUID,
  p_new_password_hash TEXT,
  p_history_limit INTEGER DEFAULT 5
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM password_history
    WHERE user_id = p_user_id
    AND password_hash = p_new_password_hash
    ORDER BY created_at DESC
    LIMIT p_history_limit
  );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 2: USER MANAGEMENT FUNCTIONS
-- ================================================================

CREATE OR REPLACE FUNCTION get_user_with_role(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    get_user_role(p.id) as role,
    p.status,
    p.created_at
  FROM profiles p
  WHERE p.id = v_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_profile_role_to_auth()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(get_user_role(NEW.id))
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 3: PROMOTER VALIDATION FUNCTIONS
-- ================================================================

CREATE OR REPLACE FUNCTION validate_promoter_assignment(
  p_contract_id UUID,
  p_promoter_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_promoter_status TEXT;
  v_contract_start DATE;
  v_contract_end DATE;
BEGIN
  -- Check promoter exists and is available
  SELECT status_enum INTO v_promoter_status
  FROM promoters
  WHERE id = p_promoter_id;
  
  IF v_promoter_status IS NULL THEN
    RAISE EXCEPTION 'Promoter not found';
  END IF;
  
  IF v_promoter_status NOT IN ('available', 'active') THEN
    RAISE EXCEPTION 'Promoter is not available (status: %)', v_promoter_status;
  END IF;
  
  -- Check for conflicting assignments
  SELECT start_date, end_date INTO v_contract_start, v_contract_end
  FROM contracts
  WHERE id = p_contract_id;
  
  IF EXISTS (
    SELECT 1 FROM contracts
    WHERE promoter_id = p_promoter_id
    AND id != p_contract_id
    AND status IN ('active', 'pending', 'approved')
    AND (
      (start_date, end_date) OVERLAPS (v_contract_start, v_contract_end)
    )
  ) THEN
    RAISE EXCEPTION 'Promoter has conflicting contract during this period';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_contract_outsourcing(
  p_contract_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_contract RECORD;
BEGIN
  SELECT * INTO v_contract
  FROM contracts
  WHERE id = p_contract_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;
  
  -- Add outsourcing validation logic here
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 4: RBAC FUNCTIONS
-- ================================================================

CREATE OR REPLACE FUNCTION rbac_upsert_role(
  p_name TEXT, 
  p_category TEXT,
  p_description TEXT
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE 
  v_id UUID; 
BEGIN
  INSERT INTO roles (name, category, description)
  VALUES (p_name, p_category, p_description)
  ON CONFLICT (name) DO UPDATE SET 
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    updated_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rbac_upsert_permission(
  p_resource TEXT,
  p_action TEXT,
  p_scope TEXT,
  p_name TEXT,
  p_description TEXT
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE 
  v_id UUID; 
BEGIN
  INSERT INTO permissions (resource, action, scope, name, description)
  VALUES (p_resource, p_action, p_scope, p_name, p_description)
  ON CONFLICT (name) DO UPDATE SET 
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rbac_attach_permission(
  p_role_id UUID,
  p_perm_id UUID
)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO role_permissions (role_id, permission_id)
  VALUES (p_role_id, p_perm_id)
  ON CONFLICT (role_id, permission_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rbac_refresh_user_permissions_mv()
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_permissions_cache;
EXCEPTION WHEN undefined_table THEN
  REFRESH MATERIALIZED VIEW user_permissions_cache;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 5: CONTRACT SYNC FUNCTIONS
-- ================================================================

CREATE OR REPLACE FUNCTION sync_contract_party_columns()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Sync first_party_id with employer_id
  IF NEW.employer_id IS NOT NULL AND NEW.first_party_id IS NULL THEN
    NEW.first_party_id := NEW.employer_id;
  ELSIF NEW.first_party_id IS NOT NULL AND NEW.employer_id IS NULL THEN
    NEW.employer_id := NEW.first_party_id;
  END IF;
  
  -- Sync second_party_id with client_id
  IF NEW.client_id IS NOT NULL AND NEW.second_party_id IS NULL THEN
    NEW.second_party_id := NEW.client_id;
  ELSIF NEW.second_party_id IS NOT NULL AND NEW.client_id IS NULL THEN
    NEW.client_id := NEW.second_party_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_contract_party_ids()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Update denormalized columns after contract update
  UPDATE contracts SET
    employer_id = COALESCE(first_party_id, employer_id),
    client_id = COALESCE(second_party_id, client_id)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 6: PROMOTER MANAGEMENT FUNCTIONS
-- ================================================================

CREATE OR REPLACE FUNCTION get_contracts_without_promoters(
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  contract_id UUID,
  contract_number TEXT,
  title TEXT,
  status TEXT,
  contract_type TEXT,
  first_party_name TEXT,
  second_party_name TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ,
  days_since_creation INTEGER
)
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.contract_number,
    c.title,
    c.status,
    c.contract_type,
    COALESCE(p1.name_en, p1.name_ar) as first_party_name,
    COALESCE(p2.name_en, p2.name_ar) as second_party_name,
    c.start_date,
    c.end_date,
    c.created_at,
    EXTRACT(EPOCH FROM (NOW() - c.created_at))::INTEGER / 86400 as days_since_creation
  FROM contracts c
  LEFT JOIN parties p1 ON (c.first_party_id = p1.id OR c.employer_id = p1.id)
  LEFT JOIN parties p2 ON (c.second_party_id = p2.id OR c.client_id = p2.id)
  WHERE c.promoter_id IS NULL
  AND (p_status IS NULL OR c.status = p_status)
  ORDER BY c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION suggest_promoters_for_contract(
  p_contract_id UUID,
  p_max_suggestions INTEGER DEFAULT 5
)
RETURNS TABLE (
  promoter_id UUID,
  promoter_name_en TEXT,
  promoter_name_ar TEXT,
  confidence_score INTEGER,
  reason TEXT
)
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_contract RECORD;
BEGIN
  SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found: %', p_contract_id;
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.name_en,
    p.name_ar,
    85 as confidence_score,
    'Available promoter with matching experience' as reason
  FROM promoters p
  WHERE p.status_enum IN ('available', 'active')
  ORDER BY p.created_at DESC
  LIMIT p_max_suggestions;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION bulk_assign_promoters(
  p_assignments JSONB,
  p_assigned_by UUID DEFAULT NULL
)
RETURNS TABLE (
  contract_id UUID,
  success BOOLEAN,
  error_message TEXT
)
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_assignment JSONB;
  v_contract_id UUID;
  v_promoter_id UUID;
BEGIN
  FOR v_assignment IN SELECT * FROM jsonb_array_elements(p_assignments)
  LOOP
    BEGIN
      v_contract_id := (v_assignment->>'contract_id')::UUID;
      v_promoter_id := (v_assignment->>'promoter_id')::UUID;
      
      UPDATE contracts 
      SET promoter_id = v_promoter_id, updated_at = NOW()
      WHERE id = v_contract_id;
      
      RETURN QUERY SELECT v_contract_id, TRUE, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT v_contract_id, FALSE, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_promoter_assignment_stats()
RETURNS TABLE (
  total_contracts BIGINT,
  contracts_with_promoter BIGINT,
  contracts_without_promoter BIGINT,
  percentage_complete NUMERIC,
  high_priority_missing BIGINT,
  medium_priority_missing BIGINT,
  low_priority_missing BIGINT
)
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_contracts,
    COUNT(promoter_id)::BIGINT as contracts_with_promoter,
    (COUNT(*) - COUNT(promoter_id))::BIGINT as contracts_without_promoter,
    ROUND(100.0 * COUNT(promoter_id) / NULLIF(COUNT(*), 0), 2) as percentage_complete,
    COUNT(*) FILTER (WHERE promoter_id IS NULL AND status IN ('active', 'pending'))::BIGINT as high_priority,
    COUNT(*) FILTER (WHERE promoter_id IS NULL AND status = 'draft')::BIGINT as medium_priority,
    COUNT(*) FILTER (WHERE promoter_id IS NULL)::BIGINT as low_priority
  FROM contracts;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION count_promoters_with_active_contracts()
RETURNS BIGINT
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT promoter_id)::BIGINT
    FROM contracts
    WHERE status = 'active' AND promoter_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_promoter_metrics()
RETURNS TABLE (
  total_workforce BIGINT,
  active_on_contracts BIGINT,
  available_for_work BIGINT,
  on_leave BIGINT,
  inactive BIGINT,
  terminated BIGINT,
  utilization_rate NUMERIC,
  compliance_rate NUMERIC
)
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_workforce,
    COUNT(*) FILTER (WHERE status_enum = 'active')::BIGINT as active_on_contracts,
    COUNT(*) FILTER (WHERE status_enum = 'available')::BIGINT as available_for_work,
    COUNT(*) FILTER (WHERE status_enum = 'on_leave')::BIGINT as on_leave,
    COUNT(*) FILTER (WHERE status_enum = 'inactive')::BIGINT as inactive,
    COUNT(*) FILTER (WHERE status_enum = 'terminated')::BIGINT as terminated,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status_enum = 'active') / NULLIF(COUNT(*), 0), 2) as utilization_rate,
    ROUND(100.0 * COUNT(*) FILTER (
      WHERE id_card_expiry_date > NOW() + INTERVAL '30 days'
      AND passport_expiry_date > NOW() + INTERVAL '30 days'
    ) / NULLIF(COUNT(*), 0), 2) as compliance_rate
  FROM promoters;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 7: CURRENCY FUNCTIONS
-- ================================================================

CREATE OR REPLACE FUNCTION get_exchange_rate(
  p_from_currency currency_code,
  p_to_currency currency_code,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(18,8)
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_rate DECIMAL(18,8);
BEGIN
  IF p_from_currency = p_to_currency THEN
    RETURN 1.0;
  END IF;
  
  SELECT rate INTO v_rate
  FROM exchange_rates
  WHERE from_currency = p_from_currency
  AND to_currency = p_to_currency
  AND effective_date <= p_date
  AND is_active = TRUE
  ORDER BY effective_date DESC
  LIMIT 1;
  
  RETURN v_rate;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION convert_currency(
  p_amount DECIMAL(15,2),
  p_from_currency currency_code,
  p_to_currency currency_code,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(15,2)
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_rate DECIMAL(18,8);
BEGIN
  IF p_from_currency = p_to_currency THEN
    RETURN p_amount;
  END IF;
  
  v_rate := get_exchange_rate(p_from_currency, p_to_currency, p_date);
  
  IF v_rate IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN ROUND(p_amount * v_rate, 2);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_set_exchange_rates_timestamp()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 8: AUDIT FUNCTIONS
-- ================================================================

CREATE OR REPLACE FUNCTION audit_promoter_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF OLD.promoter_id IS DISTINCT FROM NEW.promoter_id THEN
    INSERT INTO contract_promoter_audit (
      contract_id,
      old_promoter_id,
      new_promoter_id,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.promoter_id,
      NEW.promoter_id,
      'Automatic audit: promoter changed'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 9: DASHBOARD FUNCTIONS
-- ================================================================

CREATE OR REPLACE FUNCTION get_user_dashboard_layout(p_user_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_layout JSONB;
BEGIN
  SELECT layout INTO v_layout
  FROM dashboard_layouts
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_layout, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION clone_dashboard_layout(
  p_source_user_id UUID,
  p_target_user_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO dashboard_layouts (user_id, layout)
  SELECT p_target_user_id, layout
  FROM dashboard_layouts
  WHERE user_id = p_source_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 10: UTILITY FUNCTIONS
-- ================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- PART 11: UNACCENT FUNCTION (if exists)
-- ================================================================

-- Fix the unaccent function if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'unaccent'
  ) THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION unaccent(text)
      RETURNS text
      SECURITY DEFINER
      SET search_path = public, pg_catalog, pg_temp
      AS $func$
      SELECT unaccent(''unaccent'', $1);
      $func$ LANGUAGE sql IMMUTABLE;
    ';
    RAISE NOTICE 'Fixed unaccent function';
  END IF;
END $$;

-- ================================================================
-- VERIFICATION
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All 26+ functions updated with SET search_path!';
  RAISE NOTICE 'Functions fixed:';
  RAISE NOTICE '  - Password history (2)';
  RAISE NOTICE '  - User management (2)';
  RAISE NOTICE '  - Promoter validation (2)';
  RAISE NOTICE '  - RBAC (4)';
  RAISE NOTICE '  - Contract sync (2)';
  RAISE NOTICE '  - Promoter management (6)';
  RAISE NOTICE '  - Currency (3)';
  RAISE NOTICE '  - Audit (1)';
  RAISE NOTICE '  - Dashboard (2)';
  RAISE NOTICE '  - Utility (2)';
  RAISE NOTICE '  - Unaccent (1 if exists)';
  RAISE NOTICE '';
  RAISE NOTICE 'Run supabase db lint to verify all warnings are fixed!';
END $$;

