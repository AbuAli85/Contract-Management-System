-- Migration: Add missing contract columns for backward compatibility
-- Date: 2025-01-20
-- Description: Add first_party_id and second_party_id columns to maintain compatibility with existing code

-- Add the missing columns that the code expects
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS first_party_id UUID,
ADD COLUMN IF NOT EXISTS second_party_id UUID;

-- Add foreign key constraints for the new columns
ALTER TABLE contracts 
ADD CONSTRAINT IF NOT EXISTS contracts_first_party_id_fkey 
FOREIGN KEY (first_party_id) REFERENCES parties(id) ON DELETE SET NULL;

ALTER TABLE contracts 
ADD CONSTRAINT IF NOT EXISTS contracts_second_party_id_fkey 
FOREIGN KEY (second_party_id) REFERENCES parties(id) ON DELETE SET NULL;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_contracts_first_party_id ON contracts(first_party_id);
CREATE INDEX IF NOT EXISTS idx_contracts_second_party_id ON contracts(second_party_id);

-- Add comments for documentation
COMMENT ON COLUMN contracts.first_party_id IS 'Foreign key to the first party in the contract (backward compatibility)';
COMMENT ON COLUMN contracts.second_party_id IS 'Foreign key to the second party in the contract (backward compatibility)';

-- Create a function to sync the old and new column values
CREATE OR REPLACE FUNCTION sync_contract_party_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- If first_party_id is set but employer_id is not, sync them
  IF NEW.first_party_id IS NOT NULL AND NEW.employer_id IS NULL THEN
    NEW.employer_id = NEW.first_party_id;
  END IF;
  
  -- If second_party_id is set but client_id is not, sync them
  IF NEW.second_party_id IS NOT NULL AND NEW.client_id IS NULL THEN
    NEW.client_id = NEW.second_party_id;
  END IF;
  
  -- If employer_id is set but first_party_id is not, sync them
  IF NEW.employer_id IS NOT NULL AND NEW.first_party_id IS NULL THEN
    NEW.first_party_id = NEW.employer_id;
  END IF;
  
  -- If client_id is set but second_party_id is not, sync them
  IF NEW.client_id IS NOT NULL AND NEW.second_party_id IS NULL THEN
    NEW.second_party_id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync the columns
DROP TRIGGER IF EXISTS sync_contract_party_columns_trigger ON contracts;
CREATE TRIGGER sync_contract_party_columns_trigger
  BEFORE INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contract_party_columns();

-- Update existing records to sync the columns (if any exist)
UPDATE contracts 
SET 
  first_party_id = employer_id,
  second_party_id = client_id
WHERE first_party_id IS NULL OR second_party_id IS NULL;
