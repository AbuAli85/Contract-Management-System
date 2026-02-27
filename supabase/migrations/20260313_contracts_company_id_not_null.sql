-- ============================================================================
-- Contracts: enforce non-null company_id and add index
-- ============================================================================
-- Assumptions:
-- - Earlier migrations (e.g. 20260228_add_strict_tenancy_keys.sql) have already
--   added contracts.company_id and performed best-effort backfill using existing
--   relationships (promoters, employer_employees, etc.).
-- - This migration only tightens constraints where the data is already clean.
-- ============================================================================

-- 1. Add supporting index for tenant-scoped contract queries
CREATE INDEX IF NOT EXISTS idx_contracts_company_created_at
  ON public.contracts (company_id, created_at);

-- 2. Enforce NOT NULL on company_id, but only if there are no remaining NULLs
DO $$
DECLARE
  v_missing INTEGER;
BEGIN
  -- Count any remaining contracts rows without a company_id
  SELECT COUNT(*) INTO v_missing
  FROM public.contracts
  WHERE company_id IS NULL;

  IF v_missing = 0 THEN
    ALTER TABLE public.contracts
      ALTER COLUMN company_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'contracts.company_id is still NULL for % rows; NOT NULL constraint not applied. Please fix data and re-run.', v_missing;
  END IF;
END $$;

