-- Migration: Fix trigger functions with TEXT vs UUID type mismatch
-- Date: 2025-10-23
-- Issue: Trigger functions trying to compare UUID with TEXT causing errors

-- Drop the problematic trigger and function if they exist
DROP TRIGGER IF EXISTS sync_contract_party_ids_trigger ON contracts;
DROP FUNCTION IF EXISTS sync_contract_party_ids();

-- Recreate the function with proper UUID types
CREATE OR REPLACE FUNCTION sync_contract_party_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync first_party_id and employer_id (both UUID now)
  IF NEW.first_party_id IS NOT NULL AND NEW.employer_id IS NULL THEN
    NEW.employer_id = NEW.first_party_id;
  ELSIF NEW.employer_id IS NOT NULL AND NEW.first_party_id IS NULL THEN
    NEW.first_party_id = NEW.employer_id;
  END IF;
  
  -- Sync second_party_id and client_id (both UUID now)
  IF NEW.second_party_id IS NOT NULL AND NEW.client_id IS NULL THEN
    NEW.client_id = NEW.second_party_id;
  ELSIF NEW.client_id IS NOT NULL AND NEW.second_party_id IS NULL THEN
    NEW.second_party_id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER sync_contract_party_ids_trigger
  BEFORE INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contract_party_ids();

-- Also update the sync_contract_party_columns function if it exists (from previous migration)
DROP TRIGGER IF EXISTS sync_contract_party_columns_trigger ON contracts;
DROP FUNCTION IF EXISTS sync_contract_party_columns() CASCADE;

-- Recreate with proper UUID handling
CREATE OR REPLACE FUNCTION sync_contract_party_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- If first_party_id is set but employer_id is not, sync them (both UUID)
  IF NEW.first_party_id IS NOT NULL AND NEW.employer_id IS NULL THEN
    NEW.employer_id = NEW.first_party_id;
  END IF;
  
  -- If second_party_id is set but client_id is not, sync them (both UUID)
  IF NEW.second_party_id IS NOT NULL AND NEW.client_id IS NULL THEN
    NEW.client_id = NEW.second_party_id;
  END IF;
  
  -- If employer_id is set but first_party_id is not, sync them (both UUID)
  IF NEW.employer_id IS NOT NULL AND NEW.first_party_id IS NULL THEN
    NEW.first_party_id = NEW.employer_id;
  END IF;
  
  -- If client_id is set but second_party_id is not, sync them (both UUID)
  IF NEW.client_id IS NOT NULL AND NEW.second_party_id IS NULL THEN
    NEW.second_party_id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER sync_contract_party_columns_trigger
  BEFORE INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contract_party_columns();

-- Comment for documentation
COMMENT ON FUNCTION sync_contract_party_ids() IS 'Automatically syncs first_party_id with employer_id and second_party_id with client_id';
COMMENT ON FUNCTION sync_contract_party_columns() IS 'Automatically syncs party-related columns in contracts table (UUID types)';

