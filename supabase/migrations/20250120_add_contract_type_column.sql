-- Migration: Add contract_type column to contracts table
-- Date: 2025-01-20
-- This migration adds the missing contract_type column that the form expects

-- Add contract_type column if it doesn't exist
DO $$ 
BEGIN
    -- Check if contract_type column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'contract_type'
    ) THEN
        -- Add contract_type column
        ALTER TABLE contracts 
        ADD COLUMN contract_type TEXT DEFAULT 'employment' 
        CHECK (contract_type IN ('employment', 'service', 'consultancy', 'partnership'));
        
        -- Update existing records to have a default contract_type
        UPDATE contracts 
        SET contract_type = COALESCE(type, 'employment') 
        WHERE contract_type IS NULL;
        
        -- Make contract_type NOT NULL after setting defaults
        ALTER TABLE contracts 
        ALTER COLUMN contract_type SET NOT NULL;
        
        RAISE NOTICE 'Added contract_type column to contracts table';
    ELSE
        RAISE NOTICE 'contract_type column already exists in contracts table';
    END IF;
    
    -- Check if type column exists and is different from contract_type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'type'
    ) THEN
        -- Copy data from type to contract_type if contract_type is empty
        UPDATE contracts 
        SET contract_type = type 
        WHERE (contract_type IS NULL OR contract_type = '') 
        AND type IS NOT NULL;
        
        RAISE NOTICE 'Copied data from type column to contract_type column';
    END IF;
    
END $$;

-- Create index on contract_type for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_contract_type ON contracts(contract_type);

-- Add comment to the column
COMMENT ON COLUMN contracts.contract_type IS 'Type of contract (employment, service, consultancy, partnership)';
