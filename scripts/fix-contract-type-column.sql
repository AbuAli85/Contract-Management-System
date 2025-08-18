-- Fix for missing contract_type column in contracts table
-- This script resolves the PGRST204 error: "Could not find the 'contract_type' column of 'contracts' in the schema cache"

-- Step 1: Add contract_type column if it doesn't exist
DO $$ 
BEGIN
    -- Check if contract_type column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'contract_type'
        AND table_schema = 'public'
    ) THEN
        -- Add contract_type column
        ALTER TABLE contracts 
        ADD COLUMN contract_type TEXT DEFAULT 'employment';
        
        RAISE NOTICE 'Added contract_type column to contracts table';
    ELSE
        RAISE NOTICE 'contract_type column already exists in contracts table';
    END IF;
END $$;

-- Step 2: Add check constraint for valid contract types
ALTER TABLE contracts 
DROP CONSTRAINT IF EXISTS contracts_contract_type_check;

ALTER TABLE contracts 
ADD CONSTRAINT contracts_contract_type_check 
CHECK (contract_type IN ('employment', 'service', 'consultancy', 'partnership'));

-- Step 3: Copy data from existing 'type' column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'type'
        AND table_schema = 'public'
    ) THEN
        -- Copy data from type column to contract_type
        UPDATE contracts 
        SET contract_type = COALESCE(type, 'employment') 
        WHERE contract_type IS NULL OR contract_type = '';
        
        RAISE NOTICE 'Copied data from type column to contract_type column';
    END IF;
END $$;

-- Step 4: Set default values for any remaining NULL values
UPDATE contracts 
SET contract_type = 'employment' 
WHERE contract_type IS NULL OR contract_type = '';

-- Step 5: Make contract_type NOT NULL
ALTER TABLE contracts 
ALTER COLUMN contract_type SET NOT NULL;

-- Step 6: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_contract_type ON contracts(contract_type);

-- Step 7: Add comment
COMMENT ON COLUMN contracts.contract_type IS 'Type of contract (employment, service, consultancy, partnership)';

-- Step 8: Verify the fix
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contracts' 
AND column_name = 'contract_type'
AND table_schema = 'public';

-- Step 9: Show sample data
SELECT 
    id,
    contract_number,
    title,
    contract_type,
    status
FROM contracts 
LIMIT 5;
