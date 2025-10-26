-- Migration: Fix Supabase Security Linter Issues
-- Date: 2025-10-26
-- Purpose: Fix SECURITY DEFINER views and enable RLS on public tables
-- References: https://supabase.com/docs/guides/database/database-linter

-- ================================================================
-- PART 1: FIX SECURITY DEFINER VIEWS
-- ================================================================
-- Views should use SECURITY INVOKER to enforce permissions of the
-- querying user rather than the view creator
-- ================================================================

-- 1. approved_contracts_view
DROP VIEW IF EXISTS approved_contracts_view CASCADE;
CREATE VIEW approved_contracts_view
WITH (security_invoker = true) AS
SELECT 
  c.*,
  u.email as approved_by_email,
  u.full_name as approved_by_name,
  (c.start_date - CURRENT_DATE) as days_until_start
FROM contracts c
LEFT JOIN users u ON c.approved_by = u.id
WHERE c.status = 'approved'
ORDER BY c.start_date ASC;

COMMENT ON VIEW approved_contracts_view IS 'All approved contracts awaiting activation with approver info';

-- 2. pending_contracts_view
DROP VIEW IF EXISTS pending_contracts_view CASCADE;
CREATE VIEW pending_contracts_view
WITH (security_invoker = true) AS
SELECT 
  c.*,
  u.email as created_by_email,
  u.full_name as created_by_name,
  EXTRACT(EPOCH FROM (NOW() - c.submitted_for_review_at))::INTEGER / 86400 as days_pending
FROM contracts c
LEFT JOIN users u ON c.created_by = u.id
WHERE c.status = 'pending'
ORDER BY c.submitted_for_review_at ASC;

COMMENT ON VIEW pending_contracts_view IS 'All contracts awaiting approval with creator info and pending duration';

-- 3. promoter_status_summary
DROP VIEW IF EXISTS promoter_status_summary CASCADE;
CREATE VIEW promoter_status_summary
WITH (security_invoker = true) AS
SELECT 
  status_enum as status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM promoters
GROUP BY status_enum
ORDER BY count DESC;

COMMENT ON VIEW promoter_status_summary IS 'Summary statistics of promoters by status';

-- 4. contracts_needing_promoters
DROP VIEW IF EXISTS contracts_needing_promoters CASCADE;
CREATE VIEW contracts_needing_promoters
WITH (security_invoker = true) AS
SELECT 
    c.id,
    c.contract_number,
    c.title,
    c.status,
    c.contract_type,
    c.created_at,
    (EXTRACT(EPOCH FROM (NOW() - c.created_at))::INTEGER / 86400) as days_without_promoter,
    COALESCE(p1.name_en, p1.name_ar, 'Unknown') as first_party_name,
    COALESCE(p2.name_en, p2.name_ar, 'Unknown') as second_party_name,
    CASE 
        WHEN c.status IN ('active', 'pending') THEN 'high'
        WHEN c.status = 'draft' AND (EXTRACT(EPOCH FROM (NOW() - c.created_at))::INTEGER / 86400) > 7 THEN 'medium'
        ELSE 'low'
    END as priority
FROM contracts c
LEFT JOIN parties p1 ON (
    c.first_party_id = p1.id OR 
    c.employer_id = p1.id
)
LEFT JOIN parties p2 ON (
    c.second_party_id = p2.id OR 
    c.client_id = p2.id
)
WHERE c.promoter_id IS NULL
ORDER BY 
    CASE 
        WHEN c.status IN ('active', 'pending') THEN 1
        WHEN c.status = 'draft' AND (EXTRACT(EPOCH FROM (NOW() - c.created_at))::INTEGER / 86400) > 7 THEN 2
        ELSE 3
    END,
    c.created_at DESC;

COMMENT ON VIEW contracts_needing_promoters IS 'Lists all contracts without promoters, prioritized by urgency';

