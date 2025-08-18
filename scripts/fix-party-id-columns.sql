-- Fix missing party ID columns in contracts table
-- This script adds the columns that the form is trying to use
-- Date: 2025-01-20

-- Step 1: Add first_party_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'first_party_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN first_party_id TEXT;
        
        RAISE NOTICE 'Added first_party_id column to contracts table';
    ELSE
        RAISE NOTICE 'first_party_id column already exists in contracts table';
    END IF;
END $$;

-- Step 2: Add second_party_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'second_party_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN second_party_id TEXT;
        
        RAISE NOTICE 'Added second_party_id column to contracts table';
    ELSE
        RAISE NOTICE 'second_party_id column already exists in contracts table';
    END IF;
END $$;

-- Step 3: Copy data from existing columns if they exist
DO $$ 
BEGIN
    -- Copy from client_id to first_party_id if client_id exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'client_id'
        AND table_schema = 'public'
    ) THEN
        UPDATE contracts 
        SET first_party_id = client_id 
        WHERE first_party_id IS NULL AND client_id IS NOT NULL;
        
        RAISE NOTICE 'Copied data from client_id to first_party_id';
    END IF;
    
    -- Copy from employer_id to second_party_id if employer_id exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'employer_id'
        AND table_schema = 'public'
    ) THEN
        UPDATE contracts 
        SET second_party_id = employer_id 
        WHERE second_party_id IS NULL AND employer_id IS NOT NULL;
        
        RAISE NOTICE 'Copied data from employer_id to second_party_id';
    END IF;
END $$;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_first_party_id ON contracts(first_party_id);
CREATE INDEX IF NOT EXISTS idx_contracts_second_party_id ON contracts(second_party_id);

-- Step 5: Add comments
COMMENT ON COLUMN contracts.first_party_id IS 'First party ID (client) for the contract';
COMMENT ON COLUMN contracts.second_party_id IS 'Second party ID (employer) for the contract';

-- Step 6: Verify the fix
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contracts' 
AND column_name IN ('first_party_id', 'second_party_id', 'promoter_id', 'client_id', 'employer_id')
AND table_schema = 'public'
ORDER BY column_name;

-- Step 7: Show sample data with new columns
SELECT 
    id,
    contract_number,
    title,
    contract_type,
    status,
    is_current,
    priority,
    start_date,
    end_date,
    first_party_id,
    second_party_id,
    promoter_id,
    client_id,
    employer_id
FROM contracts 
LIMIT 5;
