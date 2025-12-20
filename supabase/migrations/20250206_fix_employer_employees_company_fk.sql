-- ============================================================================
-- FIX EMPLOYER_EMPLOYEES COMPANY_ID FOREIGN KEY CONSTRAINT
-- ============================================================================
-- This migration fixes the foreign key constraint on employer_employees.company_id
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
    AND constraint_name = 'employer_employees_company_id_fkey'
    AND table_name = 'employer_employees'
  ) THEN
    ALTER TABLE employer_employees 
    DROP CONSTRAINT employer_employees_company_id_fkey;
    
    RAISE NOTICE 'Dropped existing employer_employees_company_id_fkey constraint';
  END IF;
END $$;

-- Recreate the foreign key constraint with ON DELETE SET NULL
-- This allows companies to be deleted, and sets company_id to NULL for affected employees
ALTER TABLE employer_employees
ADD CONSTRAINT employer_employees_company_id_fkey 
FOREIGN KEY (company_id) 
REFERENCES companies(id) 
ON DELETE SET NULL;

-- Add index if it doesn't exist (should already exist, but just in case)
CREATE INDEX IF NOT EXISTS idx_employer_employees_company_id 
ON employer_employees(company_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT employer_employees_company_id_fkey ON employer_employees 
IS 'Foreign key to companies table. When a company is deleted, company_id is set to NULL for all affected employee records.';

