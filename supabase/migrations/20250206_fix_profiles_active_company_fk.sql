-- ============================================================================
-- FIX PROFILES ACTIVE_COMPANY_ID FOREIGN KEY CONSTRAINT
-- ============================================================================
-- This migration fixes the foreign key constraint on profiles.active_company_id
-- to include ON DELETE behavior, allowing companies to be deleted without
-- foreign key constraint errors.
-- ============================================================================

-- Drop the existing foreign key constraint if it exists
DO $$
BEGIN
  -- Check if the constraint exists and drop it
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND constraint_name = 'profiles_active_company_id_fkey'
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles 
    DROP CONSTRAINT profiles_active_company_id_fkey;
    
    RAISE NOTICE 'Dropped existing profiles_active_company_id_fkey constraint';
  END IF;
END $$;

-- Recreate the foreign key constraint with ON DELETE SET NULL
-- This allows companies to be deleted, and sets active_company_id to NULL for affected profiles
ALTER TABLE profiles
ADD CONSTRAINT profiles_active_company_id_fkey 
FOREIGN KEY (active_company_id) 
REFERENCES companies(id) 
ON DELETE SET NULL;

-- Add index if it doesn't exist (should already exist, but just in case)
CREATE INDEX IF NOT EXISTS idx_profiles_active_company_id 
ON profiles(active_company_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT profiles_active_company_id_fkey ON profiles 
IS 'Foreign key to companies table. When a company is deleted, active_company_id is set to NULL for all affected user profiles.';

