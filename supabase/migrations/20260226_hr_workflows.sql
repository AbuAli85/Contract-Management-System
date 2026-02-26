-- ============================================================================
-- HR Workflows: Onboarding & Offboarding
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.hr_workflows (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_name   TEXT,
  workflow_type   TEXT NOT NULL CHECK (workflow_type IN ('onboarding', 'offboarding')),
  status          TEXT NOT NULL DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress', 'completed', 'cancelled', 'on_hold')),
  steps           JSONB NOT NULL DEFAULT '[]',
  start_date      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_workflows_company
  ON public.hr_workflows (company_id, workflow_type, status);
CREATE INDEX IF NOT EXISTS idx_hr_workflows_employee
  ON public.hr_workflows (employee_id);

CREATE OR REPLACE FUNCTION update_hr_workflows_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_hr_workflows_updated_at ON public.hr_workflows;
CREATE TRIGGER trg_hr_workflows_updated_at
  BEFORE UPDATE ON public.hr_workflows
  FOR EACH ROW EXECUTE FUNCTION update_hr_workflows_updated_at();

ALTER TABLE public.hr_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_workflows_company_select"
  ON public.hr_workflows FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "hr_workflows_company_write"
  ON public.hr_workflows FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager', 'hr')
        AND is_active = true
    )
    OR auth.role() = 'service_role'
  );
