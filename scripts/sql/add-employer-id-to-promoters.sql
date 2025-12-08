-- Add employer_id column to promoters table
-- Run this in your Supabase SQL editor

-- Add the employer_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promoters' AND column_name = 'employer_id'
  ) THEN
    ALTER TABLE public.promoters
    ADD COLUMN employer_id UUID NULL;
    
    -- Add foreign key constraint to parties table
    ALTER TABLE public.promoters
    ADD CONSTRAINT promoters_employer_id_fkey
    FOREIGN KEY (employer_id) REFERENCES public.parties(id) ON DELETE SET NULL;
    
    -- Create index for faster lookups
    CREATE INDEX idx_promoters_employer_id ON public.promoters(employer_id);
    
    RAISE NOTICE 'Successfully added employer_id column to promoters table';
  ELSE
    RAISE NOTICE 'employer_id column already exists in promoters table';
  END IF;
END $$;
