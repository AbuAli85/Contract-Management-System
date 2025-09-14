-- Safe bootstrap migration: create promoters table if it doesn't exist
-- This file is NON-DESTRUCTIVE. It will not drop or truncate any data.
-- Apply in Supabase SQL editor or via migration runner in non-prod/prod.

-- Create extension for UUID if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table if missing (minimal, app-compatible schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'promoters'
  ) THEN
    CREATE TABLE public.promoters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      -- Names
      name_en TEXT,
      name_ar TEXT,
      first_name TEXT,
      last_name TEXT,
      -- Contact
      email TEXT,
      phone TEXT,
      mobile_number TEXT,
      profile_picture_url TEXT,
      -- Documents
      id_card_number TEXT UNIQUE,
      id_card_expiry_date DATE,
      passport_number TEXT,
      passport_expiry_date DATE,
      visa_number TEXT,
      visa_expiry_date DATE,
      work_permit_number TEXT,
      work_permit_expiry_date DATE,
      -- Personal info
      nationality TEXT,
      date_of_birth DATE,
      gender TEXT,
      marital_status TEXT,
      -- Address
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      postal_code TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      -- Professional
      job_title TEXT,
      company TEXT,
      department TEXT,
      specialization TEXT,
      experience_years INTEGER,
      education_level TEXT,
      university TEXT,
      graduation_year INTEGER,
      skills TEXT,
      certifications TEXT,
      -- Financial
      bank_name TEXT,
      account_number TEXT,
      iban TEXT,
      swift_code TEXT,
      tax_id TEXT,
      -- Status & prefs
      status TEXT,
      overall_status TEXT,
      rating NUMERIC,
      availability TEXT,
      preferred_language TEXT,
      timezone TEXT,
      special_requirements TEXT,
      notes TEXT,
      employer_id UUID,
      -- Notifications
      notify_days_before_id_expiry INTEGER DEFAULT 100,
      notify_days_before_passport_expiry INTEGER DEFAULT 210,
      -- Timestamps
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Helpful indexes
    CREATE INDEX IF NOT EXISTS idx_promoters_email ON public.promoters(email);
    CREATE INDEX IF NOT EXISTS idx_promoters_status ON public.promoters(status);
    CREATE INDEX IF NOT EXISTS idx_promoters_id_card_number ON public.promoters(id_card_number);
  END IF;
END $$ LANGUAGE plpgsql;

-- Ensure updated_at auto-update trigger (safe create)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'set_updated_at' AND n.nspname = 'public'
  ) THEN
    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS trigger AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'promoters_set_updated_at' AND c.relname = 'promoters' AND n.nspname = 'public'
  ) THEN
    CREATE TRIGGER promoters_set_updated_at
    BEFORE UPDATE ON public.promoters
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
  END IF;
END $$ LANGUAGE plpgsql;

-- Optional: basic RLS read for authenticated users, but only if RLS is enabled elsewhere.
-- This migration does not enable/force RLS to avoid accidental lockouts.

