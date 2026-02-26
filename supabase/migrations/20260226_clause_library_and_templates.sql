-- ============================================================================
-- Clause Library & Contract Templates
-- ============================================================================
-- clause_library: Reusable legal clauses with versioning and categorization.
-- contract_templates: User-defined contract templates with dynamic fields.
-- ============================================================================

-- ─── 1. Clause Library ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.clause_library (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  title_ar     TEXT,
  content      TEXT NOT NULL,
  content_ar   TEXT,
  category     TEXT NOT NULL DEFAULT 'general'
                 CHECK (category IN (
                   'indemnity','liability','confidentiality','payment',
                   'termination','dispute_resolution','intellectual_property',
                   'force_majeure','governing_law','general','custom'
                 )),
  tags         TEXT[] NOT NULL DEFAULT '{}',
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  version      INTEGER NOT NULL DEFAULT 1,
  parent_id    UUID REFERENCES public.clause_library(id) ON DELETE SET NULL,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clause_library_company
  ON public.clause_library (company_id, is_active, category);
CREATE INDEX IF NOT EXISTS idx_clause_library_tags
  ON public.clause_library USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_clause_library_parent
  ON public.clause_library (parent_id);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_clause_library_fts
  ON public.clause_library
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_clause_library_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_clause_library_updated_at ON public.clause_library;
CREATE TRIGGER trg_clause_library_updated_at
  BEFORE UPDATE ON public.clause_library
  FOR EACH ROW EXECUTE FUNCTION update_clause_library_updated_at();

-- RLS
ALTER TABLE public.clause_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clause_library_select_company"
  ON public.clause_library FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "clause_library_write_privileged"
  ON public.clause_library FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager', 'hr')
        AND is_active = true
    )
    OR auth.role() = 'service_role'
  );


-- ─── 2. Contract Templates ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.contract_templates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  name_ar        TEXT,
  description    TEXT,
  contract_type  TEXT NOT NULL DEFAULT 'employment',
  language       TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ar', 'bilingual')),
  body_html      TEXT NOT NULL DEFAULT '',
  body_html_ar   TEXT,
  fields         JSONB NOT NULL DEFAULT '[]',   -- Array of { key, label, type, required, default }
  clause_ids     UUID[] NOT NULL DEFAULT '{}',  -- Linked clause IDs from clause_library
  is_active      BOOLEAN NOT NULL DEFAULT true,
  is_default     BOOLEAN NOT NULL DEFAULT false,
  version        INTEGER NOT NULL DEFAULT 1,
  parent_id      UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_company
  ON public.contract_templates (company_id, is_active, contract_type);
CREATE INDEX IF NOT EXISTS idx_contract_templates_clause_ids
  ON public.contract_templates USING gin(clause_ids);

CREATE OR REPLACE FUNCTION update_contract_templates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_contract_templates_updated_at ON public.contract_templates;
CREATE TRIGGER trg_contract_templates_updated_at
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION update_contract_templates_updated_at();

-- RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract_templates_select_company"
  ON public.contract_templates FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "contract_templates_write_privileged"
  ON public.contract_templates FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
        AND is_active = true
    )
    OR auth.role() = 'service_role'
  );
