-- Safely add employer_id to promoters table if missing, and index + FK

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'promoters'
  ) THEN
    -- Add column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'promoters' AND column_name = 'employer_id'
    ) THEN
      ALTER TABLE public.promoters
      ADD COLUMN employer_id UUID NULL;
    END IF;

    -- Add FK to parties(id) when parties exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'parties'
    ) THEN
      -- Drop existing constraint if any (e.g., wrong target) then recreate
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public' AND tc.table_name = 'promoters' AND tc.constraint_name = 'promoters_employer_id_fkey'
      ) THEN
        ALTER TABLE public.promoters DROP CONSTRAINT promoters_employer_id_fkey;
      END IF;

      ALTER TABLE public.promoters
      ADD CONSTRAINT promoters_employer_id_fkey
      FOREIGN KEY (employer_id) REFERENCES public.parties(id) ON DELETE SET NULL;
    END IF;

    -- Create index for faster lookups (idempotent)
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_promoters_employer_id'
    ) THEN
      CREATE INDEX idx_promoters_employer_id ON public.promoters(employer_id);
    END IF;
  END IF;
END $$ LANGUAGE plpgsql;