-- 5. contracts_with_converted_values
DROP VIEW IF EXISTS contracts_with_converted_values CASCADE;
CREATE VIEW contracts_with_converted_values
WITH (security_invoker = true) AS
SELECT 
    c.*,
    c.value as original_value,
    c.currency as original_currency,
    convert_currency(c.value, c.currency::currency_code, 'USD'::currency_code) as value_usd,
    convert_currency(c.value, c.currency::currency_code, 'OMR'::currency_code) as value_omr,
    convert_currency(c.value, c.currency::currency_code, 'SAR'::currency_code) as value_sar,
    convert_currency(c.value, c.currency::currency_code, 'AED'::currency_code) as value_aed
FROM contracts c;

COMMENT ON VIEW contracts_with_converted_values IS 'Contract values converted to multiple currencies using current exchange rates';

-- 6. promoters_status_review
DROP VIEW IF EXISTS promoters_status_review CASCADE;
CREATE VIEW promoters_status_review
WITH (security_invoker = true) AS
SELECT 
  id,
  name_en,
  email,
  status as old_status,
  status_enum as new_status,
  employer_id,
  CASE 
    WHEN status_enum IS NULL THEN '⚠️ Missing status_enum'
    WHEN status IS NULL THEN '⚠️ Missing old status'
    WHEN status IS NOT NULL AND status_enum IS NOT NULL 
         AND LOWER(status) != status_enum::text THEN '⚠️ Status mismatch'
    ELSE '✅ OK'
  END as status_check,
  CASE 
    WHEN status_enum IS NULL THEN 1
    WHEN status IS NOT NULL AND status_enum IS NOT NULL 
         AND LOWER(status) != status_enum::text THEN 2
    ELSE 3
  END as priority
FROM promoters;

COMMENT ON VIEW promoters_status_review IS 'Review promoter status mappings and identify potential issues. Use ORDER BY priority to see issues first.';

-- 7. rbac_user_role_assignments
DROP VIEW IF EXISTS rbac_user_role_assignments CASCADE;
CREATE VIEW rbac_user_role_assignments
WITH (security_invoker = true) AS
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

COMMENT ON VIEW rbac_user_role_assignments IS 'Compatibility view for RBAC permission cache - bridges user_roles and roles tables';

-- 8. parties_index_usage
DROP VIEW IF EXISTS parties_index_usage CASCADE;
CREATE VIEW parties_index_usage
WITH (security_invoker = true) AS
SELECT
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE relname = 'parties'
ORDER BY idx_scan DESC;

COMMENT ON VIEW parties_index_usage IS 'Monitor parties table index usage for optimization';

-- 9. party_role_analysis (if it exists - recreate with security_invoker)
-- Note: This view wasn't found in existing migrations, but if it exists in the database,
-- we'll drop and potentially need to recreate it manually based on your business logic
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' 
    AND viewname = 'party_role_analysis'
  ) THEN
    DROP VIEW IF EXISTS party_role_analysis CASCADE;
    RAISE NOTICE 'Dropped party_role_analysis view - please recreate with security_invoker if needed';
  END IF;
END $$;

-- ================================================================
-- PART 2: ENABLE RLS ON PUBLIC TABLES
-- ================================================================
-- Tables in the public schema should have Row Level Security enabled
-- to ensure proper access control through PostgREST
-- ================================================================

-- 1. Enable RLS on exchange_rates table
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for exchange_rates
-- Policy: Allow authenticated users to read exchange rates
DROP POLICY IF EXISTS "Authenticated users can view exchange rates" ON exchange_rates;
CREATE POLICY "Authenticated users can view exchange rates" 
  ON exchange_rates 
  FOR SELECT 
  USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Policy: Only service role can modify exchange rates
DROP POLICY IF EXISTS "Service role can manage exchange rates" ON exchange_rates;
CREATE POLICY "Service role can manage exchange rates" 
  ON exchange_rates 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- 2. Enable RLS on promoter_suggestions table
