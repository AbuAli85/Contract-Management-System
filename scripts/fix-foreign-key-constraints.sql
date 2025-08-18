-- Fix foreign key constraints and ensure proper data types
-- This script works with existing foreign key relationships
-- Date: 2025-01-20

-- Step 1: Check current foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'contracts'
AND tc.table_schema = 'public';

-- Step 2: Check current column types and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN 'FOREIGN KEY'
        ELSE 'NO CONSTRAINT'
    END as constraint_type
FROM information_schema.columns c
LEFT JOIN information_schema.table_constraints tc 
    ON tc.table_name = c.table_name 
    AND tc.table_schema = c.table_schema
    AND tc.constraint_type = 'FOREIGN KEY'
LEFT JOIN information_schema.key_column_usage kcu 
    ON kcu.constraint_name = tc.constraint_name
    AND kcu.column_name = c.column_name
WHERE c.table_name = 'contracts' 
AND c.table_schema = 'public'
AND c.column_name IN ('promoter_id', 'first_party_id', 'second_party_id', 'client_id', 'employer_id')
ORDER BY c.column_name;

-- Step 3: Ensure first_party_id and second_party_id columns exist and are UUID type
DO $$ 
BEGIN
    -- Add first_party_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'first_party_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN first_party_id UUID;
        
        RAISE NOTICE 'Added first_party_id column as UUID type';
    ELSE
        RAISE NOTICE 'first_party_id column already exists';
    END IF;
    
    -- Add second_party_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'second_party_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN second_party_id UUID;
        
        RAISE NOTICE 'Added second_party_id column as UUID type';
    ELSE
        RAISE NOTICE 'second_party_id column already exists';
    END IF;
END $$;

-- Step 4: Copy data from existing foreign key columns to new party ID columns
DO $$ 
BEGIN
    -- Copy from client_id to first_party_id if both exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'client_id'
        AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'first_party_id'
        AND table_schema = 'public'
    ) THEN
        UPDATE contracts 
        SET first_party_id = client_id 
        WHERE first_party_id IS NULL AND client_id IS NOT NULL;
        
        RAISE NOTICE 'Copied data from client_id to first_party_id';
    END IF;
    
    -- Copy from employer_id to second_party_id if both exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'employer_id'
        AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'second_party_id'
        AND table_schema = 'public'
    ) THEN
        UPDATE contracts 
        SET second_party_id = employer_id 
        WHERE second_party_id IS NULL AND employer_id IS NOT NULL;
        
        RAISE NOTICE 'Copied data from employer_id to second_party_id';
    END IF;
END $$;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_first_party_id ON contracts(first_party_id);
CREATE INDEX IF NOT EXISTS idx_contracts_second_party_id ON contracts(second_party_id);

-- Step 6: Add comments
COMMENT ON COLUMN contracts.first_party_id IS 'First party ID (client) for the contract - UUID type';
COMMENT ON COLUMN contracts.second_party_id IS 'Second party ID (employer) for the contract - UUID type';

-- Step 7: Verify the final schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contracts' 
AND table_schema = 'public'
AND column_name IN ('promoter_id', 'first_party_id', 'second_party_id', 'client_id', 'employer_id')
ORDER BY column_name;

-- Step 8: Show sample data
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
LIMIT 3;
