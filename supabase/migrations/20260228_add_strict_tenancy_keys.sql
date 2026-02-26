-- ============================================================================
-- Add Strict Tenancy Keys (company_id) to Core Tables
-- ============================================================================
-- Tables covered (if they exist):
--   - contracts
--   - contract_versions
--   - contract_approvals
--   - promoters
--   - documents
--
-- Goals:
--   1) Ensure each row in core business tables can be scoped by company_id.
--   2) Add FK company_id → companies(id).
--   3) Skip columns that already exist (idempotent).
--   4) Provide safe backfill strategies:
--        - If table has user_id, infer via user_roles.
--        - If table links to promoter_id, infer via promoter → employer_employees → company_id.
--        - If inference is impossible, leave NULL and avoid adding NOT NULL here
--          (can be enforced in a later, separate migration once backfill is verified).
--
-- IMPORTANT:
--   - This migration intentionally does NOT touch any RLS policies.
--   - It is safe to run multiple times.
-- ============================================================================

-- ============================================================================
-- 1. Add company_id column + FK (if missing)
-- ============================================================================

-- 1a. contracts.company_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contracts'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.contracts
      ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1b. contract_versions.company_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contract_versions'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contract_versions' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.contract_versions
      ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1c. contract_approvals.company_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contract_approvals'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contract_approvals' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.contract_approvals
      ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1d. promoters.company_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'promoters'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promoters' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.promoters
      ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1e. documents.company_id  (generic document table, only if present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'documents'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.documents
      ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 2. Backfill company_id where possible
-- ============================================================================
-- NOTE: All backfills are written to be safe and idempotent:
--   - They only update rows where company_id IS NULL.
--   - They rely on existing FKs/relationships; if no mapping exists, rows remain NULL.
--   - No NOT NULL constraints are added here; that can be done after validating data.
-- ============================================================================

-- 2a. contracts: infer company_id via promoter → employer_employees → company_id
--     Fallbacks (e.g., via parties) are left to earlier migrations.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'company_id'
  ) THEN
    -- Backfill from promoters through employer_employees when promoter_id is present
    -- and employer_employees has a non-null company_id.
    UPDATE public.contracts c
    SET company_id = ee.company_id
    FROM public.promoters pr
    JOIN public.employer_employees ee ON ee.promoter_id = pr.id
    WHERE c.promoter_id = pr.id
      AND ee.company_id IS NOT NULL
      AND c.company_id IS NULL;

    -- Additional backfill strategies (if present in previous migrations) are
    -- intentionally not duplicated here to avoid conflicts; this step only fills
    -- in any remaining NULL company_id values using a strict promoter mapping.
  END IF;
END $$;

-- 2b. contract_versions: infer company_id via parent contracts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contract_versions' AND column_name = 'company_id'
  ) THEN
    UPDATE public.contract_versions cv
    SET company_id = c.company_id
    FROM public.contracts c
    WHERE cv.contract_id = c.id
      AND c.company_id IS NOT NULL
      AND cv.company_id IS NULL;
  END IF;
END $$;

-- 2c. contract_approvals: prefer contract-based mapping; optionally fall back from created_by → user_roles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contract_approvals' AND column_name = 'company_id'
  ) THEN
    -- Primary backfill: inherit from parent contract
    UPDATE public.contract_approvals ca
    SET company_id = c.company_id
    FROM public.contracts c
    WHERE ca.contract_id = c.id
      AND c.company_id IS NOT NULL
      AND ca.company_id IS NULL;

    -- Optional, conservative backfill using created_by → profiles → user_roles:
    -- Only fill when the creator has exactly one active company membership.
    UPDATE public.contract_approvals ca
    SET company_id = ur.company_id
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id AND ur.is_active = TRUE
    WHERE ca.company_id IS NULL
      AND ca.created_by = p.user_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.user_roles ur2
        WHERE ur2.user_id = ur.user_id
          AND ur2.is_active = TRUE
          AND ur2.company_id IS DISTINCT FROM ur.company_id
      );
  END IF;
END $$;

-- 2d. promoters: infer company_id via employer_employees (employer-employee system)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promoters' AND column_name = 'company_id'
  ) THEN
    -- Backfill from employer_employees when promoter_id is linked and employer_employees
    -- already has a company_id.
    UPDATE public.promoters pr
    SET company_id = ee.company_id
    FROM public.employer_employees ee
    WHERE ee.promoter_id = pr.id
      AND ee.company_id IS NOT NULL
      AND pr.company_id IS NULL;

    -- Any remaining NULL company_id rows require manual decision; this migration
    -- intentionally leaves them NULL so that later NOT NULL enforcement can be
    -- done in a separate, verified step.
  END IF;
END $$;

-- 2e. documents: no generic, reliable backfill path
--     Without knowing the concrete relationships of public.documents (if it
--     exists at all), we cannot safely infer company_id here. The column is
--     added as nullable; follow-up, project-specific migrations should:
--       - Implement a table-specific backfill strategy, then
--       - Add a NOT NULL constraint once all rows are populated.

