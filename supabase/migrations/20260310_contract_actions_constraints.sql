-- ============================================================================
-- Contract Actions: constraints and uniqueness
-- ============================================================================
-- Adds:
--   - CHECK constraints for action_type and status
--   - Partial unique index to prevent multiple open/pending renewals
--   - Wrapped in IF EXISTS so it is safe if table is missing
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.contract_actions') IS NOT NULL THEN
    ALTER TABLE public.contract_actions
      ADD CONSTRAINT contract_actions_action_type_check
        CHECK (action_type IN ('renewal'))
      NOT VALID;

    ALTER TABLE public.contract_actions
      ADD CONSTRAINT contract_actions_status_check
        CHECK (status IN ('open', 'pending', 'done', 'cancelled'))
      NOT VALID;

    -- Prevent multiple open/pending renewals per contract
    CREATE UNIQUE INDEX IF NOT EXISTS idx_contract_actions_unique_open_renewal
      ON public.contract_actions (company_id, contract_id, action_type)
      WHERE action_type = 'renewal' AND status IN ('open', 'pending');
  END IF;
END $$;


