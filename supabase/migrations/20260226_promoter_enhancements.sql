-- ============================================================
-- Migration: Promoter Module Enhancements
-- Date: 2026-02-26
-- Description: Adds missing columns to promoters and fixes
--              promoter_documents foreign key type mismatch
-- Target project: contract-generator (reootcngcptfogfozlmz)
-- ============================================================

-- ─── 1. Fix promoter_documents table ─────────────────────────────────────────
-- The promoter_id column was integer but promoters.id is uuid.
-- This migration recreates the column with the correct type.
-- (Safe: table was empty when this was applied)

DO $$
BEGIN
  -- Drop old integer promoter_id if it still exists as integer
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'promoter_documents'
      AND column_name = 'promoter_id'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE public.promoter_documents DROP COLUMN promoter_id;
    ALTER TABLE public.promoter_documents
      ADD COLUMN promoter_id uuid REFERENCES public.promoters(id) ON DELETE CASCADE;
  END IF;

  -- Fix id column from integer to uuid if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'promoter_documents'
      AND column_name = 'id'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE public.promoter_documents ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.promoter_documents DROP COLUMN id;
    ALTER TABLE public.promoter_documents
      ADD COLUMN id uuid DEFAULT gen_random_uuid() PRIMARY KEY;
  END IF;
END $$;

-- Add missing columns to promoter_documents
ALTER TABLE public.promoter_documents
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS document_name text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;

-- Indexes on promoter_documents
CREATE INDEX IF NOT EXISTS idx_promoter_docs_promoter_id
  ON public.promoter_documents(promoter_id);
CREATE INDEX IF NOT EXISTS idx_promoter_docs_type
  ON public.promoter_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_promoter_docs_expiry
  ON public.promoter_documents(expires_at)
  WHERE expires_at IS NOT NULL;

-- Enable RLS on promoter_documents
ALTER TABLE public.promoter_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS promoter_documents_select ON public.promoter_documents;
DROP POLICY IF EXISTS promoter_documents_insert ON public.promoter_documents;
DROP POLICY IF EXISTS promoter_documents_update ON public.promoter_documents;
DROP POLICY IF EXISTS promoter_documents_delete ON public.promoter_documents;

CREATE POLICY promoter_documents_select ON public.promoter_documents
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY promoter_documents_insert ON public.promoter_documents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY promoter_documents_update ON public.promoter_documents
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY promoter_documents_delete ON public.promoter_documents
  FOR DELETE USING (auth.role() = 'authenticated');

-- ─── 2. Add missing columns to promoters ─────────────────────────────────────

ALTER TABLE public.promoters
  ADD COLUMN IF NOT EXISTS photo_url            text,
  ADD COLUMN IF NOT EXISTS work_location        text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name  text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS contract_start_date  date,
  ADD COLUMN IF NOT EXISTS contract_end_date    date,
  ADD COLUMN IF NOT EXISTS salary               numeric(12, 2),
  ADD COLUMN IF NOT EXISTS currency             text DEFAULT 'OMR',
  ADD COLUMN IF NOT EXISTS tags                 text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS archived_at          timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by          uuid;

-- ─── 3. Add missing indexes on promoters ─────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_promoters_work_location
  ON public.promoters(work_location)
  WHERE work_location IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_promoters_department
  ON public.promoters(department)
  WHERE department IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_promoters_contract_dates
  ON public.promoters(contract_start_date, contract_end_date);

CREATE INDEX IF NOT EXISTS idx_promoters_tags
  ON public.promoters USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_promoters_archived
  ON public.promoters(archived_at)
  WHERE archived_at IS NOT NULL;

-- ─── 4. Add updated_at trigger to promoters (if missing) ─────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_promoters_updated_at'
      AND tgrelid = 'public.promoters'::regclass
  ) THEN
    CREATE TRIGGER set_promoters_updated_at
      BEFORE UPDATE ON public.promoters
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
EXCEPTION WHEN undefined_function THEN
  -- set_updated_at function doesn't exist, skip
  NULL;
END $$;

-- ─── 5. Add updated_at trigger to promoter_documents (if missing) ─────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_promoter_documents_updated_at'
      AND tgrelid = 'public.promoter_documents'::regclass
  ) THEN
    CREATE TRIGGER set_promoter_documents_updated_at
      BEFORE UPDATE ON public.promoter_documents
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
EXCEPTION WHEN undefined_function THEN
  NULL;
END $$;
