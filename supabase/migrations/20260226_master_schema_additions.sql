-- ============================================================================
-- SmartPRO Enterprise Platform — Master Schema Additions
-- Run this migration to add all new tables introduced in the Feb 2026 update
-- ============================================================================

-- ============================================================
-- 1. DIGITAL SIGNATURES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.digital_signatures (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contract_id       UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  signer_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  signer_name       TEXT NOT NULL,
  signer_email      TEXT,
  signer_role       TEXT,
  signature_type    TEXT NOT NULL DEFAULT 'drawn'
                      CHECK (signature_type IN ('drawn', 'typed', 'uploaded', 'docusign', 'hellosign')),
  signature_data    TEXT,            -- base64 PNG for drawn/typed/uploaded
  external_id       TEXT,            -- DocuSign/HelloSign envelope/signature ID
  external_provider TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'signed', 'declined', 'expired', 'voided')),
  ip_address        TEXT,
  user_agent        TEXT,
  signed_at         TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_digital_signatures_contract
  ON public.digital_signatures (contract_id, status);
CREATE INDEX IF NOT EXISTS idx_digital_signatures_signer
  ON public.digital_signatures (signer_id);

ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "digital_signatures_company_read"
  ON public.digital_signatures FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true)
    OR signer_id = auth.uid()
    OR auth.role() = 'service_role'
  );

CREATE POLICY "digital_signatures_company_write"
  ON public.digital_signatures FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager') AND is_active = true
    )
    OR signer_id = auth.uid()
    OR auth.role() = 'service_role'
  );

-- ============================================================
-- 2. CLAUSE LIBRARY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clause_library (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  title_ar        TEXT,
  category        TEXT NOT NULL DEFAULT 'general',
  contract_types  TEXT[] DEFAULT '{}',
  language        TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ar', 'bilingual')),
  content         TEXT NOT NULL,
  content_ar      TEXT,
  tags            TEXT[] DEFAULT '{}',
  is_mandatory    BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  version         INTEGER NOT NULL DEFAULT 1,
  parent_id       UUID REFERENCES public.clause_library(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clause_library_company
  ON public.clause_library (company_id, category, is_active);

ALTER TABLE public.clause_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clause_library_company_read"
  ON public.clause_library FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "clause_library_company_write"
  ON public.clause_library FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager') AND is_active = true
    )
    OR auth.role() = 'service_role'
  );

-- ============================================================
-- 3. CONTRACT TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  name_ar         TEXT,
  contract_type   TEXT NOT NULL,
  language        TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ar', 'bilingual')),
  description     TEXT,
  body_html       TEXT,
  body_html_ar    TEXT,
  fields          JSONB DEFAULT '[]',
  clause_ids      UUID[] DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  version         INTEGER NOT NULL DEFAULT 1,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_company
  ON public.contract_templates (company_id, contract_type, is_active);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract_templates_company_read"
  ON public.contract_templates FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "contract_templates_company_write"
  ON public.contract_templates FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager') AND is_active = true
    )
    OR auth.role() = 'service_role'
  );

-- ============================================================
-- 4. CRM — COMMUNICATION LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.communication_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_type    TEXT NOT NULL DEFAULT 'party',
  contact_id      UUID,
  contact_name    TEXT,
  contact_email   TEXT,
  channel         TEXT NOT NULL DEFAULT 'email'
                    CHECK (channel IN ('email', 'phone', 'whatsapp', 'meeting', 'note', 'sms', 'other')),
  direction       TEXT NOT NULL DEFAULT 'outbound'
                    CHECK (direction IN ('inbound', 'outbound')),
  subject         TEXT,
  body            TEXT,
  outcome         TEXT,
  duration_mins   INTEGER,
  follow_up_date  DATE,
  logged_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communication_logs_company
  ON public.communication_logs (company_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_logs_contact
  ON public.communication_logs (contact_type, contact_id);

ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "communication_logs_company_read"
  ON public.communication_logs FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "communication_logs_company_write"
  ON public.communication_logs FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true
    )
    OR auth.role() = 'service_role'
  );

-- ============================================================
-- 5. CRM — DEALS / PIPELINE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  contact_type    TEXT DEFAULT 'party',
  contact_id      UUID,
  contact_name    TEXT,
  stage           TEXT NOT NULL DEFAULT 'lead'
                    CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  value           NUMERIC(15, 3),
  currency        TEXT DEFAULT 'OMR',
  probability     INTEGER DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),
  expected_close  DATE,
  assigned_to     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes           TEXT,
  lost_reason     TEXT,
  won_at          TIMESTAMPTZ,
  lost_at         TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_company_stage
  ON public.deals (company_id, stage);
CREATE INDEX IF NOT EXISTS idx_deals_assigned
  ON public.deals (assigned_to);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deals_company_read"
  ON public.deals FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "deals_company_write"
  ON public.deals FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true
    )
    OR auth.role() = 'service_role'
  );

-- ============================================================
-- 6. HR WORKFLOWS (ONBOARDING / OFFBOARDING)
-- ============================================================
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

ALTER TABLE public.hr_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_workflows_company_read"
  ON public.hr_workflows FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "hr_workflows_company_write"
  ON public.hr_workflows FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'hr') AND is_active = true
    )
    OR auth.role() = 'service_role'
  );

-- ============================================================
-- 7. AUDIT LOGS (dedicated table)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  entity_type     TEXT,
  entity_id       UUID,
  old_data        JSONB,
  new_data        JSONB,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company
  ON public.audit_logs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON public.audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user
  ON public.audit_logs (user_id, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_read"
  ON public.audit_logs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
    OR auth.role() = 'service_role'
  );

CREATE POLICY "audit_logs_insert"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

-- ============================================================
-- 8. SAVED REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.saved_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  definition      JSONB NOT NULL,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_reports_company_read"
  ON public.saved_reports FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "saved_reports_company_write"
  ON public.saved_reports FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true
    )
    OR auth.role() = 'service_role'
  );

-- ============================================================
-- 9. RECRUITMENT — JOB POSTINGS & APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.job_postings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  department      TEXT,
  location        TEXT,
  employment_type TEXT DEFAULT 'full_time',
  description     TEXT,
  requirements    TEXT,
  salary_min      NUMERIC(15, 3),
  salary_max      NUMERIC(15, 3),
  currency        TEXT DEFAULT 'OMR',
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'open', 'closed', 'cancelled')),
  deadline        DATE,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id  UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
  company_id      UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  applicant_name  TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  nationality     TEXT,
  cv_url          TEXT,
  cover_letter    TEXT,
  status          TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  notes           TEXT,
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_postings_company
  ON public.job_postings (company_id, status);
CREATE INDEX IF NOT EXISTS idx_job_applications_posting
  ON public.job_applications (job_posting_id, status);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_postings_company_read"
  ON public.job_postings FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true)
    OR status = 'open'
    OR auth.role() = 'service_role'
  );

CREATE POLICY "job_postings_company_write"
  ON public.job_postings FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'hr') AND is_active = true
    )
    OR auth.role() = 'service_role'
  );

CREATE POLICY "job_applications_company_read"
  ON public.job_applications FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'hr') AND is_active = true
    )
    OR auth.role() = 'service_role'
  );

CREATE POLICY "job_applications_company_write"
  ON public.job_applications FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true
    )
    OR auth.role() = 'service_role'
  );

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'digital_signatures', 'clause_library', 'contract_templates',
    'deals', 'hr_workflows', 'saved_reports', 'job_postings', 'job_applications'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;
       CREATE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END;
$$;
