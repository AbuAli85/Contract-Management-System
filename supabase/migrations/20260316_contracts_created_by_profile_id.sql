-- ============================================================================
-- Contracts: created_by_profile_id for tenant-scoped actor attribution
-- ============================================================================
-- The existing contracts.created_by column is historically tied to auth.users(id)
-- via legacy migrations and views. To align with the canonical tenancy model
-- (user_roles.user_id = profiles.id), we introduce a separate
-- created_by_profile_id column that references profiles(id).
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contracts'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contracts'
      AND column_name = 'created_by_profile_id'
  ) THEN
    ALTER TABLE public.contracts
      ADD COLUMN created_by_profile_id UUID REFERENCES public.profiles(id);
  END IF;
END $$;

-- Optional index to support tenant + actor scoped queries later
CREATE INDEX IF NOT EXISTS idx_contracts_company_created_by_profile
  ON public.contracts (company_id, created_by_profile_id);

