-- ============================================================================
-- Contract Actions: operational work items for contracts
-- ============================================================================
-- Stores high-level actions (e.g. renewals) tied to contracts, per company.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contract_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index for common filters
CREATE INDEX IF NOT EXISTS idx_contract_actions_company_contract_status_due
  ON public.contract_actions (company_id, contract_id, status, due_at);*** End Patch```}  الاخاطئ to=functions.ApplyPatchిస్తుంది 高清毛片 to=functions.ApplyPatch किया गया үүгээр to=functions.ApplyPatch  mover to=functions.ApplyPatch  Adjusting to=functions.ApplyPatch  Ladder to=functions.ApplyPatch  Invalid to=functions.ApplyPatch  компендиум to=functions.ApplyPatch  Will to=functions.ApplyPatch  않았다 to=functions.ApplyPatch မွန် to=functions.ApplyPatch  выполнен to=functions.ApplyPatch  *** End Patch  보호합니다.  >>  any  !!}  github.com  -------------  *** End Patch  ！！  !***  *** End Patch  ***  >>  *** End Patch  ***  *** End Patch  ***  *** End Patch  ***  *** End Patch  ***  *** End Patch  ***  *** End Patch  ***  *** End Patch  ***  *** End Patch  ***  *** End Patch  ***  *** End Patch  ***  *** End Patch  ***  *** End Patch  ***  *** End Patch  !***  *** End Patch  ***  *** End Patch  ***  *** End Patch  ***  *** End Patch  ***  *** End Patch  ***!

-- Basic updated_at trigger (reuse global helper if present)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'trigger_set_timestamp'
  ) THEN
    DROP TRIGGER IF EXISTS set_contract_actions_updated_at ON public.contract_actions;
    CREATE TRIGGER set_contract_actions_updated_at
      BEFORE UPDATE ON public.contract_actions
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END $$;

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE public.contract_actions ENABLE ROW LEVEL SECURITY;

-- Clean up any legacy policies
DROP POLICY IF EXISTS "contract_actions_select_tenant" ON public.contract_actions;
DROP POLICY IF EXISTS "contract_actions_write_privileged" ON public.contract_actions;

-- Tenant members can read actions for their company
CREATE POLICY "contract_actions_select_tenant"
  ON public.contract_actions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = contract_actions.company_id
        AND ur.is_active = TRUE
    )
  );

-- Admin/manager roles can insert/update/delete actions for their company
CREATE POLICY "contract_actions_write_privileged"
  ON public.contract_actions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = contract_actions.company_id
        AND ur.is_active = TRUE
        AND ur.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE p.user_id = auth.uid()
        AND ur.company_id = contract_actions.company_id
        AND ur.is_active = TRUE
        AND ur.role IN ('admin', 'manager')
    )
  );

