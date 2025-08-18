-- Ensure service role and authenticated roles have the right privileges for imports
-- Safe, idempotent grants to avoid "permission denied for table promoters"

DO $$
BEGIN
  -- Grant schema usage just in case
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT USAGE ON SCHEMA public TO service_role;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT USAGE ON SCHEMA public TO authenticated;
  END IF;

  -- Promoters table privileges
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'promoters'
  ) THEN
    -- Service role: full access (bypasses RLS but still needs privileges)
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.promoters TO service_role;
    END IF;

    -- Authenticated app users: read/insert/update (adjust as needed)
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      GRANT SELECT, INSERT, UPDATE ON TABLE public.promoters TO authenticated;
    END IF;
  END IF;

  -- Parties table read for employer validation
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'parties'
  ) THEN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
      GRANT SELECT ON TABLE public.parties TO service_role;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      GRANT SELECT ON TABLE public.parties TO authenticated;
    END IF;
  END IF;
END $$ LANGUAGE plpgsql;


