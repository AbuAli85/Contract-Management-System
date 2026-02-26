-- ============================================================================
-- Recruitment, CRM Communication Logs & Sales Pipeline
-- ============================================================================

-- ─── 1. Job Postings ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.job_postings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  department      TEXT,
  location        TEXT,
  job_type        TEXT NOT NULL DEFAULT 'full_time'
                    CHECK (job_type IN ('full_time','part_time','contract','internship','remote')),
  experience_level TEXT DEFAULT 'mid'
                    CHECK (experience_level IN ('entry','mid','senior','lead','executive')),
  description     TEXT,
  requirements    TEXT,
  salary_min      NUMERIC(12,2),
  salary_max      NUMERIC(12,2),
  currency        TEXT DEFAULT 'OMR',
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','open','closed','on_hold')),
  deadline        DATE,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_postings_company
  ON public.job_postings (company_id, status);

-- ─── 2. Job Applications ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.job_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_posting_id  UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  applicant_name  TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  resume_url      TEXT,
  cover_letter    TEXT,
  stage           TEXT NOT NULL DEFAULT 'applied'
                    CHECK (stage IN ('applied','screening','interview','assessment','offer','hired','rejected','withdrawn')),
  rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes           TEXT,
  assigned_to     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_company
  ON public.job_applications (company_id, stage);
CREATE INDEX IF NOT EXISTS idx_job_applications_posting
  ON public.job_applications (job_posting_id, stage);

-- ─── 3. Communication Logs (CRM) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.communication_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_type    TEXT NOT NULL CHECK (contact_type IN ('party','promoter','employer','employee','applicant')),
  contact_id      UUID NOT NULL,
  contact_name    TEXT,
  contact_email   TEXT,
  channel         TEXT NOT NULL CHECK (channel IN ('email','phone','whatsapp','meeting','note','sms','other')),
  direction       TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound','outbound')),
  subject         TEXT,
  body            TEXT,
  outcome         TEXT,
  duration_mins   INTEGER,
  logged_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  follow_up_date  DATE,
  related_contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_logs_company_contact
  ON public.communication_logs (company_id, contact_type, contact_id);
CREATE INDEX IF NOT EXISTS idx_comm_logs_logged_at
  ON public.communication_logs (company_id, logged_at DESC);

-- ─── 4. Deals / Sales Pipeline ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  contact_type    TEXT CHECK (contact_type IN ('party','promoter','employer')),
  contact_id      UUID,
  contact_name    TEXT,
  stage           TEXT NOT NULL DEFAULT 'lead'
                    CHECK (stage IN ('lead','qualified','proposal','negotiation','won','lost')),
  value           NUMERIC(14,2),
  currency        TEXT DEFAULT 'OMR',
  probability     INTEGER DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),
  expected_close  DATE,
  actual_close    DATE,
  assigned_to     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes           TEXT,
  lost_reason     TEXT,
  related_contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_company_stage
  ON public.deals (company_id, stage);
CREATE INDEX IF NOT EXISTS idx_deals_assigned
  ON public.deals (company_id, assigned_to);

-- ─── 5. Audit Logs (proper table, replaces webhook_logs workaround) ───────────

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    UUID,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created
  ON public.audit_logs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON public.audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user
  ON public.audit_logs (user_id, created_at DESC);

-- RLS for all new tables
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Generic company-scoped read policy helper
CREATE POLICY "job_postings_company_select"
  ON public.job_postings FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "job_postings_company_write"
  ON public.job_postings FOR ALL
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner','admin','manager','hr') AND is_active = true) OR auth.role() = 'service_role');

CREATE POLICY "job_applications_company_select"
  ON public.job_applications FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "job_applications_company_write"
  ON public.job_applications FOR ALL
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner','admin','manager','hr') AND is_active = true) OR auth.role() = 'service_role');

CREATE POLICY "communication_logs_company_select"
  ON public.communication_logs FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "communication_logs_company_write"
  ON public.communication_logs FOR ALL
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true) OR auth.role() = 'service_role');

CREATE POLICY "deals_company_select"
  ON public.deals FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "deals_company_write"
  ON public.deals FOR ALL
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true) OR auth.role() = 'service_role');

CREATE POLICY "audit_logs_company_select"
  ON public.audit_logs FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('owner','admin') AND is_active = true));

CREATE POLICY "audit_logs_service_insert"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true));