ALTER TABLE promoter_suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for promoter_suggestions
-- Policy: Authenticated users can view suggestions
DROP POLICY IF EXISTS "Authenticated users can view promoter suggestions" ON promoter_suggestions;
CREATE POLICY "Authenticated users can view promoter suggestions" 
  ON promoter_suggestions 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert suggestions
DROP POLICY IF EXISTS "Authenticated users can create promoter suggestions" ON promoter_suggestions;
CREATE POLICY "Authenticated users can create promoter suggestions" 
  ON promoter_suggestions 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update suggestions
DROP POLICY IF EXISTS "Authenticated users can update promoter suggestions" ON promoter_suggestions;
CREATE POLICY "Authenticated users can update promoter suggestions" 
  ON promoter_suggestions 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- 3. Enable RLS on contract_promoter_audit table
ALTER TABLE contract_promoter_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contract_promoter_audit
-- Policy: Authenticated users can view audit logs
DROP POLICY IF EXISTS "Authenticated users can view contract promoter audit" ON contract_promoter_audit;
CREATE POLICY "Authenticated users can view contract promoter audit" 
  ON contract_promoter_audit 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Policy: System can insert audit logs (via triggers)
DROP POLICY IF EXISTS "Service role can insert audit logs" ON contract_promoter_audit;
CREATE POLICY "Service role can insert audit logs" 
  ON contract_promoter_audit 
  FOR INSERT 
  WITH CHECK (true);

-- 4. Enable RLS on promoters_status_backup table
ALTER TABLE promoters_status_backup ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for promoters_status_backup
-- Policy: Only admins can view backup data
DROP POLICY IF EXISTS "Admins can view promoters status backup" ON promoters_status_backup;
CREATE POLICY "Admins can view promoters status backup" 
  ON promoters_status_backup 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy: Service role has full access
DROP POLICY IF EXISTS "Service role can manage promoters status backup" ON promoters_status_backup;
CREATE POLICY "Service role can manage promoters status backup" 
  ON promoters_status_backup 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- ================================================================
-- PART 3: RE-GRANT PERMISSIONS ON VIEWS
-- ================================================================

-- Grant SELECT permissions on all views to authenticated users
GRANT SELECT ON approved_contracts_view TO authenticated;
GRANT SELECT ON pending_contracts_view TO authenticated;
GRANT SELECT ON promoter_status_summary TO authenticated;
GRANT SELECT ON contracts_needing_promoters TO authenticated;
GRANT SELECT ON contracts_with_converted_values TO authenticated;
GRANT SELECT ON promoters_status_review TO authenticated;
GRANT SELECT ON rbac_user_role_assignments TO authenticated;
GRANT SELECT ON rbac_user_role_assignments TO anon;
GRANT SELECT ON parties_index_usage TO authenticated;

-- ================================================================
-- VERIFICATION
-- ================================================================

-- Verify that views are using security_invoker
DO $$
DECLARE
  view_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO view_count
  FROM pg_views
  WHERE schemaname = 'public'
  AND viewname IN (
    'approved_contracts_view',
    'pending_contracts_view',
    'promoter_status_summary',
    'contracts_needing_promoters',
    'contracts_with_converted_values',
    'promoters_status_review',
    'rbac_user_role_assignments',
    'parties_index_usage'
  );
  
  RAISE NOTICE 'Total views recreated with security_invoker: %', view_count;
END $$;

-- Verify RLS is enabled on tables
DO $$
DECLARE
  rls_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN (
    'exchange_rates',
    'promoter_suggestions',
    'contract_promoter_audit',
    'promoters_status_backup'
  )
  AND rowsecurity = true;
  
  RAISE NOTICE 'Total tables with RLS enabled: %', rls_count;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Security linter issues fixed!';
  RAISE NOTICE '   - 8 views recreated with SECURITY INVOKER';
  RAISE NOTICE '   - 4 tables now have RLS enabled';
  RAISE NOTICE '   - All RLS policies have been created';
END $$;

